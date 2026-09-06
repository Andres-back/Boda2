-- Additive migration: guests, access codes and tables are untouched.
ALTER TABLE "configuracion" ADD COLUMN "horaRecepcion" TEXT NOT NULL DEFAULT '18:30';
ALTER TABLE "configuracion" ALTER COLUMN "organizadorTelefono" SET DEFAULT '+573209107554';
ALTER TABLE "configuracion" ALTER COLUMN "organizadorWhatsapp" SET DEFAULT '573209107554';
