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

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL ?? "https://academy.jetschool.id"),
  title: {
    default: "Kursus AI Bersertifikat — Jetschool Academy",
    template: "%s — Jetschool Academy",
  },
  description:
    "Kursus AI, webinar gratis, kelas online, workshop, dan bootcamp AI bersertifikat resmi dari praktisi. Daftar 1 menit, semua lewat WhatsApp.",
  keywords: [
    "kursus AI",
    "kursus AI bersertifikat",
    "pelatihan AI",
    "belajar AI",
    "webinar AI gratis",
    "sertifikat AI",
    "kursus kecerdasan buatan",
    "pelatihan AI untuk guru",
    "Jetschool Academy",
  ],
  authors: [{ name: "Jetschool Academy" }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Jetschool Academy",
    title: "Kursus AI Bersertifikat — Jetschool Academy",
    description:
      "Kursus AI, webinar gratis, kelas online, workshop, dan bootcamp AI bersertifikat resmi dari praktisi.",
    images: [{ url: "/hero2.webp", width: 1200, height: 630, alt: "Jetschool Academy — Kursus AI Bersertifikat" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kursus AI Bersertifikat — Jetschool Academy",
    description:
      "Kursus AI, webinar gratis, kelas online, workshop, dan bootcamp AI bersertifikat resmi dari praktisi.",
    images: ["/hero2.webp"],
  },
};

// Tanpa ini, mobile browser merender halaman di lebar virtual desktop (~980px)
// lalu zoom-out paksa — bikin semua halaman terlihat kepotong/berantakan di HP.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Jetschool Academy",
  url: SITE_URL,
  logo: `${SITE_URL}/iconjetschool academy.png`,
  description:
    "Platform kursus dan pelatihan AI bersertifikat — webinar, kelas online, workshop, dan bootcamp dari praktisi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <MetaPixel />
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
