import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

const COOKIE = "jsa_member";
// Gunakan secret TERPISAH dari ADMIN_PASSWORD
const SECRET = process.env.MEMBER_SESSION_SECRET;
if (!SECRET) throw new Error("MEMBER_SESSION_SECRET wajib diisi di .env sebelum production!");

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export async function getMemberSession(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [value, signature] = raw.split(":");
  if (!value || !signature) return null;
  if (sign(value) !== signature) return null;
  return value;
}

export async function requireMember(): Promise<string> {
  const identifier = await getMemberSession();
  if (!identifier) redirect("/member/login");
  return identifier;
}

export async function createMemberSession(identifier: string): Promise<void> {
  const value = `${identifier}:${sign(identifier)}`;
  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
    path: "/",
  });
}

export async function destroyMemberSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
