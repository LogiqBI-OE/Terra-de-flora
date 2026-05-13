"""Seed idempotente: usuarios iniciales (con nivel + permisos) + datos base."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import Customer, Planta, Producto, User, UserRole
from app.models.user import compose_full_name, role_for_level
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
    customer_id: int | None = None,
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
        if customer_id is not None:
            existing.customer_id = customer_id
        db.commit()
        print(f"  · usuario sincronizado: {email} (level {level})")
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
            customer_id=customer_id,
            is_active=True,
        )
    )
    db.commit()
    print(f"  ✓ usuario creado: {email} (level {level})")


def upsert_planta(db: Session, codigo: str, nombre: str) -> None:
    if db.query(Planta).filter(Planta.codigo == codigo).first():
        return
    db.add(Planta(codigo=codigo, nombre=nombre))
    db.commit()
    print(f"  ✓ planta: {codigo} ({nombre})")


def upsert_customer(db: Session, codigo: str, nombre: str) -> None:
    if db.query(Customer).filter(Customer.codigo == codigo).first():
        return
    db.add(Customer(codigo=codigo, nombre=nombre))
    db.commit()
    print(f"  ✓ customer: {codigo} ({nombre})")


def upsert_producto(db: Session, sku: str, nombre: str, unidad: str = "kg") -> None:
    if db.query(Producto).filter(Producto.sku == sku).first():
        return
    db.add(Producto(sku=sku, nombre=nombre, unidad=unidad))
    db.commit()
    print(f"  ✓ producto: {sku} ({nombre})")


def run() -> None:
    print("→ Asegurando esquema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("→ Plantas...")
        upsert_planta(db, "MTY", "Monterrey")
        upsert_planta(db, "GDL", "Guadalajara")

        print("→ Customers...")
        upsert_customer(db, "WALMART", "Walmart")
        upsert_customer(db, "CHEDRAUI", "Chedraui")
        upsert_customer(db, "SORIANA", "Soriana")

        # Customer al que está atado el usuario "cliente" demo
        walmart = db.query(Customer).filter(Customer.codigo == "WALMART").first()

        print("→ Usuarios...")
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
            customer_id=walmart.id if walmart else None,
        )

        print("→ System config (defaults)...")
        ensure_defaults(db)

        print("→ Productos...")
        upsert_producto(db, "AGU-001", "Aguacate Hass A", "kg")
        upsert_producto(db, "AGU-002", "Aguacate Hass B", "kg")
        upsert_producto(db, "ACT-010", "Aceite de Aguacate 1L", "L")
        upsert_producto(db, "ACT-005", "Aceite de Aguacate 500ml", "L")
    finally:
        db.close()
    print("→ Seed listo.")


if __name__ == "__main__":
    run()
