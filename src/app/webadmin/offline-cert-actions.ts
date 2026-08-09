"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendWa, msgCertificate, normalizeWa } from "@/lib/wa";
import { sendEmail, getCertEmailHtml } from "@/lib/email";
import { isCertIssuanceEnabled, issueCertificate } from "@/lib/certificates";
import { slugify } from "@/lib/slug";

/**
 * Buat program "offline" tersembunyi (isActive=false → tidak muncul di katalog publik,
 * tapi sertifikat + halaman verifikasi tetap jalan). Dipanggil dari Step 1 wizard
 * Kirim Sertifikat. Return programId via query param.
 */
export async function createOfflineProgram(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/webadmin/kirim-sertifikat?e=title");

  const slugBase = slugify(title) || "offline";
  let slug = `offline-${slugBase}`;
  // Pastikan slug unik
  let n = 1;
  while (await prisma.program.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `offline-${slugBase}-${n}`;
  }

  const program = await prisma.program.create({
    data: {
      title,
      slug,
      type: "WORKSHOP",
      tagline: "Program offline (tidak dipublikasikan)",
      description: "Program untuk penerbitan sertifikat offline.",
      emoji: "🏅",
      mentorName: "Jetschool Academy",
      mentorBio: "Program offline.",
      materi: [],
      deliverables: [],
      scheduleAt: new Date(),
      durationLabel: "Offline",
      price: 0,
      isActive: false,
    },
  });

  redirect(`/webadmin/kirim-sertifikat?step=desain&programId=${program.id}`);
}

/**
 * Import peserta offline dari Excel → buat registrasi + terbitkan sertifikat.
 * Body: { programId, recipients: [{ name, whatsapp, email }] }
 * Nomor sertifikat otomatis via issueCertificate (per program).
 */
export async function importOfflineRecipients(formData: FormData) {
  await requireAdmin();
  const programId = String(formData.get("programId") ?? "");
  const raw = String(formData.get("recipients") ?? "");

  if (!programId || !raw) redirect("/webadmin/kirim-sertifikat?e=invalid");

  let recipients: { name: string; whatsapp: string; email: string }[] = [];
  try {
    recipients = JSON.parse(raw);
  } catch {
    redirect("/webadmin/kirim-sertifikat?e=invalid");
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    redirect("/webadmin/kirim-sertifikat?e=empty");
  }

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true, title: true },
  });
  if (!program) redirect("/webadmin/kirim-sertifikat?e=program");

  const certEnabled = await isCertIssuanceEnabled();
  if (!certEnabled) redirect("/webadmin/kirim-sertifikat?e=hold");

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const details: string[] = [];

  for (const r of recipients) {
    const name = String(r.name ?? "").trim();
    const whatsapp = normalizeWa(String(r.whatsapp ?? "").trim());
    const email = String(r.email ?? "").trim().toLowerCase();
    if (!name || (!whatsapp && !email)) {
      failed += 1;
      details.push(`${name || "(tanpa nama)"}: data tidak lengkap`);
      continue;
    }

    try {
      // Cek duplikat: WA atau email yang sama di program yang sama
      const existing = await prisma.registration.findFirst({
        where: {
          programId,
          OR: [
            ...(whatsapp ? [{ whatsapp }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
        include: { certificate: true },
      });

      if (existing?.certificate) {
        skipped += 1;
        details.push(`${name}: sudah punya sertifikat`);
        continue;
      }

      let reg = existing;
      if (!reg) {
        reg = await prisma.registration.create({
          data: {
            name,
            whatsapp: whatsapp || email,
            email: email || `${name.replace(/\s+/g, "").toLowerCase()}@offline.local`,
            programId,
            status: "PAID",
          },
          include: { certificate: true },
        });
      } else if (existing && existing.status !== "PAID" && existing.status !== "PASSED") {
        reg = await prisma.registration.update({
          where: { id: existing.id },
          data: { status: "PAID" },
          include: { certificate: true },
        });
      }

      // Terbitkan sertifikat
      const cert = await issueCertificate(reg.id);
      imported += 1;
      details.push(`${name}: ${cert.number}`);
    } catch (err) {
      failed += 1;
      details.push(
        `${name}: ${err instanceof Error ? err.message : "gagal terbitkan"}`,
      );
    }
  }

  revalidatePath("/webadmin/kirim-sertifikat");
  redirect(
    `/webadmin/kirim-sertifikat?ok=1&imported=${imported}&skipped=${skipped}&failed=${failed}`,
  );
}

/**
 * Kirim sertifikat manual via WA atau email.
 * Form: { id: certificateId, via: "wa" | "email" }
 */
export async function sendOfflineCert(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const via = String(formData.get("via") ?? "");
  const back = String(formData.get("back") ?? "/webadmin/kirim-sertifikat");

  if (!id || (via !== "wa" && via !== "email")) {
    redirect(`${back}?e=invalid`);
  }

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      registration: { include: { program: true } },
    },
  });
  if (!cert) redirect(`${back}?e=notfound`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://academy.jetschool.id";
  const certUrl = `${baseUrl}/sertifikat/${cert.number}`;
  const reg = cert.registration;

  try {
    if (via === "wa") {
      const target = normalizeWa(reg.whatsapp);
      const ok = await sendWa(target, msgCertificate(reg.name, cert.number, certUrl));
      if (!ok) redirect(`${back}?e=wafail`);
      await prisma.certificate.update({ where: { id }, data: { sentWaAt: new Date() } });
    } else {
      await sendEmail({
        to: reg.email,
        subject: `e-Sertifikat — ${reg.program.title}`,
        html: getCertEmailHtml(reg.name, reg.program.title, certUrl),
      });
      await prisma.certificate.update({ where: { id }, data: { sentEmailAt: new Date() } });
    }
  } catch (err) {
    console.error("[sendOfflineCert]", err);
    redirect(`${back}?e=sendfail`);
  }

  revalidatePath("/webadmin/kirim-sertifikat");
  redirect(`${back}?ok=1&via=${via}`);
}
