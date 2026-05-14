"""Modelo Cliente — catalogo de clientes (PF/PM)."""
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TipoCliente(str, enum.Enum):
    PF = "PF"  # Persona Fisica
    PM = "PM"  # Persona Moral


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    tipo: Mapped[TipoCliente] = mapped_column(
        Enum(TipoCliente, name="tipo_cliente"), nullable=False, default=TipoCliente.PF
    )
    razon_social: Mapped[str | None] = mapped_column(String(220))
    rfc: Mapped[str | None] = mapped_column(String(20), index=True)
    telefono: Mapped[str | None] = mapped_column(String(40))
    email: Mapped[str | None] = mapped_column(String(160))
    direccion: Mapped[str | None] = mapped_column(Text)
    notas: Mapped[str | None] = mapped_column(Text)
    # Cómo nos contactó. Puede ser uno de los presets (Instagram, Facebook,
    # Recomendado, De otro evento) o un texto libre cuando el usuario elige "Otros".
    como_nos_contacto: Mapped[str | None] = mapped_column(String(120))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
