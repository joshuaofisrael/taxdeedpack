export function createId(prefix = "ord") {
  const rand = cryptoRandom();
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(16).slice(2, 10);
}

export function nowIso() {
  return new Date().toISOString();
}
