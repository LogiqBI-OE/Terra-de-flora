"""Router: calendario de eventos. Acceso L5+.

Endpoints:
  GET    /calendario?from=ISO&to=ISO    → eventos del rango (propios +
                                          donde participo + sintéticos de
                                          proyectos)
  POST   /calendario                    → crear evento
  PATCH  /calendario/{id}               → editar (solo owner)
  DELETE /calendario/{id}               → borrar (solo owner)
"""
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user, require_level_5
from app.db import get_db
from app.models.cliente import Cliente
from app.models.evento import EventoCalendario, EventoParticipante
from app.models.proyecto import Proyecto, TipoProyecto
from app.models.user import User
from app.schemas.evento import (
    EventoCreate,
    EventoOut,
    EventoUpdate,
    ParticipanteOut,
)


router = APIRouter(tags=["calendario"])


TIPO_PROYECTO_EMOJI: dict[str, str] = {
    "boda": "💐",
    "iglesia": "⛪",
    "bautizo": "👶",
    "cumple": "🎂",
    "xv": "👑",
    "corporativo": "🏢",
    "otro": "🎉",
}


def _nombre_display(u: User | None) -> str:
    if not u:
        return "—"
    return u.full_name or u.username or u.email.split("@")[0]


def _iniciales(u: User) -> str:
    name = u.full_name or u.username or u.email
    parts = [p for p in name.strip().split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    if parts:
        return parts[0][:2].upper()
    return u.email[:2].upper()


def _evento_to_out(e: EventoCalendario, me_id: int, db: Session) -> EventoOut:
    proyecto_codigo: str | None = None
    proyecto_nombre: str | None = None
    if e.proyecto_id:
        p = db.get(Proyecto, e.proyecto_id)
        if p:
            proyecto_codigo = f"PROY-{p.id:04d}"
            proyecto_nombre = p.nombre

    owner = db.get(User, e.owner_id)
    participantes = []
    for ep in e.participantes:
        u = db.get(User, ep.user_id)
        if u:
            participantes.append(ParticipanteOut(
                user_id=u.id, nombre=_nombre_display(u), iniciales=_iniciales(u)
            ))

    return EventoOut(
        id=e.id,
        kind="evento",
        tipo=e.tipo,
        titulo=e.titulo,
        descripcion=e.descripcion,
        start_at=e.start_at,
        end_at=e.end_at,
        all_day=e.all_day,
        proyecto_id=e.proyecto_id,
        proyecto_codigo=proyecto_codigo,
        proyecto_nombre=proyecto_nombre,
        owner_id=e.owner_id,
        owner_nombre=_nombre_display(owner),
        is_done=e.is_done,
        is_mine=e.owner_id == me_id,
        can_edit=e.owner_id == me_id,
        participantes=participantes,
    )


def _proyecto_to_sintetico(p: Proyecto, db: Session) -> EventoOut:
    cli = db.get(Cliente, p.cliente_id)
    cliente_nombre = cli.nombre if cli else "—"
    emoji = TIPO_PROYECTO_EMOJI.get(p.tipo.value if isinstance(p.tipo, TipoProyecto) else str(p.tipo), "🎉")

    # Convertimos fecha (date) a datetime UTC al inicio del día. El frontend
    # decide cómo renderizarlo (all_day=True ya da la pista).
    start_dt = datetime.combine(p.fecha_evento, time(0, 0), tzinfo=timezone.utc)

    titulo = f"{emoji} {p.nombre}"
    descripcion = f"Cliente: {cliente_nombre}"

    return EventoOut(
        id=-p.id,  # ids negativos para sintéticos (frontend los detecta por kind)
        kind="proyecto",
        tipo=None,
        titulo=titulo,
        descripcion=descripcion,
        start_at=start_dt,
        end_at=None,
        all_day=True,
        proyecto_id=p.id,
        proyecto_codigo=f"PROY-{p.id:04d}",
        proyecto_nombre=p.nombre,
        owner_id=None,
        owner_nombre=None,
        is_done=False,
        is_mine=False,
        can_edit=False,
        participantes=[],
    )


@router.get(
    "/calendario",
    response_model=list[EventoOut],
    dependencies=[Depends(require_level_5)],
)
def list_eventos(
    from_: date = Query(..., alias="from"),
    to: date = Query(...),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> list[EventoOut]:
    """Devuelve eventos del usuario en el rango [from, to] (inclusive).

    Incluye:
      - Eventos creados por el usuario (owner)
      - Eventos donde el usuario es participante invitado
      - Eventos sintéticos derivados de proyecto.fecha_evento (todos los
        proyectos activos cuya fecha cae en el rango)
    """
    if to < from_:
        raise HTTPException(status_code=400, detail="'to' debe ser >= 'from'")

    start = datetime.combine(from_, time(0, 0), tzinfo=timezone.utc)
    end = datetime.combine(to, time(23, 59, 59), tzinfo=timezone.utc)

    # Owner events
    owner_rows = (
        db.query(EventoCalendario)
        .options(selectinload(EventoCalendario.participantes))
        .filter(
            EventoCalendario.owner_id == me.id,
            EventoCalendario.start_at >= start,
            EventoCalendario.start_at <= end,
        )
        .all()
    )

    # Eventos donde participo
    participant_rows = (
        db.query(EventoCalendario)
        .options(selectinload(EventoCalendario.participantes))
        .join(EventoParticipante, EventoParticipante.evento_id == EventoCalendario.id)
        .filter(
            EventoParticipante.user_id == me.id,
            EventoCalendario.start_at >= start,
            EventoCalendario.start_at <= end,
        )
        .all()
    )

    # Dedupe por id
    seen: set[int] = set()
    all_events: list[EventoCalendario] = []
    for e in (*owner_rows, *participant_rows):
        if e.id not in seen:
            seen.add(e.id)
            all_events.append(e)

    out = [_evento_to_out(e, me.id, db) for e in all_events]

    # Sintéticos de proyectos
    proyectos = (
        db.query(Proyecto)
        .filter(
            Proyecto.is_active == True,  # noqa: E712
            Proyecto.fecha_evento >= from_,
            Proyecto.fecha_evento <= to,
        )
        .all()
    )
    for p in proyectos:
        out.append(_proyecto_to_sintetico(p, db))

    # Ordenar por start_at
    out.sort(key=lambda e: e.start_at)
    return out


@router.post(
    "/calendario",
    response_model=EventoOut,
    dependencies=[Depends(require_level_5)],
)
def create_evento(
    payload: EventoCreate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> EventoOut:
    if payload.end_at and payload.end_at < payload.start_at:
        raise HTTPException(status_code=400, detail="end_at debe ser >= start_at")
    if payload.proyecto_id and not db.get(Proyecto, payload.proyecto_id):
        raise HTTPException(status_code=400, detail="Proyecto inválido")

    e = EventoCalendario(
        owner_id=me.id,
        tipo=payload.tipo,
        titulo=payload.titulo.strip(),
        descripcion=payload.descripcion,
        start_at=payload.start_at,
        end_at=payload.end_at,
        all_day=payload.all_day,
        proyecto_id=payload.proyecto_id,
        is_done=payload.is_done,
    )
    db.add(e)
    db.flush()
    for uid in set(payload.participante_ids):
        if uid == me.id:
            continue  # no se invita a sí mismo
        if db.get(User, uid):
            db.add(EventoParticipante(evento_id=e.id, user_id=uid))
    db.commit()
    db.refresh(e)
    return _evento_to_out(e, me.id, db)


@router.patch(
    "/calendario/{eid}",
    response_model=EventoOut,
    dependencies=[Depends(require_level_5)],
)
def update_evento(
    eid: int,
    payload: EventoUpdate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> EventoOut:
    e = db.get(EventoCalendario, eid)
    if not e:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if e.owner_id != me.id:
        raise HTTPException(status_code=403, detail="Solo el owner puede editar")

    if payload.tipo is not None:
        e.tipo = payload.tipo
    if payload.titulo is not None:
        e.titulo = payload.titulo.strip()
    if payload.descripcion is not None:
        e.descripcion = payload.descripcion
    if payload.start_at is not None:
        e.start_at = payload.start_at
    if payload.end_at is not None:
        e.end_at = payload.end_at
    if payload.all_day is not None:
        e.all_day = payload.all_day
    if payload.proyecto_id is not None:
        if payload.proyecto_id == 0:
            e.proyecto_id = None
        else:
            if not db.get(Proyecto, payload.proyecto_id):
                raise HTTPException(status_code=400, detail="Proyecto inválido")
            e.proyecto_id = payload.proyecto_id
    if payload.is_done is not None:
        e.is_done = payload.is_done

    if payload.participante_ids is not None:
        db.query(EventoParticipante).filter(EventoParticipante.evento_id == e.id).delete()
        db.flush()
        for uid in set(payload.participante_ids):
            if uid == me.id:
                continue
            if db.get(User, uid):
                db.add(EventoParticipante(evento_id=e.id, user_id=uid))

    db.commit()
    db.refresh(e)
    return _evento_to_out(e, me.id, db)


@router.delete(
    "/calendario/{eid}",
    status_code=204,
    dependencies=[Depends(require_level_5)],
)
def delete_evento(
    eid: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> None:
    e = db.get(EventoCalendario, eid)
    if not e:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if e.owner_id != me.id:
        raise HTTPException(status_code=403, detail="Solo el owner puede borrar")
    db.delete(e)
    db.commit()
