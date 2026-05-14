"""Router: CRUD de materiales + catalogo de sugerencias para dropdowns."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_5
from app.db import get_db
from app.models.material import Material
from app.models.proveedor import Proveedor
from app.models.user import User
from app.schemas.material import (
    FAMILIAS,
    MaterialCatalog,
    MaterialCreate,
    MaterialOut,
    MaterialUpdate,
    UNIDADES,
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
def catalog(_: User = Depends(require_level_5)) -> MaterialCatalog:
    return MaterialCatalog(familias=FAMILIAS, unidades=UNIDADES)


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
