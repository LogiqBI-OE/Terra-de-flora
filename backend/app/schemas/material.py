"""Schemas para CRUD de materiales + catalogos de tipos y unidades."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class MaterialCreate(BaseModel):
    codigo: str | None = None
    nombre: str = Field(..., min_length=1, max_length=200)
    familia: str = Field("Flor", min_length=1, max_length=60)
    unidad: str = Field("pieza", min_length=1, max_length=40)
    contenido_por_paquete: Decimal = Field(default=Decimal("1"), gt=Decimal("0"))
    precio_paquete: Decimal = Field(default=Decimal("0"), ge=Decimal("0"))
    proveedor_id: int | None = None
    color_hex: str | None = None
    notas: str | None = None


class MaterialUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    familia: str | None = None
    unidad: str | None = None
    contenido_por_paquete: Decimal | None = None
    precio_paquete: Decimal | None = None
    proveedor_id: int | None = None
    color_hex: str | None = None
    notas: str | None = None
    is_active: bool | None = None


class MaterialOut(BaseModel):
    id: int
    codigo: str | None
    nombre: str
    familia: str
    unidad: str
    contenido_por_paquete: Decimal
    precio_paquete: Decimal
    precio_unitario: Decimal  # calculado
    proveedor_id: int | None
    proveedor_nombre: str | None
    color_hex: str | None
    notas: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── Histórico de precios ─────────────────────────────────────────────────
class MaterialPrecioHistoricoOut(BaseModel):
    id: int
    material_id: int
    precio_paquete: Decimal
    contenido_por_paquete: Decimal
    precio_unitario: Decimal  # calculado
    changed_by_user_id: int | None
    changed_by_nombre: str | None
    source: str
    created_at: datetime


# ── Catalogos editables ───────────────────────────────────────────────────

class CatalogItemCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=60)
    orden: int = 0


class CatalogItemUpdate(BaseModel):
    nombre: str | None = None
    orden: int | None = None
    is_active: bool | None = None


class CatalogItemOut(BaseModel):
    id: int
    nombre: str
    orden: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MaterialCatalog(BaseModel):
    """Listas dinamicas para los dropdowns del MaterialesTab."""
    familias: list[str]
    unidades: list[str]
