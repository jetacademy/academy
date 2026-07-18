import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWa, msgWelcome, msgAccess } from "@/lib/wa";
import { createInvoice, isXenditConfigured } from "@/lib/xendit";
import { formatJadwal } from "@/lib/format";
import { sendEmail, getWelcomeEmailHtml, getPaidEmailHtml } from "@/lib/email";

/**
 * POST /api/register — satu pintu untuk semua tipe program.
 *
 * - Program GRATIS (webinar): simpan pendaftar → WA sambutan (Zoom + grup).
 * - Program BERBAYAR (kelas/workshop/bootcamp): simpan pendaftar →
 *   buat invoice Xendit → client diarahkan ke halaman pembayaran.
 *   Akses (grup/LMS/Zoom) dikirim via WA oleh webhook setelah lunas.
 */
export async function POST(req: Request) {
  let body: { name?: string; whatsapp?: string; email?: string; programSlug?: string; institution?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const whatsapp = (body.whatsapp ?? "").trim();
  const email = (body.email ?? "").trim();
  const programSlug = (body.programSlug ?? "").trim();
  const institution = (body.institution ?? "").trim();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (name.length < 3) return NextResponse.json({ error: "Nama minimal 3 huruf." }, { status: 400 });
  if (!/^0[0-9]{8,13}$/.test(whatsapp)) return NextResponse.json({ error: "Nomor WhatsApp tidak valid (contoh: 081234567890)." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  try {
    const program = await prisma.program.findUnique({ where: { slug: programSlug } });
    if (!program || !program.isActive) {
      return NextResponse.json({ error: "Program tidak ditemukan. (Sudah jalankan `npm run db:seed`?)" }, { status: 404 });
    }

    // Validasi apakah nomor WA atau Email sudah digunakan & lunas / terdaftar di program ini
    const existingReg = await prisma.registration.findFirst({
      where: {
        programId: program.id,
        OR: [
          { whatsapp },
          { email }
        ]
      },
      include: { payment: true }
    });

    if (existingReg) {
      const isPaidOrFree = program.price === 0 || existingReg.status === "PAID" || existingReg.status === "PASSED" || existingReg.payment?.status === "PAID";
      if (isPaidOrFree) {
        const fieldUsed = existingReg.whatsapp === whatsapp ? "Nomor WhatsApp" : "Email";
        const message = program.price === 0
          ? `${fieldUsed} ini sudah terdaftar untuk program ini. Silakan cek WhatsApp/Email Anda.`
          : `${fieldUsed} ini sudah terdaftar dan lunas untuk program ini. Silakan masuk ke menu Member.`;
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // idempoten: daftar dua kali dengan nomor sama = tetap sukses
    const reg = await (prisma.registration as any).upsert({
      where: { whatsapp_programId: { whatsapp, programId: program.id } },
      create: { name, whatsapp, email, institution, programId: program.id },
      update: { name, email, institution },
      include: { payment: true },
    }) as any;

    // ── PROGRAM GRATIS (WEBINAR) ─────────────────────────────────
    if (program.price === 0) {
      await sendWa(
        whatsapp,
        msgWelcome(name, program.title, formatJadwal(program.scheduleAt), program.zoomLink, program.waGroupLink)
      );
      await sendEmail({
        to: email,
        subject: `Pendaftaran Berhasil: ${program.title}`,
        html: getWelcomeEmailHtml(name, program.title, formatJadwal(program.scheduleAt), program.waGroupLink ?? "")
      }).catch((err) => console.error("Gagal mengirim email pendaftaran gratis:", err));

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
        memberUrl: `${baseUrl}/member`,
      }));
      await sendEmail({
        to: email,
        subject: `Pembayaran Berhasil: Akses Pelatihan ${program.title}`,
        html: getPaidEmailHtml(name, program.title, `${baseUrl}/member`, program.zoomLink, program.waGroupLink, program.lmsLink)
      }).catch((err) => console.error("Gagal mengirim email pembayaran dev:", err));

      return NextResponse.json({ ok: true, paid: true, waGroupLink: program.waGroupLink, lmsLink: program.lmsLink });
    }

    const invoice = await createInvoice({
      externalId: `ACADEMY-${reg.id}`,
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

    await sendEmail({
      to: email,
      subject: `Selesaikan Pembayaran Pelatihan: ${program.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; color: #17161a; background: #ffffff;">
          <h2 style="color: #232176; margin-top: 0;">Satu Langkah Lagi! ⏰</h2>
          <p>Halo ${name}, Anda terdaftar pada program <strong>${program.title}</strong>.</p>
          <p>Untuk mengaktifkan akses kelas, silakan selesaikan pembayaran invoice sebesar <strong>${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(program.price)}</strong> di link berikut:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoice.invoice_url}" style="background: #f7941d; color: #ffffff; padding: 12px 24px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Bayar Sekarang</a>
          </div>
          <p>Invoice ini berlaku selama 24 jam. Jika sudah lunas, Anda akan otomatis menerima email konfirmasi link akses kelas.</p>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;"/>
          <p style="font-size: 0.8em; color: #9c99a3; text-align: center;">Jetschool Academy &copy; 2026</p>
        </div>
      `
    }).catch((err) => console.error("Gagal mengirim email invoice:", err));

    return NextResponse.json({ ok: true, invoiceUrl: invoice.invoice_url });
  } catch (err: any) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: `Terjadi kesalahan: ${err?.message || err}` },
      { status: 503 }
    );
  }
}
