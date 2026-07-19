import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

const COOKIE = "jsa_member";
// Gunakan secret TERPISAH dari ADMIN_PASSWORD

function sign(value: string): string {
  const secret = process.env.MEMBER_SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "default-member-session-secret-key" : "");
  if (!secret) throw new Error("MEMBER_SESSION_SECRET wajib diisi di .env!");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function getMemberSession(): Promise<string | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(COOKIE)?.value;
    if (!raw) return null;
    const [value, signature] = raw.split(":");
    if (!value || !signature) return null;
    if (sign(value) !== signature) return null;
    return value;
  } catch {
    // Abaikan jika dipanggil di luar konteks request (misal unit test)
    return null;
  }
}

export async function requireMember(): Promise<string> {
  const identifier = await getMemberSession();
  if (!identifier) redirect("/member/login");
  return identifier;
}

export async function createMemberSession(identifier: string): Promise<void> {
  const value = `${identifier}:${sign(identifier)}`;
  try {
    const jar = await cookies();
    jar.set(COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: "/",
    });
  } catch (err) {
    console.warn("Gagal membuat cookie session member (abaikan jika di unit test):", err);
  }
}

export async function destroyMemberSession(): Promise<void> {
  try {
    (await cookies()).delete(COOKIE);
  } catch (err) {
    console.warn("Gagal menghapus cookie session member:", err);
  }
}
