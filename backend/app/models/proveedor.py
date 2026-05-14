"""Modelo Proveedor — agenda de proveedores con dirección y contacto."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    razon_social: Mapped[str | None] = mapped_column(String(200))
    rfc: Mapped[str | None] = mapped_column(String(20))
    contacto_nombre: Mapped[str | None] = mapped_column(String(160))
    contacto_telefono: Mapped[str | None] = mapped_column(String(40))
    contacto_email: Mapped[str | None] = mapped_column(String(160))
    direccion: Mapped[str | None] = mapped_column(Text)
    notas: Mapped[str | None] = mapped_column(Text)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
