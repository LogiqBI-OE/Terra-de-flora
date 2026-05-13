"""Router: upload de los 4 archivos a un snapshot."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db import get_db
from app.models import Snapshot, SnapshotStatus
from app.models.user import User
from app.schemas.upload import UploadResult
from app.services.upload_service import VALIDATORS, procesar_upload

router = APIRouter(prefix="/snapshots", tags=["uploads"])


@router.post("/{snapshot_id}/upload/{tipo}", response_model=UploadResult)
def upload(
    snapshot_id: int,
    tipo: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> UploadResult:
    if tipo not in VALIDATORS:
        raise HTTPException(400, f"Tipo inválido. Opciones: {list(VALIDATORS.keys())}")
    snap = db.get(Snapshot, snapshot_id)
    if not snap:
        raise HTTPException(404, "Snapshot no encontrado")

    content = file.file.read()
    result = procesar_upload(db, snapshot_id, tipo, file.filename or f"{tipo}.xlsx", content)

    # Actualiza status del snapshot
    if result.filas_ok > 0:
        snap.status = SnapshotStatus.uploading
        db.commit()

    return result
