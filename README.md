# Oleolab — Coberturas Workspace

Workspace web para gestión de coberturas de Oleolab. Login diferenciado para Clientes y Administradores.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Python 3 + FastAPI + SQLAlchemy + JWT
- **DB local:** SQLite (archivo `backend/oleolab.db`, cero instalación)
- **DB prod:** PostgreSQL (Railway)
- **Hosting:** Railway

## Estructura

```
.
├── backend/             # FastAPI app
├── frontend/            # React + Vite app
├── Logos/               # Brand assets
├── 03. Prototipo/       # HTML prototypes
├── .vscode/             # Tasks, settings y extensiones recomendadas
├── dev.ps1              # Arranca backend + frontend con 1 comando
└── README.md
```

## Cómo arrancar (cada vez)

### 🟢 Opción 1 — VS Code (recomendado, 1 click)

1. Abre la carpeta del proyecto en VS Code.
2. `Ctrl+Shift+P` → `Tasks: Run Task` → **`Dev: Start All`**
3. Se abren 2 paneles de terminal (backend + frontend).
4. Abre http://localhost:5173

### 🟢 Opción 2 — Un solo comando

Desde la raíz del proyecto, en PowerShell:
```powershell
.\dev.ps1
```
Abre 2 ventanas de PowerShell (una por servicio). Abre http://localhost:5173

### 🟢 Opción 3 — Manual (2 terminales)

**Terminal 1 — Backend:**
```powershell
cd backend
python -m uvicorn app.main:app --reload
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```

## Usuarios sembrados (seed)

| Email                       | Rol     | Contraseña       |
| --------------------------- | ------- | ---------------- |
| `orlando@logiqbi.com`       | admin   | `Oleolab2026!`   |
| `cliente.demo@oleolab.com`  | cliente | `Oleolab2026!`   |

Para re-correr el seed: `Ctrl+Shift+P → Tasks: Run Task → Backend: seed DB`

## Setup inicial (solo una vez)

Si esto es una clonada fresca del repo:

1. **Instala Scoop** (gestor de paquetes sin admin):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
   iwr -useb get.scoop.sh | iex
   ```
2. **Instala Python y Node:**
   ```powershell
   scoop install python nodejs-lts
   ```
3. **Instala deps:**
   - VS Code: `Ctrl+Shift+P → Tasks: Run Task → Install: backend deps` y luego `Install: frontend deps`
   - O manualmente:
     ```powershell
     cd backend; python -m pip install -r requirements.txt
     cd ..\frontend; npm install
     ```
4. **Crea el seed inicial:**
   ```powershell
   cd backend
   python -m app.seed
   ```

## Endpoints útiles

| URL | Descripción |
|---|---|
| http://localhost:5173 | Frontend (login) |
| http://127.0.0.1:8000 | Backend (API root) |
| http://127.0.0.1:8000/docs | Swagger / OpenAPI |
| http://127.0.0.1:8000/health | Healthcheck |

## Deploy a Railway

### Una sola vez (setup inicial)

1. **Crea cuenta en Railway**: https://railway.app → Sign in with GitHub
2. Autoriza Railway en tu repo `LogiqBI-OE/oleolab-coberturas`
3. En Railway: **New Project → Deploy from GitHub repo → oleolab-coberturas**

Esto crea UN servicio inicial. Vamos a tener **3 en total**: db, backend, frontend.

### 1) Postgres
   - En el proyecto: **+ New → Database → PostgreSQL**
   - Railway lo provisiona automáticamente y crea la env var `DATABASE_URL`.

### 2) Servicio Backend
   - Si Railway creó un servicio del repo, edítalo. Si no: **+ New → GitHub Repo → oleolab-coberturas**
   - Settings:
     - **Root Directory:** `backend`
     - **Build:** detecta Dockerfile automáticamente
   - Variables (Settings → Variables):
     - `DATABASE_URL` → click "Reference" → selecciona el de Postgres
     - `JWT_SECRET` → genera uno aleatorio largo (32+ chars). Railway tiene "Generate" si das click derecho.
     - `CORS_ORIGINS` → vacío por ahora; lo llenamos cuando tengamos URL del frontend
     - `SEED_ADMIN_EMAIL`, `SEED_CLIENT_EMAIL`, `SEED_PASSWORD` → los del seed
   - **Generate domain** en Settings → Networking. Ej: `oleolab-backend.up.railway.app`

### 3) Servicio Frontend
   - **+ New → GitHub Repo → oleolab-coberturas**
   - Settings:
     - **Root Directory:** `frontend`
     - **Build:** detecta Dockerfile automáticamente
   - Variables:
     - `VITE_API_URL` → URL pública del backend (paso 2). Ej: `https://oleolab-backend.up.railway.app`
   - **Generate domain** en Settings → Networking. Ej: `oleolab-front.up.railway.app`

### 4) Conectar los dos
   - Vuelve al servicio **Backend** → Variables → edita `CORS_ORIGINS` y pon la URL pública del frontend:
     ```
     https://oleolab-front.up.railway.app
     ```
   - Si quieres permitir local también: separa con coma:
     ```
     http://localhost:5173,https://oleolab-front.up.railway.app
     ```
   - Esto re-despliega el backend automáticamente (~90s).

### 5) Probar
   - Abre la URL del frontend → debes ver el login.
   - Login con `orlando@logiqbi.com` / `Oleolab2026!` (el seed corrió en el primer arranque).

### A partir de aquí
   Cada `git push origin main` despliega:
   - Backend si cambian archivos en `/backend`
   - Frontend si cambian archivos en `/frontend`

   Ambos servicios tienen logs en tiempo real en sus dashboards de Railway.

---

### Variables de entorno (referencia)

**Backend:**
| Variable | Valor | Quién la setea |
|---|---|---|
| `DATABASE_URL` | conexión postgres | Railway (al crear el plugin Postgres) |
| `JWT_SECRET` | string 32+ chars random | tú, al crear el servicio |
| `CORS_ORIGINS` | URL(s) del frontend, separadas por coma | tú |
| `JWT_ALGORITHM` | `HS256` | default |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | default |
| `SEED_ADMIN_EMAIL` | `orlando@logiqbi.com` | tú |
| `SEED_CLIENT_EMAIL` | `cliente.demo@oleolab.com` | tú |
| `SEED_PASSWORD` | password inicial | tú |

**Frontend:**
| Variable | Valor |
|---|---|
| `VITE_API_URL` | URL pública del backend (https://...railway.app) |

## Roadmap

- [x] Login con niveles 1-9 + permisos custom
- [x] Hallazgos (home) + Coberturas + Catálogos CRUD + Usuarios + System settings
- [x] Carga de datos (Excel templates + uploads)
- [ ] Drill-down en Cobertura
- [ ] Tabla de hallazgos exportable a Excel
- [ ] Comparador de snapshots
- [ ] Vista de Demanda
- [ ] Notificaciones / alertas por email
- [ ] Reglas de coloreo editables
