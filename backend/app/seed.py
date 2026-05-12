"""Idempotent seed: creates initial admin and demo client users if absent."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models.user import User, UserRole


def upsert_user(db: Session, email: str, role: UserRole, full_name: str, password: str) -> None:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"  · ya existe: {email} ({existing.role.value})")
        return
    db.add(
        User(
            email=email.lower(),
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=True,
        )
    )
    db.commit()
    print(f"  ✓ creado: {email} ({role.value})")


def run() -> None:
    print("→ Asegurando esquema...")
    Base.metadata.create_all(bind=engine)

    print("→ Sembrando usuarios iniciales...")
    db = SessionLocal()
    try:
        upsert_user(
            db,
            email=settings.SEED_ADMIN_EMAIL,
            role=UserRole.admin,
            full_name="Orlando (Admin)",
            password=settings.SEED_PASSWORD,
        )
        upsert_user(
            db,
            email=settings.SEED_CLIENT_EMAIL,
            role=UserRole.cliente,
            full_name="Cliente Demo",
            password=settings.SEED_PASSWORD,
        )
    finally:
        db.close()
    print("→ Seed listo.")


if __name__ == "__main__":
    run()
