// Tipe & helper blok konten halaman program. File ini AMAN dipakai di client
// maupun server (tidak ada dependensi Node-only) — sanitasi/validasi server-side
// ada terpisah di webadmin/actions.ts agar dompurify/jsdom tidak ikut ter-bundle ke client.

export type ContentBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; html: string }
  | { id: string; type: "image"; url: string; caption?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "list"; title?: string; items: string[] }
  | { id: string; type: "stack"; title?: string; items: { label: string; value: number }[] }
  | { id: string; type: "quote"; text: string; author?: string };

export type BlockType = ContentBlock["type"];

export const BLOCK_TYPES: BlockType[] = ["heading", "text", "image", "video", "list", "stack", "quote"];

export const BLOCK_TYPE_META: Record<BlockType, { label: string; icon: string; hint: string }> = {
  heading: { label: "Judul Bagian", icon: "🔠", hint: "Judul besar pemisah antar-bagian" },
  text: { label: "Teks", icon: "📝", hint: "Paragraf naskah — bisa tebal/miring/daftar" },
  image: { label: "Gambar", icon: "🖼️", hint: "Foto/ilustrasi dengan keterangan opsional" },
  video: { label: "Video", icon: "🎬", hint: "YouTube, Vimeo, atau Bunny Stream" },
  list: { label: "Daftar Poin", icon: "📋", hint: "Poin singkat, mis. materi yang dipelajari" },
  stack: { label: "Value Stack", icon: "💰", hint: "Rincian nilai/benefit dengan label & harga" },
  quote: { label: "Kutipan / Jaminan", icon: "💬", hint: "Kutipan menonjol, mis. profil mentor atau garansi" },
};

export function createBlockId(): string {
  return `blk_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createEmptyBlock(type: BlockType): ContentBlock {
  const id = createBlockId();
  switch (type) {
    case "heading":
      return { id, type, text: "" };
    case "text":
      return { id, type, html: "" };
    case "image":
      return { id, type, url: "", caption: "" };
    case "video":
      return { id, type, url: "", caption: "" };
    case "list":
      return { id, type, title: "", items: [] };
    case "stack":
      return { id, type, title: "", items: [] };
    case "quote":
      return { id, type, text: "", author: "" };
  }
}

function escapeForHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

/** Konversi field lama (description/materi/deliverables/mentorBio/guarantee) jadi blok awal — titik mulai yang enak saat pertama kali buka editor. */
export function buildLegacyBlocks(program: {
  description: string;
  materi: string[];
  deliverables: { label: string; value: number }[];
  mentorName: string;
  mentorBio: string;
  guarantee: string | null;
}): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  if (program.description.trim()) {
    blocks.push({ id: createBlockId(), type: "text", html: `<p>${escapeForHtml(program.description.trim())}</p>` });
  }
  if (program.materi.length) {
    blocks.push({ id: createBlockId(), type: "list", title: "Yang Anda Pelajari", items: program.materi });
  }
  if (program.deliverables.length) {
    blocks.push({ id: createBlockId(), type: "stack", title: "Yang Anda Terima", items: program.deliverables });
  }
  if (program.mentorBio.trim()) {
    blocks.push({ id: createBlockId(), type: "quote", text: program.mentorBio.trim(), author: program.mentorName });
  }
  if (program.guarantee?.trim()) {
    blocks.push({ id: createBlockId(), type: "quote", text: program.guarantee.trim(), author: "Jaminan Resmi" });
  }
  return blocks;
}
