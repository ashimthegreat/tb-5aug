export const MAX_NAME = 100;
export const MAX_MESSAGE = 2000;
export const MAX_DESCRIPTION = 200;
export const MAX_ITEMS = 50;
export const MAX_QTY = 9999;
export const MAX_PRICE = 10_000_000;
export const MAX_EMAIL = 254;

const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const value = email.trim();
  if (value.length === 0 || value.length > MAX_EMAIL) return false;
  if (value.includes("..")) return false;
  return EMAIL_RE.test(value);
}

export function cleanPhone(phone: string): string {
  return phone
    .replace(/[^\d+()\-.\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isValidPhone(phone: string): boolean {
  if (typeof phone !== "string") return false;
  const value = phone.trim();
  if (value.length === 0) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
