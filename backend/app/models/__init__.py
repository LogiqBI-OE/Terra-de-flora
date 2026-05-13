"""Re-exports de todos los modelos para que SQLAlchemy los registre al importar `app.models`."""
from app.models.user import User, UserRole
from app.models.planta import Planta
from app.models.customer import Customer
from app.models.producto import Producto
from app.models.snapshot import Snapshot, SnapshotStatus
from app.models.inventario import Inventario
from app.models.produccion import Produccion
from app.models.compra import Compra
from app.models.demanda import Demanda
from app.models.system_config import SystemConfig

__all__ = [
    "User",
    "UserRole",
    "Planta",
    "Customer",
    "Producto",
    "Snapshot",
    "SnapshotStatus",
    "Inventario",
    "Produccion",
    "Compra",
    "Demanda",
    "SystemConfig",
]
