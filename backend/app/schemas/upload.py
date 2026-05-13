"""Schemas para resultado de upload de Excel."""
from pydantic import BaseModel


class UploadError(BaseModel):
    fila: int | None = None  # número de fila en Excel (1-indexed, ignorando header)
    columna: str | None = None
    detalle: str


class UploadResult(BaseModel):
    tipo: str  # inventario | produccion | compras | demanda
    archivo: str
    filas_ok: int
    filas_err: int
    errores: list[UploadError] = []
