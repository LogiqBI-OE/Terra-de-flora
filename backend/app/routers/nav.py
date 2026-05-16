"""Router: configuración del sidebar de navegación.

  GET /nav            → nav efectivo para el usuario actual (filtrado)
  GET /nav/admin      → config completo (solo L9)
  PATCH /nav/admin/sections/{id}   → editar sección
  POST  /nav/admin/sections        → crear sección
  DELETE /nav/admin/sections/{id}  → borrar (items van a sección 'otros')
  PATCH /nav/admin/items/{id}      → editar item (label/section/orden/min_level/hidden)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_level_9
from app.db import get_db
from app.models.nav import NavItem, NavSection
from app.models.user import User


router = APIRouter(tags=["nav"])


# ── REGISTRY: una fuente de verdad por cada página conocida ──────────────
# Agregar aquí cuando crees una página nueva. La seed la inserta en DB
# con estos defaults si no existe todavía.
NAV_REGISTRY: dict[str, dict] = {
    "proyectos": {
        "to": "/proyectos",
        "icon": "briefcase",
        "default_label": "Gestor de proyectos",
        "default_section": "gestion",
        "default_order": 10,
        "default_min_level": 0,
    },
    "muro-comentarios": {
        "to": "/muro-comentarios",
        "icon": "chat",
        "default_label": "Muro de comentarios",
        "default_section": "gestion",
        "default_order": 20,
        "default_min_level": 5,
    },
    "reportes": {
        "to": "/reportes",
        "icon": "chart",
        "default_label": "Reportes",
        "default_section": "gestion",
        "default_order": 30,
        "default_min_level": 0,
        "default_disabled": True,
        "default_hint": "Próximamente",
    },
    "portal-mensajes": {
        "to": "/portal-mensajes",
        "icon": "network",
        "default_label": "Portal de mensajes",
        "default_section": "community",
        "default_order": 10,
        "default_min_level": 0,
        "default_disabled": True,
        "default_hint": "Próximamente",
    },
    "campanas": {
        "to": "/campanas",
        "icon": "megaphone",
        "default_label": "Campañas",
        "default_section": "community",
        "default_order": 20,
        "default_min_level": 0,
        "default_disabled": True,
        "default_hint": "Próximamente",
    },
    "integraciones": {
        "to": "/integraciones",
        "icon": "plug",
        "default_label": "Integraciones",
        "default_section": "community",
        "default_order": 30,
        "default_min_level": 0,
        "default_disabled": True,
        "default_hint": "Próximamente",
    },
    "calendario": {
        "to": "/calendario",
        "icon": "calendar",
        "default_label": "Calendario",
        "default_section": "community",
        "default_order": 40,
        "default_min_level": 5,
    },
    "clientes": {
        "to": "/clientes",
        "icon": "user-circle",
        "default_label": "Clientes",
        "default_section": "catalogos",
        "default_order": 10,
        "default_min_level": 0,
    },
    "materiales": {
        "to": "/materiales",
        "icon": "box",
        "default_label": "Materiales y proveedores",
        "default_section": "catalogos",
        "default_order": 20,
        "default_min_level": 0,
    },
    "usuarios": {
        "to": "/usuarios",
        "icon": "users",
        "default_label": "Usuarios",
        "default_section": "admin",
        "default_order": 10,
        "default_min_level": 5,
    },
    "configuracion": {
        "to": "/configuracion",
        "icon": "settings",
        "default_label": "System settings",
        "default_section": "admin",
        "default_order": 20,
        "default_min_level": 9,
    },
    "manual": {
        "to": "/manual",
        "icon": "manual",
        "default_label": "Manual de uso",
        "default_section": "admin",
        "default_order": 30,
        "default_min_level": 0,
        "default_disabled": True,
        "default_hint": "Próximamente",
    },
}

DEFAULT_SECTIONS: list[dict] = [
    {"key": "gestion", "label": "Gestión", "orden": 10},
    {"key": "community", "label": "Community Management", "orden": 20},
    {"key": "catalogos", "label": "Catálogos", "orden": 30},
    {"key": "admin", "label": "Administración", "orden": 40},
    {"key": "otros", "label": "Otros", "orden": 99},  # fallback si borran sección
]


def ensure_nav_seed(db: Session) -> None:
    """Asegura que todas las secciones default y todos los items del
    REGISTRY existan en DB. NO sobreescribe lo que el L9 ya editó."""
    # 1) Secciones
    existing_sections = {s.key: s for s in db.query(NavSection).all()}
    for spec in DEFAULT_SECTIONS:
        if spec["key"] not in existing_sections:
            s = NavSection(key=spec["key"], label=spec["label"], orden=spec["orden"])
            db.add(s)
            existing_sections[spec["key"]] = s
    db.flush()

    # 2) Items
    existing_items = {i.key: i for i in db.query(NavItem).all()}
    for key, spec in NAV_REGISTRY.items():
        if key in existing_items:
            continue
        section = existing_sections.get(spec["default_section"]) or existing_sections.get("otros")
        item = NavItem(
            key=key,
            section_id=section.id if section else None,
            label=spec["default_label"],
            orden=spec.get("default_order", 0),
            min_level=spec.get("default_min_level", 0),
            is_hidden=False,
            is_disabled=spec.get("default_disabled", False),
            hint=spec.get("default_hint"),
        )
        db.add(item)
    db.commit()


# ── Schemas ──────────────────────────────────────────────────────────────
class NavItemPublic(BaseModel):
    key: str
    to: str
    icon: str
    label: str
    orden: int
    section_id: int | None
    is_disabled: bool
    hint: str | None


class NavSectionPublic(BaseModel):
    id: int
    key: str
    label: str
    orden: int
    items: list[NavItemPublic]


class NavPublic(BaseModel):
    sections: list[NavSectionPublic]


class NavItemAdmin(NavItemPublic):
    min_level: int
    is_hidden: bool
    in_registry: bool  # false = item huérfano (sin registry en código)


class NavSectionAdmin(BaseModel):
    id: int
    key: str
    label: str
    orden: int
    items: list[NavItemAdmin]


class NavAdmin(BaseModel):
    sections: list[NavSectionAdmin]


class SectionUpdate(BaseModel):
    label: str | None = None
    orden: int | None = None


class SectionCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=60)
    label: str = Field(..., min_length=1, max_length=120)
    orden: int = 0


class ItemUpdate(BaseModel):
    section_id: int | None = None
    label: str | None = None
    orden: int | None = None
    min_level: int | None = Field(None, ge=0, le=9)
    is_hidden: bool | None = None
    is_disabled: bool | None = None
    hint: str | None = None


# ── Helpers ──────────────────────────────────────────────────────────────
def _item_to_public(i: NavItem) -> NavItemPublic | None:
    """Convierte un NavItem a su forma 'pública' (con to + icon resueltos
    desde REGISTRY). Devuelve None si el item es huérfano (no está en
    registry actual)."""
    reg = NAV_REGISTRY.get(i.key)
    if not reg:
        return None
    return NavItemPublic(
        key=i.key,
        to=reg["to"],
        icon=reg["icon"],
        label=i.label,
        orden=i.orden,
        section_id=i.section_id,
        is_disabled=i.is_disabled,
        hint=i.hint,
    )


# ── GET /nav (público para usuarios autenticados) ────────────────────────
@router.get("/nav", response_model=NavPublic)
def get_nav(
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> NavPublic:
    """Devuelve el nav efectivo para el usuario actual: ordenado y filtrado
    por min_level + is_hidden."""
    sections = db.query(NavSection).order_by(NavSection.orden, NavSection.id).all()
    items = (
        db.query(NavItem)
        .filter(NavItem.is_hidden == False, NavItem.min_level <= me.level)  # noqa: E712
        .order_by(NavItem.orden, NavItem.id)
        .all()
    )

    items_by_section: dict[int | None, list[NavItem]] = {}
    for i in items:
        items_by_section.setdefault(i.section_id, []).append(i)

    out: list[NavSectionPublic] = []
    for s in sections:
        bucket = items_by_section.get(s.id, [])
        public_items = [p for p in (_item_to_public(i) for i in bucket) if p]
        if not public_items:
            continue
        out.append(NavSectionPublic(
            id=s.id, key=s.key, label=s.label, orden=s.orden, items=public_items,
        ))
    return NavPublic(sections=out)


# ── GET /nav/admin (solo L9) ─────────────────────────────────────────────
@router.get(
    "/nav/admin",
    response_model=NavAdmin,
    dependencies=[Depends(require_level_9)],
)
def get_nav_admin(db: Session = Depends(get_db)) -> NavAdmin:
    sections = db.query(NavSection).order_by(NavSection.orden, NavSection.id).all()
    items = db.query(NavItem).order_by(NavItem.orden, NavItem.id).all()

    items_by_section: dict[int | None, list[NavItem]] = {}
    for i in items:
        items_by_section.setdefault(i.section_id, []).append(i)

    out: list[NavSectionAdmin] = []
    for s in sections:
        bucket = items_by_section.get(s.id, [])
        admin_items: list[NavItemAdmin] = []
        for i in bucket:
            reg = NAV_REGISTRY.get(i.key)
            admin_items.append(NavItemAdmin(
                key=i.key,
                to=reg["to"] if reg else "(huérfano)",
                icon=reg["icon"] if reg else "x",
                label=i.label,
                orden=i.orden,
                section_id=i.section_id,
                is_disabled=i.is_disabled,
                hint=i.hint,
                min_level=i.min_level,
                is_hidden=i.is_hidden,
                in_registry=reg is not None,
            ))
        out.append(NavSectionAdmin(
            id=s.id, key=s.key, label=s.label, orden=s.orden, items=admin_items,
        ))

    # Items sin sección (section_id = None) van como "huérfanos visuales"
    # — los agrupo bajo una sección virtual con id=-1.
    orphans = items_by_section.get(None, [])
    if orphans:
        admin_items = []
        for i in orphans:
            reg = NAV_REGISTRY.get(i.key)
            admin_items.append(NavItemAdmin(
                key=i.key,
                to=reg["to"] if reg else "(huérfano)",
                icon=reg["icon"] if reg else "x",
                label=i.label,
                orden=i.orden,
                section_id=None,
                is_disabled=i.is_disabled,
                hint=i.hint,
                min_level=i.min_level,
                is_hidden=i.is_hidden,
                in_registry=reg is not None,
            ))
        out.append(NavSectionAdmin(
            id=-1, key="__orphans__", label="(sin sección)", orden=999, items=admin_items,
        ))
    return NavAdmin(sections=out)


# ── Sections CRUD ────────────────────────────────────────────────────────
@router.post(
    "/nav/admin/sections",
    response_model=NavSectionAdmin,
    dependencies=[Depends(require_level_9)],
)
def create_section(payload: SectionCreate, db: Session = Depends(get_db)) -> NavSectionAdmin:
    if db.query(NavSection).filter(NavSection.key == payload.key).first():
        raise HTTPException(status_code=400, detail="Ya existe una sección con ese key.")
    s = NavSection(key=payload.key, label=payload.label, orden=payload.orden)
    db.add(s)
    db.commit()
    db.refresh(s)
    return NavSectionAdmin(id=s.id, key=s.key, label=s.label, orden=s.orden, items=[])


@router.patch(
    "/nav/admin/sections/{sid}",
    response_model=NavSectionAdmin,
    dependencies=[Depends(require_level_9)],
)
def update_section(
    sid: int, payload: SectionUpdate, db: Session = Depends(get_db)
) -> NavSectionAdmin:
    s = db.get(NavSection, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    if payload.label is not None:
        s.label = payload.label
    if payload.orden is not None:
        s.orden = payload.orden
    db.commit()
    db.refresh(s)
    items = (
        db.query(NavItem)
        .filter(NavItem.section_id == s.id)
        .order_by(NavItem.orden)
        .all()
    )
    admin_items = []
    for i in items:
        reg = NAV_REGISTRY.get(i.key)
        admin_items.append(NavItemAdmin(
            key=i.key,
            to=reg["to"] if reg else "(huérfano)",
            icon=reg["icon"] if reg else "x",
            label=i.label, orden=i.orden, section_id=i.section_id,
            is_disabled=i.is_disabled, hint=i.hint,
            min_level=i.min_level, is_hidden=i.is_hidden,
            in_registry=reg is not None,
        ))
    return NavSectionAdmin(id=s.id, key=s.key, label=s.label, orden=s.orden, items=admin_items)


@router.delete(
    "/nav/admin/sections/{sid}",
    status_code=204,
    dependencies=[Depends(require_level_9)],
)
def delete_section(sid: int, db: Session = Depends(get_db)) -> None:
    s = db.get(NavSection, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    # Reasigna items a sección "otros"
    fallback = db.query(NavSection).filter(NavSection.key == "otros").first()
    items = db.query(NavItem).filter(NavItem.section_id == s.id).all()
    for i in items:
        i.section_id = fallback.id if fallback else None
    db.flush()
    db.delete(s)
    db.commit()


# ── Items update ─────────────────────────────────────────────────────────
@router.patch(
    "/nav/admin/items/{iid}",
    response_model=NavItemAdmin,
    dependencies=[Depends(require_level_9)],
)
def update_item(
    iid: int, payload: ItemUpdate, db: Session = Depends(get_db)
) -> NavItemAdmin:
    i = db.get(NavItem, iid)
    if not i:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    if payload.section_id is not None:
        # 0 = mover a "sin sección" (None)
        if payload.section_id == 0:
            i.section_id = None
        else:
            target = db.get(NavSection, payload.section_id)
            if not target:
                raise HTTPException(status_code=400, detail="Sección destino inválida")
            i.section_id = target.id
    if payload.label is not None:
        i.label = payload.label
    if payload.orden is not None:
        i.orden = payload.orden
    if payload.min_level is not None:
        i.min_level = payload.min_level
    if payload.is_hidden is not None:
        i.is_hidden = payload.is_hidden
    if payload.is_disabled is not None:
        i.is_disabled = payload.is_disabled
    if payload.hint is not None:
        i.hint = payload.hint
    db.commit()
    db.refresh(i)
    reg = NAV_REGISTRY.get(i.key)
    return NavItemAdmin(
        key=i.key,
        to=reg["to"] if reg else "(huérfano)",
        icon=reg["icon"] if reg else "x",
        label=i.label, orden=i.orden, section_id=i.section_id,
        is_disabled=i.is_disabled, hint=i.hint,
        min_level=i.min_level, is_hidden=i.is_hidden,
        in_registry=reg is not None,
    )
