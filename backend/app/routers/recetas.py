"""Router: CRUD de recetas (plantillas de conceptos).

Endpoints:
  GET    /recetas              listado (summary, sin items)
  GET    /recetas/_catalog     categorias sugeridas
  GET    /recetas/{id}         detalle con items + costo estimado
  POST   /recetas              crea receta + items
  PATCH  /recetas/{id}         actualiza header y/o reemplaza lista de items
  DELETE /recetas/{id}         elimina (cascade borra items)
"""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_5
from app.db import get_db
from app.models.material import Material
from app.models.receta import Receta, RecetaItem
from app.models.user import User
from app.schemas.receta import (
    CATEGORIAS_RECETA,
    RecetaCatalog,
    RecetaCreate,
    RecetaItemOut,
    RecetaOut,
    RecetaSummary,
    RecetaUpdate,
)

router = APIRouter(prefix="/recetas", tags=["recetas"])


def _precio_unitario(m: Material) -> Decimal:
    contenido = m.contenido_por_paquete or Decimal("1")
    if contenido <= 0:
        return Decimal("0")
    return (m.precio_paquete / contenido).quantize(Decimal("0.0001"))


def _item_to_out(it: RecetaItem, db: Session) -> RecetaItemOut:
    m = db.get(Material, it.material_id)
    return RecetaItemOut(
        id=it.id,
        material_id=it.material_id,
        material_nombre=m.nombre if m else "(material eliminado)",
        material_familia=m.familia if m else "—",
        material_unidad=m.unidad if m else "—",
        material_precio_unitario=_precio_unitario(m) if m else Decimal("0"),
        cantidad=it.cantidad,
        notas=it.notas,
    )


def _receta_to_out(r: Receta, db: Session) -> RecetaOut:
    items_out = [_item_to_out(it, db) for it in r.items]
    costo = sum((io.cantidad * io.material_precio_unitario for io in items_out), Decimal("0"))
    return RecetaOut(
        id=r.id,
        nombre=r.nombre,
        descripcion=r.descripcion,
        categoria=r.categoria,
        is_active=r.is_active,
        items=items_out,
        costo_estimado=costo.quantize(Decimal("0.01")),
        item_count=len(items_out),
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


def _validate_materials_exist(db: Session, material_ids: list[int]) -> None:
    if not material_ids:
        return
    found = {m.id for m in db.query(Material).filter(Material.id.in_(material_ids)).all()}
    missing = [mid for mid in material_ids if mid not in found]
    if missing:
        raise HTTPException(400, f"Materiales no existen: {missing}")


@router.get("/_catalog", response_model=RecetaCatalog)
def catalog(_: User = Depends(require_level_5)) -> RecetaCatalog:
    return RecetaCatalog(categorias=CATEGORIAS_RECETA)


@router.get("", response_model=list[RecetaSummary])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[RecetaSummary]:
    rows = db.query(Receta).order_by(Receta.categoria, Receta.nombre).all()
    out: list[RecetaSummary] = []
    for r in rows:
        # Costo estimado liviano (sin construir RecetaOut completo)
        items_costo = Decimal("0")
        for it in r.items:
            m = db.get(Material, it.material_id)
            if m:
                items_costo += (it.cantidad * _precio_unitario(m))
        out.append(RecetaSummary(
            id=r.id,
            nombre=r.nombre,
            descripcion=r.descripcion,
            categoria=r.categoria,
            is_active=r.is_active,
            item_count=len(r.items),
            costo_estimado=items_costo.quantize(Decimal("0.01")),
            updated_at=r.updated_at,
        ))
    return out


@router.get("/{receta_id}", response_model=RecetaOut)
def obtener(
    receta_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> RecetaOut:
    r = db.get(Receta, receta_id)
    if not r:
        raise HTTPException(404, "Receta no encontrada")
    return _receta_to_out(r, db)


@router.post("", response_model=RecetaOut, status_code=201)
def crear(
    payload: RecetaCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> RecetaOut:
    _validate_materials_exist(db, [it.material_id for it in payload.items])
    r = Receta(
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        categoria=payload.categoria,
    )
    for it in payload.items:
        r.items.append(RecetaItem(
            material_id=it.material_id,
            cantidad=it.cantidad,
            notas=it.notas,
        ))
    db.add(r)
    db.commit()
    db.refresh(r)
    return _receta_to_out(r, db)


@router.patch("/{receta_id}", response_model=RecetaOut)
def actualizar(
    receta_id: int,
    payload: RecetaUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> RecetaOut:
    r = db.get(Receta, receta_id)
    if not r:
        raise HTTPException(404, "Receta no encontrada")

    data = payload.model_dump(exclude_unset=True)
    if "items" in data and data["items"] is not None:
        new_items = payload.items or []
        _validate_materials_exist(db, [it.material_id for it in new_items])
        # Borra y reemplaza (cascade orphan-delete cuida los hijos).
        r.items.clear()
        for it in new_items:
            r.items.append(RecetaItem(
                material_id=it.material_id,
                cantidad=it.cantidad,
                notas=it.notas,
            ))
        data.pop("items")

    for k, v in data.items():
        setattr(r, k, v)

    db.commit()
    db.refresh(r)
    return _receta_to_out(r, db)


@router.delete("/{receta_id}", status_code=204)
def eliminar(
    receta_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> None:
    r = db.get(Receta, receta_id)
    if not r:
        raise HTTPException(404, "Receta no encontrada")
    db.delete(r)
    db.commit()
