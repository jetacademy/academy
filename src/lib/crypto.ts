import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const hash = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

/** Key untuk integrasi mesin-ke-mesin (mis. Hermes agent) — bukan password, tidak di-hash. */
export function generateApiKey(): string {
  return `jsa_${randomBytes(24).toString("hex")}`;
}
