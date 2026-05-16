"""Histórico de precios del material.

Cada vez que un L5+ edita el precio de un material, se inserta una fila aquí.
Permite reconstruir la evolución del costo y comparar el snapshot que vive
en una cotización congelada vs el precio actual del catálogo.

Útil para responder: "Cuando se compró este material para el evento, ¿gané
o perdí margen vs lo que cotizamos?"
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class MaterialPrecioHistorico(Base):
    __tablename__ = "material_precio_historico"

    id: Mapped[int] = mapped_column(primary_key=True)
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materiales.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Snapshot del estado de precio en ese momento
    precio_paquete: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    contenido_por_paquete: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    # Quién hizo el cambio (puede ser null para registros de seed)
    changed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    # 'edit' = cambio manual desde catálogo o editor de receta
    # 'seed' = registro inicial al crear el material
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="edit")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
