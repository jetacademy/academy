import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

/**
 * PATCH /api/v1/articles/[id] — perbarui sebagian field artikel.
 * Body JSON: field mana pun dari { title, excerpt, content, slug, coverImageUrl, authorName, isPublished } — semua opsional.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-articles-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.excerpt === "string" && body.excerpt.trim()) data.excerpt = body.excerpt.trim();
  if (typeof body.authorName === "string" && body.authorName.trim()) data.authorName = body.authorName.trim();
  if (typeof body.coverImageUrl === "string") data.coverImageUrl = body.coverImageUrl.trim() || null;
  if (typeof body.slug === "string" && body.slug.trim()) data.slug = slugify(body.slug);

  if (typeof body.content === "string" && body.content.trim()) {
    const content = await sanitizeHtml(body.content.trim());
    if (!content) return NextResponse.json({ error: "Content tidak valid/kosong setelah sanitasi." }, { status: 400 });
    data.content = content;
  }

  if (typeof body.isPublished === "boolean") {
    data.isPublished = body.isPublished;
    if (body.isPublished && !existing.publishedAt) data.publishedAt = new Date();
    if (!body.isPublished) data.publishedAt = existing.publishedAt; // biarkan riwayat tanggal terbit lama
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada field valid untuk diperbarui." }, { status: 400 });
  }

  try {
    const updated = await prisma.article.update({ where: { id }, data });
    return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug, url: `${SITE_URL}/artikel/${updated.slug}` });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: `Slug "${data.slug}" sudah dipakai artikel lain.` }, { status: 409 });
    }
    console.error("[api/v1/articles PATCH]", err);
    return NextResponse.json({ error: "Gagal memperbarui artikel." }, { status: 500 });
  }
}

/** DELETE /api/v1/articles/[id] — hapus artikel permanen. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-articles-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 });

  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
