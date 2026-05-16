"""Router: configuración global del sistema.

- GET /system-config         → L9: lista completa con metadata
- PATCH /system-config       → L9: actualiza valores
- GET /system-config/runtime → cualquier autenticado: solo claves que el
                                frontend necesita conocer en runtime (toggles
                                de comportamiento del cliente)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_level_9
from app.core.system_config_defaults import keys_by_id
from app.db import get_db
from app.models.user import User
from app.schemas.system_config import SystemConfigItem, SystemConfigUpdate
from app.services import system_config_service as svc

router = APIRouter(prefix="/system-config", tags=["system-config"])


class RuntimeConfig(BaseModel):
    keep_warm_ping_enabled: bool
    keep_warm_ping_interval_minutes: int


@router.get("/runtime", response_model=RuntimeConfig)
def runtime(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> RuntimeConfig:
    """Settings que el frontend lee al iniciar para configurar comportamiento."""
    enabled = svc.get(db, "keep_warm_ping_enabled").strip().lower() == "true"
    try:
        interval = int(svc.get(db, "keep_warm_ping_interval_minutes"))
    except ValueError:
        interval = 5
    if interval < 1:
        interval = 1
    return RuntimeConfig(
        keep_warm_ping_enabled=enabled,
        keep_warm_ping_interval_minutes=interval,
    )


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
