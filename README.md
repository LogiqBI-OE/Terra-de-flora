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

1. Push del repo a GitHub (ya hecho).
2. En Railway: New Project → Deploy from GitHub repo.
3. Añadir plugin **PostgreSQL** — Railway inyecta `DATABASE_URL`.
4. Crear dos servicios desde el mismo repo:
   - `backend` (root: `/backend`, install: `pip install -r requirements-prod.txt`)
   - `frontend` (root: `/frontend`)
5. Variables de entorno del backend en Railway:
   - `DATABASE_URL` (lo inyecta el plugin de Postgres)
   - `JWT_SECRET` (genera uno largo y aleatorio)
   - `CORS_ORIGINS` (URL pública del frontend)
   - `SEED_ADMIN_EMAIL`, `SEED_CLIENT_EMAIL`, `SEED_PASSWORD`
6. Apuntar `VITE_API_URL` en el servicio del frontend al dominio público del backend.

## Roadmap

- [x] Login Cliente / Administrador con toggle
- [ ] Dashboard de cliente
- [ ] Dashboard de administrador
- [ ] CRUD de coberturas
- [ ] Reportes / BI
