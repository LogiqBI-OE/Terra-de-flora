"""Comentarios del proyecto (chat interno del equipo).

Soporta:
  - replies (parent_id auto-FK)
  - edición dentro de los primeros 3 min (edited_at se llena)
  - reacciones con emojis (tabla aparte, unique por user+emoji)
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Comentario(Base):
    __tablename__ = "comentarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("comentarios.id", ondelete="SET NULL"), index=True
    )
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ComentarioRead(Base):
    """Por cada (user, proyecto): última vez que el user vio la conversación.
    Comentarios con created_at > last_read_at y user_id != me cuentan como no
    leídos."""
    __tablename__ = "comentario_reads"
    __table_args__ = (
        UniqueConstraint("user_id", "proyecto_id", name="uq_read_user_proyecto"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id", ondelete="CASCADE"), index=True, nullable=False
    )
    last_read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ComentarioMention(Base):
    """Una fila por cada mención @ que aparece dentro de un comentario."""
    __tablename__ = "comentario_mentions"
    __table_args__ = (
        UniqueConstraint("comentario_id", "user_id", name="uq_mention_unique"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    comentario_id: Mapped[int] = mapped_column(
        ForeignKey("comentarios.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ComentarioReaccion(Base):
    __tablename__ = "comentario_reacciones"
    __table_args__ = (
        UniqueConstraint("comentario_id", "user_id", "emoji", name="uq_reaccion_user_emoji"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    comentario_id: Mapped[int] = mapped_column(
        ForeignKey("comentarios.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    emoji: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
