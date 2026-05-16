"""Schemas para comentarios."""
from datetime import datetime

from pydantic import BaseModel, Field


# Lista cerrada de emojis permitidos (set fijo de 6)
ALLOWED_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👀"]


class ComentarioCreate(BaseModel):
    texto: str = Field(..., min_length=1, max_length=4000)
    parent_id: int | None = None


class ComentarioUpdate(BaseModel):
    texto: str = Field(..., min_length=1, max_length=4000)


class ParentSnippet(BaseModel):
    """Mini-tarjeta del comentario al que se responde."""
    id: int
    user_nombre: str
    texto: str  # truncado a 120 chars en el server


class ReaccionAgg(BaseModel):
    emoji: str
    count: int
    by_me: bool  # ¿el usuario actual reaccionó con este emoji?


class ComentarioOut(BaseModel):
    id: int
    proyecto_id: int
    user_id: int
    user_nombre: str
    user_iniciales: str
    user_email: str
    texto: str
    created_at: datetime
    edited_at: datetime | None
    parent_id: int | None
    parent: ParentSnippet | None
    reacciones: list[ReaccionAgg]

    model_config = {"from_attributes": True}


class EmojiToggle(BaseModel):
    emoji: str


# ── Muro de comentarios ────────────────────────────────────────────────────
class TeamUser(BaseModel):
    """Usuario mencionable (para @-autocomplete)."""
    id: int
    nombre: str
    username: str | None
    iniciales: str
    level: int


class ConversacionItem(BaseModel):
    """Una fila del listado del Muro: un proyecto + su último mensaje + badges."""
    proyecto_id: int
    proyecto_codigo: str
    proyecto_nombre: str
    cliente_nombre: str
    ultimo_mensaje: str | None
    ultimo_autor: str | None
    ultimo_at: datetime | None
    total_mensajes: int
    unread_count: int
    has_mention: bool


class ConversacionesResponse(BaseModel):
    items: list[ConversacionItem]


class BadgeProyecto(BaseModel):
    """Badge para una pill/columna específica."""
    proyecto_id: int
    unread_count: int
    has_mention: bool


class BadgeMap(BaseModel):
    """Map de badges para todos los proyectos visibles (gestor)."""
    items: list[BadgeProyecto]


class TopbarBadge(BaseModel):
    """Lo que muestra la campana del topbar."""
    unread_proyectos: int  # cuántos proyectos tienen mensajes sin leer
    total_mensajes: int    # cuántos mensajes sin leer en total
    has_mention: bool      # ¿hay alguno donde @me esté pendiente?
