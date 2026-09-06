-- Align database defaults with the wedding configuration.
-- Existing rows are migrated safely by the idempotent seed at container startup.
ALTER TABLE "configuracion"
  ALTER COLUMN "nombre" SET DEFAULT 'Boda de Alejandro Valencia y Ana Usma',
  ALTER COLUMN "precioPorPersona" SET DEFAULT 0,
  ALTER COLUMN "organizadorNombre" SET DEFAULT 'Alejandro y Ana',
  ALTER COLUMN "organizadorEmail" SET DEFAULT '',
  ALTER COLUMN "organizadorTelefono" SET DEFAULT '+573134890987',
  ALTER COLUMN "organizadorWhatsapp" SET DEFAULT '573134890987';
