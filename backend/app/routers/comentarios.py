"""Router: comentarios de proyecto. Acceso L5+.

Endpoints:
  GET    /proyectos/{pid}/comentarios            → lista (orden asc por fecha)
  POST   /proyectos/{pid}/comentarios            → crear (user = el logueado)
  DELETE /proyectos/{pid}/comentarios/{cid}      → borrar (solo el autor o L6+)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_level_5
from app.db import get_db
from app.models.comentario import Comentario
from app.models.proyecto import Proyecto
from app.models.user import User
from app.schemas.comentario import ComentarioCreate, ComentarioOut


router = APIRouter(tags=["comentarios"])


def _iniciales(nombre: str | None, email: str) -> str:
    if nombre and nombre.strip():
        parts = [p for p in nombre.strip().split() if p]
        if len(parts) >= 2:
            return (parts[0][0] + parts[1][0]).upper()
        if parts:
            return parts[0][:2].upper()
    return email[:2].upper()


def _to_out(c: Comentario, user: User) -> ComentarioOut:
    nombre = user.full_name or user.username or user.email.split("@")[0]
    return ComentarioOut(
        id=c.id,
        proyecto_id=c.proyecto_id,
        user_id=c.user_id,
        user_nombre=nombre,
        user_iniciales=_iniciales(user.full_name, user.email),
        user_email=user.email,
        texto=c.texto,
        created_at=c.created_at,
    )


@router.get(
    "/proyectos/{pid}/comentarios",
    response_model=list[ComentarioOut],
    dependencies=[Depends(require_level_5)],
)
def list_comentarios(pid: int, db: Session = Depends(get_db)) -> list[ComentarioOut]:
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    # Una query con join al user (sin selectinload porque relationship no está
    # definida — hacemos join manual)
    rows = (
        db.query(Comentario, User)
        .join(User, User.id == Comentario.user_id)
        .filter(Comentario.proyecto_id == pid)
        .order_by(Comentario.created_at.asc(), Comentario.id.asc())
        .all()
    )
    return [_to_out(c, u) for c, u in rows]


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
    # Requiere autenticado + L5+ implícito via la app (los proyectos son L5+).
    if user.level < 5:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    c = Comentario(proyecto_id=pid, user_id=user.id, texto=payload.texto.strip())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_out(c, user)


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
    # Solo el autor o L6+ puede borrar
    if c.user_id != user.id and user.level < 6:
        raise HTTPException(status_code=403, detail="No puedes borrar comentarios de otro usuario")
    db.delete(c)
    db.commit()
