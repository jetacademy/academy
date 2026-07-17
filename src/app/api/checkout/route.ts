import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInvoice, isXenditConfigured } from "@/lib/xendit";

/**
 * POST /api/checkout — buat invoice Xendit untuk paket sertifikat.
 * Peserta diidentifikasi lewat nomor WA yang dipakai saat daftar webinar.
 */
export async function POST(req: Request) {
  let body: { whatsapp?: string; programSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const whatsapp = (body.whatsapp ?? "").trim();
  const programSlug = (body.programSlug ?? "").trim();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const program = await prisma.program.findUnique({ where: { slug: programSlug } });
    if (!program) return NextResponse.json({ error: "Program tidak ditemukan." }, { status: 404 });

    const reg = await prisma.registration.findUnique({
      where: { whatsapp_programId: { whatsapp, programId: program.id } },
      include: { payment: true, certificate: true },
    });
    if (!reg) {
      return NextResponse.json(
        { error: "Nomor WA ini belum terdaftar di program tersebut. Pakai nomor yang sama dengan saat daftar webinar ya." },
        { status: 404 }
      );
    }

    // sudah lulus → langsung ke sertifikat
    if (reg.certificate) {
      return NextResponse.json({ ok: true, postTestUrl: `${baseUrl}/sertifikat/${reg.certificate.number}` });
    }
    // sudah bayar → langsung ke post-test
    if (reg.status === "PAID") {
      return NextResponse.json({ ok: true, postTestUrl: `${baseUrl}/post-test/${reg.id}` });
    }

    // invoice pending yang masih ada → pakai ulang
    if (reg.payment?.status === "PENDING" && reg.payment.invoiceUrl) {
      return NextResponse.json({ ok: true, invoiceUrl: reg.payment.invoiceUrl });
    }

    // MODE DEV tanpa Xendit: langsung tandai lunas supaya alur bisa dites lokal
    if (!isXenditConfigured()) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Pembayaran belum dikonfigurasi. Hubungi admin." }, { status: 503 });
      }
      console.warn("[checkout] XENDIT_SECRET_KEY kosong — MODE DEV: pembayaran dianggap lunas.");
      await prisma.$transaction([
        prisma.payment.upsert({
          where: { registrationId: reg.id },
          create: { registrationId: reg.id, amount: program.certPrice, status: "PAID", paidAt: new Date() },
          update: { status: "PAID", paidAt: new Date() },
        }),
        prisma.registration.update({ where: { id: reg.id }, data: { status: "PAID" } }),
      ]);
      return NextResponse.json({ ok: true, postTestUrl: `${baseUrl}/post-test/${reg.id}` });
    }

    const invoice = await createInvoice({
      externalId: reg.id,
      amount: program.certPrice,
      payerEmail: reg.email,
      description: `Paket Sertifikat — ${program.title} (${reg.name})`,
      successRedirectUrl: `${baseUrl}/post-test/${reg.id}`,
    });

    await prisma.payment.upsert({
      where: { registrationId: reg.id },
      create: {
        registrationId: reg.id,
        amount: program.certPrice,
        xenditInvoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url,
      },
      update: { xenditInvoiceId: invoice.id, invoiceUrl: invoice.invoice_url, status: "PENDING" },
    });

    return NextResponse.json({ ok: true, invoiceUrl: invoice.invoice_url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Gagal menyiapkan pembayaran. Coba lagi atau hubungi admin." }, { status: 500 });
  }
}
