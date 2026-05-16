"""Router: CRUD de materiales + catálogos editables de tipos/unidades.

Cada edición de precio del material registra una fila en
material_precio_historico (Fase 3 — tracking de costos).
"""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_level_5
from app.db import get_db
from app.models.material import Material
from app.models.material_catalog import MaterialFamilia, MaterialUnidad
from app.models.material_historico import MaterialPrecioHistorico
from app.models.proveedor import Proveedor
from app.models.user import User
from app.schemas.material import (
    CatalogItemCreate,
    CatalogItemOut,
    CatalogItemUpdate,
    MaterialCatalog,
    MaterialCreate,
    MaterialOut,
    MaterialPrecioHistoricoOut,
    MaterialUpdate,
)

router = APIRouter(prefix="/materiales", tags=["materiales"])


def _precio_unit(m: Material) -> Decimal:
    contenido = m.contenido_por_paquete or Decimal("1")
    if contenido <= 0:
        return Decimal("0")
    return (m.precio_paquete / contenido).quantize(Decimal("0.0001"))


def _to_out(m: Material, db: Session) -> MaterialOut:
    proveedor_nombre: str | None = None
    if m.proveedor_id:
        p = db.get(Proveedor, m.proveedor_id)
        proveedor_nombre = p.nombre if p else None
    return MaterialOut(
        id=m.id,
        codigo=m.codigo,
        nombre=m.nombre,
        familia=m.familia,
        unidad=m.unidad,
        contenido_por_paquete=m.contenido_por_paquete,
        precio_paquete=m.precio_paquete,
        precio_unitario=_precio_unit(m),
        proveedor_id=m.proveedor_id,
        proveedor_nombre=proveedor_nombre,
        color_hex=m.color_hex,
        notas=m.notas,
        is_active=m.is_active,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def _record_price_history(
    db: Session, m: Material, user_id: int | None, source: str = "edit"
) -> None:
    """Inserta una fila en el histórico con el estado actual del precio."""
    db.add(MaterialPrecioHistorico(
        material_id=m.id,
        precio_paquete=m.precio_paquete,
        contenido_por_paquete=m.contenido_por_paquete,
        changed_by_user_id=user_id,
        source=source,
    ))


@router.get("/_catalog", response_model=MaterialCatalog)
def catalog(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> MaterialCatalog:
    """Devuelve los nombres de los tipos y unidades activos para los dropdowns.
    Lee de las tablas catalog (editables por el usuario)."""
    familias = (
        db.query(MaterialFamilia)
        .filter(MaterialFamilia.is_active == True)  # noqa: E712
        .order_by(MaterialFamilia.orden, MaterialFamilia.nombre)
        .all()
    )
    unidades = (
        db.query(MaterialUnidad)
        .filter(MaterialUnidad.is_active == True)  # noqa: E712
        .order_by(MaterialUnidad.orden, MaterialUnidad.nombre)
        .all()
    )
    return MaterialCatalog(
        familias=[f.nombre for f in familias],
        unidades=[u.nombre for u in unidades],
    )


# ── CRUD Materiales ───────────────────────────────────────────────────────

@router.get("", response_model=list[MaterialOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[MaterialOut]:
    rows = db.query(Material).order_by(Material.familia, Material.nombre).all()
    return [_to_out(m, db) for m in rows]


@router.post("", response_model=MaterialOut, status_code=201)
def crear(
    payload: MaterialCreate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> MaterialOut:
    if me.level < 5:
        raise HTTPException(403, "Acceso denegado")
    if payload.proveedor_id is not None:
        if not db.get(Proveedor, payload.proveedor_id):
            raise HTTPException(400, "Proveedor no existe")
    m = Material(**payload.model_dump())
    db.add(m)
    db.flush()  # asegura id antes de histórico
    _record_price_history(db, m, me.id, source="seed")
    db.commit()
    db.refresh(m)
    return _to_out(m, db)


@router.patch("/{material_id}", response_model=MaterialOut)
def actualizar(
    material_id: int,
    payload: MaterialUpdate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> MaterialOut:
    if me.level < 5:
        raise HTTPException(403, "Acceso denegado")
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(404, "Material no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "proveedor_id" in data and data["proveedor_id"] is not None:
        if not db.get(Proveedor, data["proveedor_id"]):
            raise HTTPException(400, "Proveedor no existe")

    # Detecta cambio de precio o contenido para registrar histórico
    prev_precio = m.precio_paquete
    prev_contenido = m.contenido_por_paquete

    for k, v in data.items():
        setattr(m, k, v)

    price_changed = (
        m.precio_paquete != prev_precio
        or m.contenido_por_paquete != prev_contenido
    )
    if price_changed:
        _record_price_history(db, m, me.id, source="edit")

    db.commit()
    db.refresh(m)
    return _to_out(m, db)


@router.get("/{material_id}/historico", response_model=list[MaterialPrecioHistoricoOut])
def historico(
    material_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[MaterialPrecioHistoricoOut]:
    if not db.get(Material, material_id):
        raise HTTPException(404, "Material no encontrado")
    rows = (
        db.query(MaterialPrecioHistorico)
        .filter(MaterialPrecioHistorico.material_id == material_id)
        .order_by(MaterialPrecioHistorico.created_at.desc())
        .all()
    )
    user_ids = {r.changed_by_user_id for r in rows if r.changed_by_user_id}
    users = {u.id: u for u in (
        db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    )}
    out: list[MaterialPrecioHistoricoOut] = []
    for r in rows:
        contenido = r.contenido_por_paquete or Decimal("1")
        precio_unit = (r.precio_paquete / contenido).quantize(Decimal("0.0001")) if contenido > 0 else Decimal("0")
        u = users.get(r.changed_by_user_id) if r.changed_by_user_id else None
        nombre = None
        if u:
            nombre = u.full_name or u.username or u.email.split("@")[0]
        out.append(MaterialPrecioHistoricoOut(
            id=r.id,
            material_id=r.material_id,
            precio_paquete=r.precio_paquete,
            contenido_por_paquete=r.contenido_por_paquete,
            precio_unitario=precio_unit,
            changed_by_user_id=r.changed_by_user_id,
            changed_by_nombre=nombre,
            source=r.source,
            created_at=r.created_at,
        ))
    return out


@router.delete("/{material_id}", status_code=204)
def eliminar(
    material_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(404, "Material no encontrado")
    db.delete(m)
    db.commit()


# ── CRUD Tipos / Familias ─────────────────────────────────────────────────

@router.get("/familias", response_model=list[CatalogItemOut])
def listar_familias(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[CatalogItemOut]:
    rows = db.query(MaterialFamilia).order_by(MaterialFamilia.orden, MaterialFamilia.nombre).all()
    return [CatalogItemOut.model_validate(r) for r in rows]


@router.post("/familias", response_model=CatalogItemOut, status_code=201)
def crear_familia(
    payload: CatalogItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> CatalogItemOut:
    f = MaterialFamilia(nombre=payload.nombre.strip(), orden=payload.orden)
    db.add(f)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un tipo con ese nombre.")
    db.refresh(f)
    return CatalogItemOut.model_validate(f)


@router.patch("/familias/{familia_id}", response_model=CatalogItemOut)
def actualizar_familia(
    familia_id: int,
    payload: CatalogItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> CatalogItemOut:
    f = db.get(MaterialFamilia, familia_id)
    if not f:
        raise HTTPException(404, "Tipo no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "nombre" in data:
        data["nombre"] = data["nombre"].strip()
    for k, v in data.items():
        setattr(f, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un tipo con ese nombre.")
    db.refresh(f)
    return CatalogItemOut.model_validate(f)


@router.delete("/familias/{familia_id}", status_code=204)
def eliminar_familia(
    familia_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    f = db.get(MaterialFamilia, familia_id)
    if not f:
        raise HTTPException(404, "Tipo no encontrado")
    db.delete(f)
    db.commit()


# ── CRUD Unidades ─────────────────────────────────────────────────────────

@router.get("/unidades", response_model=list[CatalogItemOut])
def listar_unidades(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[CatalogItemOut]:
    rows = db.query(MaterialUnidad).order_by(MaterialUnidad.orden, MaterialUnidad.nombre).all()
    return [CatalogItemOut.model_validate(r) for r in rows]


@router.post("/unidades", response_model=CatalogItemOut, status_code=201)
def crear_unidad(
    payload: CatalogItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> CatalogItemOut:
    u = MaterialUnidad(nombre=payload.nombre.strip(), orden=payload.orden)
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe una unidad con ese nombre.")
    db.refresh(u)
    return CatalogItemOut.model_validate(u)


@router.patch("/unidades/{unidad_id}", response_model=CatalogItemOut)
def actualizar_unidad(
    unidad_id: int,
    payload: CatalogItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> CatalogItemOut:
    u = db.get(MaterialUnidad, unidad_id)
    if not u:
        raise HTTPException(404, "Unidad no encontrada")
    data = payload.model_dump(exclude_unset=True)
    if "nombre" in data:
        data["nombre"] = data["nombre"].strip()
    for k, v in data.items():
        setattr(u, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe una unidad con ese nombre.")
    db.refresh(u)
    return CatalogItemOut.model_validate(u)


@router.delete("/unidades/{unidad_id}", status_code=204)
def eliminar_unidad(
    unidad_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    u = db.get(MaterialUnidad, unidad_id)
    if not u:
        raise HTTPException(404, "Unidad no encontrada")
    db.delete(u)
    db.commit()
