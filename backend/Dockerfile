FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONIOENCODING=utf-8

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# En prod usamos psycopg para Postgres + las deps base
COPY requirements.txt requirements-prod.txt ./
RUN pip install --upgrade pip && pip install -r requirements-prod.txt

COPY . .

# Railway inyecta $PORT en runtime; fallback a 8000 para local.
ENV PORT=8000
EXPOSE 8000

# start.sh corre el seed (idempotente) y luego uvicorn.
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]
