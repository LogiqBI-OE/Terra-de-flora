"""Router: CRUD de clientes. Acceso L5+."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_5
from app.db import get_db
from app.models.cliente import Cliente
from app.models.user import User
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[ClienteOut]:
    rows = db.query(Cliente).order_by(Cliente.nombre).all()
    return [ClienteOut.model_validate(r) for r in rows]


@router.post("", response_model=ClienteOut, status_code=201)
def crear(
    payload: ClienteCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ClienteOut:
    c = Cliente(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return ClienteOut.model_validate(c)


@router.patch("/{cliente_id}", response_model=ClienteOut)
def actualizar(
    cliente_id: int,
    payload: ClienteUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> ClienteOut:
    c = db.get(Cliente, cliente_id)
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return ClienteOut.model_validate(c)


@router.delete("/{cliente_id}", status_code=204)
def eliminar(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    c = db.get(Cliente, cliente_id)
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    db.delete(c)
    db.commit()
