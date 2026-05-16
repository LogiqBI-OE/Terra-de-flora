"""Seed idempotente: usuarios iniciales (con nivel + permisos) + niveles + system config."""
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import User
from app.models.material_catalog import MaterialFamilia, MaterialUnidad
from app.models.pago import MetodoPago
from app.models.user import compose_full_name, role_for_level
from app.services.levels_service import ensure_levels_seeded
from app.services.system_config_service import ensure_defaults


DEFAULT_FAMILIAS = [
    ("Flor", 10),
    ("Material", 20),
    ("Vela", 30),
    ("Mecánico", 40),
    ("Servicio externo", 50),
    ("Terra de Flora", 60),
    ("Otro", 99),
]

DEFAULT_UNIDADES = [
    ("Paquete", 10),
    ("Pieza", 20),
    ("Tallo", 30),
    ("Metro", 40),
    ("Kg", 50),
    ("Litro", 60),
    ("Servicio", 70),
]

DEFAULT_METODOS_PAGO = [
    ("Transferencia", 10),
    ("Efectivo", 20),
    ("Cheque", 30),
    ("Tarjeta", 40),
    ("Otro", 99),
]


def ensure_metodos_pago(db: Session) -> None:
    """Pobla métodos de pago si la tabla está vacía. No sobrescribe."""
    if db.query(MetodoPago).count() == 0:
        for nombre, orden in DEFAULT_METODOS_PAGO:
            db.add(MetodoPago(nombre=nombre, orden=orden))
        db.commit()
        print(f"  + métodos de pago: {len(DEFAULT_METODOS_PAGO)} cargados")


def ensure_material_catalogs(db: Session) -> None:
    """Pobla familias y unidades si las tablas están vacías. NO sobreescribe
    si el usuario ya editó la lista."""
    if db.query(MaterialFamilia).count() == 0:
        for nombre, orden in DEFAULT_FAMILIAS:
            db.add(MaterialFamilia(nombre=nombre, orden=orden))
        print(f"  + tipos de material: {len(DEFAULT_FAMILIAS)} cargados")
    if db.query(MaterialUnidad).count() == 0:
        for nombre, orden in DEFAULT_UNIDADES:
            db.add(MaterialUnidad(nombre=nombre, orden=orden))
        print(f"  + unidades de material: {len(DEFAULT_UNIDADES)} cargadas")
    db.commit()


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
        if "last_login_at" not in cols:
            print("  + migracion: agregando columna users.last_login_at")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE"))

    if "clientes" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("clientes")}
        if "como_nos_contacto" not in cols:
            print("  + migracion: agregando columna clientes.como_nos_contacto")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE clientes ADD COLUMN como_nos_contacto VARCHAR(120)"))

    if "comentarios" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("comentarios")}
        with engine.begin() as conn:
            if "parent_id" not in cols:
                print("  + migracion: agregando columna comentarios.parent_id")
                conn.execute(text("ALTER TABLE comentarios ADD COLUMN parent_id INTEGER"))
                conn.execute(text(
                    "ALTER TABLE comentarios ADD CONSTRAINT comentarios_parent_fk "
                    "FOREIGN KEY (parent_id) REFERENCES comentarios(id) ON DELETE SET NULL"
                ))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_comentarios_parent_id ON comentarios (parent_id)"))
            if "edited_at" not in cols:
                print("  + migracion: agregando columna comentarios.edited_at")
                conn.execute(text("ALTER TABLE comentarios ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE"))

    if "proyectos" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("proyectos")}
        with engine.begin() as conn:
            if "cant_invitados" not in cols:
                print("  + migracion: agregando columna proyectos.cant_invitados")
                conn.execute(text("ALTER TABLE proyectos ADD COLUMN cant_invitados INTEGER"))
            if "planner_nombre" not in cols:
                print("  + migracion: agregando columnas proyectos.planner_*")
                conn.execute(text("ALTER TABLE proyectos ADD COLUMN planner_nombre VARCHAR(160)"))
                conn.execute(text("ALTER TABLE proyectos ADD COLUMN planner_telefono VARCHAR(40)"))
                conn.execute(text("ALTER TABLE proyectos ADD COLUMN planner_email VARCHAR(160)"))
            if "locations" not in cols:
                print("  + migracion: agregando columna proyectos.locations (JSON)")
                conn.execute(text("ALTER TABLE proyectos ADD COLUMN locations JSON DEFAULT '[]'::json NOT NULL"))


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
    force_password_reset: bool = False,
) -> None:
    full_name = compose_full_name(first_name, last_name_paterno, last_name_materno)
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        # IMPORTANTE: NO sobreescribimos campos editables por el usuario
        # (first_name, last_name_paterno, last_name_materno, full_name).
        # Solo aseguramos:
        #  - level/permissions/role: para que el admin del seed NO pueda
        #    quedar accidentalmente demoteado a nivel bajo sin recuperación.
        #  - username: solo se setea si esta NULL (no pisa si el usuario ya tiene uno).
        #  - hashed_password: solo si force_password_reset=True (env var bootstrap).
        existing.level = level
        existing.permissions = permissions or []
        existing.role = role_for_level(level)
        if username and not existing.username:
            existing.username = username.lower()
        if force_password_reset:
            existing.hashed_password = hash_password(password)
            print(f"  ! password RESET para {email} (SEED_RESET_ADMIN_PASSWORD=true)")
        db.commit()
        print(f"  - usuario sincronizado: {email} (level {level}, nombre preservado)")
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
    print("-> Config seed:")
    print(f"     SEED_ADMIN_EMAIL = {settings.SEED_ADMIN_EMAIL}")
    print(f"     SEED_PASSWORD length = {len(settings.SEED_PASSWORD)}")
    print(f"     SEED_RESET_ADMIN_PASSWORD = {settings.SEED_RESET_ADMIN_PASSWORD}")
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
            force_password_reset=settings.SEED_RESET_ADMIN_PASSWORD,
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

        print("-> Catálogos de materiales (tipos y unidades)...")
        ensure_material_catalogs(db)

        print("-> Catálogo de métodos de pago...")
        ensure_metodos_pago(db)

        print("-> Navegación (sidebar)...")
        from app.routers.nav import ensure_nav_seed
        ensure_nav_seed(db)
    finally:
        db.close()
    print("-> Seed listo.")


if __name__ == "__main__":
    run()
