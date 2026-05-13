"""Schemas para /system/levels + /system/level-permissions."""
from pydantic import BaseModel


class LevelOut(BaseModel):
    level: int
    label: str
    description: str
    is_reserved: bool
    permissions: list[str]  # permisos actuales asignados al nivel

    model_config = {"from_attributes": True}


class LevelUpdate(BaseModel):
    label: str | None = None
    description: str | None = None
    is_reserved: bool | None = None


class LevelsPayload(BaseModel):
    """Vista completa para el frontend (tab Niveles de usuarios)."""
    levels: list[LevelOut]
    permissions: list[str]
    restricted: list[str]


class MatrixUpdate(BaseModel):
    """PATCH bulk para la matriz: {level: [permissions]}."""
    matrix: dict[int, list[str]]
