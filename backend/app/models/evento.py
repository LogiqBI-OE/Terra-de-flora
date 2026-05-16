"""Eventos de calendario.

Cada usuario tiene su propio calendario. Puede invitar a otros (tabla
evento_participantes). Los eventos pueden estar ligados a un proyecto
(opcional). Las fechas de evento de los proyectos aparecen como
eventos SINTÉTICOS en el endpoint de rango (no se guardan aquí).
"""
from datetime import datetime
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TipoEvento(str, enum.Enum):
    junta = "junta"
    llamada = "llamada"
    pendiente = "pendiente"
    custom = "custom"


class EventoCalendario(Base):
    __tablename__ = "eventos_calendario"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tipo: Mapped[TipoEvento] = mapped_column(
        Enum(TipoEvento, name="tipo_evento"),
        nullable=False,
        default=TipoEvento.junta,
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)

    # Eje temporal: si all_day=True, start_at marca el día y end_at se ignora.
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    all_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Asociaciones opcionales
    proyecto_id: Mapped[int | None] = mapped_column(
        ForeignKey("proyectos.id", ondelete="SET NULL"), index=True
    )

    # Pendientes tienen estado completado/no
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    participantes: Mapped[list["EventoParticipante"]] = relationship(
        "EventoParticipante",
        cascade="all, delete-orphan",
    )


class EventoParticipante(Base):
    __tablename__ = "evento_participantes"
    __table_args__ = (
        UniqueConstraint("evento_id", "user_id", name="uq_participante_unique"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    evento_id: Mapped[int] = mapped_column(
        ForeignKey("eventos_calendario.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
