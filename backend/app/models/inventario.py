"""Modelo: fila de inventario (parte de un snapshot)."""
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Inventario(Base):
    __tablename__ = "inventarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id", ondelete="CASCADE"), index=True, nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), index=True, nullable=False)
    planta_id: Mapped[int] = mapped_column(ForeignKey("plantas.id"), index=True, nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
