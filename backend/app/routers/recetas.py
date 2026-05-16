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
from sqlalchemy.orm import Session, selectinload

from app.core.deps import require_level_5
from app.db import get_db
from app.models.material import Material
from app.models.proveedor import Proveedor
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


def _grupo_efectivo(it: RecetaItem, mat: Material | None) -> str:
    """Si el item tiene grupo explícito, usa ese. Si no, infiere de familia."""
    if it.grupo:
        return it.grupo
    return (mat.familia if mat else "Otros")


def _load_materiales(db: Session, material_ids: set[int]) -> dict[int, Material]:
    if not material_ids:
        return {}
    rows = db.query(Material).filter(Material.id.in_(material_ids)).all()
    return {m.id: m for m in rows}


def _load_proveedores(db: Session, proveedor_ids: set[int]) -> dict[int, Proveedor]:
    proveedor_ids = {pid for pid in proveedor_ids if pid is not None}
    if not proveedor_ids:
        return {}
    rows = db.query(Proveedor).filter(Proveedor.id.in_(proveedor_ids)).all()
    return {p.id: p for p in rows}


def _item_to_out(
    it: RecetaItem,
    materiales: dict[int, Material],
    proveedores: dict[int, Proveedor],
) -> RecetaItemOut:
    m = materiales.get(it.material_id)
    prov = (proveedores.get(m.proveedor_id) if (m and m.proveedor_id) else None)
    return RecetaItemOut(
        id=it.id,
        material_id=it.material_id,
        material_nombre=m.nombre if m else "(material eliminado)",
        material_familia=m.familia if m else "—",
        material_unidad=m.unidad if m else "—",
        material_precio_paquete=(m.precio_paquete if m else Decimal("0")),
        material_contenido_por_paquete=(m.contenido_por_paquete if m else Decimal("1")),
        material_precio_unitario=_precio_unitario(m) if m else Decimal("0"),
        material_color_hex=(m.color_hex if m else None),
        material_proveedor_nombre=(prov.nombre if prov else None),
        cantidad=it.cantidad,
        grupo=it.grupo,
        grupo_efectivo=_grupo_efectivo(it, m),
        orden=it.orden or 0,
        notas=it.notas,
    )


def _receta_to_out(r: Receta, db: Session) -> RecetaOut:
    material_ids = {it.material_id for it in r.items}
    materiales = _load_materiales(db, material_ids)
    proveedor_ids = {m.proveedor_id for m in materiales.values() if m.proveedor_id}
    proveedores = _load_proveedores(db, proveedor_ids)

    items_out = [_item_to_out(it, materiales, proveedores) for it in r.items]
    costo = sum((io.cantidad * io.material_precio_unitario for io in items_out), Decimal("0"))
    return RecetaOut(
        id=r.id,
        nombre=r.nombre,
        descripcion=r.descripcion,
        categoria=r.categoria,
        n_arreglos_default=r.n_arreglos_default or 1,
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
    rows = (
        db.query(Receta)
        .options(selectinload(Receta.items))
        .order_by(Receta.categoria, Receta.nombre)
        .all()
    )
    # Precarga TODOS los materiales referenciados en una sola query
    material_ids = {it.material_id for r in rows for it in r.items}
    materiales = _load_materiales(db, material_ids)

    out: list[RecetaSummary] = []
    for r in rows:
        items_costo = Decimal("0")
        for it in r.items:
            m = materiales.get(it.material_id)
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
        n_arreglos_default=payload.n_arreglos_default,
    )
    for it in payload.items:
        r.items.append(RecetaItem(
            material_id=it.material_id,
            cantidad=it.cantidad,
            grupo=it.grupo,
            orden=it.orden,
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
                grupo=it.grupo,
                orden=it.orden,
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
