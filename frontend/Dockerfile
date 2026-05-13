# Multi-stage: compila Vite, luego sirve estático ligero.

# ── Etapa 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

# VITE_API_URL se pasa como build-arg desde Railway:
#   en el dashboard del servicio frontend, Variables → VITE_API_URL = https://<backend>.up.railway.app
# Vite la "bakea" en el bundle final (NO se puede cambiar en runtime).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Etapa 2: serve ───────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# `serve` sirve el output de Vite (carpeta dist) con fallback a index.html
# para que las rutas SPA (/hallazgos, /usuarios, etc.) no den 404.
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
