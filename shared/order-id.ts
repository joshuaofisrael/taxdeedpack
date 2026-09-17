export function createOrderId(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rand = cryptoRandom(6);
  return `JIV${y}${m}${d}${rand}`;
}

function cryptoRandom(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function normalizeReferralCode(value: string | undefined | null): string | null {
  const trimmed = value?.trim().toUpperCase();
  if (!trimmed) return null;
  if (!/^[A-Z0-9]{3,32}$/.test(trimmed)) return null;
  return trimmed;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
