"""Catálogo de niveles y permisos del sistema.

Cambia aquí para añadir / quitar niveles o permisos.
Los DEFAULT_PERMISSIONS definen lo que cada nivel trae prendido por default;
en cada usuario se pueden añadir EXTRA prendiendo permissions adicionales.
"""
from __future__ import annotations

# ── Niveles jerárquicos ──────────────────────────────────────────────────────
LEVELS: dict[int, str] = {
    9: "System Admin",
    8: "Reservado",          # hueco intencional
    7: "Director",
    6: "Business Owner",
    5: "Cadena de valor",
    4: "Funcionales",
    3: "Líderes",
    2: "Usuario general",
    1: "Outsource",
}

RESERVED_LEVELS: set[int] = {8}  # visibles en UI pero no asignables

# ── Permisos disponibles ─────────────────────────────────────────────────────
PERMISSIONS: list[str] = [
    "view_cobertura",
    "upload_data",
    "manage_snapshots",
    "manage_catalogs",
    "edit_coloring_rules",
    "manage_notifications",
    "manage_users",
    "export_data",
    "view_all_customers",
]

# ── Defaults por nivel ───────────────────────────────────────────────────────
DEFAULT_PERMISSIONS: dict[int, set[str]] = {
    9: set(PERMISSIONS),  # System Admin: todo
    8: {p for p in PERMISSIONS if p != "manage_users"},
    7: {  # Director
        "view_cobertura", "manage_snapshots", "manage_catalogs",
        "edit_coloring_rules", "export_data", "view_all_customers",
    },
    6: {  # Business Owner
        "view_cobertura", "upload_data", "manage_snapshots", "manage_catalogs",
        "edit_coloring_rules", "export_data", "view_all_customers",
    },
    5: {  # Cadena de valor
        "view_cobertura", "upload_data", "manage_snapshots", "export_data",
        "view_all_customers",
    },
    4: {  # Funcionales
        "view_cobertura", "upload_data", "export_data", "view_all_customers",
    },
    3: {  # Líderes
        "view_cobertura", "export_data", "view_all_customers",
    },
    2: {  # Usuario general
        "view_cobertura", "export_data",
    },
    1: {  # Outsource
        "view_cobertura",
    },
}

# Permisos restringidos: solo nivel 9 puede asignarlos / tenerlos
RESTRICTED_PERMISSIONS: set[str] = {"manage_users"}


def effective_permissions(level: int, custom: list[str] | None) -> set[str]:
    """Permisos efectivos = defaults del nivel ∪ custom (sin duplicados)."""
    base = set(DEFAULT_PERMISSIONS.get(level, set()))
    if custom:
        base.update(custom)
    return base
