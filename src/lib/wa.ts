// ============================================================
// Evolution API — pengiriman pesan WhatsApp otomatis
// Semua pengiriman bersifat best-effort: jika server WA tidak
// tersedia, alur utama (daftar/bayar) tetap berjalan.
// ============================================================

/** 08123... / +62812... / 62812... → 62812... */
export function normalizeWa(raw: string): string {
  let n = raw.replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

export async function sendWa(to: string, text: string): Promise<boolean> {
  const url = process.env.EVOLUTION_API_URL;
  const apikey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  // nilai placeholder dari .env.example dianggap belum dikonfigurasi
  const isPlaceholder = !url || !apikey || !instance || url.includes("domainkamu") || apikey.startsWith("isi_");
  if (isPlaceholder) {
    console.warn("[wa] Evolution API belum dikonfigurasi — pesan dilewati:", text.slice(0, 60));
    return false;
  }

  try {
    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey },
      body: JSON.stringify({ number: normalizeWa(to), text }),
    });
    if (!res.ok) console.error("[wa] gagal kirim:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[wa] error:", err);
    return false;
  }
}

// ---------- Template pesan (jelas, sopan, profesional) ----------

export function msgWelcome(name: string, programTitle: string, schedule: string, zoomLink?: string | null, waGroupLink?: string | null) {
  return [
    `Halo ${name},`,
    ``,
    `Pendaftaran Anda untuk *${programTitle}* telah kami terima.`,
    ``,
    `Jadwal: ${schedule}`,
    zoomLink ? `Tautan Zoom: ${zoomLink}` : null,
    waGroupLink ? `\nSilakan bergabung ke grup peserta untuk informasi, materi, dan pengingat jadwal:\n${waGroupLink}` : null,
    ``,
    `Sampai bertemu di kelas.`,
    ``,
    `Salam,`,
    `Tim Jetschool Academy`,
  ].filter((l) => l !== null).join("\n");
}

export function msgPaid(name: string, programTitle: string, postTestUrl: string) {
  return [
    `Halo ${name},`,
    ``,
    `Pembayaran paket sertifikat *${programTitle}* telah kami terima. Terima kasih.`,
    ``,
    `Langkah terakhir: selesaikan evaluasi singkat melalui tautan berikut. Setelah dinyatakan lulus, e-sertifikat Anda terbit secara otomatis.`,
    postTestUrl,
    ``,
    `Salam,`,
    `Tim Jetschool Academy`,
  ].join("\n");
}

/** Akses program berbayar (kelas/workshop/bootcamp) setelah pembayaran diterima */
export function msgAccess(params: {
  name: string;
  programTitle: string;
  schedule?: string | null;
  zoomLink?: string | null;
  waGroupLink?: string | null;
  lmsLink?: string | null;
  postTestUrl: string;
}) {
  return [
    `Halo ${params.name},`,
    ``,
    `Pembayaran Anda untuk *${params.programTitle}* telah kami terima. Selamat bergabung.`,
    ``,
    `Detail akses Anda:`,
    params.waGroupLink ? `• Grup peserta: ${params.waGroupLink}` : null,
    params.lmsLink ? `• Materi pembelajaran: ${params.lmsLink}` : null,
    params.zoomLink ? `• Tautan Zoom: ${params.zoomLink}` : null,
    params.schedule ? `• Jadwal: ${params.schedule}` : null,
    ``,
    `Setelah menyelesaikan materi, silakan kerjakan evaluasi berikut untuk menerbitkan e-sertifikat Anda:`,
    params.postTestUrl,
    ``,
    `Salam,`,
    `Tim Jetschool Academy`,
  ].filter((l) => l !== null).join("\n");
}

export function msgCertificate(name: string, certNumber: string, certUrl: string) {
  return [
    `Halo ${name},`,
    ``,
    `Selamat — Anda dinyatakan lulus, dan e-sertifikat Anda telah terbit.`,
    ``,
    `Nomor sertifikat: ${certNumber}`,
    `Unduh dan verifikasi: ${certUrl}`,
    ``,
    `Sertifikat ini dapat Anda lampirkan pada CV dan profil LinkedIn.`,
    ``,
    `Salam,`,
    `Tim Jetschool Academy`,
  ].join("\n");
}
