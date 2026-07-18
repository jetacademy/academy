import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCallback } from "@/lib/xendit";
import { sendWa, msgPaid, msgAccess } from "@/lib/wa";
import { formatJadwal } from "@/lib/format";
import { sendEmail, getPaidEmailHtml } from "@/lib/email";

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
    if (!event.external_id) {
      return NextResponse.json({ error: "external_id tidak ditemukan." }, { status: 400 });
    }
    // external_id kita isi dengan registrationId saat membuat invoice
    const INVOICE_PREFIX = "ACADEMY-";
    const registrationId = event.external_id.startsWith(INVOICE_PREFIX)
      ? event.external_id.slice(INVOICE_PREFIX.length)
      : event.external_id;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { xenditInvoiceId: event.id ?? "" },
          { registrationId },
        ],
      },
      include: { registration: { include: { program: true } } },
    });
    if (!payment) return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });

    // Pastikan webhook ini untuk invoice yang masih aktif — tolak stale callback
    const isCurrentInvoice = !event.id || payment.xenditInvoiceId === event.id;

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
        const memberUrl = `${baseUrl}/member`;
        if (reg.program.price > 0) {
          // program berbayar → kirim semua akses (grup, LMS, Zoom) + link post-test
          await sendWa(reg.whatsapp, msgAccess({
            name: reg.name,
            programTitle: reg.program.title,
            schedule: formatJadwal(reg.program.scheduleAt),
            zoomLink: reg.program.zoomLink,
            waGroupLink: reg.program.waGroupLink,
            lmsLink: reg.program.lmsLink,
            memberUrl,
          }));
        } else {
          // webinar gratis → yang dibayar adalah paket sertifikat, kirim link post-test
          await sendWa(reg.whatsapp, msgPaid(reg.name, reg.program.title, memberUrl));
        }

        // Kirim email pembayaran sukses — best-effort
        await sendEmail({
          to: reg.email,
          subject: `Pembayaran Berhasil: Akses Pelatihan ${reg.program.title}`,
          html: getPaidEmailHtml(reg.name, reg.program.title, memberUrl, reg.program.zoomLink, reg.program.waGroupLink, reg.program.lmsLink),
        }).catch((err) => console.error("Gagal mengirim email webhook lunas:", err));
      }
    } else if (event.status === "EXPIRED" && payment.status !== "PAID" && isCurrentInvoice) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
    } else if (event.status === "FAILED" && payment.status !== "PAID" && isCurrentInvoice) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    } else {
      console.warn("[webhook] Status tidak dikenal / stale callback:", event.status);
      return NextResponse.json({ error: `Status tidak dikenal: ${event.status}` }, { status: 202 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook xendit]", err);
    return NextResponse.json({ error: "Gagal memproses webhook." }, { status: 500 });
  }
}
