"""Seed idempotente: usuarios iniciales (con nivel + permisos) + niveles + system config."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import User
from app.models.user import compose_full_name, role_for_level
from app.services.levels_service import ensure_levels_seeded
from app.services.system_config_service import ensure_defaults


def upsert_user(
    db: Session,
    *,
    email: str,
    first_name: str,
    last_name_paterno: str = "",
    last_name_materno: str = "",
    password: str,
    level: int,
    permissions: list[str] | None = None,
) -> None:
    full_name = compose_full_name(first_name, last_name_paterno, last_name_materno)
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        # Sincroniza nivel/permisos del seed por si cambiaron en código
        existing.first_name = first_name
        existing.last_name_paterno = last_name_paterno
        existing.last_name_materno = last_name_materno
        existing.full_name = full_name
        existing.level = level
        existing.permissions = permissions or []
        existing.role = role_for_level(level)
        db.commit()
        print(f"  - usuario sincronizado: {email} (level {level})")
        return
    db.add(
        User(
            email=email.lower(),
            hashed_password=hash_password(password),
            first_name=first_name,
            last_name_paterno=last_name_paterno,
            last_name_materno=last_name_materno,
            full_name=full_name,
            level=level,
            permissions=permissions or [],
            role=role_for_level(level),
            is_active=True,
        )
    )
    db.commit()
    print(f"  + usuario creado: {email} (level {level})")


def run() -> None:
    print("-> Asegurando esquema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("-> Usuarios...")
        upsert_user(
            db,
            email=settings.SEED_ADMIN_EMAIL,
            first_name="Orlando",
            last_name_paterno="Elizondo",
            last_name_materno="Salazar",
            password=settings.SEED_PASSWORD,
            level=9,
            permissions=[],
        )
        upsert_user(
            db,
            email=settings.SEED_CLIENT_EMAIL,
            first_name="Cliente",
            last_name_paterno="Demo",
            password=settings.SEED_PASSWORD,
            level=1,
            permissions=[],
        )

        print("-> System config (defaults)...")
        ensure_defaults(db)

        print("-> Niveles + matriz de permisos (defaults iniciales)...")
        ensure_levels_seeded(db)
    finally:
        db.close()
    print("-> Seed listo.")


if __name__ == "__main__":
    run()
