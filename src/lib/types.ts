// ─── Shared TypeScript types for the Jetschool Academy codebase ───
// JSON field types for Prisma models that use Json type

/** A single materi/jp row in the certificate syllabus table */
export interface CertMateriJp {
  materi: string;
  teori: number;
  tugas: number;
}

/** Posisi & skala custom satu elemen sertifikat di live editor — dx/dy adalah pergeseran
 *  sebagai fraksi lebar/tinggi lembar (mis. 0.02 = geser 2% dari lebar sertifikat), bukan px
 *  tetap, supaya proporsional persis sama baik dirender kecil di editor maupun penuh di halaman
 *  publik. scale adalah pengali ukuran seragam (1 = ukuran asli). */
export interface CertLayoutEntry {
  dx: number;
  dy: number;
  scale: number;
}

/** Kunci elemen sertifikat yang bisa digeser/diperbesar di live editor */
export type CertLayout = Record<string, CertLayoutEntry>;

/** Configuration payload stored in Program.certConfig (Json field) */
export interface CertConfig {
  numberFormat?: string;
  description?: string;
  title?: string;
  subtitle?: string;
  placeDate?: string;
  materiJp?: CertMateriJp[];
  /** Posisi & skala custom per elemen, diatur lewat drag/resize di live editor admin */
  layout?: CertLayout;
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
  /** Logo header sertifikat — kosongkan untuk pakai logo bawaan Jetschool Academy */
  logoUrl?: string;
  /** Warna aksen sertifikat (judul, badge nomor, garis bingkai) — hex, mis. "#232176" */
  accentColor?: string;
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
