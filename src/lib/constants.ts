import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { EVENT_CONFIG } from "@/config/event";
import {
  ACCESS_CODE_ALPHABET,
  ACCESS_CODE_LENGTH,
  ACCESS_CODE_PREFIX,
} from "@/lib/access-code";

export const MAX_POR_RESERVA = 10;
export const CODE_ALPHABET = ACCESS_CODE_ALPHABET;
export const CODE_LENGTH = ACCESS_CODE_LENGTH;
export const CODE_PREFIX = ACCESS_CODE_PREFIX;
export const MESA_CAPACIDAD_DEFAULT = 8;
export const MESA_CAPACIDAD_MIN = 1;
export const MESA_CAPACIDAD_MAX = 20;

export type ConfiguracionData = {
  id: string;
  nombre: string;
  fecha: Date;
  puertas: string;
  horaRecepcion: string;
  lugar: string;
  barrio: string | null;
  ciudad: string | null;
  precioPorPersona: number;
  organizadorNombre: string;
  organizadorEmail: string;
  organizadorTelefono: string;
  organizadorWhatsapp: string;
  actualizadoEn: Date;
  actualizadoPorId: string | null;
};

export function toValidDate(value: Date | string | number | null | undefined, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return fallback;
}

const _getConfiguracionRaw = unstable_cache(
  async () => prisma.configuracion.findUnique({ where: { id: "singleton" } }),
  ["configuracion-singleton"],
  { revalidate: 60, tags: ["configuracion"] }
);

export async function getConfiguracion(): Promise<ConfiguracionData> {
  const row = await _getConfiguracionRaw();
  if (row) {
    return {
      ...row,
      fecha: row.fecha instanceof Date ? row.fecha : new Date(row.fecha),
      actualizadoEn: row.actualizadoEn instanceof Date ? row.actualizadoEn : new Date(row.actualizadoEn),
    };
  }
  return {
    id: "singleton",
    nombre: EVENT_CONFIG.name,
    fecha: new Date(EVENT_CONFIG.startDate),
    puertas: "6:00 p. m.",
    horaRecepcion: "19:30",
    lugar: EVENT_CONFIG.venue,
    barrio: EVENT_CONFIG.address,
    ciudad: EVENT_CONFIG.city,
    precioPorPersona: 0,
    organizadorNombre: "Jans Narvaez y Yurleydi Solarte",
    organizadorEmail: process.env.ADMIN_EMAIL?.toLowerCase() ?? "",
    organizadorTelefono: process.env.ADMIN_TELEFONO ?? "+573000000000",
    organizadorWhatsapp: process.env.WHATSAPP_ADMIN_NUMBER ?? EVENT_CONFIG.organizerWhatsapp,
    actualizadoEn: new Date(),
    actualizadoPorId: null,
  };
}

export const PRECIO_PERSONA = 0;
export const AFORO = Number(process.env.EVENT_CAPACITY ?? 0);
export const EVENT_DATE = process.env.EVENT_DATE ?? EVENT_CONFIG.startDate;
export const EVENT_NOMBRE = EVENT_CONFIG.name;
export const EVENT_LUGAR = EVENT_CONFIG.venue;
export const EVENT_BARRIO = EVENT_CONFIG.address;
export const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER ?? EVENT_CONFIG.organizerWhatsapp;
export const WHATSAPP_ADMIN_DISPLAY = process.env.WHATSAPP_ADMIN_DISPLAY ?? "300 000 0000";
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
export const ADMIN_NAME = process.env.ADMIN_NAME ?? "Jans y Yurleydi";
export const ADMIN_TELEFONO = process.env.ADMIN_TELEFONO ?? "+573000000000";
