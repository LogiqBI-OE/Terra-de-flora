"""Registro de eventos de login (auditoría / actividad).

Cada intento de login (exitoso o fallido) genera una fila aquí.
- user_id: NULL si el identifier no matcheo ningun usuario
- identifier_used: lo que el usuario tipeo (email o username) — se guarda crudo
- success: True si autenticacion fue OK + cuenta activa
- failure_reason: string corto cuando success=False (user_not_found, bad_password, inactive)
- ip / user_agent: capturados del request (truncados a 45/255 chars respectivamente)
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LoginEvent(Base):
    __tablename__ = "login_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    identifier_used: Mapped[str] = mapped_column(String(255), nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    failure_reason: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
