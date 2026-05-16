"""Router: comentarios de proyecto. Acceso L5+.

Endpoints:
  GET    /proyectos/{pid}/comentarios            → lista con parent + reacciones
  POST   /proyectos/{pid}/comentarios            → crear (texto + opcional parent_id)
  PATCH  /proyectos/{pid}/comentarios/{cid}      → editar texto (autor, <=3min)
  DELETE /proyectos/{pid}/comentarios/{cid}      → borrar (autor <=3min, o L6+ siempre)
  POST   /proyectos/{pid}/comentarios/{cid}/reaccion
                                                  → toggle reacción (body: emoji)
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_level_5
from app.db import get_db
from app.models.comentario import Comentario, ComentarioReaccion
from app.models.proyecto import Proyecto
from app.models.user import User
from app.schemas.comentario import (
    ALLOWED_EMOJIS,
    ComentarioCreate,
    ComentarioOut,
    ComentarioUpdate,
    EmojiToggle,
    ParentSnippet,
    ReaccionAgg,
)


router = APIRouter(tags=["comentarios"])

EDIT_WINDOW = timedelta(minutes=3)


def _iniciales(nombre: str | None, email: str) -> str:
    if nombre and nombre.strip():
        parts = [p for p in nombre.strip().split() if p]
        if len(parts) >= 2:
            return (parts[0][0] + parts[1][0]).upper()
        if parts:
            return parts[0][:2].upper()
    return email[:2].upper()


def _nombre_display(user: User) -> str:
    return user.full_name or user.username or user.email.split("@")[0]


def _to_out(
    c: Comentario,
    user: User,
    parents: dict[int, tuple[Comentario, User]],
    reacciones_index: dict[int, list[tuple[str, int, bool]]],
) -> ComentarioOut:
    parent_snip: ParentSnippet | None = None
    if c.parent_id is not None and c.parent_id in parents:
        pc, pu = parents[c.parent_id]
        snippet = pc.texto if len(pc.texto) <= 120 else pc.texto[:117] + "…"
        parent_snip = ParentSnippet(id=pc.id, user_nombre=_nombre_display(pu), texto=snippet)
    elif c.parent_id is not None:
        # Padre borrado o no encontrado
        parent_snip = ParentSnippet(id=c.parent_id, user_nombre="(eliminado)", texto="…")

    reacciones = [
        ReaccionAgg(emoji=emoji, count=count, by_me=by_me)
        for emoji, count, by_me in reacciones_index.get(c.id, [])
    ]

    return ComentarioOut(
        id=c.id,
        proyecto_id=c.proyecto_id,
        user_id=c.user_id,
        user_nombre=_nombre_display(user),
        user_iniciales=_iniciales(user.full_name, user.email),
        user_email=user.email,
        texto=c.texto,
        created_at=c.created_at,
        edited_at=c.edited_at,
        parent_id=c.parent_id,
        parent=parent_snip,
        reacciones=reacciones,
    )


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _within_edit_window(c: Comentario) -> bool:
    # created_at viene con tz (server_default=func.now() en columna TIMESTAMPTZ).
    return _now_utc() - c.created_at <= EDIT_WINDOW


@router.get(
    "/proyectos/{pid}/comentarios",
    response_model=list[ComentarioOut],
    dependencies=[Depends(require_level_5)],
)
def list_comentarios(
    pid: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> list[ComentarioOut]:
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    rows = (
        db.query(Comentario, User)
        .join(User, User.id == Comentario.user_id)
        .filter(Comentario.proyecto_id == pid)
        .order_by(Comentario.created_at.asc(), Comentario.id.asc())
        .all()
    )

    # Precarga de parents (solo los referenciados, pueden venir de fuera de la
    # lista en teoría pero como filtramos por proyecto y parent es mismo proy,
    # están todos en `rows`. Aún así indexo por id para acceso O(1)).
    by_id: dict[int, tuple[Comentario, User]] = {c.id: (c, u) for c, u in rows}

    # Precarga de reacciones agrupadas
    ids = [c.id for c, _ in rows]
    reacciones_index: dict[int, list[tuple[str, int, bool]]] = {cid: [] for cid in ids}
    if ids:
        raw = (
            db.query(ComentarioReaccion)
            .filter(ComentarioReaccion.comentario_id.in_(ids))
            .all()
        )
        # Agrupa por (comentario_id, emoji)
        buckets: dict[tuple[int, str], list[int]] = {}
        for r in raw:
            buckets.setdefault((r.comentario_id, r.emoji), []).append(r.user_id)
        # Mantén orden estable: el orden de ALLOWED_EMOJIS
        for cid in ids:
            for emoji in ALLOWED_EMOJIS:
                key = (cid, emoji)
                if key in buckets:
                    users = buckets[key]
                    reacciones_index[cid].append((emoji, len(users), me.id in users))

    return [_to_out(c, u, by_id, reacciones_index) for c, u in rows]


@router.post(
    "/proyectos/{pid}/comentarios",
    response_model=ComentarioOut,
)
def create_comentario(
    pid: int,
    payload: ComentarioCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ComentarioOut:
    if user.level < 5:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    parent_id: int | None = None
    if payload.parent_id is not None:
        parent = db.get(Comentario, payload.parent_id)
        if not parent or parent.proyecto_id != pid:
            raise HTTPException(status_code=400, detail="Comentario padre inválido")
        # Aplana threads de >1 nivel: si el padre es respuesta, usamos su raíz.
        parent_id = parent.parent_id or parent.id

    c = Comentario(
        proyecto_id=pid,
        user_id=user.id,
        parent_id=parent_id,
        texto=payload.texto.strip(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    parents: dict[int, tuple[Comentario, User]] = {}
    if c.parent_id:
        p = db.get(Comentario, c.parent_id)
        if p:
            pu = db.get(User, p.user_id)
            if pu:
                parents[p.id] = (p, pu)
    return _to_out(c, user, parents, {})


@router.patch(
    "/proyectos/{pid}/comentarios/{cid}",
    response_model=ComentarioOut,
)
def update_comentario(
    pid: int,
    cid: int,
    payload: ComentarioUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ComentarioOut:
    c = db.get(Comentario, cid)
    if not c or c.proyecto_id != pid:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if c.user_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el autor puede editar")
    if not _within_edit_window(c):
        raise HTTPException(
            status_code=400,
            detail="Ya pasaron los 3 minutos para editar este comentario.",
        )

    c.texto = payload.texto.strip()
    c.edited_at = _now_utc()
    db.commit()
    db.refresh(c)

    # Recarga reacciones para devolverlas en la respuesta
    parents: dict[int, tuple[Comentario, User]] = {}
    if c.parent_id:
        p = db.get(Comentario, c.parent_id)
        if p:
            pu = db.get(User, p.user_id)
            if pu:
                parents[p.id] = (p, pu)

    reacciones_index: dict[int, list[tuple[str, int, bool]]] = {c.id: []}
    raw = db.query(ComentarioReaccion).filter(ComentarioReaccion.comentario_id == c.id).all()
    buckets: dict[str, list[int]] = {}
    for r in raw:
        buckets.setdefault(r.emoji, []).append(r.user_id)
    for emoji in ALLOWED_EMOJIS:
        if emoji in buckets:
            users = buckets[emoji]
            reacciones_index[c.id].append((emoji, len(users), user.id in users))

    return _to_out(c, user, parents, reacciones_index)


@router.delete(
    "/proyectos/{pid}/comentarios/{cid}",
    status_code=204,
)
def delete_comentario(
    pid: int,
    cid: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    c = db.get(Comentario, cid)
    if not c or c.proyecto_id != pid:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    # L6+ puede borrar siempre. Autor solo dentro de 3 min.
    if user.level >= 6:
        pass
    elif c.user_id == user.id:
        if not _within_edit_window(c):
            raise HTTPException(
                status_code=400,
                detail="Ya pasaron los 3 minutos para borrar este comentario.",
            )
    else:
        raise HTTPException(status_code=403, detail="No puedes borrar comentarios de otro usuario")

    db.delete(c)
    db.commit()


@router.post(
    "/proyectos/{pid}/comentarios/{cid}/reaccion",
    response_model=ComentarioOut,
)
def toggle_reaccion(
    pid: int,
    cid: int,
    payload: EmojiToggle,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ComentarioOut:
    if payload.emoji not in ALLOWED_EMOJIS:
        raise HTTPException(status_code=400, detail="Emoji no permitido")

    c = db.get(Comentario, cid)
    if not c or c.proyecto_id != pid:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    existing = (
        db.query(ComentarioReaccion)
        .filter(
            ComentarioReaccion.comentario_id == cid,
            ComentarioReaccion.user_id == user.id,
            ComentarioReaccion.emoji == payload.emoji,
        )
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(ComentarioReaccion(comentario_id=cid, user_id=user.id, emoji=payload.emoji))
    db.commit()

    # Reusamos lógica de salida
    autor = db.get(User, c.user_id)
    parents: dict[int, tuple[Comentario, User]] = {}
    if c.parent_id:
        p = db.get(Comentario, c.parent_id)
        if p:
            pu = db.get(User, p.user_id)
            if pu:
                parents[p.id] = (p, pu)

    reacciones_index: dict[int, list[tuple[str, int, bool]]] = {c.id: []}
    raw = db.query(ComentarioReaccion).filter(ComentarioReaccion.comentario_id == c.id).all()
    buckets: dict[str, list[int]] = {}
    for r in raw:
        buckets.setdefault(r.emoji, []).append(r.user_id)
    for emoji in ALLOWED_EMOJIS:
        if emoji in buckets:
            users = buckets[emoji]
            reacciones_index[c.id].append((emoji, len(users), user.id in users))

    assert autor is not None
    return _to_out(c, autor, parents, reacciones_index)
