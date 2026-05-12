from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import Base, engine
from app.routers import auth

# Crea tablas si no existen (sin Alembic por ahora — agregar migraciones cuando haya cambios reales)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Oleolab Coberturas API",
    version="0.1.0",
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


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
