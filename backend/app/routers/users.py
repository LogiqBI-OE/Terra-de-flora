"""Router: CRUD de usuarios + catalogo de niveles/permisos + reset password.

Acceso (todos los endpoints requieren al menos L5):
  - GET endpoints: cualquier L5+
  - Mutaciones (POST/PATCH/DELETE/reset-password): cada actor puede gestionar
    usuarios DE SU NIVEL PARA ABAJO. Es decir, un L7 puede crear/editar/borrar
    cualquier usuario con level <= 7. No puede tocar L8 o L9, ni promover a
    nadie por encima de su propio nivel.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_level_5, require_level_6
from app.core.permissions import (
    LEVELS,
    PERMISSIONS,
    RESERVED_LEVELS,
    RESTRICTED_PERMISSIONS,
    effective_permissions,
)
from app.core.security import hash_password
from app.db import get_db
from app.models.login_event import LoginEvent
from app.models.user import User, compose_full_name, role_for_level
from app.schemas.users import (
    LoginEventOut,
    PasswordReset,
    PermissionsCatalog,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.levels_service import all_permissions_matrix
from app.services.system_config_service import get as cfg_get

router = APIRouter(prefix="/users", tags=["users"])


def _normalize_username(raw: str | None) -> str | None:
    if raw is None:
        return None
    cleaned = raw.strip().lower()
    return cleaned or None


def _to_out(u: User, db: Session) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        username=u.username,
        first_name=u.first_name,
        last_name_paterno=u.last_name_paterno,
        last_name_materno=u.last_name_materno,
        full_name=u.full_name,
        level=u.level,
        level_label=LEVELS.get(u.level, "—"),
        role=u.role.value,
        permissions=list(u.permissions or []),
        effective_permissions=sorted(effective_permissions(db, u.level, list(u.permissions or []))),
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


def _require_can_manage(actor: User, target_level: int, action: str) -> None:
    """Verifica que `actor` pueda gestionar a un usuario de nivel `target_level`.
    Regla: actor.level >= target_level. Si no, 403.
    """
    if actor.level < target_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"No puedes {action} a un usuario de nivel L{target_level} "
                f"(tu nivel es L{actor.level}). Solo puedes gestionar usuarios "
                "de tu nivel para abajo."
            ),
        )


def _require_can_assign_level(actor: User, new_level: int) -> None:
    """No puedes asignar a un usuario un nivel mayor al tuyo."""
    if new_level > actor.level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"No puedes asignar el nivel L{new_level} "
                f"(tu nivel es L{actor.level}). Solo puedes asignar niveles "
                "iguales o inferiores al tuyo."
            ),
        )


@router.get("/_catalog", response_model=PermissionsCatalog)
def catalogo(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> PermissionsCatalog:
    matrix = all_permissions_matrix(db)
    return PermissionsCatalog(
        levels=[
            {"level": lvl, "label": label, "reserved": lvl in RESERVED_LEVELS}
            for lvl, label in sorted(LEVELS.items(), reverse=True)
        ],
        permissions=PERMISSIONS,
        restricted=list(RESTRICTED_PERMISSIONS),
        defaults_by_level={k: sorted(v) for k, v in matrix.items()},
    )


@router.get("", response_model=list[UserOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[UserOut]:
    rows = db.query(User).order_by(User.level.desc(), User.email).all()
    return [_to_out(u, db) for u in rows]


@router.post("", response_model=UserOut, status_code=201)
def crear(
    payload: UserCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_level_5),
) -> UserOut:
    _validate_payload(payload.level, payload.permissions)
    _require_can_assign_level(actor, payload.level)

    full = compose_full_name(payload.first_name, payload.last_name_paterno, payload.last_name_materno)
    u = User(
        email=payload.email.lower(),
        username=_normalize_username(payload.username),
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name.strip() or None,
        last_name_paterno=(payload.last_name_paterno or "").strip() or None,
        last_name_materno=(payload.last_name_materno or "").strip() or None,
        full_name=full,
        level=payload.level,
        permissions=payload.permissions or [],
        role=role_for_level(payload.level),
        is_active=True,
    )
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un usuario con ese email o nombre de usuario.")
    db.refresh(u)
    return _to_out(u, db)


@router.patch("/{user_id}", response_model=UserOut)
def actualizar(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_level_5),
) -> UserOut:
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")

    # Check 1: el target actual debe estar dentro del scope del actor.
    _require_can_manage(actor, u.level, "editar")

    data = payload.model_dump(exclude_unset=True)

    if "level" in data or "permissions" in data:
        new_level = data.get("level", u.level)
        new_perms = data.get("permissions", list(u.permissions or []))
        _validate_payload(new_level, new_perms)
        # Check 2: no puedes promover a un nivel superior al tuyo.
        _require_can_assign_level(actor, new_level)
        u.level = new_level
        u.permissions = new_perms
        u.role = role_for_level(new_level)

    if "password" in data and data["password"]:
        u.hashed_password = hash_password(data["password"])

    if "username" in data:
        u.username = _normalize_username(data["username"])

    for f in ("first_name", "last_name_paterno", "last_name_materno", "is_active"):
        if f in data:
            setattr(u, f, data[f])

    if any(k in data for k in ("first_name", "last_name_paterno", "last_name_materno")):
        u.full_name = compose_full_name(u.first_name, u.last_name_paterno, u.last_name_materno)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un usuario con ese nombre de usuario.")
    db.refresh(u)
    return _to_out(u, db)


@router.post("/{user_id}/reset-password", response_model=PasswordReset)
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_level_5),
) -> PasswordReset:
    """Resetea la contraseña al `standard_password`. Solo target de nivel <= actor."""
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    _require_can_manage(actor, u.level, "resetear la contraseña de")
    standard = cfg_get(db, "standard_password")
    if not standard:
        raise HTTPException(400, "No hay standard_password configurado en /system-config.")
    u.hashed_password = hash_password(standard)
    db.commit()
    return PasswordReset(user_id=u.id, used_standard=True)


def _event_to_out(e: LoginEvent, db: Session) -> LoginEventOut:
    u = db.get(User, e.user_id) if e.user_id else None
    return LoginEventOut(
        id=e.id,
        user_id=e.user_id,
        user_email=u.email if u else None,
        user_full_name=u.full_name if u else None,
        identifier_used=e.identifier_used,
        success=e.success,
        failure_reason=e.failure_reason,
        ip=e.ip,
        user_agent=e.user_agent,
        created_at=e.created_at,
    )


@router.get("/_login-events", response_model=list[LoginEventOut])
def all_login_events(
    user_id: int | None = Query(None, description="Filtrar por user_id"),
    success: bool | None = Query(None, description="True solo exitosos, False solo fallidos"),
    failure_reason: str | None = Query(None, description="Filtrar por razón exacta de fallo"),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_level_6),
) -> list[LoginEventOut]:
    """Timeline global de eventos de login. Filtros opcionales."""
    q = db.query(LoginEvent)
    if user_id is not None:
        q = q.filter(LoginEvent.user_id == user_id)
    if success is not None:
        q = q.filter(LoginEvent.success == success)
    if failure_reason:
        q = q.filter(LoginEvent.failure_reason == failure_reason)
    rows = (
        q.order_by(LoginEvent.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_event_to_out(r, db) for r in rows]


@router.get("/{user_id}/login-events", response_model=list[LoginEventOut])
def login_events(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_level_5),
) -> list[LoginEventOut]:
    """Ultimos N intentos de login de un usuario (exitosos y fallidos)."""
    if not db.get(User, user_id):
        raise HTTPException(404, "Usuario no encontrado")
    rows = (
        db.query(LoginEvent)
        .filter(LoginEvent.user_id == user_id)
        .order_by(LoginEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_event_to_out(r, db) for r in rows]


@router.delete("/{user_id}", status_code=204)
def eliminar(
    user_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_level_5),
) -> None:
    if user_id == actor.id:
        raise HTTPException(400, "No puedes eliminarte a ti mismo.")
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    _require_can_manage(actor, u.level, "eliminar")
    db.delete(u)
    db.commit()
