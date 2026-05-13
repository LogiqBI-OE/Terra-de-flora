"""Modelo: producto (SKU). Familia y categoría son opcionales para granularidad futura."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    unidad: Mapped[str] = mapped_column(String(16), default="kg", nullable=False)
    familia: Mapped[str | None] = mapped_column(String(64))
    categoria: Mapped[str | None] = mapped_column(String(64))
