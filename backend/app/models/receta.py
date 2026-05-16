"""Modelos Receta + RecetaItem.

Una Receta es una plantilla reutilizable de "concepto" (centro de mesa,
ambientación, etc.) con su lista default de materiales y cantidades.

Convenio: 1 receta = 1 unidad. En la cotización, cuando agregas un Concepto
con cantidad=6 (seis centros de mesa), cada item de la receta se multiplica × 6.
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Receta(Base):
    __tablename__ = "recetas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    # Categoria libre tipo etiqueta: "Mesa", "Ambientación", "Iglesia",
    # "Ramo", "Boutonniere", etc. Sugerimos algunas en el frontend.
    categoria: Mapped[str] = mapped_column(String(60), index=True, nullable=False, default="Mesa")
    # N° default de arreglos al editar la receta. Multiplica los costos en
    # el editor para preview de costo total y cálculo de paquetes a comprar.
    # No afecta el costo unitario (que sigue siendo 'por 1 unidad').
    n_arreglos_default: Mapped[int] = mapped_column(default=1, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["RecetaItem"]] = relationship(
        "RecetaItem",
        back_populates="receta",
        cascade="all, delete-orphan",
        order_by="RecetaItem.orden, RecetaItem.id",
    )


class RecetaItem(Base):
    __tablename__ = "receta_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    receta_id: Mapped[int] = mapped_column(
        ForeignKey("recetas.id", ondelete="CASCADE"), index=True, nullable=False
    )
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materiales.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    # Cantidad necesaria del material por 1 unidad de la receta.
    cantidad: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=1)
    # Grupo visual dentro de la receta (FLORES, MATERIALES BASE,
    # CONTENEDORES, etc.). Si null, se infiere de Material.familia.
    grupo: Mapped[str | None] = mapped_column(String(60))
    # Orden dentro del grupo (drag-to-reorder)
    orden: Mapped[int] = mapped_column(default=0, nullable=False)
    notas: Mapped[str | None] = mapped_column(String(255))

    receta: Mapped["Receta"] = relationship("Receta", back_populates="items")
