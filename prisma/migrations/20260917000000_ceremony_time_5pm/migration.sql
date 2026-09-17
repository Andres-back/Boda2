ALTER TABLE "configuracion"
  ALTER COLUMN "fecha" SET DEFAULT '2026-10-11 22:00:00',
  ALTER COLUMN "puertas" SET DEFAULT '5:00 p. m.';

UPDATE "configuracion"
SET "fecha" = '2026-10-11 22:00:00',
    "puertas" = '5:00 p. m.',
    "actualizadoEn" = CURRENT_TIMESTAMP
WHERE "id" = 'singleton';
