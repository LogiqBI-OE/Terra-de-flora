"""Router: cotizaciones por proyecto. Acceso L5+.

Endpoints:
  GET    /proyectos/{pid}/cotizaciones              → lista resumida de versiones
  GET    /proyectos/{pid}/cotizaciones/_catalog     → catálogo de secciones tipo
  POST   /proyectos/{pid}/cotizaciones              → crear v1 (o duplicar última)
  POST   /proyectos/{pid}/cotizaciones/{id}/duplicar→ duplica versión a la siguiente
  GET    /cotizaciones/{id}                          → detalle completo (con totales)
  PATCH  /cotizaciones/{id}                          → actualiza metadata; al pasar a
                                                       'enviada'/'aprobada' congela costos
  DELETE /cotizaciones/{id}                          → borra (solo borrador)

  POST   /cotizaciones/{id}/secciones                → crear sección (+ items opcionales)
  PATCH  /cotizaciones/secciones/{sid}               → actualizar sección
  DELETE /cotizaciones/secciones/{sid}               → borrar sección

  POST   /cotizaciones/secciones/{sid}/items         → agregar item
  PATCH  /cotizaciones/items/{iid}                   → actualizar item
  DELETE /cotizaciones/items/{iid}                   → borrar item
"""
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.core.deps import require_level_5
from app.db import get_db
from app.models.cotizacion import (
    Cotizacion,
    CotizacionItem,
    CotizacionSeccion,
    EstadoCotizacion,
)
from app.models.material import Material
from app.models.proyecto import Proyecto
from app.models.receta import Receta, RecetaItem
from app.schemas.cotizacion import (
    CotizacionCatalog,
    CotizacionCreate,
    CotizacionItemCreate,
    CotizacionItemOut,
    CotizacionItemUpdate,
    CotizacionOut,
    CotizacionSeccionCreate,
    CotizacionSeccionOut,
    CotizacionSeccionUpdate,
    CotizacionSummary,
    CotizacionUpdate,
    SeccionTipoOption,
)


router = APIRouter(tags=["cotizaciones"])

SECCIONES_TIPO = [
    {"nombre": "Mesa de novios", "emoji": "💞"},
    {"nombre": "Recepción", "emoji": "🥂"},
    {"nombre": "Iglesia", "emoji": "⛪"},
    {"nombre": "Civil", "emoji": "⚖️"},
    {"nombre": "Centros de mesa", "emoji": "🌸"},
    {"nombre": "Cocteleria", "emoji": "🍸"},
    {"nombre": "Baños", "emoji": "🚻"},
    {"nombre": "Camino al altar", "emoji": "🌿"},
    {"nombre": "Brunch", "emoji": "🍳"},
    {"nombre": "Otro", "emoji": "✨"},
]

ZERO = Decimal("0")
Q2 = Decimal("0.01")


def _q2(v: Decimal) -> Decimal:
    return v.quantize(Q2)


# ── Cálculo de costos ─────────────────────────────────────────────────────
class RecetaCostCache:
    """Precarga en batch los costos y nombres de un set de recetas para
    evitar N+1 queries al construir CotizacionOut.

    Uso:
        cache = RecetaCostCache(db).load_for([id1, id2, ...])
        nombre, costo = cache.get(receta_id)
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self._cache: dict[int, tuple[str, Decimal]] = {}

    def load_for(self, receta_ids: list[int]) -> "RecetaCostCache":
        # Quita None / duplicados y filtra los que ya tenemos
        unique_ids = {rid for rid in receta_ids if rid is not None and rid not in self._cache}
        if not unique_ids:
            return self
        # 1 query: trae las recetas con items y materials eager-loaded
        recetas = (
            self.db.query(Receta)
            .options(selectinload(Receta.items))
            .filter(Receta.id.in_(unique_ids))
            .all()
        )
        # 2 query: precios de materiales referenciados
        material_ids: set[int] = set()
        for r in recetas:
            for it in r.items:
                material_ids.add(it.material_id)
        materiales: dict[int, Material] = {}
        if material_ids:
            for m in self.db.query(Material).filter(Material.id.in_(material_ids)).all():
                materiales[m.id] = m

        for r in recetas:
            total = ZERO
            for it in r.items:
                mat = materiales.get(it.material_id)
                if not mat or mat.contenido_por_paquete <= 0:
                    continue
                precio_unit = mat.precio_paquete / mat.contenido_por_paquete
                total += precio_unit * it.cantidad
            self._cache[r.id] = (r.nombre, total)

        # Marca como "(eliminada)" las que pediste pero no existen
        for rid in unique_ids:
            if rid not in self._cache:
                self._cache[rid] = ("(receta eliminada)", ZERO)

        return self

    def get(self, receta_id: int) -> tuple[str, Decimal]:
        if receta_id not in self._cache:
            # Lazy fallback: carga sola esta receta. Idealmente nunca pasa.
            self.load_for([receta_id])
        return self._cache.get(receta_id, ("(receta eliminada)", ZERO))


def _collect_receta_ids(c: Cotizacion) -> list[int]:
    return [it.receta_id for s in c.secciones for it in s.items if it.receta_id is not None]


# Mantengo helpers legacy para freeze (que solo corre 1 vez por cotización al firmar)
def _costo_unit_receta_uncached(db: Session, receta_id: int) -> Decimal:
    items = db.query(RecetaItem).filter(RecetaItem.receta_id == receta_id).all()
    total = ZERO
    for it in items:
        mat = db.get(Material, it.material_id)
        if not mat or mat.contenido_por_paquete <= 0:
            continue
        precio_unit = mat.precio_paquete / mat.contenido_por_paquete
        total += precio_unit * it.cantidad
    return total


def _nombre_receta_uncached(db: Session, receta_id: int) -> str:
    r = db.get(Receta, receta_id)
    return r.nombre if r else "(receta eliminada)"


def _item_to_out(
    it: CotizacionItem,
    margen_default: Decimal,
    is_snapshot: bool,
    cache: RecetaCostCache,
) -> CotizacionItemOut:
    if is_snapshot and it.costo_unit_snapshot is not None:
        costo_unit = Decimal(it.costo_unit_snapshot)
        nombre = it.nombre_snapshot or it.descripcion or "(item)"
    else:
        if it.receta_id is not None:
            nombre, costo_unit = cache.get(it.receta_id)
        else:
            costo_unit = ZERO
            nombre = it.descripcion or "(item libre)"

    cant = Decimal(it.cantidad)
    if it.precio_venta_unit is not None:
        precio_venta = Decimal(it.precio_venta_unit)
    else:
        precio_venta = costo_unit * (Decimal("1") + margen_default)

    return CotizacionItemOut(
        id=it.id,
        seccion_id=it.seccion_id,
        receta_id=it.receta_id,
        descripcion=it.descripcion,
        cantidad=cant,
        precio_venta_unit=it.precio_venta_unit,
        orden=it.orden,
        notas=it.notas,
        nombre=nombre,
        costo_unit=_q2(costo_unit),
        precio_venta_calc=_q2(precio_venta),
        subtotal_costo=_q2(costo_unit * cant),
        subtotal_venta=_q2(precio_venta * cant),
        is_snapshot=is_snapshot,
    )


def _to_seccion_out(
    s: CotizacionSeccion,
    margen_default: Decimal,
    is_snapshot: bool,
    cache: RecetaCostCache,
) -> CotizacionSeccionOut:
    items_out = [_item_to_out(it, margen_default, is_snapshot, cache) for it in s.items]
    subtotal_costo = sum((it.subtotal_costo for it in items_out), ZERO)
    subtotal_venta = sum((it.subtotal_venta for it in items_out), ZERO)
    return CotizacionSeccionOut(
        id=s.id,
        cotizacion_id=s.cotizacion_id,
        nombre=s.nombre,
        orden=s.orden,
        notas=s.notas,
        items=items_out,
        subtotal_costo=_q2(subtotal_costo),
        subtotal_venta=_q2(subtotal_venta),
    )


def _to_out(db: Session, c: Cotizacion) -> CotizacionOut:
    is_snap = c.snapshot_at is not None
    margen = Decimal(c.margen_default)
    cache = RecetaCostCache(db).load_for(_collect_receta_ids(c))
    secciones_out = [_to_seccion_out(s, margen, is_snap, cache) for s in c.secciones]
    total_costo = sum((s.subtotal_costo for s in secciones_out), ZERO)
    total_venta = sum((s.subtotal_venta for s in secciones_out), ZERO)
    margen_real = (
        ((total_venta - total_costo) / total_venta) if total_venta > 0 else ZERO
    )
    return CotizacionOut(
        id=c.id,
        proyecto_id=c.proyecto_id,
        version=c.version,
        nombre=c.nombre,
        estado=c.estado,
        margen_default=margen,
        notas=c.notas,
        snapshot_at=c.snapshot_at,
        is_active=c.is_active,
        created_at=c.created_at,
        updated_at=c.updated_at,
        secciones=secciones_out,
        total_costo=_q2(total_costo),
        total_venta=_q2(total_venta),
        margen_real=margen_real,
    )


def _summary(db: Session, c: Cotizacion, cache: RecetaCostCache | None = None) -> CotizacionSummary:
    is_snap = c.snapshot_at is not None
    margen = Decimal(c.margen_default)
    if cache is None:
        cache = RecetaCostCache(db).load_for(_collect_receta_ids(c))
    total_venta = ZERO
    for s in c.secciones:
        for it in s.items:
            out = _item_to_out(it, margen, is_snap, cache)
            total_venta += out.subtotal_venta
    return CotizacionSummary(
        id=c.id,
        proyecto_id=c.proyecto_id,
        version=c.version,
        nombre=c.nombre,
        estado=c.estado,
        snapshot_at=c.snapshot_at,
        is_active=c.is_active,
        total_venta=_q2(total_venta),
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


# ── Snapshot al congelar ──────────────────────────────────────────────────
def _freeze_snapshot(db: Session, c: Cotizacion) -> None:
    """Llena nombre_snapshot y costo_unit_snapshot en todos los items."""
    for s in c.secciones:
        for it in s.items:
            if it.receta_id is not None:
                it.costo_unit_snapshot = _costo_unit_receta_uncached(db, it.receta_id)
                it.nombre_snapshot = _nombre_receta_uncached(db, it.receta_id)
            else:
                it.costo_unit_snapshot = ZERO
                it.nombre_snapshot = it.descripcion or "(item libre)"
    c.snapshot_at = datetime.now(timezone.utc)


# ── Endpoints: catálogo + lista ───────────────────────────────────────────
@router.get(
    "/proyectos/{pid}/cotizaciones/_catalog",
    response_model=CotizacionCatalog,
    dependencies=[Depends(require_level_5)],
)
def catalog() -> CotizacionCatalog:
    return CotizacionCatalog(
        secciones_tipo=[SeccionTipoOption(**s) for s in SECCIONES_TIPO]
    )


@router.get(
    "/proyectos/{pid}/cotizaciones",
    response_model=list[CotizacionSummary],
    dependencies=[Depends(require_level_5)],
)
def list_versions(pid: int, db: Session = Depends(get_db)) -> list[CotizacionSummary]:
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    versiones = (
        db.query(Cotizacion)
        .options(selectinload(Cotizacion.secciones).selectinload(CotizacionSeccion.items))
        .filter(Cotizacion.proyecto_id == pid)
        .order_by(Cotizacion.version.desc())
        .all()
    )
    # Una sola cache compartida para todas las versiones del proyecto
    all_receta_ids: list[int] = []
    for c in versiones:
        all_receta_ids.extend(_collect_receta_ids(c))
    cache = RecetaCostCache(db).load_for(all_receta_ids)
    return [_summary(db, c, cache) for c in versiones]


@router.post(
    "/proyectos/{pid}/cotizaciones",
    response_model=CotizacionOut,
    dependencies=[Depends(require_level_5)],
)
def create_cotizacion(
    pid: int, payload: CotizacionCreate, db: Session = Depends(get_db)
) -> CotizacionOut:
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    siguiente = (
        db.query(Cotizacion)
        .filter(Cotizacion.proyecto_id == pid)
        .order_by(Cotizacion.version.desc())
        .first()
    )
    next_v = (siguiente.version + 1) if siguiente else 1
    c = Cotizacion(
        proyecto_id=pid,
        version=next_v,
        nombre=payload.nombre,
        margen_default=payload.margen_default,
        notas=payload.notas,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_out(db, c)


@router.post(
    "/proyectos/{pid}/cotizaciones/{cid}/duplicar",
    response_model=CotizacionOut,
    dependencies=[Depends(require_level_5)],
)
def duplicar(pid: int, cid: int, db: Session = Depends(get_db)) -> CotizacionOut:
    src = db.get(Cotizacion, cid)
    if not src or src.proyecto_id != pid:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    siguiente = (
        db.query(Cotizacion)
        .filter(Cotizacion.proyecto_id == pid)
        .order_by(Cotizacion.version.desc())
        .first()
    )
    next_v = (siguiente.version + 1) if siguiente else 1
    nueva = Cotizacion(
        proyecto_id=pid,
        version=next_v,
        nombre=src.nombre,
        margen_default=src.margen_default,
        notas=src.notas,
        estado=EstadoCotizacion.borrador,
    )
    db.add(nueva)
    db.flush()
    for s in src.secciones:
        ns = CotizacionSeccion(
            cotizacion_id=nueva.id, nombre=s.nombre, orden=s.orden, notas=s.notas
        )
        db.add(ns)
        db.flush()
        for it in s.items:
            db.add(
                CotizacionItem(
                    seccion_id=ns.id,
                    receta_id=it.receta_id,
                    descripcion=it.descripcion,
                    cantidad=it.cantidad,
                    precio_venta_unit=it.precio_venta_unit,
                    orden=it.orden,
                    notas=it.notas,
                )
            )
    db.commit()
    db.refresh(nueva)
    return _to_out(db, nueva)


# ── Endpoints: detalle/edición de una cotización ──────────────────────────
@router.get(
    "/cotizaciones/{cid}",
    response_model=CotizacionOut,
    dependencies=[Depends(require_level_5)],
)
def get_cotizacion(cid: int, db: Session = Depends(get_db)) -> CotizacionOut:
    c = (
        db.query(Cotizacion)
        .options(selectinload(Cotizacion.secciones).selectinload(CotizacionSeccion.items))
        .filter(Cotizacion.id == cid)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return _to_out(db, c)


@router.patch(
    "/cotizaciones/{cid}",
    response_model=CotizacionOut,
    dependencies=[Depends(require_level_5)],
)
def update_cotizacion(
    cid: int, payload: CotizacionUpdate, db: Session = Depends(get_db)
) -> CotizacionOut:
    c = db.get(Cotizacion, cid)
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if payload.nombre is not None:
        c.nombre = payload.nombre
    if payload.margen_default is not None:
        if c.snapshot_at is not None:
            raise HTTPException(
                status_code=400,
                detail="No puedes cambiar el margen en una versión congelada. Duplica a una nueva versión.",
            )
        c.margen_default = payload.margen_default
    if payload.notas is not None:
        c.notas = payload.notas

    if payload.estado is not None and payload.estado != c.estado:
        prev = c.estado
        c.estado = payload.estado
        # Congelar al pasar a enviada/aprobada por primera vez
        if (
            payload.estado in (EstadoCotizacion.enviada, EstadoCotizacion.aprobada)
            and c.snapshot_at is None
        ):
            _freeze_snapshot(db, c)
        # Si vuelve a borrador, "descongelamos" (limpiamos snapshot) para
        # que vuelva a leer precios vivos.
        if payload.estado == EstadoCotizacion.borrador and prev != EstadoCotizacion.borrador:
            for s in c.secciones:
                for it in s.items:
                    it.costo_unit_snapshot = None
                    it.nombre_snapshot = None
            c.snapshot_at = None

    db.commit()
    db.refresh(c)
    return _to_out(db, c)


@router.delete(
    "/cotizaciones/{cid}",
    status_code=204,
    dependencies=[Depends(require_level_5)],
)
def delete_cotizacion(cid: int, db: Session = Depends(get_db)) -> None:
    c = db.get(Cotizacion, cid)
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if c.estado != EstadoCotizacion.borrador:
        raise HTTPException(
            status_code=400, detail="Solo puedes borrar versiones en borrador."
        )
    db.delete(c)
    db.commit()


def _assert_editable(c: Cotizacion) -> None:
    if c.snapshot_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Esta versión está congelada. Duplícala para editar.",
        )


# ── Secciones ─────────────────────────────────────────────────────────────
@router.post(
    "/cotizaciones/{cid}/secciones",
    response_model=CotizacionSeccionOut,
    dependencies=[Depends(require_level_5)],
)
def create_seccion(
    cid: int, payload: CotizacionSeccionCreate, db: Session = Depends(get_db)
) -> CotizacionSeccionOut:
    c = db.get(Cotizacion, cid)
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    _assert_editable(c)
    s = CotizacionSeccion(
        cotizacion_id=cid,
        nombre=payload.nombre,
        orden=payload.orden,
        notas=payload.notas,
    )
    db.add(s)
    db.flush()
    for it in payload.items:
        db.add(
            CotizacionItem(
                seccion_id=s.id,
                receta_id=it.receta_id,
                descripcion=it.descripcion,
                cantidad=it.cantidad,
                precio_venta_unit=it.precio_venta_unit,
                orden=it.orden,
                notas=it.notas,
            )
        )
    db.commit()
    db.refresh(s)
    cache = RecetaCostCache(db).load_for([it.receta_id for it in s.items if it.receta_id])
    return _to_seccion_out(s, Decimal(c.margen_default), False, cache)


@router.patch(
    "/cotizaciones/secciones/{sid}",
    response_model=CotizacionSeccionOut,
    dependencies=[Depends(require_level_5)],
)
def update_seccion(
    sid: int, payload: CotizacionSeccionUpdate, db: Session = Depends(get_db)
) -> CotizacionSeccionOut:
    s = db.get(CotizacionSeccion, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    c = db.get(Cotizacion, s.cotizacion_id)
    _assert_editable(c)
    if payload.nombre is not None:
        s.nombre = payload.nombre
    if payload.orden is not None:
        s.orden = payload.orden
    if payload.notas is not None:
        s.notas = payload.notas
    db.commit()
    db.refresh(s)
    cache = RecetaCostCache(db).load_for([it.receta_id for it in s.items if it.receta_id])
    return _to_seccion_out(s, Decimal(c.margen_default), False, cache)


@router.delete(
    "/cotizaciones/secciones/{sid}",
    status_code=204,
    dependencies=[Depends(require_level_5)],
)
def delete_seccion(sid: int, db: Session = Depends(get_db)) -> None:
    s = db.get(CotizacionSeccion, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    c = db.get(Cotizacion, s.cotizacion_id)
    _assert_editable(c)
    db.delete(s)
    db.commit()


# ── Items ─────────────────────────────────────────────────────────────────
@router.post(
    "/cotizaciones/secciones/{sid}/items",
    response_model=CotizacionItemOut,
    dependencies=[Depends(require_level_5)],
)
def create_item(
    sid: int, payload: CotizacionItemCreate, db: Session = Depends(get_db)
) -> CotizacionItemOut:
    s = db.get(CotizacionSeccion, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    c = db.get(Cotizacion, s.cotizacion_id)
    _assert_editable(c)
    it = CotizacionItem(
        seccion_id=sid,
        receta_id=payload.receta_id,
        descripcion=payload.descripcion,
        cantidad=payload.cantidad,
        precio_venta_unit=payload.precio_venta_unit,
        orden=payload.orden,
        notas=payload.notas,
    )
    db.add(it)
    db.commit()
    db.refresh(it)
    cache = RecetaCostCache(db).load_for([it.receta_id] if it.receta_id else [])
    return _item_to_out(it, Decimal(c.margen_default), False, cache)


@router.patch(
    "/cotizaciones/items/{iid}",
    response_model=CotizacionItemOut,
    dependencies=[Depends(require_level_5)],
)
def update_item(
    iid: int, payload: CotizacionItemUpdate, db: Session = Depends(get_db)
) -> CotizacionItemOut:
    it = db.get(CotizacionItem, iid)
    if not it:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    s = db.get(CotizacionSeccion, it.seccion_id)
    c = db.get(Cotizacion, s.cotizacion_id)
    _assert_editable(c)
    if payload.receta_id is not None:
        it.receta_id = payload.receta_id
    if payload.descripcion is not None:
        it.descripcion = payload.descripcion
    if payload.cantidad is not None:
        it.cantidad = payload.cantidad
    if payload.precio_venta_unit is not None:
        it.precio_venta_unit = payload.precio_venta_unit
    if payload.orden is not None:
        it.orden = payload.orden
    if payload.notas is not None:
        it.notas = payload.notas
    db.commit()
    db.refresh(it)
    cache = RecetaCostCache(db).load_for([it.receta_id] if it.receta_id else [])
    return _item_to_out(it, Decimal(c.margen_default), False, cache)


@router.delete(
    "/cotizaciones/items/{iid}",
    status_code=204,
    dependencies=[Depends(require_level_5)],
)
def delete_item(iid: int, db: Session = Depends(get_db)) -> None:
    it = db.get(CotizacionItem, iid)
    if not it:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    s = db.get(CotizacionSeccion, it.seccion_id)
    c = db.get(Cotizacion, s.cotizacion_id)
    _assert_editable(c)
    db.delete(it)
    db.commit()
