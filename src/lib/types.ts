// ─── Shared TypeScript types for the Jetschool Academy codebase ───
// JSON field types for Prisma models that use Json type

/** Position coordinates on a certificate (percentage-based) */
export interface CertPosition {
  x: number;
  y: number;
}

/** Per-element style override for a certificate element (position + optional typography/transform) */
export interface CertElementStyle extends CertPosition {
  /** Multiplier applied to the element's default clamp() font-size, e.g. 1.25 = 125%. Default 1. */
  fontScale?: number;
  /** CSS font-family stack. Omit/empty to keep the element's built-in default font. */
  fontFamily?: string;
  /** Rotation in degrees applied around the element's center. Default 0. */
  rotation?: number;
  /** Stacking order override. Omit to keep the element's default render order. */
  zIndex?: number;
}

/** All certificate element positions/styles */
export interface CertPositions {
  logo: CertElementStyle;
  title: CertElementStyle;
  subtitle: CertElementStyle;
  number: CertElementStyle;
  recipient: CertElementStyle;
  description: CertElementStyle;
  table: CertElementStyle;
  placeDate: CertElementStyle;
  signatures: CertElementStyle;
}

/** A single materi/jp row in the certificate syllabus table */
export interface CertMateriJp {
  materi: string;
  teori: number;
  tugas: number;
}

/** Configuration payload stored in Program.certConfig (Json field) */
export interface CertConfig {
  numberFormat?: string;
  description?: string;
  title?: string;
  subtitle?: string;
  placeDate?: string;
  materiJp?: CertMateriJp[];
  /** @deprecated Tanda tangan narasumber dihapus dari desain (2026-07) — sertifikat kini hanya
   *  menampilkan satu tanda tangan (Direktur, lihat sign2*). Field lama tetap dibiarkan di tipe
   *  ini supaya data JSON program lama yang masih menyimpannya tidak menyebabkan type error. */
  sign1Name?: string;
  sign1Role?: string;
  sign1Img?: string;
  sign2Name?: string;
  sign2Role?: string;
  sign2Img?: string;
  stampImg?: string;
  /** Warna aksen sertifikat (judul, badge nomor, garis bingkai) — hex, mis. "#232176" */
  accentColor?: string;
  positions?: CertPositions;
}

/** The raw Prisma User model fields needed for auth lookups */
export interface UserLookup {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  role: string;
}

/** Deliverable item in Program.deliverables (Json field) */
export interface DeliverableItem {
  label: string;
  value: number;
}
