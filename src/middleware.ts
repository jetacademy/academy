// ============================================================
// Next.js Middleware — lapisan proteksi pertama untuk rute sensitif.
// Hanya memvalidasi KEBERADAAN cookie (bukan signature) — cepat & edge-compatible.
// Verifikasi signature & role dilakukan di server action/page (requireAdmin, requireMember).
// ============================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Panel Admin ──────────────────────────────────────────
  if (
    pathname.startsWith("/webadmin") &&
    !pathname.startsWith("/webadmin/login")
  ) {
    if (!request.cookies.has("jsa_admin")) {
      return NextResponse.redirect(new URL("/webadmin/login", request.url));
    }
  }

  // ── Area Member ──────────────────────────────────────────
  // Kecualikan halaman publik: login, daftar, sertifikat
  const memberPublic = ["/member/login", "/member/daftar"];
  if (
    pathname.startsWith("/member") &&
    !memberPublic.some((p) => pathname.startsWith(p))
  ) {
    if (!request.cookies.has("jsa_member")) {
      return NextResponse.redirect(new URL("/member/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/webadmin/:path*",
    "/member/:path*",
  ],
};
