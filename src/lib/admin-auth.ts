import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

const COOKIE = "jsa_admin";

function adminPassword(): string {
  // WAJIB ganti lewat ADMIN_PASSWORD di .env sebelum go-live
  return process.env.ADMIN_PASSWORD || "jetschool123";
}

/** Token sesi = HMAC dari password admin — berubah otomatis saat password diganti */
function sessionToken(): string {
  return createHmac("sha256", adminPassword()).update("jsa-admin-session-v1").digest("hex");
}

import { getMemberSession } from "./member-auth";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const hasCookie = jar.get(COOKIE)?.value === sessionToken();
  if (hasCookie) return true;

  try {
    const memberEmail = await getMemberSession();
    if (memberEmail && memberEmail.toLowerCase() === "jetschool.id@gmail.com") {
      return true;
    }
  } catch {}

  return false;
}

/** Panggil di awal setiap halaman/action admin */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/webadmin/login");
}

export async function forceAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  });
}

/** Hanya boleh dipanggil dari Server Action / Route Handler */
export async function createAdminSession(password: string): Promise<boolean> {
  if (password !== adminPassword()) return false;
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
