#!/bin/sh
set -e

# 1) Asegura esquema + seed inicial (idempotente — no sobreescribe nada).
echo "→ Running seed..."
python -m app.seed

# 2) Inicia el servidor en el puerto que Railway inyecte ($PORT).
echo "→ Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
