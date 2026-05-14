"""Schemas para CRUD de clientes."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.cliente import TipoCliente


class ClienteCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    tipo: TipoCliente = TipoCliente.PF
    razon_social: str | None = None
    rfc: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None
    notas: str | None = None
    como_nos_contacto: str | None = None


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    tipo: TipoCliente | None = None
    razon_social: str | None = None
    rfc: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None
    notas: str | None = None
    como_nos_contacto: str | None = None
    is_active: bool | None = None


class ClienteOut(BaseModel):
    id: int
    nombre: str
    tipo: TipoCliente
    razon_social: str | None
    rfc: str | None
    telefono: str | None
    email: str | None
    direccion: str | None
    notas: str | None
    como_nos_contacto: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
