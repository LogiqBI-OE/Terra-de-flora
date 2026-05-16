"""Configuración del sidebar de navegación.

Las rutas e íconos viven en el código (NAV_REGISTRY del router). La DB
solo guarda la POLÍTICA: en qué sección está cada ítem, su label, orden,
nivel mínimo para verlo, y si está oculto/disabled.

Esto permite que el L9 reordene, renombre y oculte páginas desde la UI
sin tocar código, pero garantiza que cualquier nueva página que agreguemos
en código aparezca automáticamente (con defaults del registry).
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class NavSection(Base):
    __tablename__ = "nav_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class NavItem(Base):
    __tablename__ = "nav_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    # 'key' matchea con NAV_REGISTRY del código para resolver ruta + ícono.
    key: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    section_id: Mapped[int | None] = mapped_column(
        ForeignKey("nav_sections.id", ondelete="SET NULL"), index=True
    )
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    min_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_disabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hint: Mapped[str | None] = mapped_column(String(120))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
