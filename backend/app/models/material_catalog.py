"""Catálogos editables del módulo de materiales: Tipo (familia) y Unidad.

Antes eran constantes hardcoded; ahora son tablas que el L9 admin
puede editar desde la UI. Cada item tiene `orden` para que el dropdown
salga en orden custom.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class MaterialFamilia(Base):
    """Tipo / familia del material (Flor, Material, Vela, ...).

    El campo `nombre` se denormaliza en Material.familia al guardar,
    así que renombrar aquí NO retroactiva los registros existentes.
    """
    __tablename__ = "material_familias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MaterialUnidad(Base):
    """Unidad de uso (Paquete, Pieza, Tallo, Metro, ...)."""
    __tablename__ = "material_unidades"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
