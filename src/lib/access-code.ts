export const ACCESS_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ACCESS_CODE_LENGTH = 8;
export const ACCESS_CODE_PREFIX = "JY";
export const ACCESS_CODE_FORMAT = `${ACCESS_CODE_PREFIX}-XXXXXXXX`;

export const ACCESS_CODE_REGEX = new RegExp(
  `^${ACCESS_CODE_PREFIX}-[${ACCESS_CODE_ALPHABET}]{${ACCESS_CODE_LENGTH}}$`
);

export function normalizeAccessCode(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  const compactLength = ACCESS_CODE_PREFIX.length + ACCESS_CODE_LENGTH;

  if (normalized.length === compactLength && !normalized.includes("-")) {
    return `${normalized.slice(0, ACCESS_CODE_PREFIX.length)}-${normalized.slice(ACCESS_CODE_PREFIX.length)}`;
  }

  return normalized;
}
