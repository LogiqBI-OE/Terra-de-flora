"""Router: CRUD básico de snapshots."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db import get_db
from app.models import Compra, Demanda, Inventario, Produccion, Snapshot, SnapshotStatus
from app.models.user import User
from app.schemas.snapshot import SnapshotCreate, SnapshotOut

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


def _to_out(s: Snapshot, db: Session) -> SnapshotOut:
    """Enriquece el modelo con conteos por dataset."""
    return SnapshotOut(
        id=s.id,
        nombre=s.nombre,
        status=s.status,
        notas=s.notas,
        usuario_id=s.usuario_id,
        created_at=s.created_at,
        calculated_at=s.calculated_at,
        rows_inventario=db.query(Inventario).filter(Inventario.snapshot_id == s.id).count(),
        rows_produccion=db.query(Produccion).filter(Produccion.snapshot_id == s.id).count(),
        rows_compras=db.query(Compra).filter(Compra.snapshot_id == s.id).count(),
        rows_demanda=db.query(Demanda).filter(Demanda.snapshot_id == s.id).count(),
    )


@router.get("", response_model=list[SnapshotOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[SnapshotOut]:
    rows = db.query(Snapshot).order_by(Snapshot.created_at.desc()).limit(100).all()
    return [_to_out(s, db) for s in rows]


@router.post("", response_model=SnapshotOut, status_code=201)
def crear(
    payload: SnapshotCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SnapshotOut:
    s = Snapshot(nombre=payload.nombre, notas=payload.notas, usuario_id=user.id)
    db.add(s)
    db.commit()
    db.refresh(s)
    return _to_out(s, db)


@router.get("/{snapshot_id}", response_model=SnapshotOut)
def detalle(
    snapshot_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SnapshotOut:
    s = db.get(Snapshot, snapshot_id)
    if not s:
        raise HTTPException(404, "Snapshot no encontrado")
    return _to_out(s, db)


@router.delete("/{snapshot_id}", status_code=204)
def eliminar(
    snapshot_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    s = db.get(Snapshot, snapshot_id)
    if not s:
        raise HTTPException(404, "Snapshot no encontrado")
    db.delete(s)
    db.commit()


@router.post("/{snapshot_id}/marcar-calculado", response_model=SnapshotOut)
def marcar_calculado(
    snapshot_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SnapshotOut:
    s = db.get(Snapshot, snapshot_id)
    if not s:
        raise HTTPException(404, "Snapshot no encontrado")
    s.status = SnapshotStatus.calculated
    s.calculated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(s)
    return _to_out(s, db)
