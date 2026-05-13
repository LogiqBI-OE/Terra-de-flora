"""SystemConfig: key-value para configuración global (solo lectura/escritura por nivel 9).
Diseñado para crecer: agrega más claves sin migrar el esquema.

Claves esperadas (ver core/system_config_defaults.py):
  standard_password         · password que se aplica al "Resetear" un usuario
  (futuras claves aquí)
"""
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SystemConfig(Base):
    __tablename__ = "system_config"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
