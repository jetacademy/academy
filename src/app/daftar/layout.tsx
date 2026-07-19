import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun — Mulai Belajar AI Bersertifikat",
  description:
    "Buat akun Jetschool Academy dan mulai ikuti kursus AI bersertifikat, webinar gratis, dan pelatihan lainnya.",
  alternates: { canonical: "/daftar" },
};

export default function DaftarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
