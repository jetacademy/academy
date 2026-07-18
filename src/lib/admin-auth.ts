import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

const COOKIE = "jsa_admin";

function adminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD wajib diisi di .env sebelum go-live!");
  return pw;
}

/** Token sesi = HMAC dari password admin — berubah otomatis saat password diganti */
function sessionToken(): string {
  return createHmac("sha256", adminPassword()).update("jsa-admin-session-v1").digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return createHmac("sha256", bufA).update(bufB).digest().length > 0; // dummy
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === sessionToken();
}

/** Panggil di awal setiap halaman/action admin */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/webadmin/login");
}

/** Hanya boleh dipanggil dari Server Action / Route Handler */
export async function createAdminSession(password: string): Promise<boolean> {
  if (password.length !== adminPassword().length) return false;
  const buf = Buffer.from(password);
  const expected = Buffer.from(adminPassword());
  try {
    const result = crypto.timingSafeEqual(buf, expected);
    if (!result) return false;
  } catch {
    return false;
  }
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  });
  return true;
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
