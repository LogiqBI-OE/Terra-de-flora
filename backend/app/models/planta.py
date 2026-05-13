"""Modelo: planta de producción de Oleolab."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Planta(Base):
    __tablename__ = "plantas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(128), nullable=False)
    ubicacion: Mapped[str | None] = mapped_column(String(255))
