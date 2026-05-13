"""Modelo User.
Nombre dividido en 3 campos (estándar Mx): first_name + last_name_paterno + last_name_materno.
`full_name` se mantiene como columna derivada/sincronizada para retro-compat.
Sistema de permisos: level (1..9) + permissions (JSON list[str]).
"""
import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    cliente = "cliente"


def role_for_level(level: int) -> UserRole:
    return UserRole.admin if level >= 5 else UserRole.cliente


def compose_full_name(first: str | None, paterno: str | None, materno: str | None) -> str:
    parts = [p.strip() for p in (first, paterno, materno) if p and p.strip()]
    return " ".join(parts)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Nombre dividido
    first_name: Mapped[str | None] = mapped_column(String(120))
    last_name_paterno: Mapped[str | None] = mapped_column(String(120))
    last_name_materno: Mapped[str | None] = mapped_column(String(120))
    # Cache/computado: se sincroniza al crear/actualizar
    full_name: Mapped[str | None] = mapped_column(String(255))

    # Sistema de permisos
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    permissions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.cliente
    )

    # Customer asociado: vive aquí en BD pero ya NO se edita desde la UI de Usuarios.
    # Se manejará en una vista/tabla aparte.
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
