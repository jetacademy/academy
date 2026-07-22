import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";

/**
 * PUT /api/member/profile
 * Update nama, whatsapp, dan institusi member pada semua registrasi
 * yang terhubung dengan email/whatsapp session.
 */
export async function PUT(req: Request) {
  try {
    const sessionVal = await getMemberSession();
    if (!sessionVal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { name?: string; whatsapp?: string; institution?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
    }

    const name = (body.name ?? "").trim().slice(0, 100);
    if (!name) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    }

    const whatsapp = (body.whatsapp ?? "").trim();
    if (!whatsapp) {
      return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
    }
    if (!/^08\d{7,12}$/.test(whatsapp)) {
      return NextResponse.json({ error: "Format WhatsApp harus 08xxx (min 10 digit)." }, { status: 400 });
    }

    const institution = (body.institution ?? "").trim().slice(0, 200);

    // Cari semua registrasi member berdasarkan session (email atau whatsapp)
    const registrations = await prisma.registration.findMany({
      where: { OR: [{ email: sessionVal }, { whatsapp: sessionVal }] },
      select: { id: true, email: true },
    });

    if (registrations.length === 0) {
      return NextResponse.json({ error: "Data member tidak ditemukan." }, { status: 404 });
    }

    // Update semua registrasi member dengan data profil baru
    await prisma.registration.updateMany({
      where: { OR: [{ email: sessionVal }, { whatsapp: sessionVal }] },
      data: { name, whatsapp: whatsapp.replace(/^08/, "628"), institution: institution || null },
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: { name, whatsapp, institution },
    });
  } catch (err) {
    console.error("Gagal update profil member:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
