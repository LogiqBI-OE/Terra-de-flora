"""Modelo: customer (cliente comprador de Oleolab; ej. cadena de retail/marca)."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(128), nullable=False)
