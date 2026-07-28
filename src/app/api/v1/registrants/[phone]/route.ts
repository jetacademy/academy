import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/registrants/[phone]
 * Cek apakah nomor WhatsApp terdaftar sebagai peserta.
 * Digunakan oleh Raka (CS) untuk mengenali customer yang udah daftar.
 *
 * Response:
 *   { found: false } — belum terdaftar
 *   { found: true, name, program, status, batch } — terdaftar
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;

  // Bersihkan nomor: hapus spasi, +, dan karakter non-digit
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  // Cari di registration dengan format nomor yang fleksibel
  const reg = await prisma.registration.findFirst({
    where: {
      OR: [
        { whatsapp: { contains: cleanPhone } },
        { whatsapp: { contains: cleanPhone.slice(-10) } },
      ],
    },
    include: {
      program: { select: { title: true } },
      batch: { select: { scheduleAt: true } },
      payment: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!reg) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    name: reg.name,
    email: reg.email,
    whatsapp: reg.whatsapp,
    program: reg.program.title,
    status: reg.status,
    payment: reg.payment?.status ?? null,
    batch: reg.batch
      ? new Date(reg.batch.scheduleAt).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        })
      : null,
    registeredAt: reg.createdAt,
  });
}
