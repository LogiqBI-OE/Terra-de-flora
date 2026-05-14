"""Schemas para CRUD de usuarios (página /usuarios, solo nivel 9)."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_username(v: str) -> str:
    cleaned = (v or "").strip().lower()
    if not cleaned:
        raise ValueError("El usuario no puede estar vacío.")
    if len(cleaned) < 2:
        raise ValueError("El usuario debe tener al menos 2 caracteres.")
    if not all(c.isalnum() or c in "._-" for c in cleaned):
        raise ValueError("Solo se permiten letras, números, '.', '_' y '-'.")
    return cleaned


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=80)
    first_name: str = Field(..., min_length=1)
    last_name_paterno: str = ""
    last_name_materno: str = ""
    password: str = Field(..., min_length=1)
    level: int
    permissions: list[str] = []

    @field_validator("username")
    @classmethod
    def _v_username(cls, v: str) -> str:
        return _validate_username(v)


class UserUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name_paterno: str | None = None
    last_name_materno: str | None = None
    password: str | None = None
    level: int | None = None
    permissions: list[str] | None = None
    is_active: bool | None = None

    @field_validator("username")
    @classmethod
    def _v_username(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return _validate_username(v)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str | None
    first_name: str | None
    last_name_paterno: str | None
    last_name_materno: str | None
    full_name: str | None
    level: int
    level_label: str
    role: str
    permissions: list[str]
    effective_permissions: list[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PermissionsCatalog(BaseModel):
    levels: list[dict]
    permissions: list[str]
    restricted: list[str]
    defaults_by_level: dict[int, list[str]]


class PasswordReset(BaseModel):
    """Respuesta del reset: indica si usó el standard del sistema."""
    user_id: int
    used_standard: bool


class LoginEventOut(BaseModel):
    """Evento de login para mostrar en UI."""
    id: int
    identifier_used: str
    success: bool
    failure_reason: str | None
    ip: str | None
    user_agent: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
