# Oleolab — Coberturas Workspace

Workspace web para gestión de coberturas de Oleolab. Login diferenciado para Clientes y Administradores.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Python 3.12 + FastAPI + SQLAlchemy + JWT
- **DB:** PostgreSQL 16
- **Dev:** Docker Compose (todo corre en contenedores — no requiere instalar Python ni Node localmente)
- **Hosting:** Railway

## Estructura

```
.
├── backend/             # FastAPI app
├── frontend/            # React + Vite app
├── Logos/               # Brand assets
├── 03. Prototipo/       # Static HTML prototypes
├── docker-compose.yml
├── .env.example
└── README.md
```

## Arrancar el proyecto

### Requisitos
- Docker Desktop instalado (o GitHub Codespaces — todo el código corre en contenedores)
- VS Code con extensiones recomendadas

### Primer arranque

```bash
cp .env.example .env       # ajusta variables si quieres
docker compose up --build  # primera vez compila imágenes (puede tardar 3–5 min)
```

Una vez listo:
- Frontend: http://localhost:5173
- Backend (Swagger): http://localhost:8000/docs
- Postgres: `localhost:5432` (usuario y db en `.env`)

### Usuarios sembrados (seed)

| Email                       | Rol     | Contraseña       |
| --------------------------- | ------- | ---------------- |
| `orlando@logiqbi.com`       | admin   | `Oleolab2026!`   |
| `cliente.demo@oleolab.com`  | cliente | `Oleolab2026!`   |

⚠️ **Cambia las contraseñas tras el primer login en producción.**

### Comandos útiles

```bash
docker compose up              # arranca todo
docker compose down            # detiene todo
docker compose logs -f backend # logs del backend
docker compose exec backend python -m app.seed  # re-correr el seed
docker compose exec db psql -U oleolab -d oleolab_coberturas
```

## Deploy a Railway

1. Push del repo a GitHub.
2. En Railway: New Project → Deploy from GitHub repo.
3. Añadir el plugin **PostgreSQL** — Railway inyecta `DATABASE_URL`.
4. Crear dos servicios desde el mismo repo:
   - `backend` (root: `/backend`)
   - `frontend` (root: `/frontend`)
5. Configurar variables de entorno en cada servicio según `.env.example`.
6. Apuntar `VITE_API_URL` en `frontend` al dominio público del `backend`.

## Roadmap

- [x] Login Cliente / Administrador con toggle
- [ ] Dashboard de cliente
- [ ] Dashboard de administrador
- [ ] CRUD de coberturas
- [ ] Reportes / BI
