-- Reconcile the historical migration chain with schema.prisma.
-- Safe for existing installations: additions/drops use IF EXISTS guards where possible.

ALTER TABLE "configuracion"
  ALTER COLUMN "puertas" DROP DEFAULT,
  ALTER COLUMN "lugar" DROP DEFAULT,
  ALTER COLUMN "barrio" DROP DEFAULT,
  ALTER COLUMN "aforo" SET DEFAULT 0;

ALTER TABLE "invitados"
  ADD COLUMN IF NOT EXISTS "almuerzoEntregadoEn" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reingresos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ultimoReingresoEn" TIMESTAMP(3);

ALTER TABLE "pagos" ALTER COLUMN "invitadosCubiertos" DROP DEFAULT;
ALTER TABLE "reservas" ALTER COLUMN "estado" SET DEFAULT 'PAGO_PENDIENTE';

-- This column was added accidentally as if a Prisma relation were scalar.
ALTER TABLE "users" DROP COLUMN IF EXISTS "configuracionesEditadas";

CREATE INDEX IF NOT EXISTS "invitados_codigo_idx" ON "invitados"("codigo");

ALTER TABLE "invitados" DROP CONSTRAINT IF EXISTS "invitados_reservaId_fkey";
ALTER TABLE "invitados" DROP CONSTRAINT IF EXISTS "invitados_mesaId_fkey";
ALTER TABLE "invitados" DROP CONSTRAINT IF EXISTS "invitados_adminIdPago_fkey";
ALTER TABLE "invitados" DROP CONSTRAINT IF EXISTS "invitados_adminIdAsignacion_fkey";

ALTER TABLE "invitados"
  ADD CONSTRAINT "invitados_reservaId_fkey"
  FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invitados"
  ADD CONSTRAINT "invitados_mesaId_fkey"
  FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitados"
  ADD CONSTRAINT "invitados_adminIdPago_fkey"
  FOREIGN KEY ("adminIdPago") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitados"
  ADD CONSTRAINT "invitados_adminIdAsignacion_fkey"
  FOREIGN KEY ("adminIdAsignacion") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
