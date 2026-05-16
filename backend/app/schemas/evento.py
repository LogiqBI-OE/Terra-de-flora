"""Schemas para eventos de calendario."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.evento import TipoEvento


class ParticipanteOut(BaseModel):
    user_id: int
    nombre: str
    iniciales: str


class EventoCreate(BaseModel):
    tipo: TipoEvento = TipoEvento.junta
    titulo: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    all_day: bool = False
    proyecto_id: int | None = None
    participante_ids: list[int] = []
    is_done: bool = False


class EventoUpdate(BaseModel):
    tipo: TipoEvento | None = None
    titulo: str | None = None
    descripcion: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    all_day: bool | None = None
    proyecto_id: int | None = None
    participante_ids: list[int] | None = None
    is_done: bool | None = None


class EventoOut(BaseModel):
    """Evento real o sintético (los sintéticos tienen id=0 y kind='proyecto')."""
    id: int
    # 'evento' = creado por usuario; 'proyecto' = sintético desde proyecto.fecha_evento
    kind: str
    tipo: TipoEvento | None  # None para sintéticos
    titulo: str
    descripcion: str | None
    start_at: datetime
    end_at: datetime | None
    all_day: bool
    proyecto_id: int | None
    proyecto_codigo: str | None
    proyecto_nombre: str | None
    owner_id: int | None
    owner_nombre: str | None
    is_done: bool
    is_mine: bool  # true si el owner soy yo
    can_edit: bool  # true si soy owner y no es sintético
    participantes: list[ParticipanteOut]
