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
    secret: bool = False  # si es True, en GET se devuelve enmascarado


SYSTEM_CONFIG_KEYS: list[ConfigKey] = [
    ConfigKey(
        key="standard_password",
        default="TerraDeFlora2026!",
        label="Contraseña estándar",
        description="Se aplica al usuario cuando un admin presiona “Resetear contraseña”.",
        secret=False,  # admin L9 debe poder verlo, sino no sabe cuál setear
    ),
    ConfigKey(
        key="token_lifetime_days",
        default="30",
        label="Duración de la sesión (días)",
        description=(
            "Cuántos días dura el JWT de login antes de expirar. "
            "Después de ese tiempo, el usuario debe volver a iniciar sesión."
        ),
        secret=False,
    ),
]


def keys_by_id() -> dict[str, ConfigKey]:
    return {k.key: k for k in SYSTEM_CONFIG_KEYS}
