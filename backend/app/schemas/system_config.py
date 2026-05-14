"""Schemas para /system-config."""
from pydantic import BaseModel


class SystemConfigItem(BaseModel):
    key: str
    label: str
    description: str
    section: str = "Accesos"
    input_type: str = "text"
    secret: bool
    value: str


class SystemConfigUpdate(BaseModel):
    """Body para PATCH: lista de pares clave-valor a actualizar."""
    items: dict[str, str]
