import { customAlphabet, nanoid } from "nanoid";
import { ACCESS_CODE_ALPHABET, ACCESS_CODE_LENGTH, ACCESS_CODE_PREFIX } from "./access-code";

const generate = customAlphabet(ACCESS_CODE_ALPHABET, ACCESS_CODE_LENGTH);

/**
 * Genera un codigo de entrada tipo `AA-A7K2P9M3`.
 * Longitud: 8 caracteres del alfabeto sin ambiguos (sin 0/O, 1/I/L).
 * Prefijo: AA (Alejandro y Ana).
 */
export function generateEntradaCode(): string {
  return `${ACCESS_CODE_PREFIX}-${generate()}`;
}

/**
 * Genera una contrasena temporal de 10 caracteres.
 * Usa el alfabeto sin ambiguos (mismo que el codigo de entrada).
 * La contrasena es legible, facil de dictar por WhatsApp y
 * no contiene 0/O, 1/I/L que se confunden.
 *
 * El usuario DEBE cambiarla al primer login
 * (User.debeCambiarContrasena = true se setea al asignarla).
 */
export function generateTempPassword(): string {
  // 10 chars para un balance entre seguridad y facilidad de dictado.
  return customAlphabet(ACCESS_CODE_ALPHABET, 10)();
}

/**
 * Genera un token opaco (para futuras features como "link magico" de reset).
 * No se usa actualmente (hoy se hace via pwd temporal) pero queda disponible.
 */
export function generateOpaqueToken(): string {
  return nanoid(32);
}
