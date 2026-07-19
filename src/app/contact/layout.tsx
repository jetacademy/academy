import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Hubungi tim Jetschool Academy untuk pertanyaan seputar kursus AI dan pelatihan bersertifikat.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
