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
