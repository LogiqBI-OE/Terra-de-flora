"""Schemas Pydantic para snapshots."""
from datetime import datetime

from pydantic import BaseModel

from app.models.snapshot import SnapshotStatus


class SnapshotCreate(BaseModel):
    nombre: str
    notas: str | None = None


class SnapshotOut(BaseModel):
    id: int
    nombre: str
    status: SnapshotStatus
    notas: str | None
    usuario_id: int
    created_at: datetime
    calculated_at: datetime | None

    # Conteos rápidos por dataset (cargados o no)
    rows_inventario: int = 0
    rows_produccion: int = 0
    rows_compras: int = 0
    rows_demanda: int = 0

    model_config = {"from_attributes": True}
