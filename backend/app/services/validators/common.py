"""Utilidades compartidas por los validadores."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models import Customer, Planta, Producto


@dataclass
class ValidationContext:
    """Cache en memoria para resolver SKU/Planta/Customer sin hacer una query por fila.

    Tiene auto-resolver: si no existe el SKU/Planta/Customer, se crea on-the-fly
    para que el primer upload "siembre" el master. Si prefieres validar estrictamente
    contra master, cambia `auto_create=False`.
    """
    db: Session
    auto_create: bool = True
    productos: dict[str, Producto] = field(default_factory=dict)
    plantas: dict[str, Planta] = field(default_factory=dict)
    customers: dict[str, Customer] = field(default_factory=dict)

    def get_or_create_producto(self, sku: str, nombre: str, unidad: str = "kg") -> Producto:
        key = sku.strip().upper()
        if key in self.productos:
            return self.productos[key]
        existing = self.db.query(Producto).filter(Producto.sku == key).first()
        if existing:
            self.productos[key] = existing
            return existing
        if not self.auto_create:
            raise ValueError(f"SKU '{sku}' no existe en el catálogo de productos.")
        p = Producto(sku=key, nombre=nombre or key, unidad=unidad or "kg")
        self.db.add(p)
        self.db.flush()
        self.productos[key] = p
        return p

    def get_or_create_planta(self, codigo: str) -> Planta:
        key = codigo.strip().upper()
        if key in self.plantas:
            return self.plantas[key]
        existing = self.db.query(Planta).filter(Planta.codigo == key).first()
        if existing:
            self.plantas[key] = existing
            return existing
        if not self.auto_create:
            raise ValueError(f"Planta '{codigo}' no existe.")
        p = Planta(codigo=key, nombre=key)
        self.db.add(p)
        self.db.flush()
        self.plantas[key] = p
        return p

    def get_or_create_customer(self, codigo: str) -> Customer:
        key = codigo.strip().upper()
        if key in self.customers:
            return self.customers[key]
        existing = self.db.query(Customer).filter(Customer.codigo == key).first()
        if existing:
            self.customers[key] = existing
            return existing
        if not self.auto_create:
            raise ValueError(f"Cliente '{codigo}' no existe.")
        c = Customer(codigo=key, nombre=key)
        self.db.add(c)
        self.db.flush()
        self.customers[key] = c
        return c


def to_date(v: Any) -> date:
    """Convierte un valor (date, datetime, str ISO) a date."""
    if v is None or (isinstance(v, str) and not v.strip()):
        raise ValueError("Fecha vacía")
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        return datetime.fromisoformat(v.strip()[:10]).date()
    raise ValueError(f"Fecha inválida: {v!r}")


def to_float(v: Any) -> float:
    if v is None or (isinstance(v, str) and not v.strip()):
        raise ValueError("Cantidad vacía")
    try:
        return float(v)
    except (TypeError, ValueError):
        raise ValueError(f"Cantidad inválida: {v!r}")


def to_str(v: Any, *, required: bool = True) -> str:
    if v is None or (isinstance(v, str) and not v.strip()):
        if required:
            raise ValueError("Valor vacío")
        return ""
    return str(v).strip()
