"""Router: gestión de niveles y matriz de permisos. Solo nivel 9.

GET    /system/levels              vista completa para frontend
PATCH  /system/levels/{level}      actualiza label/description
PATCH  /system/levels/matrix       actualiza matriz (bulk)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_level_9
from app.core.permissions import LEVELS, PERMISSIONS, RESERVED_LEVELS, RESTRICTED_PERMISSIONS
from app.db import get_db
from app.models.user import User
from app.schemas.levels import LevelOut, LevelsPayload, LevelUpdate, MatrixUpdate
from app.services import levels_service as svc

router = APIRouter(prefix="/system/levels", tags=["system-levels"])


def _to_out(row, perms: list[str]) -> LevelOut:
    return LevelOut(
        level=row.level,
        label=row.label,
        description=row.description or "",
        is_reserved=row.is_reserved,
        permissions=sorted(perms),
    )


@router.get("", response_model=LevelsPayload)
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> LevelsPayload:
    rows = svc.all_levels(db)
    matrix = svc.all_permissions_matrix(db)
    return LevelsPayload(
        levels=[_to_out(r, matrix.get(r.level, [])) for r in rows],
        permissions=PERMISSIONS,
        restricted=list(RESTRICTED_PERMISSIONS),
    )


@router.patch("/{level}", response_model=LevelOut)
def actualizar_meta(
    level: int,
    payload: LevelUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> LevelOut:
    if level not in LEVELS:
        raise HTTPException(400, f"Nivel inválido. Válidos: {sorted(LEVELS.keys())}")
    try:
        row = svc.update_level_meta(
            db,
            level,
            label=payload.label,
            description=payload.description,
            is_reserved=payload.is_reserved,
        )
    except ValueError as e:
        raise HTTPException(404, str(e))
    perms = svc.permissions_for_level(db, level)
    return _to_out(row, sorted(perms))


@router.patch("/matrix", response_model=LevelsPayload)
def actualizar_matrix(
    payload: MatrixUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> LevelsPayload:
    # Validar
    for lvl, perms in payload.matrix.items():
        if lvl not in LEVELS:
            raise HTTPException(400, f"Nivel {lvl} no existe.")
        invalid = [p for p in perms if p not in PERMISSIONS]
        if invalid:
            raise HTTPException(400, f"Permisos desconocidos: {invalid}")
        # Restricted: si manage_users se le asigna a un nivel < 9, rechazar
        for restricted in RESTRICTED_PERMISSIONS:
            if restricted in perms and lvl < 9:
                raise HTTPException(
                    400,
                    f"El permiso '{restricted}' es restringido y solo puede asignarse a nivel 9.",
                )
    # Aplicar
    for lvl, perms in payload.matrix.items():
        svc.set_level_permissions(db, lvl, perms)

    return listar(db, _)  # type: ignore[arg-type]
