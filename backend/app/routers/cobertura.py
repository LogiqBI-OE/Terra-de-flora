"""Router: cálculo y consulta de la matriz de cobertura."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db import get_db
from app.models import Snapshot, SnapshotStatus
from app.models.user import User
from app.schemas.cobertura import CoberturaMatrix
from app.services.cobertura.calculator import calcular_matriz

router = APIRouter(prefix="/snapshots", tags=["cobertura"])


@router.get("/{snapshot_id}/cobertura", response_model=CoberturaMatrix)
def obtener_cobertura(
    snapshot_id: int,
    granularidad: str = Query("semanal", pattern="^(semanal|mensual)$"),
    planta: str = Query("TODAS"),
    n_buckets: int = Query(12, ge=1, le=52),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CoberturaMatrix:
    snap = db.get(Snapshot, snapshot_id)
    if not snap:
        raise HTTPException(404, "Snapshot no encontrado")

    matrix = calcular_matriz(db, snapshot_id, granularidad, planta, n_buckets)

    # Marca como calculado en el primer cálculo
    if snap.status != SnapshotStatus.calculated:
        snap.status = SnapshotStatus.calculated
        snap.calculated_at = datetime.now(timezone.utc)
        db.commit()

    return matrix
