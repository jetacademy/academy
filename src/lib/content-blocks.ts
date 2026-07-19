// Tipe & helper blok konten halaman program. File ini AMAN dipakai di client
// maupun server (tidak ada dependensi Node-only) — sanitasi/validasi server-side
// ada terpisah di webadmin/actions.ts agar dompurify/jsdom tidak ikut ter-bundle ke client.

import { isValidVideoUrl } from "@/lib/video";

export type ContentBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; html: string }
  | { id: string; type: "image"; url: string; caption?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "list"; title?: string; items: string[] }
  | { id: string; type: "stack"; title?: string; items: { label: string; value: number }[] }
  | { id: string; type: "quote"; text: string; author?: string }
  | {
      id: string;
      type: "split";
      leftTitle: string;
      leftItems: { label: string; value: number }[];
      rightTitle: string;
      rightItems: string[];
    };

export type BlockType = ContentBlock["type"];

export const BLOCK_TYPES: BlockType[] = ["heading", "text", "image", "video", "list", "stack", "split", "quote"];

export const BLOCK_TYPE_META: Record<BlockType, { label: string; icon: string; hint: string }> = {
  heading: { label: "Judul Bagian", icon: "🔠", hint: "Judul besar pemisah antar-bagian" },
  text: { label: "Teks", icon: "📝", hint: "Paragraf naskah — bisa tebal/miring/daftar" },
  image: { label: "Gambar", icon: "🖼️", hint: "Foto/ilustrasi dengan keterangan opsional" },
  video: { label: "Video", icon: "🎬", hint: "YouTube, Vimeo, atau Bunny Stream" },
  list: { label: "Daftar Poin", icon: "📋", hint: "Poin singkat, mis. materi yang dipelajari" },
  stack: { label: "Value Stack", icon: "💰", hint: "Rincian nilai/benefit dengan label & harga" },
  split: { label: "2 Kolom (Terima/Pelajari)", icon: "📐", hint: "Value stack & daftar poin berdampingan — persis layout bawaan" },
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
    case "split":
      return { id, type, leftTitle: "Yang Anda Terima", leftItems: [], rightTitle: "Yang Anda Pelajari", rightItems: [] };
  }
}

/** Blok tanpa konten inti akan dirender `null` oleh ProgramContentBlocks — dipakai editor utk tampilkan placeholder. */
export function isBlockEmpty(block: ContentBlock): boolean {
  switch (block.type) {
    case "heading":
      return !block.text.trim();
    case "text":
      return !block.html.trim();
    case "image":
    case "video":
      return !block.url.trim();
    case "list":
    case "stack":
      return block.items.length === 0;
    case "quote":
      return !block.text.trim();
    case "split":
      return block.leftItems.length === 0 && block.rightItems.length === 0;
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
  if (program.materi.length || program.deliverables.length) {
    blocks.push({
      id: createBlockId(),
      type: "split",
      leftTitle: "Yang Anda Terima",
      leftItems: program.deliverables,
      rightTitle: "Yang Anda Pelajari",
      rightItems: program.materi,
    });
  }
  if (program.mentorBio.trim()) {
    blocks.push({ id: createBlockId(), type: "quote", text: program.mentorBio.trim(), author: program.mentorName });
  }
  if (program.guarantee?.trim()) {
    blocks.push({ id: createBlockId(), type: "quote", text: program.guarantee.trim(), author: "Jaminan Resmi" });
  }
  return blocks;
}

/**
 * Satu desain template siap-pakai — titik mulai yang sudah rapi (heading → teks →
 * daftar poin → value stack → gambar → kutipan) yang bisa langsung diedit/dihapus/
 * dikembangkan admin, bukan mulai dari kanvas kosong. Isinya sengaja placeholder
 * jelas "ganti teks ini" supaya tidak keliru dianggap konten final.
 */
export function buildDefaultTemplate(): ContentBlock[] {
  return [
    { id: createBlockId(), type: "heading", text: "Kenapa Ikut Program Ini?" },
    {
      id: createBlockId(),
      type: "text",
      html: "<p>Tulis penjelasan singkat mengapa program ini penting dan masalah apa yang diselesaikan untuk peserta. Ganti teks ini dengan copy Anda sendiri.</p>",
    },
    {
      id: createBlockId(),
      type: "split",
      leftTitle: "Yang Anda Terima",
      leftItems: [
        { label: "Rekaman sesi selamanya", value: 150000 },
        { label: "Akses grup komunitas", value: 0 },
        { label: "Template siap pakai", value: 100000 },
      ],
      rightTitle: "Yang Anda Pelajari",
      rightItems: ["Poin materi pertama", "Poin materi kedua", "Poin materi ketiga"],
    },
    { id: createBlockId(), type: "image", url: "", caption: "Ganti dengan gambar/screenshot produk Anda" },
    { id: createBlockId(), type: "quote", text: "Tulis testimoni peserta atau jaminan resmi di sini.", author: "Nama Peserta / Jaminan Resmi" },
  ];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Tebal dan miring (markdown) jadi strong dan em. Sengaja minimal — cukup utk teks marketing wajar. */
function inlineFormat(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1<em>$2</em>");
}

/**
 * Parser Markdown ringan khusus blok halaman program — dirancang supaya AI agent
 * (mis. Hermes) bisa menulis halaman lengkap dengan sintaks yang sudah familiar,
 * tanpa perlu tahu skema JSON blok yang presisi. Dipakai server-side (API `contentMarkdown`)
 * MAUPUN client-side (tombol "Import dari Markdown" di editor admin) — makanya di file
 * yang aman untuk keduanya.
 *
 * Sintaks yang dikenali (baris demi baris, dipisah baris kosong):
 *   # / ## / ...   → blok heading
 *   ![keterangan](url)  → blok gambar, atau blok video kalau url dikenali (YouTube/Vimeo/Bunny)
 *   > isi kutipan
 *   > — Nama Sumber        (baris terakhir kutipan diawali — atau - jadi nama sumber)
 *   - poin satu
 *   - poin dua             → blok daftar poin
 *   - Label | 150000
 *   - Label lain | 0       → blok value stack (item mengandung "|" → label & nilai)
 *   paragraf biasa         → blok teks (mendukung **tebal** dan *miring*)
 */
export function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ContentBlock[] = [];
  let paragraphBuf: string[] = [];
  let i = 0;

  function flushParagraph() {
    if (paragraphBuf.length) {
      const html = paragraphBuf.map((p) => `<p>${inlineFormat(escapeHtml(p))}</p>`).join("");
      blocks.push({ id: createBlockId(), type: "text", html });
      paragraphBuf = [];
    }
  }

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushParagraph();
      i++;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ id: createBlockId(), type: "heading", text: headingMatch[2].trim() });
      i++;
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      const [, alt, url] = imageMatch;
      const caption = alt.trim() || undefined;
      if (isValidVideoUrl(url.trim())) blocks.push({ id: createBlockId(), type: "video", url: url.trim(), caption });
      else blocks.push({ id: createBlockId(), type: "image", url: url.trim(), caption });
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      let author: string | undefined;
      const last = quoteLines[quoteLines.length - 1];
      const authorMatch = last?.match(/^[-—]\s*(.+)$/);
      if (authorMatch && quoteLines.length > 1) {
        author = authorMatch[1].trim();
        quoteLines.pop();
      }
      const text = quoteLines.join(" ").trim();
      if (text) blocks.push({ id: createBlockId(), type: "quote", text, author });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const itemLines: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        itemLines.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      const isStack = itemLines.length > 0 && itemLines.every((l) => l.includes("|"));
      if (isStack) {
        const items = itemLines.map((l) => {
          const [label, val] = l.split("|").map((s) => s.trim());
          return { label, value: Number(String(val ?? "0").replace(/[^\d.-]/g, "")) || 0 };
        });
        blocks.push({ id: createBlockId(), type: "stack", items });
      } else {
        blocks.push({ id: createBlockId(), type: "list", items: itemLines });
      }
      continue;
    }

    paragraphBuf.push(trimmed);
    i++;
  }
  flushParagraph();

  return blocks;
}
