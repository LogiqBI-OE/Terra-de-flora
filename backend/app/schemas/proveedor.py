"""Schemas para CRUD de proveedores."""
from datetime import datetime

from pydantic import BaseModel, Field


class ProveedorCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=160)
    razon_social: str | None = None
    rfc: str | None = None
    contacto_nombre: str | None = None
    contacto_telefono: str | None = None
    contacto_email: str | None = None
    direccion: str | None = None
    notas: str | None = None


class ProveedorUpdate(BaseModel):
    nombre: str | None = None
    razon_social: str | None = None
    rfc: str | None = None
    contacto_nombre: str | None = None
    contacto_telefono: str | None = None
    contacto_email: str | None = None
    direccion: str | None = None
    notas: str | None = None
    is_active: bool | None = None


class ProveedorOut(BaseModel):
    id: int
    nombre: str
    razon_social: str | None
    rfc: str | None
    contacto_nombre: str | None
    contacto_telefono: str | None
    contacto_email: str | None
    direccion: str | None
    notas: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
