// Dates are entered and displayed in Colombia, independent of the server timezone.
export const WEDDING_TIME_ZONE = "America/Bogota";
export function toBogotaInput(value: Date | string): string {
  return new Date(new Date(value).getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function parseBogotaInput(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(NaN);
  const date = new Date(`${value}:00-05:00`);
  if (Number.isNaN(date.getTime()) || toBogotaInput(date) !== value) return new Date(NaN);
  return date;
}
export function weddingDate(value: Date | string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-CO", { ...options, timeZone: WEDDING_TIME_ZONE }).format(new Date(value));
}
export function weddingTime(value: Date | string): string {
  const [hour, minute] = toBogotaInput(value).slice(11).split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "a. m." : "p. m."}`;
}
export type WeddingEvent = {
  nombre: string; fecha: string; horaRecepcion: string; lugar: string;
  barrio: string | null; ciudad: string | null; whatsapp: string;
};
// Explicit allowlist: do not expose admin IDs, email or internal configuration.
export function publicWeddingEvent(config: {
  nombre: string; fecha: Date; horaRecepcion: string; lugar: string;
  barrio: string | null; ciudad: string | null; organizadorWhatsapp: string;
}): WeddingEvent {
  return {
    nombre: config.nombre, fecha: config.fecha.toISOString(), horaRecepcion: config.horaRecepcion,
    lugar: config.lugar, barrio: config.barrio, ciudad: config.ciudad,
    whatsapp: config.organizadorWhatsapp.replace(/\D/g, ""),
  };
}
export function weddingPresentation(event: WeddingEvent, mapsUrlOverride?: string) {
  const localDate = toBogotaInput(event.fecha).slice(0, 10);
  const phone = event.whatsapp.startsWith("57") && event.whatsapp.length === 12 ? event.whatsapp.slice(2) : event.whatsapp;
  const location = [event.lugar, event.barrio].filter(Boolean).join(" · ");
  return {
    date: weddingDate(event.fecha, { day: "numeric", month: "long", year: "numeric" }),
    shortDate: weddingDate(event.fecha, { day: "numeric", month: "long" }),
    numericDate: localDate.split("-").reverse().join(" · "),
    calendarDate: weddingDate(event.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    ceremonyTime: weddingTime(event.fecha),
    receptionTime: weddingTime(`${localDate}T${event.horaRecepcion}:00-05:00`),
    location,
    fullLocation: [location, event.ciudad].filter(Boolean).join(" · "),
    mapsUrl: mapsUrlOverride?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.lugar, event.barrio, event.ciudad].filter(Boolean).join(", "))}`,
    whatsappUrl: `https://wa.me/${event.whatsapp}`,
    phoneDisplay: phone.length === 10 ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : `+${phone}`,
  };
}
