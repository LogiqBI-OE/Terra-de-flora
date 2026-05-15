"""Pagos por proyecto.

Mecánica:
  - Cada proyecto tiene UN depósito (tipo='deposito') que se crea automático
    al primer GET. Es la fila fija arriba de la tabla.
  - Los demás pagos (tipo='pago') son N filas dinámicas que tú agregas según
    el calendario pactado.
  - Status default por fecha: si fecha < hoy y no se marcó pagado, queda
    'vencido'. Si no hay fecha aún, queda 'pendiente'. El usuario puede
    override manualmente.
  - El depósito tiene un status extra 'por_regresar' / 'regresado' para
    el caso de cancelación del evento.

El total objetivo (cotización final) NO vive aquí — se jala de la
cotización 'aprobada' del proyecto en el router.
"""
from datetime import date, datetime
from decimal import Decimal
import enum

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TipoPago(str, enum.Enum):
    deposito = "deposito"
    pago = "pago"


class StatusPago(str, enum.Enum):
    pendiente = "pendiente"
    pagado = "pagado"
    vencido = "vencido"
    por_regresar = "por_regresar"
    regresado = "regresado"


class MetodoPago(Base):
    """Catálogo editable: Efectivo, Transferencia, Cheque, Tarjeta, etc."""
    __tablename__ = "metodos_pago"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Pago(Base):
    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True)
    proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tipo: Mapped[TipoPago] = mapped_column(
        Enum(TipoPago, name="tipo_pago"), nullable=False, default=TipoPago.pago
    )
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    monto: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    fecha: Mapped[date | None] = mapped_column(Date)
    metodo: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[StatusPago] = mapped_column(
        Enum(StatusPago, name="status_pago"), nullable=False, default=StatusPago.pendiente
    )
    notas: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
