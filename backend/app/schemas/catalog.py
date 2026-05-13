"""Schemas de catálogos: planta, customer, producto."""
from pydantic import BaseModel


class PlantaOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    ubicacion: str | None = None
    model_config = {"from_attributes": True}


class CustomerOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    model_config = {"from_attributes": True}


class ProductoOut(BaseModel):
    id: int
    sku: str
    nombre: str
    unidad: str
    familia: str | None = None
    categoria: str | None = None
    model_config = {"from_attributes": True}
