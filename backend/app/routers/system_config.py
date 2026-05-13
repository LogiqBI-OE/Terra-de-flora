"""Router: configuración global del sistema. Solo nivel 9."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_9
from app.core.system_config_defaults import keys_by_id
from app.db import get_db
from app.models.user import User
from app.schemas.system_config import SystemConfigItem, SystemConfigUpdate
from app.services import system_config_service as svc

router = APIRouter(prefix="/system-config", tags=["system-config"])


@router.get("", response_model=list[SystemConfigItem])
def listar(db: Session = Depends(get_db), _: User = Depends(require_level_9)) -> list[SystemConfigItem]:
    return [SystemConfigItem(**item) for item in svc.all_with_meta(db)]


@router.patch("", response_model=list[SystemConfigItem])
def actualizar(
    payload: SystemConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> list[SystemConfigItem]:
    known = keys_by_id()
    unknown = [k for k in payload.items.keys() if k not in known]
    if unknown:
        raise HTTPException(400, f"Claves desconocidas: {unknown}")
    for k, v in payload.items.items():
        svc.set_value(db, k, v)
    return [SystemConfigItem(**item) for item in svc.all_with_meta(db)]
