"""Router: CRUD de materiales + catálogos editables de tipos/unidades."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_level_5
from app.db import get_db
from app.models.material import Material
from app.models.material_catalog import MaterialFamilia, MaterialUnidad
from app.models.proveedor import Proveedor
from app.models.user import User
from app.schemas.material import (
    CatalogItemCreate,
    CatalogItemOut,
    CatalogItemUpdate,
    MaterialCatalog,
    MaterialCreate,
    MaterialOut,
    MaterialUpdate,
)

router = APIRouter(prefix="/materiales", tags=["materiales"])


def _to_out(m: Material, db: Session) -> MaterialOut:
    proveedor_nombre: str | None = None
    if m.proveedor_id:
        p = db.get(Proveedor, m.proveedor_id)
        proveedor_nombre = p.nombre if p else None
    contenido = m.contenido_por_paquete or Decimal("1")
    if contenido <= 0:
        precio_unitario = Decimal("0")
    else:
        precio_unitario = (m.precio_paquete / contenido).quantize(Decimal("0.0001"))
    return MaterialOut(
        id=m.id,
        codigo=m.codigo,
        nombre=m.nombre,
        familia=m.familia,
        unidad=m.unidad,
        contenido_por_paquete=m.contenido_por_paquete,
        precio_paquete=m.precio_paquete,
        precio_unitario=precio_unitario,
        proveedor_id=m.proveedor_id,
        proveedor_nombre=proveedor_nombre,
        notas=m.notas,
        is_active=m.is_active,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


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
    _: User = Depends(require_level_5),
) -> MaterialOut:
    if payload.proveedor_id is not None:
        if not db.get(Proveedor, payload.proveedor_id):
            raise HTTPException(400, "Proveedor no existe")
    m = Material(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_out(m, db)


@router.patch("/{material_id}", response_model=MaterialOut)
def actualizar(
    material_id: int,
    payload: MaterialUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> MaterialOut:
    m = db.get(Material, material_id)
    if not m:
        raise HTTPException(404, "Material no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "proveedor_id" in data and data["proveedor_id"] is not None:
        if not db.get(Proveedor, data["proveedor_id"]):
            raise HTTPException(400, "Proveedor no existe")
    for k, v in data.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return _to_out(m, db)


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
