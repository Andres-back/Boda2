#!/bin/sh
set -eu

echo "=== Boda de Jans y Yurleydi - inicio ==="
echo "> Esperando PostgreSQL (${DB_HOST:-db}:${DB_PORT:-5432})..."
MAX_RETRIES="${DB_MAX_RETRIES:-30}"
RETRY=0

while [ "$RETRY" -lt "$MAX_RETRIES" ]; do
    if pg_isready \
        -h "${DB_HOST:-db}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-boda_jans}" \
        -d "${DB_NAME:-boda_jans}" >/dev/null 2>&1; then
        echo "> PostgreSQL listo."
        break
    fi

    RETRY=$((RETRY + 1))
    echo "  Intento ${RETRY}/${MAX_RETRIES}..."
    sleep 2
done

if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: PostgreSQL no estuvo disponible tras ${MAX_RETRIES} intentos."
    exit 1
fi

echo "> Aplicando migraciones versionadas..."
prisma migrate deploy

if [ "${SEED_ON_START:-true}" = "true" ]; then
    echo "> Verificando datos iniciales..."
    prisma db seed
else
    echo "> Seed omitido (SEED_ON_START=${SEED_ON_START:-false})."
fi

echo "> Iniciando aplicacion en :${PORT:-3000}"
exec node server.js
