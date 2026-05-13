"""Reglas de coloreo de celdas de cobertura.

REGLAS (orden de evaluación, primera que aplica gana):
  - rojo    : balance < 0
  - amarillo: balance >= 0 pero requiere compras (sin compras estaría < 0)
  - green   : balance >= 0 pero requiere producción (sin producción y sin compras estaría < 0)
  - white   : cubierto solo con inventario inicial

Si quieres cambiar las reglas o agregar nuevos colores, edita aquí.
"""
from __future__ import annotations


def colorear(
    balance: float,
    balance_sin_compras: float,
    balance_sin_compras_ni_produccion: float,
) -> str:
    if balance < 0:
        return "red"
    if balance_sin_compras < 0:
        return "yellow"
    if balance_sin_compras_ni_produccion < 0:
        return "green"
    return "white"
