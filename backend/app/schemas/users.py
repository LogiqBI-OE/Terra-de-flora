"""Schemas para CRUD de usuarios (página /usuarios, solo nivel 9)."""
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str | None = None
    first_name: str
    last_name_paterno: str = ""
    last_name_materno: str = ""
    password: str
    level: int
    permissions: list[str] = []


class UserUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name_paterno: str | None = None
    last_name_materno: str | None = None
    password: str | None = None
    level: int | None = None
    permissions: list[str] | None = None
    is_active: bool | None = None


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
