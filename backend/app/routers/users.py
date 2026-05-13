"""Router: CRUD de usuarios + catálogo de niveles/permisos.

Acceso: solo nivel 9 (System Admin) — protegido con require_level_9.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_level_9
from app.core.permissions import (
    DEFAULT_PERMISSIONS,
    LEVELS,
    PERMISSIONS,
    RESERVED_LEVELS,
    RESTRICTED_PERMISSIONS,
    effective_permissions,
)
from app.core.security import hash_password
from app.db import get_db
from app.models.user import User, role_for_level
from app.schemas.users import PermissionsCatalog, UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _to_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        level=u.level,
        level_label=LEVELS.get(u.level, "—"),
        role=u.role.value,
        permissions=list(u.permissions or []),
        effective_permissions=sorted(effective_permissions(u.level, list(u.permissions or []))),
        customer_id=u.customer_id,
        is_active=u.is_active,
        created_at=u.created_at,
    )


def _validate_payload(level: int, perms: list[str]) -> None:
    if level not in LEVELS:
        raise HTTPException(400, f"Nivel inválido. Válidos: {sorted(LEVELS.keys())}")
    if level in RESERVED_LEVELS:
        raise HTTPException(400, f"Nivel {level} es reservado y no asignable.")
    invalid = [p for p in perms if p not in PERMISSIONS]
    if invalid:
        raise HTTPException(400, f"Permisos desconocidos: {invalid}")


@router.get("/_catalog", response_model=PermissionsCatalog)
def catalogo(_: User = Depends(require_level_9)) -> PermissionsCatalog:
    """Devuelve los niveles + permisos disponibles + defaults para que el frontend renderice."""
    return PermissionsCatalog(
        levels=[
            {"level": lvl, "label": label, "reserved": lvl in RESERVED_LEVELS}
            for lvl, label in sorted(LEVELS.items(), reverse=True)
        ],
        permissions=PERMISSIONS,
        restricted=list(RESTRICTED_PERMISSIONS),
        defaults_by_level={k: sorted(v) for k, v in DEFAULT_PERMISSIONS.items()},
    )


@router.get("", response_model=list[UserOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> list[UserOut]:
    rows = db.query(User).order_by(User.level.desc(), User.email).all()
    return [_to_out(u) for u in rows]


@router.post("", response_model=UserOut, status_code=201)
def crear(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> UserOut:
    _validate_payload(payload.level, payload.permissions)
    u = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        level=payload.level,
        permissions=payload.permissions or [],
        role=role_for_level(payload.level),
        customer_id=payload.customer_id,
        is_active=True,
    )
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un usuario con ese email.")
    db.refresh(u)
    return _to_out(u)


@router.patch("/{user_id}", response_model=UserOut)
def actualizar(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_level_9),
) -> UserOut:
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")

    data = payload.model_dump(exclude_unset=True)

    if "level" in data or "permissions" in data:
        new_level = data.get("level", u.level)
        new_perms = data.get("permissions", list(u.permissions or []))
        _validate_payload(new_level, new_perms)
        u.level = new_level
        u.permissions = new_perms
        u.role = role_for_level(new_level)

    if "password" in data and data["password"]:
        u.hashed_password = hash_password(data["password"])

    for f in ("full_name", "customer_id", "is_active"):
        if f in data:
            setattr(u, f, data[f])

    db.commit()
    db.refresh(u)
    return _to_out(u)


@router.delete("/{user_id}", status_code=204)
def eliminar(
    user_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_level_9),
) -> None:
    if user_id == actor.id:
        raise HTTPException(400, "No puedes eliminarte a ti mismo.")
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    db.delete(u)
    db.commit()
