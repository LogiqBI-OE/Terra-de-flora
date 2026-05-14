"""Schemas para CRUD de materiales."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# Sugerencias del frontend (no enum estricto en DB para flexibilidad).
FAMILIAS = ["Flor", "Base", "Oasis", "Mecánico", "Vela", "Consumible", "Otro"]
UNIDADES = ["pieza", "paquete", "metro", "kg", "litro"]


class MaterialCreate(BaseModel):
    codigo: str | None = None
    nombre: str = Field(..., min_length=1, max_length=200)
    familia: str = Field("Flor", min_length=1, max_length=60)
    unidad: str = Field("pieza", min_length=1, max_length=20)
    contenido_por_paquete: Decimal = Field(default=Decimal("1"), gt=Decimal("0"))
    precio_paquete: Decimal = Field(default=Decimal("0"), ge=Decimal("0"))
    proveedor_id: int | None = None
    notas: str | None = None


class MaterialUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    familia: str | None = None
    unidad: str | None = None
    contenido_por_paquete: Decimal | None = None
    precio_paquete: Decimal | None = None
    proveedor_id: int | None = None
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
    proveedor_nombre: str | None  # join lite
    notas: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MaterialCatalog(BaseModel):
    """Listas sugeridas para los dropdowns del UI."""
    familias: list[str]
    unidades: list[str]
