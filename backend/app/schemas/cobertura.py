"""Schemas para la matriz de cobertura calculada."""
from datetime import date

from pydantic import BaseModel


class CoberturaCell(BaseModel):
    balance: float
    color: str  # 'white' | 'green' | 'yellow' | 'red'


class CoberturaRow(BaseModel):
    producto_id: int
    sku: str
    producto: str
    unidad: str
    celdas: list[CoberturaCell]  # mismo orden que `buckets`


class CoberturaMatrix(BaseModel):
    snapshot_id: int
    granularidad: str  # 'semanal' | 'mensual'
    planta: str  # codigo de planta o 'TODAS'
    buckets: list[date]  # fecha inicio de cada bucket (semana o mes)
    filas: list[CoberturaRow]
