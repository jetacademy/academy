import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";
import { sanitizeContentBlocks } from "@/app/webadmin/actions";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

const PROGRAM_TYPES = ["WEBINAR", "KELAS", "WORKSHOP", "BOOTCAMP"] as const;

/**
 * PATCH /api/v1/programs/[id] — perbarui sebagian field program.
 * Body JSON: field mana pun dari POST /api/v1/programs — semua opsional.
 *
 * contentBlocks: array blok editor halaman — jika diisi (walau array kosong `[]`),
 * MENGGANTIKAN tampilan deskripsi/materi/deliverables/mentor/garansi bawaan di halaman publik.
 * Tiap blok: { id?, type, ...field } — type salah satu dari:
 *   heading  { text }
 *   text     { html }                         (HTML disanitasi server-side)
 *   image    { url, caption? }
 *   video    { url, caption? }                 (YouTube/Vimeo/embed Bunny Stream)
 *   list     { title?, items: string[] }
 *   stack    { title?, items: {label,value}[] }
 *   quote    { text, author? }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-programs-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Program tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.slug === "string" && body.slug.trim()) data.slug = slugify(body.slug);
  if (typeof body.type === "string" && PROGRAM_TYPES.includes(body.type as (typeof PROGRAM_TYPES)[number])) {
    data.type = body.type;
  }
  if (typeof body.mentorName === "string" && body.mentorName.trim()) data.mentorName = body.mentorName.trim();
  if (typeof body.emoji === "string" && body.emoji.trim()) data.emoji = body.emoji.trim();
  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.durationLabel === "string" && body.durationLabel.trim()) data.durationLabel = body.durationLabel.trim();
  if (typeof body.zoomLink === "string") data.zoomLink = body.zoomLink.trim() || null;
  if (typeof body.waGroupLink === "string") data.waGroupLink = body.waGroupLink.trim() || null;
  if (typeof body.lmsLink === "string") data.lmsLink = body.lmsLink.trim() || null;
  if (body.price !== undefined) data.price = Number(body.price) || 0;
  if (body.priceOld !== undefined) data.priceOld = body.priceOld ? Number(body.priceOld) || null : null;
  if (body.certPrice !== undefined) data.certPrice = Number(body.certPrice) || 0;
  if (body.certPriceOld !== undefined) data.certPriceOld = body.certPriceOld ? Number(body.certPriceOld) || null : null;
  if (body.seatsLeft !== undefined) data.seatsLeft = body.seatsLeft === null ? null : Number(body.seatsLeft) || null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;

  if (typeof body.categoryId === "string") data.categoryId = body.categoryId.trim() || null;
  else if (typeof body.categorySlug === "string") {
    const category = await prisma.category.findUnique({ where: { slug: body.categorySlug.trim() } });
    if (!category) return NextResponse.json({ error: `categorySlug "${body.categorySlug}" tidak ditemukan.` }, { status: 400 });
    data.categoryId = category.id;
  }

  if (typeof body.scheduleAt === "string") {
    const scheduleAt = new Date(body.scheduleAt);
    if (Number.isNaN(scheduleAt.getTime())) {
      return NextResponse.json({ error: "scheduleAt tidak valid." }, { status: 400 });
    }
    data.scheduleAt = scheduleAt;
  }

  if (Array.isArray(body.materi)) {
    data.materi = body.materi.map((v) => String(v).trim()).filter(Boolean);
  }
  if (Array.isArray(body.deliverables)) {
    data.deliverables = body.deliverables.map((d) => {
      const item = d as { label?: unknown; value?: unknown };
      return { label: String(item.label ?? "").trim(), value: Number(item.value ?? 0) || 0 };
    });
  }

  if (typeof body.tagline === "string" && body.tagline.trim()) {
    const tagline = body.tagline.trim();
    data.tagline = (await sanitizeHtml(tagline)) ?? tagline;
  }
  if (typeof body.description === "string" && body.description.trim()) {
    const description = body.description.trim();
    data.description = (await sanitizeHtml(description)) ?? description;
  }
  if (typeof body.mentorBio === "string" && body.mentorBio.trim()) {
    const mentorBio = body.mentorBio.trim();
    data.mentorBio = (await sanitizeHtml(mentorBio)) ?? mentorBio;
  }
  if (typeof body.guarantee === "string") {
    const guarantee = body.guarantee.trim();
    data.guarantee = guarantee ? (await sanitizeHtml(guarantee)) ?? guarantee : null;
  }
  if (body.contentBlocks !== undefined) {
    data.contentBlocks = await sanitizeContentBlocks(body.contentBlocks);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada field valid untuk diperbarui." }, { status: 400 });
  }

  try {
    const updated = await prisma.program.update({ where: { id }, data });
    return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug, url: `${SITE_URL}/program/${updated.slug}` });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: `Slug "${data.slug}" sudah dipakai program lain.` }, { status: 409 });
    }
    console.error("[api/v1/programs PATCH]", err);
    return NextResponse.json({ error: "Gagal memperbarui program." }, { status: 500 });
  }
}
