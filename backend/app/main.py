from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # registra todos los modelos en SQLAlchemy
from app.core.config import settings
from app.db import Base, engine
from app.routers import auth, catalog, cobertura, levels, snapshots, system_config, templates, uploads, users

# Crea tablas si no existen (sin Alembic por ahora)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Oleolab Coberturas API",
    version="0.2.0",
    description="API del workspace de coberturas de Oleolab.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(templates.router)
app.include_router(snapshots.router)
app.include_router(uploads.router)
app.include_router(cobertura.router)
app.include_router(users.router)
app.include_router(system_config.router)
app.include_router(levels.router)

_ = models  # silenciar "imported but unused"


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
