import { prisma } from "@/lib/prisma";
import { FALLBACK_PROGRAMS, type ProgramData, type ProgramType, type Deliverable } from "@/lib/fallback";

/**
 * Ambil program dari MySQL. Jika database belum terhubung / belum di-seed,
 * pakai data contoh supaya website tetap tampil (mode demo).
 */
export async function getPrograms(): Promise<{ programs: ProgramData[]; demo: boolean }> {
  try {
    const rows = await prisma.program.findMany({
      where: { isActive: true },
      orderBy: { scheduleAt: "asc" },
    });
    if (rows.length === 0) return { programs: FALLBACK_PROGRAMS, demo: true };
    return { programs: rows.map(toData), demo: false };
  } catch {
    console.warn("[db] MySQL belum terhubung — menampilkan data contoh.");
    return { programs: FALLBACK_PROGRAMS, demo: true };
  }
}

export async function getProgramBySlug(slug: string): Promise<{ program: ProgramData | null; demo: boolean }> {
  try {
    const row = await prisma.program.findUnique({ where: { slug } });
    if (row) return { program: toData(row), demo: false };
    return { program: FALLBACK_PROGRAMS.find((p) => p.slug === slug) ?? null, demo: true };
  } catch {
    return { program: FALLBACK_PROGRAMS.find((p) => p.slug === slug) ?? null, demo: true };
  }
}

function toData(row: {
  id: string; slug: string; type: string; title: string; tagline: string; description: string;
  emoji: string; mentorName: string; mentorBio: string; materi: unknown; deliverables: unknown;
  guarantee: string | null; scheduleAt: Date; durationLabel: string;
  waGroupLink: string | null; lmsLink: string | null;
  price: number; priceOld: number | null; certPrice: number; certPriceOld: number | null;
  seatsLeft: number | null;
}): ProgramData {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type as ProgramType,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    emoji: row.emoji,
    mentorName: row.mentorName,
    mentorBio: row.mentorBio,
    materi: Array.isArray(row.materi) ? (row.materi as string[]) : [],
    deliverables: Array.isArray(row.deliverables) ? (row.deliverables as Deliverable[]) : [],
    guarantee: row.guarantee,
    scheduleAt: row.scheduleAt,
    durationLabel: row.durationLabel,
    waGroupLink: row.waGroupLink,
    lmsLink: row.lmsLink,
    price: row.price,
    priceOld: row.priceOld,
    certPrice: row.certPrice,
    certPriceOld: row.certPriceOld,
    seatsLeft: row.seatsLeft,
  };
}
