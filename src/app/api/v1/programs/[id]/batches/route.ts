import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";

/**
 * POST /api/v1/programs/[id]/batches — buat batch jadwal baru untuk sebuah program.
 * Body JSON wajib: { scheduleAt }. Opsional: { seatsLeft, isActive }.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-batches-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const { id: programId } = await params;
  const program = await prisma.program.findUnique({ where: { id: programId }, select: { id: true, slug: true } });
  if (!program) return NextResponse.json({ error: "Program tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  const scheduleAt = new Date(String(body.scheduleAt ?? ""));
  if (Number.isNaN(scheduleAt.getTime())) {
    return NextResponse.json({ error: "scheduleAt wajib diisi berupa tanggal ISO valid." }, { status: 400 });
  }

  const batch = await prisma.programBatch.create({
    data: {
      programId,
      scheduleAt,
      seatsLeft: body.seatsLeft !== undefined && body.seatsLeft !== null ? Number(body.seatsLeft) || null : null,
      isActive: body.isActive !== false,
    },
  });

  return NextResponse.json(
    { ok: true, id: batch.id, programId: batch.programId, programSlug: program.slug, scheduleAt: batch.scheduleAt.toISOString() },
    { status: 201 }
  );
}
