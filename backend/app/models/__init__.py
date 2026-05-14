"""Re-exports de todos los modelos para que SQLAlchemy los registre al importar `app.models`."""
from app.models.user import User, UserRole
from app.models.system_config import SystemConfig
from app.models.level import Level
from app.models.level_permission import LevelPermission
from app.models.login_event import LoginEvent
from app.models.proveedor import Proveedor
from app.models.cliente import Cliente, TipoCliente
from app.models.material import Material
from app.models.receta import Receta, RecetaItem
from app.models.proyecto import Proyecto, EstadoProyecto, TipoProyecto

__all__ = [
    "User",
    "UserRole",
    "SystemConfig",
    "Level",
    "LevelPermission",
    "LoginEvent",
    "Proveedor",
    "Cliente",
    "TipoCliente",
    "Material",
    "Receta",
    "RecetaItem",
    "Proyecto",
    "EstadoProyecto",
    "TipoProyecto",
]
