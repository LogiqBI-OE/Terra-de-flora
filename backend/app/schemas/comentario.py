"""Schemas para comentarios."""
from datetime import datetime

from pydantic import BaseModel, Field


class ComentarioCreate(BaseModel):
    texto: str = Field(..., min_length=1, max_length=4000)


class ComentarioOut(BaseModel):
    id: int
    proyecto_id: int
    user_id: int
    user_nombre: str
    user_iniciales: str
    user_email: str
    texto: str
    created_at: datetime

    model_config = {"from_attributes": True}
