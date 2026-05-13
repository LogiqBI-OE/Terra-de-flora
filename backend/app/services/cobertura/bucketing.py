"""Conversión de fechas a buckets temporales (semana / mes).

Para cambiar el horizonte por defecto o el inicio de semana, edita aquí.
"""
from __future__ import annotations

from datetime import date, timedelta


HORIZONTE_DEFAULT = 12  # número de buckets a proyectar


def inicio_semana(d: date) -> date:
    """Lunes de la semana de `d` (ISO: lunes=0)."""
    return d - timedelta(days=d.weekday())


def inicio_mes(d: date) -> date:
    return d.replace(day=1)


def bucket_de(d: date, granularidad: str) -> date:
    if granularidad == "semanal":
        return inicio_semana(d)
    if granularidad == "mensual":
        return inicio_mes(d)
    raise ValueError(f"Granularidad inválida: {granularidad}")


def generar_buckets(fecha_inicio: date, granularidad: str, n: int = HORIZONTE_DEFAULT) -> list[date]:
    """Lista de fechas (inicio de bucket) desde `fecha_inicio` hacia adelante."""
    base = bucket_de(fecha_inicio, granularidad)
    if granularidad == "semanal":
        return [base + timedelta(weeks=i) for i in range(n)]
    # mensual
    out: list[date] = []
    y, m = base.year, base.month
    for _ in range(n):
        out.append(date(y, m, 1))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out
