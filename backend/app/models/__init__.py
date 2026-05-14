"""Re-exports de todos los modelos para que SQLAlchemy los registre al importar `app.models`."""
from app.models.user import User, UserRole
from app.models.system_config import SystemConfig
from app.models.level import Level
from app.models.level_permission import LevelPermission
from app.models.login_event import LoginEvent

__all__ = [
    "User",
    "UserRole",
    "SystemConfig",
    "Level",
    "LevelPermission",
    "LoginEvent",
]
