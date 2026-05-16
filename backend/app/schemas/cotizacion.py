"""Schemas para cotizaciones."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.cotizacion import EstadoCotizacion


# ── Item ──────────────────────────────────────────────────────────────────
class CotizacionItemBase(BaseModel):
    receta_id: int | None = None
    descripcion: str | None = None
    cantidad: Decimal = Field(default=Decimal("1"), ge=Decimal("0"))
    precio_venta_unit: Decimal | None = None  # override; si NULL usa margen default
    orden: int = 0
    notas: str | None = None


class CotizacionItemCreate(CotizacionItemBase):
    pass


class CotizacionItemUpdate(BaseModel):
    receta_id: int | None = None
    descripcion: str | None = None
    cantidad: Decimal | None = None
    precio_venta_unit: Decimal | None = None
    orden: int | None = None
    notas: str | None = None


class CotizacionItemOut(CotizacionItemBase):
    id: int
    seccion_id: int
    # Calculados en vivo (o desde snapshot si la cotización está congelada):
    nombre: str  # nombre de la receta o `descripcion`
    costo_unit: Decimal  # costo de materia prima por unidad
    precio_venta_calc: Decimal  # precio_venta_unit override o costo_unit*(1+margen)
    subtotal_costo: Decimal  # costo_unit * cantidad
    subtotal_venta: Decimal  # precio_venta_calc * cantidad
    is_snapshot: bool

    model_config = {"from_attributes": True}


# ── Sección ───────────────────────────────────────────────────────────────
class CotizacionSeccionBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=160)
    orden: int = 0
    notas: str | None = None


class CotizacionSeccionCreate(CotizacionSeccionBase):
    items: list[CotizacionItemCreate] = []


class CotizacionSeccionUpdate(BaseModel):
    nombre: str | None = None
    orden: int | None = None
    notas: str | None = None


class CotizacionSeccionOut(CotizacionSeccionBase):
    id: int
    cotizacion_id: int
    items: list[CotizacionItemOut]
    subtotal_costo: Decimal
    subtotal_venta: Decimal


# ── Cotización ────────────────────────────────────────────────────────────
class CotizacionCreate(BaseModel):
    """Crear una cotización nueva en un proyecto (siempre arranca como v=siguiente)."""
    nombre: str | None = None
    margen_default: Decimal = Field(default=Decimal("0.35"), ge=Decimal("0"), le=Decimal("1"))
    notas: str | None = None


class CotizacionUpdate(BaseModel):
    nombre: str | None = None
    estado: EstadoCotizacion | None = None
    margen_default: Decimal | None = None
    notas: str | None = None


class CotizacionOut(BaseModel):
    id: int
    proyecto_id: int
    version: int
    nombre: str | None
    estado: EstadoCotizacion
    margen_default: Decimal
    notas: str | None
    snapshot_at: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    secciones: list[CotizacionSeccionOut]

    # Totales agregados:
    total_costo: Decimal
    total_venta: Decimal
    margen_real: Decimal  # (total_venta - total_costo) / total_venta, 0 si venta=0

    model_config = {"from_attributes": True}


class CotizacionSummary(BaseModel):
    """Versión resumida para la lista de versiones (sidebar cards)."""
    id: int
    proyecto_id: int
    version: int
    nombre: str | None
    estado: EstadoCotizacion
    snapshot_at: datetime | None
    is_active: bool
    total_venta: Decimal
    total_costo: Decimal
    secciones_count: int
    items_count: int
    created_at: datetime
    updated_at: datetime


# ── Catálogo de secciones tipo ────────────────────────────────────────────
class SeccionTipoOption(BaseModel):
    nombre: str
    emoji: str


class CotizacionCatalog(BaseModel):
    secciones_tipo: list[SeccionTipoOption]


# ── Desviación (snapshot vs precio actual del catálogo) ──────────────────
class DesviacionItem(BaseModel):
    """Comparación del costo congelado de un item vs el costo actual del
    catálogo (Fase 3)."""
    item_id: int
    receta_id: int | None
    nombre: str
    seccion_nombre: str
    cantidad: Decimal
    costo_snapshot: Decimal     # costo unitario al momento de congelar
    costo_actual: Decimal       # costo unitario hoy (recalculado del catálogo)
    delta_unit: Decimal         # costo_actual - costo_snapshot
    delta_total: Decimal        # delta_unit * cantidad
    direccion: str              # 'sube' | 'baja' | 'igual'


class DesviacionResumen(BaseModel):
    cotizacion_id: int
    snapshot_at: datetime | None
    snapshot_total_costo: Decimal
    actual_total_costo: Decimal
    delta_total: Decimal
    delta_pct: Decimal          # porcentaje del catálogo respecto al snapshot
    items: list[DesviacionItem]
