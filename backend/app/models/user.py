"""Modelo User. Sistema de permisos:
  - level: int 1..9 (jerárquico, ver core/permissions.py)
  - permissions: JSON list[str] con permisos extras concedidos manualmente

`role` se mantiene como columna derivada para retro-compatibilidad:
    role = 'admin' si level >= 5, sino 'cliente'
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


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))

    # Sistema de permisos
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    permissions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.cliente
    )

    # Si el usuario está atado a un customer (sin view_all_customers), apunta acá
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
