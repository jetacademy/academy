/** Ubah URL video mentah (YouTube/Vimeo) jadi URL embed siap-pakai di iframe. Bunny/URL lain dikembalikan apa adanya (sudah berupa embed URL). */
export function getEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch && ytMatch[2].length === 11) {
    return `https://www.youtube.com/embed/${ytMatch[2]}`;
  }
  const vimeoReg = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoReg);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
}

const YT_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
const VIMEO_RE = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/i;
const BUNNY_RE = /^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9-]+/i;

/** Cek apakah URL video valid: YouTube, Vimeo, atau embed Bunny Stream. */
export function isValidVideoUrl(url: string): boolean {
  return YT_RE.test(url) || VIMEO_RE.test(url) || BUNNY_RE.test(url);
}
