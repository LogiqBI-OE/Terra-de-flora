from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _resolve_token_lifetime_minutes(db: Session | None) -> int:
    """Lee token_lifetime_days desde SystemConfig; fallback a env var.
    Falla suavemente: si la DB no responde o el valor esta corrupto, usa el env var.
    """
    if db is not None:
        try:
            # Import local para evitar ciclos
            from app.services.system_config_service import get as cfg_get
            raw = cfg_get(db, "token_lifetime_days")
            if raw:
                days = int(raw)
                if days > 0:
                    return days * 24 * 60
        except (ValueError, Exception):
            pass
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES


def create_access_token(
    subject: str,
    role: str,
    extra: dict[str, Any] | None = None,
    db: Session | None = None,
) -> str:
    minutes = _resolve_token_lifetime_minutes(db)
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as e:
        raise ValueError("Invalid token") from e
