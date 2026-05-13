"""Orquesta el procesamiento de un archivo subido.

Flujo:
  1. parse_workbook (excel_parser): valida headers + lee filas
  2. validator del tipo: convierte cada fila en un objeto ORM (o registra error)
  3. inserta filas válidas en bulk
  4. devuelve UploadResult con conteos y errores
"""
from __future__ import annotations

from typing import Callable

from sqlalchemy.orm import Session

from app.models import Compra, Demanda, Inventario, Produccion
from app.schemas.upload import UploadError, UploadResult
from app.services.excel_parser import ExcelParseError, parse_workbook
from app.services.validators import compras as v_compras
from app.services.validators import demanda as v_demanda
from app.services.validators import inventario as v_inventario
from app.services.validators import produccion as v_produccion
from app.services.validators.common import ValidationContext


# Mapa: tipo -> (módulo del validador, modelo ORM)
VALIDATORS: dict[str, tuple] = {
    "inventario": (v_inventario, Inventario),
    "produccion": (v_produccion, Produccion),
    "compras": (v_compras, Compra),
    "demanda": (v_demanda, Demanda),
}


def procesar_upload(
    db: Session,
    snapshot_id: int,
    tipo: str,
    filename: str,
    content: bytes,
) -> UploadResult:
    if tipo not in VALIDATORS:
        raise ValueError(f"Tipo desconocido: {tipo}")

    validator_mod, modelo = VALIDATORS[tipo]

    # 1) parse + validar headers
    try:
        filas = parse_workbook(content, validator_mod.COLUMNAS)
    except ExcelParseError as e:
        return UploadResult(
            tipo=tipo,
            archivo=filename,
            filas_ok=0,
            filas_err=0,
            errores=[UploadError(detalle=str(e))],
        )

    # 2) borrar filas previas del mismo tipo en este snapshot (reemplazo total)
    db.query(modelo).filter(modelo.snapshot_id == snapshot_id).delete(synchronize_session=False)

    # 3) construir + validar filas
    ctx = ValidationContext(db=db, auto_create=True)
    objetos: list = []
    errores: list[UploadError] = []
    fn: Callable = validator_mod.validar_y_construir
    for i, row in enumerate(filas, start=2):  # fila 1 es header
        try:
            obj = fn(row, snapshot_id, ctx)
            objetos.append(obj)
        except Exception as e:
            errores.append(UploadError(fila=i, detalle=str(e)))

    if objetos:
        db.bulk_save_objects(objetos)
    db.commit()

    return UploadResult(
        tipo=tipo,
        archivo=filename,
        filas_ok=len(objetos),
        filas_err=len(errores),
        errores=errores[:50],  # limita a 50 para no inflar la respuesta
    )
