"""Cotización por proyecto, versionada.

Estructura:
  Proyecto
    └─ Cotizacion (v1, v2, …)                ← versiones inmutables al firmar
         ├─ Secciones[]                       ← "Mesa de novios", "Recepción", …
         │    └─ Items[]                      ← receta del catálogo + cantidad
         └─ Jornadas[]                        ← logística (montaje/evento/desmontaje)
              └─ Conceptos[]                  ← sueldos/comida/transporte

Snapshot al firmar:
  - En estado `borrador`, los items leen precios vivos del catálogo (receta_id,
    material_id). Si editas la receta, la cotización refleja el cambio.
  - Al cambiar a `enviada` o `aprobada`, congelamos los costos unitarios en
    columnas *_snapshot. Eso protege la cotización ya firmada de cambios
    posteriores en el catálogo.
  - Para re-cotizar con catálogo nuevo, duplicas la versión (v1 → v2).
"""
from datetime import datetime
from decimal import Decimal
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class EstadoCotizacion(str, enum.Enum):
    borrador = "borrador"
    enviada = "enviada"
    aprobada = "aprobada"
    rechazada = "rechazada"


class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id", ondelete="CASCADE"), index=True, nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    nombre: Mapped[str | None] = mapped_column(String(160))
    estado: Mapped[EstadoCotizacion] = mapped_column(
        Enum(EstadoCotizacion, name="estado_cotizacion"),
        nullable=False,
        default=EstadoCotizacion.borrador,
    )
    # Margen por default sobre costo (ej. 0.35 = 35%). Aplica a items
    # que no tengan precio_venta_unit override.
    margen_default: Mapped[Decimal] = mapped_column(
        Numeric(6, 4), nullable=False, default=Decimal("0.3500")
    )
    notas: Mapped[str | None] = mapped_column(Text)
    snapshot_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    secciones: Mapped[list["CotizacionSeccion"]] = relationship(
        "CotizacionSeccion",
        cascade="all, delete-orphan",
        order_by="CotizacionSeccion.orden, CotizacionSeccion.id",
    )


class CotizacionSeccion(Base):
    __tablename__ = "cotizacion_secciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    cotizacion_id: Mapped[int] = mapped_column(
        ForeignKey("cotizaciones.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # N° de arreglos / unidades de esta sección. Multiplica los costos por
    # item (cantidad × n_arreglos) y los paquetes a comprar. Default = 1.
    n_arreglos: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    notas: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list["CotizacionItem"]] = relationship(
        "CotizacionItem",
        cascade="all, delete-orphan",
        order_by="CotizacionItem.orden, CotizacionItem.id",
    )


class CotizacionItem(Base):
    """Item dentro de una sección. Puede ser:
    - material_id poblado: fila de material directo (caso común; precios vivos
      desde el catálogo). Soporta grupos visuales (FLORES / MATERIALES BASE / ...).
    - receta_id poblado (legacy): referencia a una receta del catálogo.
    - ni uno ni otro: item libre con descripción.
    """
    __tablename__ = "cotizacion_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    seccion_id: Mapped[int] = mapped_column(
        ForeignKey("cotizacion_secciones.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # ── Fuente del item: material directo (nuevo) o receta (legacy) ──
    material_id: Mapped[int | None] = mapped_column(
        ForeignKey("materiales.id", ondelete="SET NULL"), index=True
    )
    receta_id: Mapped[int | None] = mapped_column(
        ForeignKey("recetas.id", ondelete="SET NULL"), index=True
    )
    descripcion: Mapped[str | None] = mapped_column(String(255))
    # Cantidad necesaria por 1 unidad de la sección (multiplica × n_arreglos
    # para totales). Decimal porque admite 0.25m, 0.5kg, etc.
    cantidad: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=1)
    # Grupo visual dentro de la sección (FLORES, MATERIALES BASE, etc.).
    # Si null, se infiere de Material.familia.
    grupo: Mapped[str | None] = mapped_column(String(60))
    # Override de precio de venta. Si NULL, se calcula como costo_unit * (1 + margen).
    precio_venta_unit: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notas: Mapped[str | None] = mapped_column(String(255))

    # Snapshot — solo se llena al pasar a 'enviada'/'aprobada'.
    nombre_snapshot: Mapped[str | None] = mapped_column(String(255))
    costo_unit_snapshot: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
