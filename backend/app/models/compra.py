"""Modelo: fila de compra (orden de compra en tránsito) — parte de un snapshot."""
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Compra(Base):
    __tablename__ = "compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id", ondelete="CASCADE"), index=True, nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), index=True, nullable=False)
    planta_id: Mapped[int] = mapped_column(ForeignKey("plantas.id"), index=True, nullable=False)
    oc: Mapped[str | None] = mapped_column(String(64))
    eta: Mapped[date] = mapped_column(Date, nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
