from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.permissions import LEVELS, effective_permissions
from app.core.security import create_access_token, verify_password
from app.db import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # `role` en el payload es opcional (compat con frontend con toggle).
    # Si llega, debe coincidir con el rol del usuario; si no, ignoramos.
    if payload.role is not None and user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Este usuario no tiene acceso como {payload.role.value}",
        )

    perms = sorted(effective_permissions(db, user.level, list(user.permissions or [])))
    token = create_access_token(
        subject=user.email, role=user.role.value, extra={"level": user.level}
    )
    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        full_name=user.full_name,
        level=user.level,
        level_label=LEVELS.get(user.level, "—"),
        permissions=perms,
    )


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> User:
    return current
