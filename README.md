# Terra de Flora — Workspace

Workspace web de Terra de Flora. Login con sistema de niveles 1-9 + permisos custom.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Python 3 + FastAPI + SQLAlchemy + JWT
- **DB:** PostgreSQL en TODOS los entornos (dev → Postgres-dev en Railway, prod → Postgres-prod en Railway)
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

> **DATABASE_URL es obligatoria en todos los entornos.** No hay fallback a SQLite.
> Antes de la primera corrida copia `.env.example` a `backend/.env` y pega el
> connection string del Postgres-dev de Railway.

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

| Email                            | Nivel | Contraseña          |
| -------------------------------- | ----- | ------------------- |
| `orlando@logiqbi.com`            | 9     | `TerraDeFlora2026!` |
| `cliente.demo@terradeflora.com`  | 1     | `TerraDeFlora2026!` |

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
3. **Configura tu `.env`:**
   ```powershell
   cp .env.example backend\.env
   ```
   Edita `backend\.env` y pon el `DATABASE_URL` del Postgres-dev de Railway.
4. **Instala deps:**
   - VS Code: `Ctrl+Shift+P → Tasks: Run Task → Install: backend deps` y luego `Install: frontend deps`
   - O manualmente:
     ```powershell
     cd backend; python -m pip install -r requirements.txt
     cd ..\frontend; npm install
     ```
5. **Corre el seed inicial:**
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
2. Autoriza Railway en tu repo `LogiqBI-OE/Terra-de-flora`
3. En Railway: **New Project → Deploy from GitHub repo → Terra-de-flora**

Esto crea UN servicio inicial. Vamos a tener **3 en total**: db, backend, frontend.

### 1) Postgres (prod)
   - En el proyecto: **+ New → Database → PostgreSQL**
   - Railway lo provisiona automáticamente y crea la env var `DATABASE_URL`.
   - **Nota:** el Postgres-dev al que apunta tu `.env` local es un servicio Postgres *separado* (otro proyecto o el mismo, según prefieras). NO uses el mismo Postgres para dev y prod.

### 2) Servicio Backend
   - Si Railway creó un servicio del repo, edítalo. Si no: **+ New → GitHub Repo → Terra-de-flora**
   - Settings:
     - **Root Directory:** `backend`
     - **Build:** detecta Dockerfile automáticamente
   - Variables (Settings → Variables):
     - `DATABASE_URL` → click "Reference" → selecciona el de Postgres-prod
     - `JWT_SECRET` → genera uno aleatorio largo (32+ chars).
     - `CORS_ORIGINS` → vacío por ahora; lo llenamos cuando tengamos URL del frontend
     - `SEED_ADMIN_EMAIL`, `SEED_CLIENT_EMAIL`, `SEED_PASSWORD` → los del seed
   - **Generate domain** en Settings → Networking. Ej: `terradeflora-backend.up.railway.app`

### 3) Servicio Frontend
   - **+ New → GitHub Repo → Terra-de-flora**
   - Settings:
     - **Root Directory:** `frontend`
     - **Build:** detecta Dockerfile automáticamente
   - Variables:
     - `VITE_API_URL` → URL pública del backend (paso 2). Ej: `https://terradeflora-backend.up.railway.app`
   - **Generate domain** en Settings → Networking. Ej: `terradeflora-front.up.railway.app`

### 4) Conectar los dos
   - Vuelve al servicio **Backend** → Variables → edita `CORS_ORIGINS` y pon la URL pública del frontend:
     ```
     https://terradeflora-front.up.railway.app
     ```
   - Si quieres permitir local también: separa con coma:
     ```
     http://localhost:5173,https://terradeflora-front.up.railway.app
     ```
   - Esto re-despliega el backend automáticamente (~90s).

### 5) Probar
   - Abre la URL del frontend → debes ver el login.
   - Login con `orlando@logiqbi.com` / `TerraDeFlora2026!` (el seed corrió en el primer arranque).

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
| `DATABASE_URL` | conexión postgres (obligatoria) | Railway (al crear el plugin Postgres) — o tú en `.env` para dev |
| `JWT_SECRET` | string 32+ chars random | tú, al crear el servicio |
| `CORS_ORIGINS` | URL(s) del frontend, separadas por coma | tú |
| `JWT_ALGORITHM` | `HS256` | default |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | default |
| `SEED_ADMIN_EMAIL` | `orlando@logiqbi.com` | tú |
| `SEED_CLIENT_EMAIL` | `cliente.demo@terradeflora.com` | tú |
| `SEED_PASSWORD` | password inicial | tú |

**Frontend:**
| Variable | Valor |
|---|---|
| `VITE_API_URL` | URL pública del backend (https://...railway.app) |

---

## Workflow DEV → PROD (dos Postgres paralelos)

Cuando quieres llenar catálogos / probar sin afectar prod, usa este patrón:

### Setup
En Railway tienes dos servicios Postgres:
- `Postgres` (prod)
- `DB_Postgre_Dev` (dev)

El backend lee la env var `DATABASE_URL` para saber a cuál apuntar.

### Cambiar el backend a DEV
1. Railway → servicio **Backend** → **Variables** → edita `DATABASE_URL`
2. Pega el connection string de **DB_Postgre_Dev** (lo encuentras en el servicio Postgres-dev → Variables → `DATABASE_URL`, ícono del ojo)
3. Save → el backend re-deploya en DEV
4. Los nuevos catálogos los llenas aquí (clientes, proveedores, materiales, recetas…)

El schema se asegura automáticamente: `Base.metadata.create_all()` corre al arranque y crea las tablas que falten.

### Sincronizar DEV → PROD cuando estés listo
Tienes que poder conectarte localmente a ambos Postgres:

1. Railway → servicio **Postgres-dev** → **Settings** → **Networking** → **Generate Public Domain**. Anota la URL+puerto+pass (variable `DATABASE_PUBLIC_URL`).
2. Lo mismo con **Postgres-prod**.
3. En tu máquina:
   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   $env:SOURCE_URL="postgresql://...DEV_PUBLIC..."
   $env:TARGET_URL="postgresql://...PROD_PUBLIC..."

   # Primero ver qué se copiaría sin escribir nada:
   python -m tools.db_sync --dry-run

   # Copia los datos (skip duplicados por PK, idempotente):
   python -m tools.db_sync

   # O empezar limpio en prod (¡destruye datos de prod!):
   python -m tools.db_sync --clean
   ```
4. Cuando termine, **apaga el Public Networking** de ambos Postgres en Railway por seguridad.
5. Cambia el `DATABASE_URL` del backend de DEV a PROD y re-deploya.

### Reset de DEV (empezar de cero)
```powershell
# Conectado a DEV, vacía y vuelve a sembrar:
$env:SOURCE_URL="postgresql://...PROD..."  # o cualquier source válido
$env:TARGET_URL="postgresql://...DEV..."
python -m tools.db_sync --clean --dry-run
```
O conéctate directo al Postgres con `psql` y ejecuta `TRUNCATE TABLE ... CASCADE` en las tablas que quieras.

### Notas
- El sync **nunca borra datos del SOURCE**; solo escribe en TARGET.
- Sin `--clean`, las filas duplicadas (mismo PK) se ignoran — no falla.
- Después de copiar, el script resetea las sequences (autoincrement IDs) para que próximos inserts no choquen.
