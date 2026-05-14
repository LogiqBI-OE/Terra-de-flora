"""Modelo Material — catálogo de insumos (flores, bases, oasis, mecánicos, velas, etc.).

Modelo de precio (siguiendo el patron del Excel de cotizaciones):
  - Los insumos se compran por PAQUETE con N piezas adentro.
  - precio_unitario = precio_paquete / contenido_por_paquete
  - Si un material se vende por pieza directa, contenido_por_paquete = 1.

Familia: agrupacion logica para filtrar (flor / base / oasis / mecanico / vela / ...).
Unidad: la unidad final de uso (pieza, metro, kg, litro, paquete).
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Material(Base):
    __tablename__ = "materiales"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str | None] = mapped_column(String(60), index=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True, nullable=False)

    # Familia y unidad como string libre — facil agregar nuevas sin migracion.
    # Los valores comunes los sugiere el frontend (Flor, Base, Oasis, Mecanico, Vela,
    # Consumible, Otro).
    familia: Mapped[str] = mapped_column(String(60), index=True, nullable=False, default="Flor")
    unidad: Mapped[str] = mapped_column(String(20), nullable=False, default="pieza")

    # Precio (Numeric para evitar errores de float)
    contenido_por_paquete: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=1
    )
    precio_paquete: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )

    proveedor_id: Mapped[int | None] = mapped_column(
        ForeignKey("proveedores.id", ondelete="SET NULL"), index=True
    )

    notas: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
