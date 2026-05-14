from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.permissions import LEVELS, effective_permissions
from app.core.security import create_access_token, verify_password
from app.db import get_db
from app.models.login_event import LoginEvent
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _log_attempt(
    db: Session,
    *,
    identifier: str,
    user_id: int | None,
    success: bool,
    failure_reason: str | None,
    request: Request,
) -> None:
    """Inserta una fila en login_events. Nunca falla el login por esto: catch all."""
    try:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")
        db.add(
            LoginEvent(
                user_id=user_id,
                identifier_used=identifier[:255],
                success=success,
                failure_reason=failure_reason,
                ip=ip[:45] if ip else None,
                user_agent=ua[:255] if ua else None,
            )
        )
        db.commit()
    except Exception:
        db.rollback()


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    identifier = payload.identifier.strip()
    # Buscar por email O username (case-insensitive)
    needle = identifier.lower()
    user = (
        db.query(User)
        .filter(or_(User.email == needle, User.username == needle))
        .first()
    )

    if not user:
        _log_attempt(db, identifier=identifier, user_id=None, success=False,
                     failure_reason="user_not_found", request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo/usuario o contraseña incorrectos",
        )

    if not verify_password(payload.password, user.hashed_password):
        _log_attempt(db, identifier=identifier, user_id=user.id, success=False,
                     failure_reason="bad_password", request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo/usuario o contraseña incorrectos",
        )

    if not user.is_active:
        _log_attempt(db, identifier=identifier, user_id=user.id, success=False,
                     failure_reason="inactive", request=request)
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    if payload.role is not None and user.role != payload.role:
        _log_attempt(db, identifier=identifier, user_id=user.id, success=False,
                     failure_reason="role_mismatch", request=request)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Este usuario no tiene acceso como {payload.role.value}",
        )

    perms = sorted(effective_permissions(db, user.level, list(user.permissions or [])))
    token = create_access_token(
        subject=user.email,
        role=user.role.value,
        extra={"level": user.level},
        db=db,
    )

    _log_attempt(db, identifier=identifier, user_id=user.id, success=True,
                 failure_reason=None, request=request)

    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        level=user.level,
        level_label=LEVELS.get(user.level, "—"),
        permissions=perms,
    )


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> User:
    return current
