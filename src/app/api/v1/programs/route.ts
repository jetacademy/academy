import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

const PROGRAM_TYPES = ["WEBINAR", "KELAS", "WORKSHOP", "BOOTCAMP"] as const;

/**
 * GET /api/v1/programs — katalog program lengkap untuk integrasi eksternal
 * (mis. Hermes agent marketing). Butuh header `X-API-Key` — key dikelola
 * di /webadmin/integrasi.
 */
export async function GET(req: Request) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-programs", max: 60, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const baseUrl = SITE_URL;

  try {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true, slug: true } },
        batches: {
          where: { isActive: true, scheduleAt: { gte: new Date() } },
          orderBy: { scheduleAt: "asc" },
          select: { id: true, scheduleAt: true, seatsLeft: true },
        },
      },
      orderBy: { scheduleAt: "asc" },
    });

    const payload = programs.map((p) => ({
      slug: p.slug,
      url: `${baseUrl}/program/${p.slug}`,
      type: p.type,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      mentorName: p.mentorName,
      mentorBio: p.mentorBio,
      materi: p.materi,
      deliverables: p.deliverables,
      durationLabel: p.durationLabel,
      isFree: p.price === 0,
      price: p.price,
      priceOld: p.priceOld,
      certPrice: p.certPrice,
      certPriceOld: p.certPriceOld,
      category: p.category?.name ?? null,
      nextSchedule: (p.batches[0]?.scheduleAt ?? p.scheduleAt).toISOString(),
      upcomingBatches: p.batches.map((b) => ({
        id: b.id,
        scheduleAt: b.scheduleAt.toISOString(),
        seatsLeft: b.seatsLeft,
      })),
      seatsLeft: p.seatsLeft,
      isFeatured: p.isFeatured,
    }));

    return NextResponse.json({ ok: true, count: payload.length, programs: payload });
  } catch (err) {
    console.error("[api/v1/programs]", err);
    return NextResponse.json({ error: "Gagal mengambil data program." }, { status: 503 });
  }
}

/**
 * POST /api/v1/programs — buat program baru.
 * Body JSON wajib: { title, type, tagline, description, mentorName, mentorBio, scheduleAt }
 * Opsional: slug, emoji, imageUrl, materi (string[]), deliverables ({label,value}[]), guarantee,
 * durationLabel, zoomLink, waGroupLink, lmsLink, price, priceOld, certPrice, certPriceOld,
 * seatsLeft, isActive, isFeatured, categoryId, categorySlug.
 */
export async function POST(req: Request) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-programs-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const tagline = String(body.tagline ?? "").trim();
  const description = String(body.description ?? "").trim();
  const mentorName = String(body.mentorName ?? "").trim();
  const mentorBio = String(body.mentorBio ?? "").trim();
  const scheduleAt = new Date(String(body.scheduleAt ?? ""));

  if (!title || !tagline || !description || !mentorName || !mentorBio) {
    return NextResponse.json(
      { error: "Field title, tagline, description, mentorName, dan mentorBio wajib diisi." },
      { status: 400 }
    );
  }
  if (Number.isNaN(scheduleAt.getTime())) {
    return NextResponse.json({ error: "scheduleAt wajib diisi berupa tanggal ISO valid." }, { status: 400 });
  }

  const type = PROGRAM_TYPES.includes(String(body.type) as (typeof PROGRAM_TYPES)[number])
    ? (String(body.type) as (typeof PROGRAM_TYPES)[number])
    : "WEBINAR";

  const slug = body.slug ? slugify(String(body.slug)) : slugify(title);
  if (!slug) {
    return NextResponse.json({ error: "Gagal membuat slug dari title. Sertakan slug manual." }, { status: 400 });
  }

  let categoryId: string | null = body.categoryId ? String(body.categoryId).trim() : null;
  if (!categoryId && body.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: String(body.categorySlug).trim() } });
    if (!category) return NextResponse.json({ error: `categorySlug "${body.categorySlug}" tidak ditemukan.` }, { status: 400 });
    categoryId = category.id;
  }

  const materi = Array.isArray(body.materi) ? body.materi.map((v) => String(v).trim()).filter(Boolean) : [];
  const deliverables = Array.isArray(body.deliverables)
    ? body.deliverables.map((d) => {
        const item = d as { label?: unknown; value?: unknown };
        return { label: String(item.label ?? "").trim(), value: Number(item.value ?? 0) || 0 };
      })
    : [];

  const guaranteeRaw = body.guarantee ? String(body.guarantee).trim() : "";

  try {
    const program = await prisma.program.create({
      data: {
        slug,
        type,
        title,
        tagline: (await sanitizeHtml(tagline)) ?? tagline,
        description: (await sanitizeHtml(description)) ?? description,
        emoji: body.emoji ? String(body.emoji).trim() || "🎓" : "🎓",
        imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
        mentorName,
        mentorBio: (await sanitizeHtml(mentorBio)) ?? mentorBio,
        materi,
        deliverables,
        guarantee: guaranteeRaw ? (await sanitizeHtml(guaranteeRaw)) ?? guaranteeRaw : null,
        scheduleAt,
        durationLabel: body.durationLabel ? String(body.durationLabel).trim() : "2 jam",
        zoomLink: body.zoomLink ? String(body.zoomLink).trim() : null,
        waGroupLink: body.waGroupLink ? String(body.waGroupLink).trim() : null,
        lmsLink: body.lmsLink ? String(body.lmsLink).trim() : null,
        price: Number(body.price ?? 0) || 0,
        priceOld: body.priceOld ? Number(body.priceOld) || null : null,
        certPrice: body.certPrice !== undefined ? Number(body.certPrice) || 0 : 49000,
        certPriceOld: body.certPriceOld ? Number(body.certPriceOld) || null : null,
        seatsLeft: body.seatsLeft !== undefined && body.seatsLeft !== null ? Number(body.seatsLeft) || null : null,
        isActive: body.isActive !== false,
        isFeatured: body.isFeatured === true,
        categoryId,
      },
    });
    return NextResponse.json(
      { ok: true, id: program.id, slug: program.slug, url: `${SITE_URL}/program/${program.slug}` },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: `Slug "${slug}" sudah dipakai program lain.` }, { status: 409 });
    }
    console.error("[api/v1/programs POST]", err);
    return NextResponse.json({ error: "Gagal membuat program." }, { status: 500 });
  }
}
