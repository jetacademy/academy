import { createHash } from "crypto";

// ============================================================
// Bunny.net Stream — hosting video materi LMS.
// Upload video besar TIDAK lewat server Next.js (body size limit
// server actions kecil) — client upload langsung ke Bunny via TUS
// resumable protocol, diotorisasi pakai tanda tangan sekali-pakai
// yang dibuat di sini. Write API key TIDAK PERNAH dikirim ke client.
// ============================================================

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} belum diatur di .env`);
  return v;
}

/** Daftarkan entri video baru di library Bunny — kembalikan guid-nya. */
export async function createBunnyVideo(title: string): Promise<{ guid: string }> {
  const libraryId = requireEnv("BUNNY_STREAM_LIBRARY_ID");
  const apiKey = requireEnv("BUNNY_STREAM_API_KEY");

  const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gagal membuat video di Bunny (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { guid: string };
  return { guid: data.guid };
}

/** Tanda tangan sekali-pakai untuk upload TUS langsung dari browser ke Bunny. */
export function getBunnyUploadAuth(videoGuid: string, expireSeconds = 3600) {
  const libraryId = requireEnv("BUNNY_STREAM_LIBRARY_ID");
  const apiKey = requireEnv("BUNNY_STREAM_API_KEY");
  const expire = Math.floor(Date.now() / 1000) + expireSeconds;
  const signature = createHash("sha256").update(`${libraryId}${apiKey}${expire}${videoGuid}`).digest("hex");
  return { libraryId, expire, signature };
}

/** URL embed player Bunny — dipakai langsung sebagai src iframe (sama seperti YouTube/Vimeo). */
export function bunnyEmbedUrl(guid: string): string {
  const libraryId = requireEnv("BUNNY_STREAM_LIBRARY_ID");
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`;
}

/** Cek apakah sebuah URL adalah embed Bunny (dipakai LessonFields utk deteksi state awal). */
export function isBunnyEmbedUrl(url: string): boolean {
  return url.includes("iframe.mediadelivery.net/embed/");
}

/** Hapus video di Bunny — dipanggil saat materi video dihapus/diganti. Best-effort, tidak throw. */
export async function deleteBunnyVideo(guid: string): Promise<void> {
  try {
    const libraryId = requireEnv("BUNNY_STREAM_LIBRARY_ID");
    const apiKey = requireEnv("BUNNY_STREAM_API_KEY");
    await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: "DELETE",
      headers: { AccessKey: apiKey },
    });
  } catch (err) {
    console.error("[bunny] Gagal hapus video:", err);
  }
}
