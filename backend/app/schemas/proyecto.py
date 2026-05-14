"""Schemas para CRUD de proyectos."""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.proyecto import EstadoProyecto, TipoProyecto


class ProyectoLocation(BaseModel):
    """Un lugar del evento (iglesia, civil, recepcion, otro)."""
    tipo: str = "Recepción"
    nombre: str = ""
    hora_evento: str | None = None
    hora_montaje: str | None = None
    hora_desmontaje: str | None = None
    notas: str | None = None


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
    cant_invitados: int | None = Field(None, ge=0)
    planner_nombre: str | None = None
    planner_telefono: str | None = None
    planner_email: str | None = None
    locations: list[ProyectoLocation] = []
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
    cant_invitados: int | None = None
    planner_nombre: str | None = None
    planner_telefono: str | None = None
    planner_email: str | None = None
    locations: list[ProyectoLocation] | None = None
    notas: str | None = None
    is_active: bool | None = None


class ProyectoOut(BaseModel):
    id: int
    codigo: str
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
    cant_invitados: int | None
    planner_nombre: str | None
    planner_telefono: str | None
    planner_email: str | None
    locations: list[ProyectoLocation]
    notas: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VendedorOption(BaseModel):
    id: int
    nombre: str
    username: str | None
    level: int


class ProyectoCatalog(BaseModel):
    tipos: list[dict]
    estados: list[dict]
    vendedores: list[VendedorOption]
    tipos_lugar: list[str]   # ["Iglesia", "Civil", "Recepción", "Otro"]
