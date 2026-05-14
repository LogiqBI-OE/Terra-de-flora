"""Modelo Proyecto — la entidad central del workspace.

Cada proyecto es un evento (boda, XV, corporativo, etc.) para un cliente.
Tiene un vendedor (User L5+) asignado y vive en un estado del pipeline.
"""
import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TipoProyecto(str, enum.Enum):
    boda = "boda"
    iglesia = "iglesia"
    bautizo = "bautizo"
    cumple = "cumple"
    xv = "xv"
    corporativo = "corporativo"
    otro = "otro"


class EstadoProyecto(str, enum.Enum):
    cotizando = "cotizando"
    aprobado = "aprobado"
    produccion = "produccion"
    montaje = "montaje"
    entregado = "entregado"
    cancelado = "cancelado"


class Proyecto(Base):
    __tablename__ = "proyectos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)

    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    vendedor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    tipo: Mapped[TipoProyecto] = mapped_column(
        Enum(TipoProyecto, name="tipo_proyecto"), nullable=False, default=TipoProyecto.boda
    )
    estado: Mapped[EstadoProyecto] = mapped_column(
        Enum(EstadoProyecto, name="estado_proyecto"), nullable=False, default=EstadoProyecto.cotizando
    )

    fecha_evento: Mapped[date | None] = mapped_column(Date)
    direccion_evento: Mapped[str | None] = mapped_column(Text)
    valor_estimado: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)

    notas: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
