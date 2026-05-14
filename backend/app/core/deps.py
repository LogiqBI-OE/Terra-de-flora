from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except ValueError:
        raise credentials_exc

    email = payload.get("sub")
    if not email:
        raise credentials_exc

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_exc
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Requiere rol administrador")
    return user


def require_level_9(user: User = Depends(get_current_user)) -> User:
    """System Admin only — gestión de usuarios y configuración de sistema."""
    if user.level < 9:
        raise HTTPException(status_code=403, detail="Requiere nivel 9 (System Admin)")
    return user


def require_level_5(user: User = Depends(get_current_user)) -> User:
    """Mandos medios+ — pueden VER la pagina de usuarios y actividad."""
    if user.level < 5:
        raise HTTPException(status_code=403, detail="Requiere nivel 5 o superior")
    return user
