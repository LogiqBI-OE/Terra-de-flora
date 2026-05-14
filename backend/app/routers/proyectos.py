"""Router: CRUD de proyectos. Acceso L5+."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_5
from app.db import get_db
from app.models.cliente import Cliente
from app.models.proyecto import EstadoProyecto, Proyecto, TipoProyecto
from app.models.user import User
from app.schemas.proyecto import (
    ProyectoCatalog,
    ProyectoCreate,
    ProyectoLocation,
    ProyectoOut,
    ProyectoUpdate,
    VendedorOption,
)

router = APIRouter(prefix="/proyectos", tags=["proyectos"])


TIPOS_META = [
    {"id": "boda", "label": "Boda", "emoji": "💐"},
    {"id": "iglesia", "label": "Iglesia", "emoji": "⛪"},
    {"id": "bautizo", "label": "Bautizo", "emoji": "👶"},
    {"id": "cumple", "label": "Cumpleaños", "emoji": "🎂"},
    {"id": "xv", "label": "XV años", "emoji": "👑"},
    {"id": "corporativo", "label": "Corporativo", "emoji": "🏢"},
    {"id": "otro", "label": "Otro", "emoji": "🎉"},
]

ESTADOS_META = [
    {"id": "cotizando", "label": "Cotizando", "emoji": "🔥"},
    {"id": "aprobado", "label": "Aprobado", "emoji": "✅"},
    {"id": "produccion", "label": "Producción", "emoji": "🌷"},
    {"id": "montaje", "label": "Montaje", "emoji": "🚚"},
    {"id": "entregado", "label": "Entregado", "emoji": "🎉"},
    {"id": "cancelado", "label": "Cancelado", "emoji": "✖️"},
]

TIPOS_LUGAR = ["Iglesia", "Civil", "Recepción", "Brunch", "Sesión de fotos", "Otro"]


def _codigo(pid: int) -> str:
    return f"PROY-{pid:04d}"


def _to_out(p: Proyecto, db: Session) -> ProyectoOut:
    cli = db.get(Cliente, p.cliente_id)
    vend = db.get(User, p.vendedor_id) if p.vendedor_id else None
    locations = [ProyectoLocation(**loc) for loc in (p.locations or [])]
    return ProyectoOut(
        id=p.id,
        codigo=_codigo(p.id),
        nombre=p.nombre,
        descripcion=p.descripcion,
        cliente_id=p.cliente_id,
        cliente_nombre=cli.nombre if cli else "(cliente eliminado)",
        cliente_tipo=cli.tipo.value if cli else "—",
        cliente_telefono=cli.telefono if cli else None,
        vendedor_id=p.vendedor_id,
        vendedor_nombre=vend.full_name if vend else None,
        vendedor_username=vend.username if vend else None,
        tipo=p.tipo,
        estado=p.estado,
        fecha_evento=p.fecha_evento,
        direccion_evento=p.direccion_evento,
        valor_estimado=p.valor_estimado,
        cant_invitados=p.cant_invitados,
        planner_nombre=p.planner_nombre,
        planner_telefono=p.planner_telefono,
        planner_email=p.planner_email,
        locations=locations,
        notas=p.notas,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("/_catalog", response_model=ProyectoCatalog)
def catalog(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ProyectoCatalog:
    # Vendedores: usuarios L5+
    vend_rows = (
        db.query(User)
        .filter(User.level >= 5, User.is_active == True)  # noqa: E712
        .order_by(User.full_name)
        .all()
    )
    return ProyectoCatalog(
        tipos=TIPOS_META,
        estados=ESTADOS_META,
        tipos_lugar=TIPOS_LUGAR,
        vendedores=[
            VendedorOption(
                id=u.id,
                nombre=u.full_name or u.email,
                username=u.username,
                level=u.level,
            )
            for u in vend_rows
        ],
    )


@router.get("", response_model=list[ProyectoOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[ProyectoOut]:
    rows = db.query(Proyecto).order_by(Proyecto.id.desc()).all()
    return [_to_out(p, db) for p in rows]


@router.get("/{proyecto_id}", response_model=ProyectoOut)
def obtener(
    proyecto_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ProyectoOut:
    p = db.get(Proyecto, proyecto_id)
    if not p:
        raise HTTPException(404, "Proyecto no encontrado")
    return _to_out(p, db)


@router.post("", response_model=ProyectoOut, status_code=201)
def crear(
    payload: ProyectoCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ProyectoOut:
    if not db.get(Cliente, payload.cliente_id):
        raise HTTPException(400, "Cliente no existe")
    if payload.vendedor_id is not None and not db.get(User, payload.vendedor_id):
        raise HTTPException(400, "Vendedor no existe")
    data = payload.model_dump()
    # locations es list[ProyectoLocation] — convertir a list[dict] para JSON column
    data["locations"] = [loc if isinstance(loc, dict) else loc.model_dump() for loc in payload.locations]
    p = Proyecto(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_out(p, db)


@router.patch("/{proyecto_id}", response_model=ProyectoOut)
def actualizar(
    proyecto_id: int,
    payload: ProyectoUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ProyectoOut:
    p = db.get(Proyecto, proyecto_id)
    if not p:
        raise HTTPException(404, "Proyecto no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "cliente_id" in data and not db.get(Cliente, data["cliente_id"]):
        raise HTTPException(400, "Cliente no existe")
    if "vendedor_id" in data and data["vendedor_id"] is not None:
        if not db.get(User, data["vendedor_id"]):
            raise HTTPException(400, "Vendedor no existe")
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _to_out(p, db)


@router.delete("/{proyecto_id}", status_code=204)
def eliminar(
    proyecto_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    p = db.get(Proyecto, proyecto_id)
    if not p:
        raise HTTPException(404, "Proyecto no encontrado")
    db.delete(p)
    db.commit()
