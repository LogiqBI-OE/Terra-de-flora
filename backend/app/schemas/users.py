"""Schemas para CRUD de usuarios (página /usuarios, solo nivel 9)."""
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    level: int
    permissions: list[str] = []
    customer_id: int | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    password: str | None = None
    level: int | None = None
    permissions: list[str] | None = None
    customer_id: int | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    level: int
    level_label: str
    role: str
    permissions: list[str]
    effective_permissions: list[str]
    customer_id: int | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PermissionsCatalog(BaseModel):
    """Para que el frontend renderice select + switches sin hardcoded."""
    levels: list[dict]      # [{level: 9, label: 'System Admin', reserved: bool}, ...]
    permissions: list[str]  # nombres de permisos disponibles
    restricted: list[str]   # permisos que solo nivel 9 puede tener
    defaults_by_level: dict[int, list[str]]
