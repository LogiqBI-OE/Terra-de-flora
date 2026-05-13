"""Modelo: LevelPermission. Matriz nivel × permiso (M:N).
Una fila (level=X, permission=Y) significa: el nivel X tiene el permiso Y por default.
La tabla `users.permissions` (JSON) sigue siendo para permisos custom EXTRA por usuario.
"""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LevelPermission(Base):
    __tablename__ = "level_permissions"

    level: Mapped[int] = mapped_column(ForeignKey("levels.level", ondelete="CASCADE"), primary_key=True)
    permission: Mapped[str] = mapped_column(String(64), primary_key=True)
