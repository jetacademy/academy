import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(d);
}

async function getArticle(slug: string) {
  return prisma.article.findFirst({ where: { slug, isPublished: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Artikel tidak ditemukan" };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/artikel/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      images: article.coverImageUrl ? [{ url: article.coverImageUrl }] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function ArtikelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImageUrl ?? undefined,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "Jetschool Academy" },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: `${SITE_URL}/artikel/${article.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Artikel", item: `${SITE_URL}/artikel` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${SITE_URL}/artikel/${article.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Navbar minimal ctaHref="/program" ctaLabel="Lihat Program" />

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container" style={{ maxWidth: "44rem" }}>
          <Link href="/artikel" style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--ink-faint)" }}>← Semua Artikel</Link>
          <h1 style={{ fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "1rem 0 .8rem" }}>
            {article.title}
          </h1>
          <p style={{ color: "var(--ink-faint)", fontSize: ".85rem", fontWeight: 600, marginBottom: "1.5rem" }}>
            {article.authorName}{article.publishedAt && ` · ${formatDate(article.publishedAt)}`}
          </p>
        </div>
      </section>

      {article.coverImageUrl && (
        <section className="section" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
          <div className="container" style={{ maxWidth: "44rem" }}>
            <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "var(--r-md)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              <Image src={article.coverImageUrl} alt={article.title} fill style={{ objectFit: "cover" }} priority />
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container" style={{ maxWidth: "44rem" }}>
          <div className="rt-content" style={{ fontSize: "1rem", lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: "44rem" }}>
          <div className="bento bento-purple reveal" style={{ padding: "clamp(1.6rem, 4vw, 2.4rem)", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", marginBottom: ".6rem" }}>Siap tingkatkan skill Anda?</h2>
            <p style={{ fontWeight: 700, opacity: .85, marginBottom: "1.2rem" }}>Jelajahi program pelatihan bersertifikat dari Jetschool Academy.</p>
            <Link href="/program" className="btn btn-lime btn-lg">Lihat Semua Program</Link>
          </div>
        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
