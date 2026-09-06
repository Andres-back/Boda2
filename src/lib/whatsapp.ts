

export function normalizeWhatsAppNumber(numero: string | null | undefined): string {
  const digits = String(numero ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith("57")) return digits;
  if (digits.length >= 7 && digits.length <= 15) return digits;
  return "";
}

export function normalizePhoneE164(numero: string): string {
  const normalized = normalizeWhatsAppNumber(numero);
  return normalized ? `+${normalized}` : "";
}



export function buildWhatsappSimpleUrl(telefono: string, mensaje: string): string {
  const numero = normalizeWhatsAppNumber(telefono);
  if (!numero) return "";
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
