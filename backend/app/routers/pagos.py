"""Router: pagos por proyecto + catálogo de métodos. Acceso L5+.

Endpoints:
  GET    /proyectos/{pid}/pagos           → resumen + depósito + pagos
  POST   /proyectos/{pid}/pagos           → agregar pago (no depósito)
  PATCH  /pagos/{pid}                     → editar pago o depósito
  DELETE /pagos/{pid}                     → borrar pago (no depósito)

  GET    /metodos-pago                    → catálogo
  POST   /metodos-pago                    → crear (L6+)
  PATCH  /metodos-pago/{id}               → editar (L6+)
  DELETE /metodos-pago/{id}               → borrar (L6+)
"""
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_5, require_level_6
from app.db import get_db
from app.models.cotizacion import Cotizacion, EstadoCotizacion
from app.models.pago import MetodoPago, Pago, StatusPago, TipoPago
from app.models.proyecto import EstadoProyecto, Proyecto
from app.routers.cotizaciones import _to_out as _cot_to_out
from app.schemas.pago import (
    MetodoPagoIn,
    MetodoPagoOut,
    PagoCreate,
    PagoOut,
    PagosResumen,
    PagosTabResponse,
    PagoUpdate,
)


router = APIRouter(tags=["pagos"])

ZERO = Decimal("0")


# ── Helpers ───────────────────────────────────────────────────────────────
def _status_efectivo(p: Pago) -> StatusPago:
    """Aplica regla de 'vencido' automático: si tiene fecha pasada y sigue
    en pendiente, se reporta como vencido sin escribir a DB."""
    if p.status == StatusPago.pendiente and p.fecha is not None and p.fecha < date.today():
        return StatusPago.vencido
    return p.status


def _to_out(p: Pago) -> PagoOut:
    return PagoOut(
        id=p.id,
        proyecto_id=p.proyecto_id,
        tipo=p.tipo,
        orden=p.orden,
        monto=p.monto,
        fecha=p.fecha,
        metodo=p.metodo,
        status=p.status,
        status_efectivo=_status_efectivo(p),
        notas=p.notas,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


def _ensure_deposito(db: Session, pid: int) -> Pago:
    """Crea el depósito si no existe (siempre uno por proyecto)."""
    d = (
        db.query(Pago)
        .filter(Pago.proyecto_id == pid, Pago.tipo == TipoPago.deposito)
        .first()
    )
    if d:
        return d
    d = Pago(proyecto_id=pid, tipo=TipoPago.deposito, orden=0, monto=ZERO)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


def _cotizacion_referencia(db: Session, pid: int) -> tuple[Decimal, int | None, int | None, str]:
    """Regresa (monto, cotizacion_id, version, origen) según prioridad:
       1) aprobada (la más reciente) → 'aprobada'
       2) si no, enviada más reciente → 'enviada'
       3) si tampoco hay, (0, None, None, 'sin_cotizacion').
    """
    aprobada = (
        db.query(Cotizacion)
        .filter(Cotizacion.proyecto_id == pid, Cotizacion.estado == EstadoCotizacion.aprobada)
        .order_by(Cotizacion.version.desc())
        .first()
    )
    if aprobada:
        out = _cot_to_out(db, aprobada)
        return out.total_venta, aprobada.id, aprobada.version, "aprobada"

    enviada = (
        db.query(Cotizacion)
        .filter(Cotizacion.proyecto_id == pid, Cotizacion.estado == EstadoCotizacion.enviada)
        .order_by(Cotizacion.version.desc())
        .first()
    )
    if enviada:
        out = _cot_to_out(db, enviada)
        return out.total_venta, enviada.id, enviada.version, "enviada"

    return ZERO, None, None, "sin_cotizacion"


# ── GET tab completo ──────────────────────────────────────────────────────
@router.get(
    "/proyectos/{pid}/pagos",
    response_model=PagosTabResponse,
    dependencies=[Depends(require_level_5)],
)
def get_tab(pid: int, db: Session = Depends(get_db)) -> PagosTabResponse:
    proyecto = db.get(Proyecto, pid)
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    deposito = _ensure_deposito(db, pid)
    pagos = (
        db.query(Pago)
        .filter(Pago.proyecto_id == pid, Pago.tipo == TipoPago.pago)
        .order_by(Pago.orden, Pago.id)
        .all()
    )

    cot_monto, cot_id, cot_version, cot_origen = _cotizacion_referencia(db, pid)

    total_pagado = ZERO
    for p in [deposito, *pagos]:
        if p.status == StatusPago.pagado:
            total_pagado += Decimal(p.monto)

    pendiente = cot_monto - total_pagado

    alerta_regresar = (
        proyecto.estado == EstadoProyecto.cancelado
        and deposito.status == StatusPago.pagado
    )

    resumen = PagosResumen(
        cotizacion_final=cot_monto,
        cotizacion_id=cot_id,
        cotizacion_version=cot_version,
        cotizacion_origen=cot_origen,
        total_pagado=total_pagado,
        pendiente=pendiente,
        alerta_regresar_deposito=alerta_regresar,
    )

    return PagosTabResponse(
        resumen=resumen,
        deposito=_to_out(deposito),
        pagos=[_to_out(p) for p in pagos],
    )


# ── Crear pago (no depósito) ──────────────────────────────────────────────
@router.post(
    "/proyectos/{pid}/pagos",
    response_model=PagoOut,
    dependencies=[Depends(require_level_5)],
)
def create_pago(
    pid: int, payload: PagoCreate, db: Session = Depends(get_db)
) -> PagoOut:
    if not db.get(Proyecto, pid):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # Orden = siguiente
    max_orden = (
        db.query(Pago)
        .filter(Pago.proyecto_id == pid, Pago.tipo == TipoPago.pago)
        .count()
    )

    p = Pago(
        proyecto_id=pid,
        tipo=TipoPago.pago,
        orden=max_orden + 1,
        monto=payload.monto,
        fecha=payload.fecha,
        metodo=payload.metodo,
        notas=payload.notas,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_out(p)


# ── Editar (cualquier pago, incluido depósito) ────────────────────────────
@router.patch(
    "/pagos/{pago_id}",
    response_model=PagoOut,
    dependencies=[Depends(require_level_5)],
)
def update_pago(
    pago_id: int, payload: PagoUpdate, db: Session = Depends(get_db)
) -> PagoOut:
    p = db.get(Pago, pago_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    if payload.monto is not None:
        p.monto = payload.monto
    if payload.fecha is not None:
        p.fecha = payload.fecha
    if payload.metodo is not None:
        p.metodo = payload.metodo
    if payload.status is not None:
        # Solo el depósito puede usar por_regresar / regresado
        if (
            payload.status in (StatusPago.por_regresar, StatusPago.regresado)
            and p.tipo != TipoPago.deposito
        ):
            raise HTTPException(
                status_code=400,
                detail="Estados por_regresar / regresado solo aplican al depósito.",
            )
        p.status = payload.status
    if payload.notas is not None:
        p.notas = payload.notas

    db.commit()
    db.refresh(p)
    return _to_out(p)


# ── Borrar (solo pagos, no depósito) ──────────────────────────────────────
@router.delete(
    "/pagos/{pago_id}",
    status_code=204,
    dependencies=[Depends(require_level_5)],
)
def delete_pago(pago_id: int, db: Session = Depends(get_db)) -> None:
    p = db.get(Pago, pago_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    if p.tipo == TipoPago.deposito:
        raise HTTPException(status_code=400, detail="No se puede borrar el depósito.")
    db.delete(p)
    db.commit()


# ── Catálogo de métodos de pago ───────────────────────────────────────────
@router.get(
    "/metodos-pago",
    response_model=list[MetodoPagoOut],
    dependencies=[Depends(require_level_5)],
)
def list_metodos(db: Session = Depends(get_db)) -> list[MetodoPagoOut]:
    rows = (
        db.query(MetodoPago)
        .filter(MetodoPago.is_active == True)  # noqa: E712
        .order_by(MetodoPago.orden, MetodoPago.nombre)
        .all()
    )
    return [MetodoPagoOut.model_validate(r) for r in rows]


@router.post(
    "/metodos-pago",
    response_model=MetodoPagoOut,
    dependencies=[Depends(require_level_6)],
)
def create_metodo(payload: MetodoPagoIn, db: Session = Depends(get_db)) -> MetodoPagoOut:
    existing = db.query(MetodoPago).filter(MetodoPago.nombre == payload.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un método con ese nombre.")
    m = MetodoPago(nombre=payload.nombre, orden=payload.orden, is_active=payload.is_active)
    db.add(m)
    db.commit()
    db.refresh(m)
    return MetodoPagoOut.model_validate(m)


@router.patch(
    "/metodos-pago/{mid}",
    response_model=MetodoPagoOut,
    dependencies=[Depends(require_level_6)],
)
def update_metodo(
    mid: int, payload: MetodoPagoIn, db: Session = Depends(get_db)
) -> MetodoPagoOut:
    m = db.get(MetodoPago, mid)
    if not m:
        raise HTTPException(status_code=404, detail="Método no encontrado")
    m.nombre = payload.nombre
    m.orden = payload.orden
    m.is_active = payload.is_active
    db.commit()
    db.refresh(m)
    return MetodoPagoOut.model_validate(m)


@router.delete(
    "/metodos-pago/{mid}",
    status_code=204,
    dependencies=[Depends(require_level_6)],
)
def delete_metodo(mid: int, db: Session = Depends(get_db)) -> None:
    m = db.get(MetodoPago, mid)
    if not m:
        raise HTTPException(status_code=404, detail="Método no encontrado")
    db.delete(m)
    db.commit()
