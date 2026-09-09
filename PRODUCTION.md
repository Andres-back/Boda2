# Produccion: Jans y Yurleydi

Este stack es independiente de las otras bodas del servidor. Usa los contenedores
`boda-jans-yurleydi-app` y `boda-jans-yurleydi-db`, su propia red, su propia base
de datos y el volumen persistente `boda_jans_yurleydi_pgdata`.

## Despliegue

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production config
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

La aplicacion solo escucha en `127.0.0.1:3004`. En el panel de Cloudflare Tunnel,
configura `bodaevento.alexsters.works` como servicio **HTTP** con origen
`localhost:3004`. Cloudflare termina el HTTPS publico; el origen local no debe
configurarse como HTTPS.

## Verificacion

```bash
curl -fsS http://127.0.0.1:3004/api/health
docker compose --env-file .env.production exec db pg_isready -U boda_jans -d boda_jans
```

## Backup

```bash
docker compose --env-file .env.production exec -T db pg_dump -U boda_jans -d boda_jans -Fc > boda-jans-yurleydi-backup.dump
```
