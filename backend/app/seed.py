"""Seed idempotente: crea usuarios iniciales + datos base (plantas, customers, productos)."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import Customer, Planta, Producto, User, UserRole


def upsert_user(db: Session, email: str, role: UserRole, full_name: str, password: str) -> None:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"  · usuario ya existe: {email} ({existing.role.value})")
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
    print(f"  ✓ usuario creado: {email} ({role.value})")


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
        print("→ Usuarios...")
        upsert_user(db, settings.SEED_ADMIN_EMAIL, UserRole.admin, "Orlando (Admin)", settings.SEED_PASSWORD)
        upsert_user(db, settings.SEED_CLIENT_EMAIL, UserRole.cliente, "Cliente Demo", settings.SEED_PASSWORD)

        print("→ Plantas...")
        upsert_planta(db, "MTY", "Monterrey")
        upsert_planta(db, "GDL", "Guadalajara")

        print("→ Customers...")
        upsert_customer(db, "WALMART", "Walmart")
        upsert_customer(db, "CHEDRAUI", "Chedraui")
        upsert_customer(db, "SORIANA", "Soriana")

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
