import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCallback } from "@/lib/xendit";
import { sendWa, msgPaid, msgAccess } from "@/lib/wa";
import { formatJadwal } from "@/lib/format";

/**
 * POST /api/webhooks/xendit — dipanggil server Xendit saat status invoice berubah.
 * Set URL ini di Dashboard Xendit → Settings → Webhooks → Invoices:
 *   https://domainkamu.com/api/webhooks/xendit
 */
export async function POST(req: Request) {
  // verifikasi bahwa request benar-benar dari Xendit
  if (!isValidCallback(req.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "Token tidak valid." }, { status: 401 });
  }

  let event: { id?: string; external_id?: string; status?: string; paid_at?: string };
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    // external_id kita isi dengan registrationId saat membuat invoice
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { xenditInvoiceId: event.id ?? "___" },
          { registrationId: event.external_id ?? "___" },
        ],
      },
      include: { registration: { include: { program: true } } },
    });
    if (!payment) return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });

    if (event.status === "PAID") {
      // idempoten: webhook bisa dikirim lebih dari sekali
      if (payment.status !== "PAID") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "PAID", paidAt: event.paid_at ? new Date(event.paid_at) : new Date() },
          }),
          prisma.registration.update({
            where: { id: payment.registrationId },
            data: { status: "PAID" },
          }),
        ]);

        const reg = payment.registration;
        const postTestUrl = `${baseUrl}/post-test/${reg.id}`;
        if (reg.program.price > 0) {
          // program berbayar → kirim semua akses (grup, LMS, Zoom) + link post-test
          await sendWa(reg.whatsapp, msgAccess({
            name: reg.name,
            programTitle: reg.program.title,
            schedule: formatJadwal(reg.program.scheduleAt),
            zoomLink: reg.program.zoomLink,
            waGroupLink: reg.program.waGroupLink,
            lmsLink: reg.program.lmsLink,
            postTestUrl,
          }));
        } else {
          // webinar gratis → yang dibayar adalah paket sertifikat, kirim link post-test
          await sendWa(reg.whatsapp, msgPaid(reg.name, reg.program.title, postTestUrl));
        }
      }
    } else if (event.status === "EXPIRED") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook xendit]", err);
    return NextResponse.json({ error: "Gagal memproses webhook." }, { status: 500 });
  }
}
