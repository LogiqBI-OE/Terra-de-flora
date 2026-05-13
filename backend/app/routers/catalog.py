"""Router: catálogos (plantas, customers, productos) para selectores en el frontend."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db import get_db
from app.models import Customer, Planta, Producto
from app.models.user import User

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/plantas")
def listar_plantas(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[dict]:
    rows = db.query(Planta).order_by(Planta.codigo).all()
    return [{"id": p.id, "codigo": p.codigo, "nombre": p.nombre} for p in rows]


@router.get("/customers")
def listar_customers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[dict]:
    rows = db.query(Customer).order_by(Customer.codigo).all()
    return [{"id": c.id, "codigo": c.codigo, "nombre": c.nombre} for c in rows]


@router.get("/productos")
def listar_productos(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[dict]:
    rows = db.query(Producto).order_by(Producto.sku).all()
    return [
        {"id": p.id, "sku": p.sku, "nombre": p.nombre, "unidad": p.unidad}
        for p in rows
    ]
