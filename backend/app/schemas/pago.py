"""Schemas para pagos."""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.pago import StatusPago, TipoPago


class PagoCreate(BaseModel):
    monto: Decimal = Field(default=Decimal("0"), ge=Decimal("0"))
    fecha: date | None = None
    metodo: str | None = None
    notas: str | None = None


class PagoUpdate(BaseModel):
    monto: Decimal | None = None
    fecha: date | None = None
    metodo: str | None = None
    status: StatusPago | None = None
    notas: str | None = None


class PagoOut(BaseModel):
    id: int
    proyecto_id: int
    tipo: TipoPago
    orden: int
    monto: Decimal
    fecha: date | None
    metodo: str | None
    status: StatusPago
    # Status calculado (aplica regla de "vencido" auto):
    status_efectivo: StatusPago
    notas: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PagosResumen(BaseModel):
    """Estado general arriba de la tabla."""
    cotizacion_final: Decimal
    cotizacion_id: int | None  # id de la versión aprobada (o última enviada)
    cotizacion_version: int | None
    cotizacion_origen: str  # "aprobada" | "enviada" | "sin_cotizacion"
    total_pagado: Decimal
    pendiente: Decimal
    alerta_regresar_deposito: bool


class PagosTabResponse(BaseModel):
    resumen: PagosResumen
    deposito: PagoOut
    pagos: list[PagoOut]


# Catálogo de métodos
class MetodoPagoOut(BaseModel):
    id: int
    nombre: str
    orden: int
    is_active: bool

    model_config = {"from_attributes": True}


class MetodoPagoIn(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=60)
    orden: int = 0
    is_active: bool = True
