# Boda de Alejandro Valencia y Ana Usma

Invitación digital y plataforma operativa para la boda del 10 de octubre de 2026 en Mocoa, Putumayo. Incluye una portada cinematográfica y la gestión privada de confirmaciones, invitados, mesas, sillas, pases QR e ingreso.

## Funcionalidad integrada

- Invitación responsive para celular y computador.
- Registro de grupos de hasta 10 invitados.
- Un QR único `AA-XXXXXXXX` por persona.
- Portal privado para consultar y descargar entradas.
- Administración de usuarios, reservas, mesas y sillas.
- Escáner QR para ingreso y reingreso.
- Datos de fecha, horarios, lugar y contacto editables desde la administración.
- PostgreSQL persistente, migraciones automáticas y proxy HTTPS con Caddy.

## Desarrollo local

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed
pnpm dev
```

La aplicación queda en `http://localhost:3000`.

## Despliegue con Docker

Requisitos: Docker Engine con Compose, un dominio apuntando al servidor y puertos 80/443 disponibles.

```bash
cp .env.production.example .env.production
openssl rand -base64 32
docker compose --env-file .env.production config
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app caddy
```

Antes de levantar el stack, edita `.env.production` y reemplaza `DOMAIN`, `DB_PASSWORD`, `AUTH_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Usa una contraseña alfanumérica larga para PostgreSQL. Caddy obtiene y renueva HTTPS automáticamente; HTTPS es necesario para que la cámara del lector QR funcione de forma confiable en celulares.

El contenedor aplica únicamente migraciones versionadas (`prisma migrate deploy`). El seed es idempotente: crea el administrador y la configuración en una base nueva y, en reinicios posteriores, preserva contraseñas, invitados y cambios hechos desde el panel.

## Verificación operativa

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production exec app curl -fsS http://localhost:3000/api/health
docker compose --env-file .env.production exec db pg_isready -U cumbre_impacto -d cumbre_impacto
```

Respuesta esperada del healthcheck: `{"status":"ok","service":"boda-alejandro-ana","database":"ok"}`.

## Rutas principales

| Ruta | Uso |
|---|---|
| `/` | Invitación pública |
| `/reservar` | Confirmar asistencia y registrar acompañantes |
| `/login` | Acceso de invitados y administración |
| `/mi-reserva` | Entradas y QR del grupo |
| `/admin/reservas` | Gestión de reservas e invitados |
| `/admin/mesas` | Asignación de mesas y sillas |
| `/admin/usuarios` | Gestión de usuarios |
| `/admin/validar` | Escáner de ingreso y reingreso |
| `/admin/evento` | Fecha, horarios, lugar y contacto de la boda |
| `/api/health` | Salud de aplicación y base de datos |

## Backup y actualización

Haz un backup antes de actualizar una instancia con datos:

```bash
docker compose --env-file .env.production exec -T db pg_dump -U cumbre_impacto -d cumbre_impacto -Fc > boda-backup.dump
git pull
docker compose --env-file .env.production up -d --build
```

No uses `prisma db push` en producción. Los volúmenes `cumbre_impacto_pgdata` y `cumbre_impacto_caddy_data` conservan la base de datos y los certificados al recrear contenedores.
