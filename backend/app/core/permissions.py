"""Declaración del CATÁLOGO de niveles y permisos.

Lo que vive aquí (en código):
  - LEVELS: jerarquía int → label inicial
  - RESERVED_LEVELS: niveles no asignables (huecos intencionales como L8)
  - PERMISSIONS: lista de permisos disponibles (mapea a lógica del backend)
  - RESTRICTED_PERMISSIONS: permisos que SOLO niveles altos pueden tener
  - INITIAL_LEVEL_PERMISSIONS / INITIAL_LEVEL_DESCRIPTIONS: SOLO para seed inicial.
    La matriz real (level→permissions) se guarda en DB tras el primer seed,
    editable desde /system-settings. Ver services/levels_service.py.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

# ── Niveles jerárquicos ──────────────────────────────────────────────────────
LEVELS: dict[int, str] = {
    9: "System Admin",
    8: "Reservado",
    7: "Director",
    6: "Business Owner",
    5: "Cadena de valor",
    4: "Funcionales",
    3: "Líderes",
    2: "Usuario general",
    1: "Outsource",
}

RESERVED_LEVELS: set[int] = {8}

INITIAL_LEVEL_DESCRIPTIONS: dict[int, str] = {
    9: "TI / dueño técnico. Acceso total.",
    8: "Hueco reservado para futuros usos (ej. VP / C-suite).",
    7: "C-suite / decisor final.",
    6: "Dueño del proceso.",
    5: "Cadena de valor / planning.",
    4: "Operativos de área.",
    3: "Jefes de equipo / supervisores.",
    2: "Empleado consultor.",
    1: "Externo / contratista. Solo lo que se le permita explícitamente.",
}

# ── Permisos disponibles ─────────────────────────────────────────────────────
# Catálogo mínimo de arranque. Conforme se agreguen módulos del dominio
# (Terra de Flora), añade aquí los permisos correspondientes y actualiza
# INITIAL_LEVEL_PERMISSIONS abajo.
PERMISSIONS: list[str] = [
    "manage_users",
    "manage_notifications",
    "export_data",
]

RESTRICTED_PERMISSIONS: set[str] = {"manage_users"}

# ── Defaults iniciales (solo para el primer seed) ────────────────────────────
INITIAL_LEVEL_PERMISSIONS: dict[int, set[str]] = {
    9: set(PERMISSIONS),
    8: {p for p in PERMISSIONS if p != "manage_users"},
    7: {"manage_notifications", "export_data"},
    6: {"manage_notifications", "export_data"},
    5: {"export_data"},
    4: {"export_data"},
    3: {"export_data"},
    2: set(),
    1: set(),
}


def effective_permissions(db: Session, level: int, custom: list[str] | None) -> set[str]:
    """Permisos efectivos = matriz_actual[nivel] (DB) ∪ custom del usuario."""
    # Import local para evitar ciclo
    from app.services.levels_service import permissions_for_level
    base = permissions_for_level(db, level)
    if custom:
        base.update(custom)
    return base
