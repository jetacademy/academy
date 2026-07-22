import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWa, msgWelcome, msgAccess, normalizeWa } from "@/lib/wa";
import { createInvoice, isXenditConfigured } from "@/lib/xendit";
import { formatJadwal } from "@/lib/format";
import { sendEmail, getWelcomeEmailHtml, getPaidEmailHtml, getInvoiceEmailHtml } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { createMemberSession } from "@/lib/member-auth";

/**
 * POST /api/register — satu pintu untuk semua tipe program.
 * Dukungan multi-pendaftar (1 group WA/email, banyak peserta via participants[]).
 *
 * - Program GRATIS (webinar): simpan pendaftar → WA sambutan (Zoom + grup).
 * - Program BERBAYAR (kelas/workshop/bootcamp): simpan pendaftar →
 *   buat invoice Xendit → client diarahkan ke halaman pembayaran.
 *   Akses (grup/LMS/Zoom) dikirim via WA oleh webhook setelah lunas.
 */
export async function POST(req: Request) {
  // Rate limit: maks 10 registrasi per IP per 60 detik
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`register:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: limit.error }, { status: limit.status });
  }

  let body: {
    name?: string;
    whatsapp?: string;
    email?: string;
    programSlug?: string;
    institution?: string;
    batchId?: string;
    credential?: string;
    participants?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  const whatsappRaw = (body.whatsapp ?? "").trim();
  const whatsapp = normalizeWa(whatsappRaw);
  const email = (body.email ?? "").trim().toLowerCase();
  const programSlug = (body.programSlug ?? "").trim();
  const institution = (body.institution ?? "").trim().slice(0, 100).replace(/<[^>]*>/g, "");
  const batchIdInput = (body.batchId ?? "").trim();
  const credential = (body.credential ?? "").trim();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (name.length < 3) return NextResponse.json({ error: "Nama minimal 3 huruf." }, { status: 400 });
  if (!/^628[0-9]{8,13}$/.test(whatsapp)) return NextResponse.json({ error: "Nomor WhatsApp tidak valid (contoh: 081234567890)." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  // ── Multi-pendaftar: parse & validasi peserta tambahan ──────────
  const rawParticipants = Array.isArray(body.participants) ? body.participants : [];
  const participants: string[] = [];
  for (const p of rawParticipants) {
    const trimmed = (typeof p === "string" ? p : "").trim().slice(0, 100);
    if (trimmed.length < 3) {
      return NextResponse.json({
        error: "Nama peserta tidak valid. Setiap nama minimal 3 huruf.",
      }, { status: 400 });
    }
    // Cegah duplikasi nama dalam satu group
    if (participants.includes(trimmed) || trimmed === name) {
      return NextResponse.json({
        error: `Nama "${trimmed}" terduplikasi. Nama peserta harus unik dalam satu pendaftaran.`,
      }, { status: 400 });
    }
    participants.push(trimmed);
  }
  const participantCount = 1 + participants.length; // pendaftar utama + tambahan
  if (participantCount > 10) {
    return NextResponse.json({ error: "Maksimal 10 peserta dalam satu pendaftaran." }, { status: 400 });
  }

  // ── [FIX C1] Verifikasi Google credential jika dikirim ──────────
  if (credential) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Login Google belum dikonfigurasi." }, { status: 503 });
    }
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        return NextResponse.json({ error: "Token Google tidak valid." }, { status: 401 });
      }
      const payload = (await res.json()) as {
        aud?: string;
        email?: string;
        email_verified?: string;
        error_description?: string;
      };
      if (payload.error_description) {
        return NextResponse.json({ error: "Sesi Google sudah kedaluwarsa." }, { status: 401 });
      }
      if (payload.aud !== clientId) {
        return NextResponse.json({ error: "Token tidak cocok dengan aplikasi ini." }, { status: 401 });
      }
      if (!payload.email || payload.email.toLowerCase() !== email) {
        return NextResponse.json({ error: "Email tidak cocok dengan akun Google." }, { status: 400 });
      }
      if (payload.email_verified !== "true") {
        return NextResponse.json({ error: "Email Google belum diverifikasi." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Gagal memverifikasi token Google. Coba lagi." }, { status: 503 });
    }
  }

  try {
    const program = await prisma.program.findUnique({ where: { slug: programSlug } });
    if (!program || !program.isActive) {
      // [FIX M2] Hapus petunjuk internal dari pesan error
      return NextResponse.json({ error: "Program tidak ditemukan atau tidak aktif." }, { status: 404 });
    }

    // batchId opsional — kalau dikirim, pastikan benar-benar milik program ini (bukan program lain)
    let batchId: string | null = null;
    if (batchIdInput) {
      const batch = await prisma.programBatch.findFirst({ where: { id: batchIdInput, programId: program.id, isActive: true } });
      if (!batch) return NextResponse.json({ error: "Jadwal batch tidak valid. Silakan pilih ulang." }, { status: 400 });

      // [FIX C5] Validasi seatsLeft batch terhadap total peserta (multi-pendaftar)
      if (batch.seatsLeft !== null && batch.seatsLeft !== undefined) {
        const regCount = await prisma.registration.count({
          where: { batchId: batch.id, programId: program.id },
        });
        if (regCount + participantCount > batch.seatsLeft) {
          const remaining = batch.seatsLeft - regCount;
          return NextResponse.json({
            error: `Maaf, kursus untuk batch ini tidak mencukupi. Sisa kursi: ${remaining}, peserta yang didaftarkan: ${participantCount}.`,
          }, { status: 400 });
        }
      }

      batchId = batch.id;
    }

    // ── EARLY BIRD PRICE: zero-human-company ──────────────────────
    // Harga Rp 225.000 sampai H-4, setelah itu Rp 490.000
    let unitPrice = program.price;
    if (program.slug === "zero-human-company") {
      const EARLY_BIRD_PRICE = 225000;
      const FULL_PRICE = 490000;
      const sessionDate = batchId
        ? (await prisma.programBatch.findUnique({ where: { id: batchId } }))?.scheduleAt ?? program.scheduleAt
        : program.scheduleAt;
      const earlyBirdDeadline = new Date(sessionDate.getTime() - 4 * 24 * 60 * 60 * 1000);
      unitPrice = new Date() <= earlyBirdDeadline ? EARLY_BIRD_PRICE : FULL_PRICE;
    }

    // Total harga = harga per peserta × jumlah peserta
    const totalPrice = unitPrice * participantCount;

    // ── [FIX C2] Validasi duplikasi yang lebih ketat ──
    // Cari registrasi existing dengan kombinasi whatsapp ATAU email
    const existingReg = await prisma.registration.findFirst({
      where: {
        programId: program.id,
        OR: [{ whatsapp }, { email }],
      },
      include: { payment: true },
    });

    if (existingReg) {
      // Kasus 1: WA sama tapi email berbeda → tolak (cegah timpa email)
      if (existingReg.whatsapp === whatsapp && existingReg.email !== email) {
        return NextResponse.json({
          error: "Nomor WhatsApp ini sudah terdaftar dengan email berbeda. Gunakan email yang sama saat pendaftaran awal.",
        }, { status: 400 });
      }

      // Kasus 2: Email sama tapi WA berbeda → tolak (cegah false positive antar user beda)
      if (existingReg.email === email && existingReg.whatsapp !== whatsapp) {
        return NextResponse.json({
          error: "Email ini sudah terdaftar untuk program ini dengan nomor WhatsApp berbeda.",
        }, { status: 400 });
      }

      // Kasus 3: WA+Email sama persis → cek apakah masih boleh daftar ulang
      const isPaidOrFree = program.price === 0 || existingReg.status === "PAID" || existingReg.status === "PASSED" || existingReg.payment?.status === "PAID";
      if (isPaidOrFree) {
        const message = program.price === 0
          ? `Nomor WhatsApp ini sudah terdaftar untuk program ini. Silakan cek WhatsApp/Email Anda.`
          : `Nomor WhatsApp ini sudah terdaftar dan lunas untuk program ini. Silakan masuk ke menu Member.`;
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // 1. Cari atau buat User record untuk menyelaraskan login member
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { whatsapp }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          whatsapp,
          role: "STUDENT"
        }
      });
    }

    // idempoten: daftar dua kali dengan nomor sama = tetap sukses (update data terbaru)
    // Data multi-pendaftar disimpan di field participants (Json array of strings)
    const reg = await prisma.registration.upsert({
      where: { whatsapp_programId: { whatsapp, programId: program.id } },
      create: {
        name, whatsapp, email, institution,
        programId: program.id, userId: user.id, batchId,
        participants: participants.length > 0 ? participants : undefined,
      },
      update: {
        name, email, institution, userId: user.id,
        ...(batchId ? { batchId } : {}),
        ...(participants.length > 0 ? { participants } : {}),
      },
      include: { payment: true },
    });

    // Buat session member secara otomatis setelah pendaftaran berhasil
    await createMemberSession(email);

    // ── PROGRAM GRATIS (WEBINAR) ─────────────────────────────────
    if (program.price === 0) {
      const activeScheduleAt = reg.batchId
        ? (await prisma.programBatch.findUnique({ where: { id: reg.batchId } }))?.scheduleAt ?? program.scheduleAt
        : program.scheduleAt;
      const formattedJadwal = formatJadwal(activeScheduleAt);

      // Gabung semua nama peserta untuk keperluan notifikasi
      const allNames = [name, ...participants];

      await sendWa(
        whatsapp,
        msgWelcome(name, program.title, formattedJadwal, program.zoomLink, program.waGroupLink)
      );

      const pesertaInfo = participantCount > 1
        ? `\n\n📋 Total peserta: ${participantCount} orang (${allNames.join(", ")})`
        : "";

      await sendEmail({
        to: email,
        subject: `Pendaftaran Berhasil: ${program.title}`,
        html: getWelcomeEmailHtml(name, program.title, formattedJadwal, program.waGroupLink ?? "")
          .replace("</div>", `${pesertaInfo}</div>`),
      }).catch((err) => console.error("Gagal mengirim email pendaftaran gratis:", err));

      return NextResponse.json({
        ok: true, paid: false, free: true,
        waGroupLink: program.waGroupLink,
        participantCount,
        participants,
      });
    }

    // ── PROGRAM BERBAYAR ─────────────────────────────────────────
    // sudah lunas sebelumnya → langsung beri akses lagi
    if (reg.status !== "REGISTERED") {
      return NextResponse.json({
        ok: true, paid: true,
        waGroupLink: program.waGroupLink,
        lmsLink: program.lmsLink,
        participantCount,
        participants,
      });
    }

    // invoice pending masih berlaku → pakai ulang
    if (reg.payment?.status === "PENDING" && reg.payment.invoiceUrl) {
      return NextResponse.json({
        ok: true,
        invoiceUrl: reg.payment.invoiceUrl,
        participantCount,
        participants,
      });
    }

    // MODE DEV: bypass Xendit jika env XENDIT_DEV_BYPASS=true
    if (!isXenditConfigured()) {
      console.warn("[register] XENDIT_SECRET_KEY kosong — MODE DEV: pembayaran dianggap lunas.");
      if (process.env.NODE_ENV === "production" && process.env.XENDIT_DEV_BYPASS !== "true") {
        return NextResponse.json({ error: "Pembayaran belum dikonfigurasi. Hubungi admin." }, { status: 503 });
      }
      await prisma.$transaction([
        prisma.payment.upsert({
          where: { registrationId: reg.id },
          create: { registrationId: reg.id, amount: totalPrice, status: "PAID", paidAt: new Date() },
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

      return NextResponse.json({
        ok: true, paid: true,
        waGroupLink: program.waGroupLink,
        lmsLink: program.lmsLink,
        participantCount,
        participants,
      });
    }

    // Deskripsi invoice: cantumkan jumlah peserta
    const pesertaDesc = participantCount > 1
      ? `${program.title} × ${participantCount} peserta (${name} dkk.)`
      : `${program.title} (${name})`;

    const invoice = await createInvoice({
      externalId: `ACADEMY-${reg.id}`,
      amount: totalPrice,
      payerEmail: email,
      description: pesertaDesc,
      successRedirectUrl: `${baseUrl}/member`, // [FIX G5] Redirect ke dashboard, bukan program page
    });

    await prisma.payment.upsert({
      where: { registrationId: reg.id },
      create: { registrationId: reg.id, amount: totalPrice, xenditInvoiceId: invoice.id, invoiceUrl: invoice.invoice_url },
      update: { xenditInvoiceId: invoice.id, invoiceUrl: invoice.invoice_url, status: "PENDING", amount: totalPrice },
    });

    await sendEmail({
      to: email,
      subject: `Selesaikan Pembayaran: ${program.title}`,
      html: getInvoiceEmailHtml({ name, programTitle: program.title, price: totalPrice, invoiceUrl: invoice.invoice_url }),
    }).catch((err) => console.error("Gagal mengirim email invoice:", err));

    return NextResponse.json({
      ok: true,
      invoiceUrl: invoice.invoice_url,
      participantCount,
      participants,
    });
  } catch (err: unknown) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: `Terjadi kesalahan: ${err instanceof Error ? err.message : String(err)}` },
      { status: 503 }
    );
  }
}
