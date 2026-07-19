import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

/** GET /api/v1/articles — daftar semua artikel (termasuk draf) utk integrasi eksternal. */
export async function GET(req: Request) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-articles-get", max: 60, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    ok: true,
    count: articles.length,
    articles: articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      url: `${SITE_URL}/artikel/${a.slug}`,
      title: a.title,
      excerpt: a.excerpt,
      coverImageUrl: a.coverImageUrl,
      authorName: a.authorName,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
}

/**
 * POST /api/v1/articles — buat artikel baru.
 * Body JSON: { title, excerpt, content (HTML), slug?, coverImageUrl?, authorName?, isPublished? }
 */
export async function POST(req: Request) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-articles-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const excerpt = String(body.excerpt ?? "").trim();
  const contentRaw = String(body.content ?? "").trim();
  const coverImageUrl = body.coverImageUrl ? String(body.coverImageUrl).trim() : null;
  const authorName = body.authorName ? String(body.authorName).trim() : "Tim Jetschool Academy";
  const isPublished = body.isPublished === true;

  if (!title || !excerpt || !contentRaw) {
    return NextResponse.json({ error: "Field title, excerpt, dan content wajib diisi." }, { status: 400 });
  }

  const content = await sanitizeHtml(contentRaw);
  if (!content) {
    return NextResponse.json({ error: "Content tidak valid/kosong setelah sanitasi." }, { status: 400 });
  }

  const slug = body.slug ? slugify(String(body.slug)) : slugify(title);
  if (!slug) {
    return NextResponse.json({ error: "Gagal membuat slug dari title. Sertakan slug manual." }, { status: 400 });
  }

  try {
    const article = await prisma.article.create({
      data: {
        title, slug, excerpt, content, coverImageUrl, authorName, isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
    return NextResponse.json(
      { ok: true, id: article.id, slug: article.slug, url: `${SITE_URL}/artikel/${article.slug}` },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: `Slug "${slug}" sudah dipakai artikel lain.` }, { status: 409 });
    }
    console.error("[api/v1/articles POST]", err);
    return NextResponse.json({ error: "Gagal membuat artikel." }, { status: 500 });
  }
}
