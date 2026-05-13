"""Modelo: snapshot. Una fotografía inmutable de los 4 datasets en un momento + el cálculo de cobertura."""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SnapshotStatus(str, enum.Enum):
    draft = "draft"          # creado, aún sin archivos
    uploading = "uploading"  # con al menos un dataset cargado, pero no todos
    ready = "ready"          # todos los datasets cargados, listo para calcular
    calculated = "calculated"  # cobertura calculada
    error = "error"


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[SnapshotStatus] = mapped_column(
        Enum(SnapshotStatus, name="snapshot_status"), default=SnapshotStatus.draft, nullable=False
    )
    notas: Mapped[str | None] = mapped_column(Text)

    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    calculated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
