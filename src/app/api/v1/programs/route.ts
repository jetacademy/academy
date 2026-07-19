import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/v1/programs — katalog program lengkap untuk integrasi eksternal
 * (mis. Hermes agent marketing). Butuh header `X-API-Key` — key dikelola
 * di /webadmin/integrasi.
 */
export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  const authorized = await verifyApiKey(apiKey);
  if (!authorized) {
    return NextResponse.json(
      { error: "API key tidak valid atau tidak disertakan. Kirim header X-API-Key." },
      { status: 401 }
    );
  }

  const limit = checkRateLimit(`api-v1-programs:${apiKey}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: limit.error }, { status: limit.status });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
    ? process.env.NEXT_PUBLIC_BASE_URL
    : "https://academy.jetschool.id";

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
