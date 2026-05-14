"""Schemas para CRUD de recetas (plantillas de conceptos)."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


CATEGORIAS_RECETA = [
    "Mesa",
    "Ambientación",
    "Iglesia",
    "Ramo",
    "Boutonniere",
    "Arco",
    "Otro",
]


class RecetaItemIn(BaseModel):
    material_id: int
    cantidad: Decimal = Field(default=Decimal("1"), gt=Decimal("0"))
    notas: str | None = None


class RecetaItemOut(BaseModel):
    id: int
    material_id: int
    material_nombre: str       # join lite
    material_familia: str
    material_unidad: str
    material_precio_unitario: Decimal
    cantidad: Decimal
    notas: str | None


class RecetaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    categoria: str = "Mesa"
    items: list[RecetaItemIn] = []


class RecetaUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    categoria: str | None = None
    is_active: bool | None = None
    # Si se pasan items, REEMPLAZA la lista completa.
    items: list[RecetaItemIn] | None = None


class RecetaOut(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    categoria: str
    is_active: bool
    items: list[RecetaItemOut]
    costo_estimado: Decimal  # suma de cantidad × precio_unitario de cada item
    item_count: int
    created_at: datetime
    updated_at: datetime


class RecetaSummary(BaseModel):
    """Version delgada para listados."""
    id: int
    nombre: str
    descripcion: str | None
    categoria: str
    is_active: bool
    item_count: int
    costo_estimado: Decimal
    updated_at: datetime


class RecetaCatalog(BaseModel):
    categorias: list[str]
