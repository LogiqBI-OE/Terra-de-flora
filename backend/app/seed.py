"""Seed idempotente: usuarios iniciales (con nivel + permisos) + niveles + system config."""
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import User
from app.models.user import compose_full_name, role_for_level
from app.services.levels_service import ensure_levels_seeded
from app.services.system_config_service import ensure_defaults


def _run_lightweight_migrations() -> None:
    """Agrega columnas nuevas a tablas existentes (sin Alembic).
    Idempotente: solo aplica si la columna no existe.
    """
    insp = inspect(engine)
    if "users" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("users")}
        if "username" not in cols:
            print("  + migracion: agregando columna users.username")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(80)"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)"))


def upsert_user(
    db: Session,
    *,
    email: str,
    username: str | None = None,
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
        # Sincroniza nivel/permisos/username del seed por si cambiaron en código.
        # NO toca el password (idempotente: solo lo crea en insert inicial).
        existing.first_name = first_name
        existing.last_name_paterno = last_name_paterno
        existing.last_name_materno = last_name_materno
        existing.full_name = full_name
        existing.level = level
        existing.permissions = permissions or []
        existing.role = role_for_level(level)
        if username and not existing.username:
            existing.username = username.lower()
        db.commit()
        print(f"  - usuario sincronizado: {email} (level {level})")
        return
    db.add(
        User(
            email=email.lower(),
            username=username.lower() if username else None,
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
    print("-> Migraciones ligeras...")
    _run_lightweight_migrations()

    db = SessionLocal()
    try:
        print("-> Usuarios...")
        upsert_user(
            db,
            email=settings.SEED_ADMIN_EMAIL,
            username="orlando",
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
            username="cliente.demo",
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
