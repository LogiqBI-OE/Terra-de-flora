"""Schemas para CRUD de proyectos."""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.proyecto import EstadoProyecto, TipoProyecto


class ProyectoCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    cliente_id: int
    vendedor_id: int | None = None
    tipo: TipoProyecto = TipoProyecto.boda
    estado: EstadoProyecto = EstadoProyecto.cotizando
    fecha_evento: date | None = None
    direccion_evento: str | None = None
    valor_estimado: Decimal = Field(default=Decimal("0"), ge=Decimal("0"))
    notas: str | None = None


class ProyectoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    cliente_id: int | None = None
    vendedor_id: int | None = None
    tipo: TipoProyecto | None = None
    estado: EstadoProyecto | None = None
    fecha_evento: date | None = None
    direccion_evento: str | None = None
    valor_estimado: Decimal | None = None
    notas: str | None = None
    is_active: bool | None = None


class ProyectoOut(BaseModel):
    id: int
    codigo: str                # PROY-{id zero-padded}
    nombre: str
    descripcion: str | None
    cliente_id: int
    cliente_nombre: str
    cliente_tipo: str
    cliente_telefono: str | None
    vendedor_id: int | None
    vendedor_nombre: str | None
    vendedor_username: str | None
    tipo: TipoProyecto
    estado: EstadoProyecto
    fecha_evento: date | None
    direccion_evento: str | None
    valor_estimado: Decimal
    notas: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VendedorOption(BaseModel):
    """Vendedor disponible (User L5+) para los dropdowns."""
    id: int
    nombre: str
    username: str | None
    level: int


class ProyectoCatalog(BaseModel):
    tipos: list[dict]      # [{id, label, emoji}]
    estados: list[dict]    # [{id, label, emoji}]
    vendedores: list[VendedorOption]
