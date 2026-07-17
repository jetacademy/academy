import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWa, msgWelcome, msgAccess } from "@/lib/wa";
import { createInvoice, isXenditConfigured } from "@/lib/xendit";
import { formatJadwal } from "@/lib/format";

/**
 * POST /api/register — satu pintu untuk semua tipe program.
 *
 * - Program GRATIS (webinar): simpan pendaftar → WA sambutan (Zoom + grup).
 * - Program BERBAYAR (kelas/workshop/bootcamp): simpan pendaftar →
 *   buat invoice Xendit → client diarahkan ke halaman pembayaran.
 *   Akses (grup/LMS/Zoom) dikirim via WA oleh webhook setelah lunas.
 */
export async function POST(req: Request) {
  let body: { name?: string; whatsapp?: string; email?: string; programSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const whatsapp = (body.whatsapp ?? "").trim();
  const email = (body.email ?? "").trim();
  const programSlug = (body.programSlug ?? "").trim();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (name.length < 3) return NextResponse.json({ error: "Nama minimal 3 huruf." }, { status: 400 });
  if (!/^0[0-9]{8,13}$/.test(whatsapp)) return NextResponse.json({ error: "Nomor WhatsApp tidak valid (contoh: 081234567890)." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  try {
    const program = await prisma.program.findUnique({ where: { slug: programSlug } });
    if (!program || !program.isActive) {
      return NextResponse.json({ error: "Program tidak ditemukan. (Sudah jalankan `npm run db:seed`?)" }, { status: 404 });
    }

    // idempoten: daftar dua kali dengan nomor sama = tetap sukses
    const reg = await prisma.registration.upsert({
      where: { whatsapp_programId: { whatsapp, programId: program.id } },
      create: { name, whatsapp, email, programId: program.id },
      update: { name, email },
      include: { payment: true },
    });

    // ── PROGRAM GRATIS (WEBINAR) ─────────────────────────────────
    if (program.price === 0) {
      await sendWa(
        whatsapp,
        msgWelcome(name, program.title, formatJadwal(program.scheduleAt), program.zoomLink, program.waGroupLink)
      );
      return NextResponse.json({ ok: true, paid: false, free: true, waGroupLink: program.waGroupLink });
    }

    // ── PROGRAM BERBAYAR ─────────────────────────────────────────
    // sudah lunas sebelumnya → langsung beri akses lagi
    if (reg.status !== "REGISTERED") {
      return NextResponse.json({ ok: true, paid: true, waGroupLink: program.waGroupLink, lmsLink: program.lmsLink });
    }

    // invoice pending masih berlaku → pakai ulang
    if (reg.payment?.status === "PENDING" && reg.payment.invoiceUrl) {
      return NextResponse.json({ ok: true, invoiceUrl: reg.payment.invoiceUrl });
    }

    // MODE DEV tanpa Xendit: langsung dianggap lunas agar alur bisa dites lokal
    if (!isXenditConfigured()) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Pembayaran belum dikonfigurasi. Hubungi admin." }, { status: 503 });
      }
      console.warn("[register] XENDIT_SECRET_KEY kosong — MODE DEV: pembayaran dianggap lunas.");
      await prisma.$transaction([
        prisma.payment.upsert({
          where: { registrationId: reg.id },
          create: { registrationId: reg.id, amount: program.price, status: "PAID", paidAt: new Date() },
          update: { status: "PAID", paidAt: new Date() },
        }),
        prisma.registration.update({ where: { id: reg.id }, data: { status: "PAID" } }),
      ]);
      await sendWa(whatsapp, msgAccess({
        name,
        programTitle: program.title,
        schedule: formatJadwal(program.scheduleAt),
        zoomLink: program.zoomLink,
        waGroupLink: program.waGroupLink,
        lmsLink: program.lmsLink,
        postTestUrl: `${baseUrl}/post-test/${reg.id}`,
      }));
      return NextResponse.json({ ok: true, paid: true, waGroupLink: program.waGroupLink, lmsLink: program.lmsLink });
    }

    const invoice = await createInvoice({
      externalId: reg.id,
      amount: program.price,
      payerEmail: email,
      description: `${program.title} (${name})`,
      successRedirectUrl: `${baseUrl}/program/${program.slug}?status=sukses`,
    });

    await prisma.payment.upsert({
      where: { registrationId: reg.id },
      create: { registrationId: reg.id, amount: program.price, xenditInvoiceId: invoice.id, invoiceUrl: invoice.invoice_url },
      update: { xenditInvoiceId: invoice.id, invoiceUrl: invoice.invoice_url, status: "PENDING", amount: program.price },
    });

    return NextResponse.json({ ok: true, invoiceUrl: invoice.invoice_url });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: "Database belum terhubung. Cek DATABASE_URL di file .env lalu jalankan `npx prisma db push`." },
      { status: 503 }
    );
  }
}
