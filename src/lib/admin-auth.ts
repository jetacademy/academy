import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";

const COOKIE = "jsa_admin";

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET wajib diisi di .env!");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export type AdminSession = {
  userId: string;
  role: "ADMIN" | "TEACHER";
  name: string;
  email: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [sessionVal, signature] = raw.split("::");
  if (!sessionVal || !signature) return null;
  if (sign(sessionVal) !== signature) return null;

  const [userId, role] = sessionVal.split(":");
  if (!userId || !role) return null;

  if (userId === "env-admin") {
    return {
      userId: "env-admin",
      role: "ADMIN",
      name: "Root Admin",
      email: "admin@jetschool.id",
    };
  }

  // Cari di database untuk memastikan user masih aktif dan valid
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) return null;

  return {
    userId: user.id,
    role: user.role as "ADMIN" | "TEACHER",
    name: user.name,
    email: user.email,
  };
}

export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "ADMIN";
}

export async function isTeacher(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "TEACHER";
}

export async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/webadmin/login");
  }
}

export async function requireTeacherOrAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/webadmin/login");
  }
}

export async function createAdminSession(emailInput: string, passwordInput: string): Promise<boolean> {
  const email = emailInput.trim();
  const password = passwordInput;

  // 1. Cek env-based admin (fallback)
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && (email === "admin@jetschool.id" || email === "admin" || !email)) {
    const bufInput = Buffer.from(password);
    const bufExpected = Buffer.from(envPassword);
    if (bufInput.length === bufExpected.length) {
      try {
        if (timingSafeEqual(bufInput, bufExpected)) {
          const value = `env-admin:ADMIN`;
          const signedValue = `${value}::${sign(value)}`;
          const jar = await cookies();
          jar.set(COOKIE, signedValue, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 7 hari
            path: "/",
          });
          return true;
        }
      } catch {}
    }
  }

  // 2. Cek database user
  if (email) {
    const user = await (prisma as any).user.findUnique({
      where: { email },
    });
    if (user && user.passwordHash && (user.role === "ADMIN" || user.role === "TEACHER")) {
      const verified = verifyPassword(password, user.passwordHash);
      if (verified) {
        const value = `${user.id}:${user.role}`;
        const signedValue = `${value}::${sign(value)}`;
        const jar = await cookies();
        jar.set(COOKIE, signedValue, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 7 hari
          path: "/",
        });
        return true;
      }
    }
  }

  return false;
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
