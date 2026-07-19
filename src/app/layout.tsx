import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import ScrollReveal from "@/components/ScrollReveal";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Jetschool Academy — Belajar Skill, Pulang Bawa Sertifikat",
  description:
    "Webinar gratis, kelas online, workshop, dan bootcamp bersertifikat resmi. Daftar 1 menit, semua lewat WhatsApp.",
};

// Tanpa ini, mobile browser merender halaman di lebar virtual desktop (~980px)
// lalu zoom-out paksa — bikin semua halaman terlihat kepotong/berantakan di HP.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <MetaPixel />
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
