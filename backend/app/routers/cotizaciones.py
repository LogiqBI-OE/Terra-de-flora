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
    DesviacionItem,
    DesviacionResumen,
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


# ── Cache de materiales (para items material-based) ─────────────────────
class MaterialInfoCache:
    """Precarga materiales + proveedores referenciados en una cotización
    para construir CotizacionItemOut sin N+1."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._mats: dict[int, Material] = {}
        self._provs: dict[int, str] = {}

    def load_for(self, material_ids: list[int]) -> "MaterialInfoCache":
        from app.models.proveedor import Proveedor
        unique = {mid for mid in material_ids if mid is not None and mid not in self._mats}
        if unique:
            for m in self.db.query(Material).filter(Material.id.in_(unique)).all():
                self._mats[m.id] = m
            prov_ids = {m.proveedor_id for m in self._mats.values() if m.proveedor_id}
            prov_ids -= set(self._provs.keys())
            if prov_ids:
                for p in self.db.query(Proveedor).filter(Proveedor.id.in_(prov_ids)).all():
                    self._provs[p.id] = p.nombre
        return self

    def get(self, material_id: int) -> Material | None:
        return self._mats.get(material_id)

    def proveedor(self, proveedor_id: int | None) -> str | None:
        if proveedor_id is None:
            return None
        return self._provs.get(proveedor_id)


def _collect_material_ids(c: Cotizacion) -> list[int]:
    return [it.material_id for s in c.secciones for it in s.items if it.material_id is not None]


def _costo_unit_material(m: Material) -> Decimal:
    contenido = m.contenido_por_paquete or Decimal("1")
    if contenido <= 0:
        return ZERO
    return Decimal(m.precio_paquete) / Decimal(contenido)


def _item_to_out(
    it: CotizacionItem,
    n_arreglos: int,
    margen_default: Decimal,
    is_snapshot: bool,
    receta_cache: RecetaCostCache,
    mat_cache: MaterialInfoCache,
) -> CotizacionItemOut:
    mat: Material | None = None
    grupo_efectivo = it.grupo or "Otros"
    material_familia = None
    material_unidad = None
    material_color_hex = None
    material_proveedor_nombre = None
    material_precio_paquete: Decimal | None = None
    material_contenido: Decimal | None = None

    if is_snapshot and it.costo_unit_snapshot is not None:
        costo_unit = Decimal(it.costo_unit_snapshot)
        nombre = it.nombre_snapshot or it.descripcion or "(item)"
        # Si era material-based, igual exponemos los datos actuales del material
        if it.material_id is not None:
            mat = mat_cache.get(it.material_id)
    elif it.material_id is not None:
        mat = mat_cache.get(it.material_id)
        if mat:
            costo_unit = _costo_unit_material(mat)
            nombre = mat.nombre
        else:
            costo_unit = ZERO
            nombre = "(material eliminado)"
    elif it.receta_id is not None:
        nombre, costo_unit = receta_cache.get(it.receta_id)
    else:
        costo_unit = ZERO
        nombre = it.descripcion or "(item libre)"

    if mat:
        material_familia = mat.familia
        material_unidad = mat.unidad
        material_color_hex = mat.color_hex
        material_proveedor_nombre = mat_cache.proveedor(mat.proveedor_id)
        material_precio_paquete = Decimal(mat.precio_paquete)
        material_contenido = Decimal(mat.contenido_por_paquete or Decimal("1"))
        if not it.grupo:
            grupo_efectivo = mat.familia or "Otros"

    cant = Decimal(it.cantidad)
    total_unidades = cant * Decimal(n_arreglos)  # cantidad TOTAL en la sección
    if it.precio_venta_unit is not None:
        precio_venta = Decimal(it.precio_venta_unit)
    else:
        precio_venta = costo_unit * (Decimal("1") + margen_default)

    return CotizacionItemOut(
        id=it.id,
        seccion_id=it.seccion_id,
        material_id=it.material_id,
        receta_id=it.receta_id,
        descripcion=it.descripcion,
        cantidad=cant,
        grupo=it.grupo,
        precio_venta_unit=it.precio_venta_unit,
        orden=it.orden,
        notas=it.notas,
        nombre=nombre,
        material_familia=material_familia,
        material_unidad=material_unidad,
        material_color_hex=material_color_hex,
        material_proveedor_nombre=material_proveedor_nombre,
        material_precio_paquete=material_precio_paquete,
        material_contenido_por_paquete=material_contenido,
        grupo_efectivo=grupo_efectivo,
        costo_unit=_q2(costo_unit),
        precio_venta_calc=_q2(precio_venta),
        subtotal_costo=_q2(costo_unit * total_unidades),
        subtotal_venta=_q2(precio_venta * total_unidades),
        is_snapshot=is_snapshot,
    )


def _to_seccion_out(
    s: CotizacionSeccion,
    margen_default: Decimal,
    is_snapshot: bool,
    receta_cache: RecetaCostCache,
    mat_cache: MaterialInfoCache,
) -> CotizacionSeccionOut:
    n_arreglos = s.n_arreglos or 1
    items_out = [
        _item_to_out(it, n_arreglos, margen_default, is_snapshot, receta_cache, mat_cache)
        for it in s.items
    ]
    subtotal_costo = sum((it.subtotal_costo for it in items_out), ZERO)
    subtotal_venta = sum((it.subtotal_venta for it in items_out), ZERO)
    return CotizacionSeccionOut(
        id=s.id,
        cotizacion_id=s.cotizacion_id,
        nombre=s.nombre,
        orden=s.orden,
        n_arreglos=n_arreglos,
        notas=s.notas,
        items=items_out,
        subtotal_costo=_q2(subtotal_costo),
        subtotal_venta=_q2(subtotal_venta),
    )


def _to_out(db: Session, c: Cotizacion) -> CotizacionOut:
    is_snap = c.snapshot_at is not None
    margen = Decimal(c.margen_default)
    receta_cache = RecetaCostCache(db).load_for(_collect_receta_ids(c))
    mat_cache = MaterialInfoCache(db).load_for(_collect_material_ids(c))
    secciones_out = [_to_seccion_out(s, margen, is_snap, receta_cache, mat_cache) for s in c.secciones]
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


def _summary(
    db: Session,
    c: Cotizacion,
    receta_cache: RecetaCostCache | None = None,
    mat_cache: MaterialInfoCache | None = None,
) -> CotizacionSummary:
    is_snap = c.snapshot_at is not None
    margen = Decimal(c.margen_default)
    if receta_cache is None:
        receta_cache = RecetaCostCache(db).load_for(_collect_receta_ids(c))
    if mat_cache is None:
        mat_cache = MaterialInfoCache(db).load_for(_collect_material_ids(c))
    total_venta = ZERO
    total_costo = ZERO
    items_count = 0
    for s in c.secciones:
        n_arreglos = s.n_arreglos or 1
        for it in s.items:
            out = _item_to_out(it, n_arreglos, margen, is_snap, receta_cache, mat_cache)
            total_venta += out.subtotal_venta
            total_costo += out.subtotal_costo
            items_count += 1
    return CotizacionSummary(
        id=c.id,
        proyecto_id=c.proyecto_id,
        version=c.version,
        nombre=c.nombre,
        estado=c.estado,
        snapshot_at=c.snapshot_at,
        is_active=c.is_active,
        total_venta=_q2(total_venta),
        total_costo=_q2(total_costo),
        secciones_count=len(c.secciones),
        items_count=items_count,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


# ── Snapshot al congelar ──────────────────────────────────────────────────
def _freeze_snapshot(db: Session, c: Cotizacion) -> None:
    """Llena nombre_snapshot y costo_unit_snapshot en todos los items."""
    mat_cache = MaterialInfoCache(db).load_for(_collect_material_ids(c))
    for s in c.secciones:
        for it in s.items:
            if it.material_id is not None:
                mat = mat_cache.get(it.material_id)
                if mat:
                    it.costo_unit_snapshot = _costo_unit_material(mat)
                    it.nombre_snapshot = mat.nombre
                else:
                    it.costo_unit_snapshot = ZERO
                    it.nombre_snapshot = it.descripcion or "(material eliminado)"
            elif it.receta_id is not None:
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
    # Caches compartidos para todas las versiones del proyecto
    all_receta_ids: list[int] = []
    all_material_ids: list[int] = []
    for c in versiones:
        all_receta_ids.extend(_collect_receta_ids(c))
        all_material_ids.extend(_collect_material_ids(c))
    receta_cache = RecetaCostCache(db).load_for(all_receta_ids)
    mat_cache = MaterialInfoCache(db).load_for(all_material_ids)
    return [_summary(db, c, receta_cache, mat_cache) for c in versiones]


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
        n_arreglos=payload.n_arreglos,
        notas=payload.notas,
    )
    db.add(s)
    db.flush()
    for it in payload.items:
        db.add(
            CotizacionItem(
                seccion_id=s.id,
                material_id=it.material_id,
                receta_id=it.receta_id,
                descripcion=it.descripcion,
                cantidad=it.cantidad,
                grupo=it.grupo,
                precio_venta_unit=it.precio_venta_unit,
                orden=it.orden,
                notas=it.notas,
            )
        )
    db.commit()
    db.refresh(s)
    receta_cache = RecetaCostCache(db).load_for([it.receta_id for it in s.items if it.receta_id])
    mat_cache = MaterialInfoCache(db).load_for([it.material_id for it in s.items if it.material_id])
    return _to_seccion_out(s, Decimal(c.margen_default), False, receta_cache, mat_cache)


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
    if payload.n_arreglos is not None:
        s.n_arreglos = payload.n_arreglos
    if payload.notas is not None:
        s.notas = payload.notas
    db.commit()
    db.refresh(s)
    receta_cache = RecetaCostCache(db).load_for([it.receta_id for it in s.items if it.receta_id])
    mat_cache = MaterialInfoCache(db).load_for([it.material_id for it in s.items if it.material_id])
    return _to_seccion_out(s, Decimal(c.margen_default), False, receta_cache, mat_cache)


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
        material_id=payload.material_id,
        receta_id=payload.receta_id,
        descripcion=payload.descripcion,
        cantidad=payload.cantidad,
        grupo=payload.grupo,
        precio_venta_unit=payload.precio_venta_unit,
        orden=payload.orden,
        notas=payload.notas,
    )
    db.add(it)
    db.commit()
    db.refresh(it)
    receta_cache = RecetaCostCache(db).load_for([it.receta_id] if it.receta_id else [])
    mat_cache = MaterialInfoCache(db).load_for([it.material_id] if it.material_id else [])
    return _item_to_out(it, s.n_arreglos or 1, Decimal(c.margen_default), False, receta_cache, mat_cache)


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
    if payload.material_id is not None:
        it.material_id = payload.material_id
    if payload.receta_id is not None:
        it.receta_id = payload.receta_id
    if payload.descripcion is not None:
        it.descripcion = payload.descripcion
    if payload.cantidad is not None:
        it.cantidad = payload.cantidad
    if payload.grupo is not None:
        it.grupo = payload.grupo
    if payload.precio_venta_unit is not None:
        it.precio_venta_unit = payload.precio_venta_unit
    if payload.orden is not None:
        it.orden = payload.orden
    if payload.notas is not None:
        it.notas = payload.notas
    db.commit()
    db.refresh(it)
    receta_cache = RecetaCostCache(db).load_for([it.receta_id] if it.receta_id else [])
    mat_cache = MaterialInfoCache(db).load_for([it.material_id] if it.material_id else [])
    return _item_to_out(it, s.n_arreglos or 1, Decimal(c.margen_default), False, receta_cache, mat_cache)


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



# ── Desviación (Fase 3: snapshot vs precio actual) ────────────────────────
@router.get(
    "/cotizaciones/{cid}/desviacion",
    response_model=DesviacionResumen,
    dependencies=[Depends(require_level_5)],
)
def get_desviacion(cid: int, db: Session = Depends(get_db)) -> DesviacionResumen:
    """Para una cotización CONGELADA: compara cada costo snapshot vs el
    costo actual del catálogo. Muestra delta unitario y total.

    Permite responder: '¿Cuánto se movió el costo desde que firmé hasta hoy?'
    Útil para saber si el evento sigue rentable cerca del día de compra.
    """
    c = (
        db.query(Cotizacion)
        .options(selectinload(Cotizacion.secciones).selectinload(CotizacionSeccion.items))
        .filter(Cotizacion.id == cid)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    receta_cache = RecetaCostCache(db).load_for(_collect_receta_ids(c))
    mat_cache = MaterialInfoCache(db).load_for(_collect_material_ids(c))
    items: list[DesviacionItem] = []
    snap_total = ZERO
    actual_total = ZERO

    for s in c.secciones:
        n_arreglos = s.n_arreglos or 1
        for it in s.items:
            cant_total = Decimal(it.cantidad) * Decimal(n_arreglos)
            # Snapshot
            if it.costo_unit_snapshot is not None:
                snap_unit = Decimal(it.costo_unit_snapshot)
            else:
                # No congelada todavía: usa el actual como snapshot
                if it.material_id is not None:
                    mat_snap = mat_cache.get(it.material_id)
                    snap_unit = _costo_unit_material(mat_snap) if mat_snap else ZERO
                elif it.receta_id is not None:
                    _, snap_unit = receta_cache.get(it.receta_id)
                else:
                    snap_unit = ZERO
            # Actual (del catálogo en vivo)
            if it.material_id is not None:
                mat = mat_cache.get(it.material_id)
                actual_unit = _costo_unit_material(mat) if mat else ZERO
                nombre = mat.nombre if mat else "(material eliminado)"
            elif it.receta_id is not None:
                nombre, actual_unit = receta_cache.get(it.receta_id)
            else:
                actual_unit = ZERO
                nombre = it.descripcion or "(item libre)"

            delta_unit = actual_unit - snap_unit
            direccion = "igual"
            if delta_unit > 0:
                direccion = "sube"
            elif delta_unit < 0:
                direccion = "baja"

            items.append(DesviacionItem(
                item_id=it.id,
                receta_id=it.receta_id,
                nombre=nombre,
                seccion_nombre=s.nombre,
                cantidad=cant_total,
                costo_snapshot=_q2(snap_unit),
                costo_actual=_q2(actual_unit),
                delta_unit=_q2(delta_unit),
                delta_total=_q2(delta_unit * cant_total),
                direccion=direccion,
            ))
            snap_total += snap_unit * cant_total
            actual_total += actual_unit * cant_total

    delta_total = actual_total - snap_total
    delta_pct = (delta_total / snap_total * Decimal("100")) if snap_total > 0 else ZERO

    return DesviacionResumen(
        cotizacion_id=c.id,
        snapshot_at=c.snapshot_at,
        snapshot_total_costo=_q2(snap_total),
        actual_total_costo=_q2(actual_total),
        delta_total=_q2(delta_total),
        delta_pct=delta_pct.quantize(Decimal("0.01")),
        items=items,
    )
