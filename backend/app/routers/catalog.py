"""Router: CRUD de catálogos maestros (plantas, customers, productos).

Cada entidad expone GET (list), POST (create), PATCH (update), DELETE.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db import get_db
from app.models import Customer, Planta, Producto
from app.models.user import User
from app.schemas.catalog import (
    CustomerCreate,
    CustomerOut,
    CustomerUpdate,
    PlantaCreate,
    PlantaOut,
    PlantaUpdate,
    ProductoCreate,
    ProductoOut,
    ProductoUpdate,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _commit_or_409(db: Session, msg: str) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, msg)


# ╭──────────────────────────────────────────────────────────────────────────╮
# │ PLANTAS                                                                  │
# ╰──────────────────────────────────────────────────────────────────────────╯
@router.get("/plantas", response_model=list[PlantaOut])
def listar_plantas(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Planta).order_by(Planta.codigo).all()


@router.post("/plantas", response_model=PlantaOut, status_code=201)
def crear_planta(payload: PlantaCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = Planta(codigo=payload.codigo.upper().strip(), nombre=payload.nombre.strip(), ubicacion=payload.ubicacion)
    db.add(p)
    _commit_or_409(db, "Ya existe una planta con ese código.")
    db.refresh(p)
    return p


@router.patch("/plantas/{planta_id}", response_model=PlantaOut)
def actualizar_planta(planta_id: int, payload: PlantaUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.get(Planta, planta_id)
    if not p:
        raise HTTPException(404, "Planta no encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    _commit_or_409(db, "Conflicto al actualizar planta.")
    db.refresh(p)
    return p


@router.delete("/plantas/{planta_id}", status_code=204)
def eliminar_planta(planta_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.get(Planta, planta_id)
    if not p:
        raise HTTPException(404, "Planta no encontrada")
    db.delete(p)
    _commit_or_409(db, "No se puede eliminar: hay datos asociados a esta planta.")


# ╭──────────────────────────────────────────────────────────────────────────╮
# │ CUSTOMERS                                                                │
# ╰──────────────────────────────────────────────────────────────────────────╯
@router.get("/customers", response_model=list[CustomerOut])
def listar_customers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Customer).order_by(Customer.codigo).all()


@router.post("/customers", response_model=CustomerOut, status_code=201)
def crear_customer(payload: CustomerCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = Customer(codigo=payload.codigo.upper().strip(), nombre=payload.nombre.strip())
    db.add(c)
    _commit_or_409(db, "Ya existe un customer con ese código.")
    db.refresh(c)
    return c


@router.patch("/customers/{customer_id}", response_model=CustomerOut)
def actualizar_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, "Customer no encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    _commit_or_409(db, "Conflicto al actualizar customer.")
    db.refresh(c)
    return c


@router.delete("/customers/{customer_id}", status_code=204)
def eliminar_customer(customer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, "Customer no encontrado")
    db.delete(c)
    _commit_or_409(db, "No se puede eliminar: hay datos asociados a este customer.")


# ╭──────────────────────────────────────────────────────────────────────────╮
# │ PRODUCTOS                                                                │
# ╰──────────────────────────────────────────────────────────────────────────╯
@router.get("/productos", response_model=list[ProductoOut])
def listar_productos(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Producto).order_by(Producto.sku).all()


@router.post("/productos", response_model=ProductoOut, status_code=201)
def crear_producto(payload: ProductoCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = Producto(
        sku=payload.sku.upper().strip(),
        nombre=payload.nombre.strip(),
        unidad=payload.unidad or "kg",
        familia=payload.familia,
        categoria=payload.categoria,
    )
    db.add(p)
    _commit_or_409(db, "Ya existe un producto con ese SKU.")
    db.refresh(p)
    return p


@router.patch("/productos/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: int, payload: ProductoUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.get(Producto, producto_id)
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    _commit_or_409(db, "Conflicto al actualizar producto.")
    db.refresh(p)
    return p


@router.delete("/productos/{producto_id}", status_code=204)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.get(Producto, producto_id)
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    db.delete(p)
    _commit_or_409(db, "No se puede eliminar: hay datos asociados a este producto.")
