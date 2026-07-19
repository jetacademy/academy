import type { Metadata } from "next";
import { FAQ_DATA } from "./data";

export const metadata: Metadata = {
  title: "FAQ — Pertanyaan Umum Seputar Kursus AI",
  description:
    "Jawaban lengkap seputar kursus AI, sertifikat, pembayaran, dan cara mengikuti pelatihan di Jetschool Academy.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_DATA.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
