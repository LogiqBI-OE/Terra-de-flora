"""Helpers para leer/escribir Levels + LevelPermissions desde la DB.

La matriz de permisos por nivel vive ahora en BD (editable desde /system-settings).
Antes estaba hardcoded en core/permissions.py — ahora ese módulo solo declara
la LISTA de permisos disponibles + descripciones por nivel iniciales (para seed).
"""
from sqlalchemy.orm import Session

from app.core.permissions import (
    INITIAL_LEVEL_DESCRIPTIONS,
    INITIAL_LEVEL_PERMISSIONS,
    LEVELS,
    RESERVED_LEVELS,
)
from app.models import Level, LevelPermission


def ensure_levels_seeded(db: Session) -> None:
    """Crea filas en `levels` y `level_permissions` si no existen.
    Idempotente: no sobreescribe descripciones que el usuario haya editado.
    """
    existing = {l.level: l for l in db.query(Level).all()}
    for lvl, label in LEVELS.items():
        if lvl not in existing:
            db.add(
                Level(
                    level=lvl,
                    label=label,
                    description=INITIAL_LEVEL_DESCRIPTIONS.get(lvl, ""),
                    is_reserved=lvl in RESERVED_LEVELS,
                )
            )
    db.flush()

    # Permisos: solo poblar si la tabla está vacía (primera vez).
    if db.query(LevelPermission).count() == 0:
        for lvl, perms in INITIAL_LEVEL_PERMISSIONS.items():
            for p in perms:
                db.add(LevelPermission(level=lvl, permission=p))
    db.commit()


def permissions_for_level(db: Session, level: int) -> set[str]:
    """Set de permisos asignados al nivel en la matriz actual."""
    rows = db.query(LevelPermission).filter(LevelPermission.level == level).all()
    return {r.permission for r in rows}


def set_level_permissions(db: Session, level: int, permissions: list[str]) -> None:
    """Reemplaza el set de permisos del nivel por la lista dada."""
    db.query(LevelPermission).filter(LevelPermission.level == level).delete(synchronize_session=False)
    for p in permissions:
        db.add(LevelPermission(level=level, permission=p))
    db.commit()


def all_levels(db: Session) -> list[Level]:
    return db.query(Level).order_by(Level.level.desc()).all()


def update_level_meta(
    db: Session,
    level: int,
    *,
    label: str | None = None,
    description: str | None = None,
    is_reserved: bool | None = None,
) -> Level:
    row = db.get(Level, level)
    if not row:
        raise ValueError(f"Nivel {level} no existe.")
    if label is not None:
        row.label = label
    if description is not None:
        row.description = description
    if is_reserved is not None:
        row.is_reserved = is_reserved
    db.commit()
    db.refresh(row)
    return row


def all_permissions_matrix(db: Session) -> dict[int, list[str]]:
    """Devuelve {level: [perms...]} para construir la matriz en frontend."""
    rows = db.query(LevelPermission).order_by(LevelPermission.level, LevelPermission.permission).all()
    matrix: dict[int, list[str]] = {}
    for r in rows:
        matrix.setdefault(r.level, []).append(r.permission)
    return matrix
