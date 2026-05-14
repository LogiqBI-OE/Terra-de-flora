"""Router: CRUD de proveedores. Acceso L5+ (lectura) / L5+ (mutaciones por ahora).

Si en el futuro queremos limitar mutaciones, cambiar require_level_5 por
require_level_9 en POST/PATCH/DELETE.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_5
from app.db import get_db
from app.models.proveedor import Proveedor
from app.models.user import User
from app.schemas.proveedor import ProveedorCreate, ProveedorOut, ProveedorUpdate

router = APIRouter(prefix="/proveedores", tags=["proveedores"])


@router.get("", response_model=list[ProveedorOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[ProveedorOut]:
    rows = db.query(Proveedor).order_by(Proveedor.nombre).all()
    return [ProveedorOut.model_validate(r) for r in rows]


@router.post("", response_model=ProveedorOut, status_code=201)
def crear(
    payload: ProveedorCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ProveedorOut:
    p = Proveedor(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return ProveedorOut.model_validate(p)


@router.patch("/{proveedor_id}", response_model=ProveedorOut)
def actualizar(
    proveedor_id: int,
    payload: ProveedorUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ProveedorOut:
    p = db.get(Proveedor, proveedor_id)
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return ProveedorOut.model_validate(p)


@router.delete("/{proveedor_id}", status_code=204)
def eliminar(
    proveedor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    p = db.get(Proveedor, proveedor_id)
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    db.delete(p)
    db.commit()
