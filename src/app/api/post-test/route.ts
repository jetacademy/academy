import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWa, msgCertificate } from "@/lib/wa";
import { sendEmail, getCertEmailHtml } from "@/lib/email";

/**
 * POST /api/post-test — nilai jawaban, dan jika lulus terbitkan sertifikat otomatis.
 * Kunci jawaban hanya ada di server; skor dihitung di sini.
 */
export async function POST(req: Request) {
  let body: { registrationId?: string; answers?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const registrationId = body.registrationId ?? "";
  const answers = body.answers ?? {};
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        program: { include: { questions: true } },
        certificate: true,
      },
    });
    if (!reg) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });

    // sudah punya sertifikat → kembalikan yang ada
    if (reg.certificate) {
      return NextResponse.json({
        passed: true,
        score: 100,
        certUrl: `${baseUrl}/sertifikat/${reg.certificate.number}`,
      });
    }

    if (reg.status !== "PAID") {
      return NextResponse.json({ error: "Selesaikan pembayaran dulu sebelum mengerjakan post-test." }, { status: 403 });
    }

    const questions = reg.program.questions;
    if (questions.length === 0) {
      return NextResponse.json({ error: "Soal belum tersedia. Hubungi admin." }, { status: 400 });
    }

    const correctCount = questions.filter((q) => answers[q.id] === q.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= reg.program.passingScore;

    await prisma.testAttempt.create({
      data: { registrationId: reg.id, score, passed },
    });

    if (!passed) {
      return NextResponse.json({ passed: false, score });
    }

    // LULUS → terbitkan sertifikat bernomor urut: JSA-<tahun>-<serial 4 digit>
    const year = new Date().getFullYear();
    const cert = await prisma.$transaction(async (tx) => {
      const created = await tx.certificate.create({
        data: { registrationId: reg.id, number: `TMP-${reg.id}` },
      });
      const number = `JSA-${year}-${String(created.serial).padStart(4, "0")}`;
      await tx.registration.update({ where: { id: reg.id }, data: { status: "PASSED" } });
      return tx.certificate.update({ where: { id: created.id }, data: { number } });
    });

    const certUrl = `${baseUrl}/sertifikat/${cert.number}`;

    // kirim link sertifikat via WA — best-effort
    await sendWa(reg.whatsapp, msgCertificate(reg.name, cert.number, certUrl));

    // kirim link sertifikat via Email — best-effort
    await sendEmail({
      to: reg.email,
      subject: `Selamat! Sertifikat Resmi Anda Telah Terbit - ${reg.program.title}`,
      html: getCertEmailHtml(reg.name, reg.program.title, certUrl),
    }).catch((err) => console.error("Gagal mengirim email sertifikat:", err));

    return NextResponse.json({ passed: true, score, certUrl });
  } catch (err) {
    console.error("[post-test]", err);
    return NextResponse.json({ error: "Gagal memproses jawaban. Coba lagi ya." }, { status: 500 });
  }
}
