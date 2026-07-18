// Rate limiter in-memory sederhana — tanpa Redis / package eksternal.
// Reset otomatis setiap windowMs. Cocok untuk single-instance deployment.
// Untuk multi-instance (load balancer), ganti dengan Redis-based store.

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Bersihkan entry kadaluarsa setiap 60 detik
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

/**
 * @param key  identifier unik (misal: IP atau email)
 * @param maxRequests  jumlah maksimal request dalam window
 * @param windowMs  durasi window dalam milidetik (default: 60 detik)
 * @returns { allowed, remaining, resetInMs }
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetInMs: entry.resetAt - now };
}

/**
 * Middleware helper untuk Next.js API Route.
 * Gunakan di awal setiap route handler yang perlu dilimit.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs?: number
): { ok: true } | { ok: false; error: string; status: number } {
  const result = rateLimit(identifier, maxRequests, windowMs);
  if (!result.allowed) {
    return {
      ok: false,
      error: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(result.resetInMs / 1000)} detik.`,
      status: 429,
    };
  }
  return { ok: true };
}
