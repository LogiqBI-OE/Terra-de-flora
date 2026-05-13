"""Helpers para leer/escribir SystemConfig con autoseed de defaults."""
from sqlalchemy.orm import Session

from app.core.system_config_defaults import SYSTEM_CONFIG_KEYS, keys_by_id
from app.models.system_config import SystemConfig


def ensure_defaults(db: Session) -> None:
    """Crea las filas faltantes con su valor default."""
    existing = {c.key for c in db.query(SystemConfig).all()}
    for spec in SYSTEM_CONFIG_KEYS:
        if spec.key not in existing:
            db.add(SystemConfig(key=spec.key, value=spec.default))
    db.commit()


def get(db: Session, key: str) -> str:
    """Devuelve el valor (creando con default si no existe)."""
    spec = keys_by_id().get(key)
    row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if row:
        return row.value
    if spec:
        db.add(SystemConfig(key=key, value=spec.default))
        db.commit()
        return spec.default
    return ""


def set_value(db: Session, key: str, value: str) -> SystemConfig:
    row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if row:
        row.value = value
    else:
        row = SystemConfig(key=key, value=value)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


def all_with_meta(db: Session) -> list[dict]:
    """Devuelve todas las claves con metadata para la UI."""
    ensure_defaults(db)
    rows = {r.key: r for r in db.query(SystemConfig).all()}
    out: list[dict] = []
    for spec in SYSTEM_CONFIG_KEYS:
        row = rows.get(spec.key)
        out.append({
            "key": spec.key,
            "label": spec.label,
            "description": spec.description,
            "secret": spec.secret,
            "value": (row.value if row else spec.default),
        })
    return out
