import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const WEDDING_CONFIG = {
  name: "Boda de Alejandro Valencia y Ana Usma",
  startDate: process.env.EVENT_DATE ?? "2026-10-10T14:30:00-05:00",
  venue: "Iglesia Cruzada Cristiana",
  address: "Barrio San Francisco",
  city: "Mocoa, Putumayo",
  capacity: process.env.EVENT_CAPACITY ? Number(process.env.EVENT_CAPACITY) : 0,
  organizerWhatsapp: "573209107554",
} as const;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? process.env.ADMIN_INITIAL_PASSWORD;
  const adminNombre = process.env.ADMIN_NAME ?? "Alejandro y Ana";
  const adminTelefono = process.env.ADMIN_TELEFONO ?? "+573209107554";
  const adminWhatsapp = process.env.WHATSAPP_ADMIN_NUMBER ?? WEDDING_CONFIG.organizerWhatsapp;

  if (!adminEmail) {
    throw new Error("Define ADMIN_EMAIL antes de ejecutar prisma db seed.");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, rol: true },
  });

  if (existingAdmin) {
    if (existingAdmin.rol !== Rol.ADMIN) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { rol: Rol.ADMIN },
      });
    }
    console.log(`[seed] Administrador existente preservado: ${adminEmail}.`);
  } else {
    if (!adminPassword) {
      throw new Error("Define ADMIN_PASSWORD para crear el administrador inicial.");
    }

    await prisma.user.create({
      data: {
        nombreCompleto: adminNombre,
        email: adminEmail,
        telefono: adminTelefono,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        rol: Rol.ADMIN,
        debeCambiarContrasena: false,
      },
    });
    console.log(`[seed] Administrador inicial creado: ${adminEmail}.`);
  }

  const configuracion = await prisma.configuracion.findUnique({
    where: { id: "singleton" },
    select: { nombre: true },
  });

  const weddingDefaults = {
    nombre: WEDDING_CONFIG.name,
    fecha: new Date(WEDDING_CONFIG.startDate),
    puertas: "2:30 p. m.",
    horaRecepcion: "18:30",
    lugar: WEDDING_CONFIG.venue,
    barrio: WEDDING_CONFIG.address,
    ciudad: WEDDING_CONFIG.city,
    aforo: WEDDING_CONFIG.capacity,
    precioPorPersona: 0,
    organizadorNombre: adminNombre,
    organizadorEmail: adminEmail,
    organizadorTelefono: adminTelefono,
    organizadorWhatsapp: adminWhatsapp,
  };

  if (!configuracion) {
    await prisma.configuracion.create({
      data: { id: "singleton", ...weddingDefaults },
    });
    console.log("[seed] Configuración inicial de la boda creada.");
  } else if (configuracion.nombre.toLowerCase().includes("cumbre impacto")) {
    await prisma.configuracion.update({
      where: { id: "singleton" },
      data: weddingDefaults,
    });
    console.log("[seed] Configuración heredada de Cumbre migrada a la boda.");
  } else {
    console.log("[seed] Configuración existente preservada.");
  }
}

main()
  .catch((error) => {
    console.error("[seed] Error:", error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
