"""Catálogo de claves del SystemConfig + defaults.

Para añadir una clave nueva:
  1. Añádela aquí con su default y descripción.
  2. (Opcional) Tipa el valor en el servicio que la consume.

⚠️ standard_password: se guarda en texto plano para que un admin nivel 9 pueda
verlo/editarlo. SOLO úsalo como contraseña *temporal* que el usuario debe
cambiar al primer login. Para Prod, considera hashear el "set" y guardar solo
una versión interpretable como "última vez ajustada".
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ConfigKey:
    key: str
    default: str
    label: str
    description: str
    section: str = "Accesos"   # agrupa visualmente en la UI
    input_type: str = "text"   # text | password | number
    secret: bool = False       # si es True, en GET se devuelve enmascarado


SYSTEM_CONFIG_KEYS: list[ConfigKey] = [
    # ── Accesos ──────────────────────────────────────────────────────────────
    ConfigKey(
        key="standard_password",
        default="TerraDeFlora2026!",
        label="Contraseña estándar",
        description="Se aplica al usuario cuando un admin presiona “Resetear contraseña”.",
        section="Accesos",
        input_type="text",  # L9 lo necesita ver para comunicarlo
        secret=False,
    ),
    ConfigKey(
        key="token_lifetime_days",
        default="30",
        label="Duración de la sesión (días)",
        description=(
            "Cuántos días dura el JWT de login antes de expirar. "
            "Después de ese tiempo, el usuario debe volver a iniciar sesión."
        ),
        section="Accesos",
        input_type="number",
        secret=False,
    ),

    # ── Rendimiento ──────────────────────────────────────────────────────────
    ConfigKey(
        key="keep_warm_ping_enabled",
        default="false",
        label="Mantener backend caliente (keep-warm)",
        description=(
            "Cuando está activo, mientras tengas la app abierta en cualquier "
            "pestaña, el frontend pinguea /health cada N minutos para evitar "
            "que el backend se duerma (cold start de Railway ≈ 300-500ms en "
            "el primer request del día). Si todos cierran la app, el ping se "
            "detiene — para keep-warm 24/7 usa un servicio externo como "
            "UptimeRobot."
        ),
        section="Rendimiento",
        input_type="boolean",
        secret=False,
    ),
    ConfigKey(
        key="keep_warm_ping_interval_minutes",
        default="5",
        label="Intervalo del keep-warm (minutos)",
        description=(
            "Cada cuántos minutos hacer el ping a /health cuando el keep-warm "
            "está activo. Default 5 (Railway suele dormir el contenedor "
            "después de ~10 min sin tráfico)."
        ),
        section="Rendimiento",
        input_type="number",
        secret=False,
    ),
]


def keys_by_id() -> dict[str, ConfigKey]:
    return {k.key: k for k in SYSTEM_CONFIG_KEYS}
