"""Schemas para los catálogos (productos, plantas, customers)."""
from pydantic import BaseModel


# ── Planta ────────────────────────────────────────────────────────────────────
class PlantaCreate(BaseModel):
    codigo: str
    nombre: str
    ubicacion: str | None = None


class PlantaUpdate(BaseModel):
    nombre: str | None = None
    ubicacion: str | None = None


class PlantaOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    ubicacion: str | None = None

    model_config = {"from_attributes": True}


# ── Customer ──────────────────────────────────────────────────────────────────
class CustomerCreate(BaseModel):
    codigo: str
    nombre: str


class CustomerUpdate(BaseModel):
    nombre: str | None = None


class CustomerOut(BaseModel):
    id: int
    codigo: str
    nombre: str

    model_config = {"from_attributes": True}


# ── Producto ──────────────────────────────────────────────────────────────────
class ProductoCreate(BaseModel):
    sku: str
    nombre: str
    unidad: str = "kg"
    familia: str | None = None
    categoria: str | None = None


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    familia: str | None = None
    categoria: str | None = None


class ProductoOut(BaseModel):
    id: int
    sku: str
    nombre: str
    unidad: str
    familia: str | None = None
    categoria: str | None = None

    model_config = {"from_attributes": True}
