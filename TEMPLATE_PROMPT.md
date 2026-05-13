# Plantilla para arrancar otra app con la misma arquitectura

Cópia/pega este archivo (completo o las secciones relevantes) a una nueva sesión
de Claude para replicar el stack y convenciones que construimos en
`oleolab-coberturas`. También conviene **darle al nuevo Claude el link del repo**
para que vea ejemplos concretos:

> Repo de referencia: https://github.com/LogiqBI-OE/oleolab-coberturas

---

## 1. Brief inicial (pégalo al primer mensaje del nuevo proyecto)

```
Voy a construir una nueva aplicación interna tipo workspace. Quiero replicar
exactamente el stack y las convenciones de mi proyecto anterior
`oleolab-coberturas` (https://github.com/LogiqBI-OE/oleolab-coberturas), pero
adaptarlo al nuevo dominio.

Stack obligatorio:
  Frontend: React 18 + Vite + TypeScript + Tailwind CSS
  Backend: Python 3.12 + FastAPI + SQLAlchemy 2 + bcrypt + python-jose
  DB: SQLite en dev local, Postgres en prod (DATABASE_URL inyectada)
  Deploy: Railway monorepo (Backend + Postgres + Frontend en un solo proyecto)
  Local dev sin Docker: Scoop (Windows sin admin) para Python y Node

Convenciones obligatorias:
  - Modularidad EXTREMA: un archivo por modelo, schema, router, página, sección
  - Theme system: CSS variables en index.css con tres bloques:
      :root         → tokens fijos (sidebar, brand-hero login, etc.)
      :root, .theme-dark → tokens temables modo oscuro (default)
      .theme-light  → overrides modo claro (slate-50 page bg)
  - Cero hex/rgba hardcoded en .ts/.tsx — todo via var(--*)
  - Sistema de permisos:
      · Niveles 1-9 con label + description editables
      · Matriz nivel × permiso editable desde /system-settings
      · Cada user tiene level + permissions[] custom on top
      · effective_permissions(level, custom) = matrix[level] ∪ custom
      · Solo nivel 9 ve /usuarios y /system-settings
  - SystemConfig: tabla key-value para parámetros globales editables
      (default: standard_password). Auto-seed con defaults declarados en código.
  - Drawer slide-in (React Portal a document.body) para forms de creación/edición
  - UI primitives reutilizables: Button, Card, Modal, Drawer, Tabs, TextField,
    Avatar, IconButton, Badge, Spinner, EmptyState
  - localStorage para sesión: write SÍNCRONO en login()/logout(), nunca useEffect
  - HTTP client: si 401 + había token → auto logout y redirect a /login
                 si 401 sin token → NO redirect (Login.tsx muestra el error)

Quiero que primero me hagas estas 5 preguntas y luego empieces:
  1. ¿Cuál es el dominio de la app? (qué hace, quién la usa)
  2. ¿Cuáles serían las páginas del sidebar agrupadas por sección?
     (estilo: MONITORES / INPUTS / CONFIGURACIÓN)
  3. ¿Cuál es el branding? (logo, color primario, nombre)
  4. ¿Qué niveles de usuario tiene? (los 9 de Oleolab funcionan o cambian)
  5. ¿GitHub repo target? Yo te paso el nombre cuando lo cree
```

---

## 2. Cosas que vas a querer cambiar al adaptar

| Qué | Dónde |
|---|---|
| Nombre de la app | `package.json`, `<title>` en `index.html`, README, branding en `Login.tsx` |
| Logo / colores | `frontend/src/index.css` (tokens), `components/SproutIcon.tsx`, `Login.tsx` panel derecho |
| Modelos de dominio | `backend/app/models/*.py` — uno por entidad |
| Páginas del sidebar | `frontend/src/components/layout/navConfig.tsx` |
| Iconos del sidebar | `frontend/src/components/icons/Icons.tsx` |
| Datos de seed | `backend/app/seed.py` |
| Email del admin inicial | `.env.example` + variable `SEED_ADMIN_EMAIL` |

---

## 3. Cosas que NO cambian (reutilizables tal cual)

- Sistema de auth completo (`auth.py`, `security.py`, `deps.py`)
- Sistema de permisos (`permissions.py`, `levels_service.py`, modelos Level + LevelPermission)
- SystemConfig (key-value editable)
- UI primitives (Button, Card, Modal, Drawer, Tabs, TextField, etc.)
- Layout (AppShell, Sidebar, Topbar con sun/moon + avatar)
- AuthContext con `useAuth().can(perm)`
- HTTP client con manejo de 401
- ThemeProvider con persistencia localStorage
- Página /usuarios completa
- Página /system-settings con Generales/Niveles/Permisos
- Dockerfiles backend + frontend
- start.sh con seed idempotente
- README de deploy a Railway

---

## 4. Pitfalls que te ahorras de pelear (saber de antemano)

1. **VITE_API_URL bakea en BUILD time.** Si cambias la URL del backend después
   del deploy, hay que hacer **Redeploy** (no Restart) del frontend. Vite
   solo lee env vars al compilar `npm run build`.

2. **Railway entrega DATABASE_URL como `postgresql://`** pero SQLAlchemy v2 con
   psycopg v3 quiere `postgresql+psycopg://`. El archivo `backend/app/db.py`
   tiene `_normalize_db_url()` que lo convierte automáticamente — no lo borres.

3. **React Portal para Drawer/Modal.** Si dejas el Drawer en su lugar natural
   del árbol React, lo afecta el `overflow:hidden` del `<main>` del AppShell y
   no cubre todo el viewport. Usa `createPortal(content, document.body)`.

4. **localStorage para token: síncrono, NO en useEffect.** El primer fetch
   después de `login()` lee localStorage. Si el token aún no está escrito
   (porque useEffect corre en el siguiente tick), el fetch va sin Authorization
   header → 401 → loop. Escribe `localStorage.setItem(...)` dentro de `login()`
   antes de `setToken/setUser`.

5. **CORS_ORIGINS** debe incluir el protocolo `https://` y NO terminar en `/`.
   La comparación es string-exact contra el header `Origin` del browser.

6. **PowerShell + Python en Windows + Unicode**: setea `PYTHONIOENCODING=utf-8`
   o los prints con `→ ✓` truenan con `UnicodeEncodeError`.

7. **L8 reservado**: si replicas la jerarquía de 9 niveles, el L8 viene oculto
   por default. Si en tu nuevo dominio quieres que sea visible, edita
   `INITIAL_LEVEL_DESCRIPTIONS` y quita el 8 de `RESERVED_LEVELS`. O
   simplemente actívalo desde la UI de System settings.

---

## 5. Comandos rápidos para arrancar local

```powershell
# Una sola vez (sin admin):
iwr -useb get.scoop.sh | iex
scoop install python nodejs-lts

# Cada vez que clones:
cd backend
python -m pip install -r requirements.txt
python -m app.seed

# Para correr:
.\dev.ps1                    # arranca backend + frontend en ventanas separadas
# o desde VS Code Tasks: Ctrl+Shift+P → Tasks: Run Task → "Dev: Start All"
```

---

## 6. Estructura completa de carpetas (referencia)

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py            ← Pydantic Settings (DATABASE_URL, JWT_SECRET, etc.)
│   │   ├── security.py          ← bcrypt + jose JWT
│   │   ├── deps.py              ← get_current_user, require_level_9
│   │   ├── permissions.py       ← LEVELS, PERMISSIONS, defaults seed
│   │   └── system_config_defaults.py
│   ├── db.py                    ← engine, SessionLocal, normalize_db_url
│   ├── models/                  ← UN modelo por archivo
│   │   ├── user.py
│   │   ├── level.py
│   │   ├── level_permission.py
│   │   ├── system_config.py
│   │   └── (resto de modelos del dominio)
│   ├── schemas/                 ← Pydantic por dominio
│   ├── routers/                 ← UN router por recurso REST
│   ├── services/                ← lógica de negocio aislada
│   ├── main.py
│   └── seed.py                  ← idempotente, corre en cada arranque
├── Dockerfile
├── start.sh                     ← python -m app.seed && uvicorn
├── requirements.txt             ← deps de dev (sin psycopg)
└── requirements-prod.txt        ← deps de prod (con psycopg[binary])

frontend/
├── src/
│   ├── components/
│   │   ├── layout/              ← AppShell, Sidebar, SidebarSection, SidebarItem, Topbar, navConfig
│   │   ├── ui/                  ← Button, Card, Modal, Drawer, Tabs, TextField, Avatar, IconButton, Badge, Spinner, EmptyState, ThemeToggle, UserMenu
│   │   ├── icons/Icons.tsx      ← inline SVG estilo Heroicons
│   │   ├── ProtectedRoute.tsx
│   │   └── SproutIcon.tsx       ← branding
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── usuarios/            ← UsuariosPage + sections (Table, FormDrawer)
│   │   ├── configuracion/       ← SystemSettings + tabs (Generales, Niveles, Permisos)
│   │   └── (resto de páginas del dominio — una carpeta por página con sections/)
│   ├── lib/
│   │   ├── api/                 ← client.ts + auth.ts + users.ts + (resto por dominio)
│   │   ├── auth.tsx             ← AuthContext con can(perm)
│   │   ├── theme.tsx            ← ThemeProvider
│   │   ├── colors.ts            ← tokens semánticos referencian CSS vars
│   │   └── format.ts            ← fmtNumber, fmtDate
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                ← CSS variables: :root + .theme-dark + .theme-light
├── Dockerfile                   ← multi-stage: vite build + serve
└── package.json

.vscode/
├── tasks.json                   ← Dev: Start All, Install: backend deps, etc.
├── settings.json
└── extensions.json

dev.ps1                          ← un comando arranca todo local
docker-compose.yml               ← alternativa Docker (opcional)
.gitattributes                   ← LF en *.sh
.gitignore
.env.example
README.md
TEMPLATE_PROMPT.md               ← este archivo
```

---

## 7. Si quieres, una alternativa MÁS RÁPIDA: fork-and-rename

En lugar de empezar de cero:

```bash
# 1. En GitHub: crea un repo nuevo (vacío) "logiqbi-oe/<nuevo-nombre>"
# 2. En local:
git clone https://github.com/LogiqBI-OE/oleolab-coberturas.git nuevo-nombre
cd nuevo-nombre
git remote set-url origin https://github.com/LogiqBI-OE/nuevo-nombre.git

# 3. Limpia el SQLite local
rm backend/oleolab.db

# 4. Pásale a Claude el repo clonado y pídele:
#    "Adapta este repo a [nuevo dominio]. Mantén toda la arquitectura
#     (auth, niveles, system settings, etc.) pero:
#       - renombra el branding de Oleolab a [NUEVO]
#       - cambia el color verde a [NUEVO COLOR HEX]
#       - reemplaza las páginas de dominio (Hallazgos, Cobertura, Catálogos)
#         por: [LISTA DE PÁGINAS DEL NUEVO DOMINIO]
#       - actualiza el seed con datos del nuevo dominio"

# 5. Cuando termine: git push -u origin main
# 6. Repite el deploy a Railway con los pasos del README
```

Eso te ahorra ~80% del trabajo de la primera sesión.
