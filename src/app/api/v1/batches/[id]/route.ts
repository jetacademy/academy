import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";

/**
 * PATCH /api/v1/batches/[id] — perbarui jadwal/kursi/status aktif sebuah batch.
 * Body JSON: field mana pun dari { scheduleAt, seatsLeft, isActive } — semua opsional.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-batches-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.programBatch.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.scheduleAt === "string") {
    const scheduleAt = new Date(body.scheduleAt);
    if (Number.isNaN(scheduleAt.getTime())) {
      return NextResponse.json({ error: "scheduleAt tidak valid." }, { status: 400 });
    }
    data.scheduleAt = scheduleAt;
  }
  if (body.seatsLeft !== undefined) data.seatsLeft = body.seatsLeft === null ? null : Number(body.seatsLeft) || null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada field valid untuk diperbarui." }, { status: 400 });
  }

  const updated = await prisma.programBatch.update({ where: { id }, data });
  return NextResponse.json({
    ok: true,
    id: updated.id,
    programId: updated.programId,
    scheduleAt: updated.scheduleAt.toISOString(),
    seatsLeft: updated.seatsLeft,
    isActive: updated.isActive,
  });
}

/**
 * DELETE /api/v1/batches/[id] — hapus batch. Registrasi yang sudah terkait
 * tidak ikut terhapus (Registration.batchId di-null-kan, histori tetap ada).
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, { rateLimitKey: "api-v1-batches-write", max: 20, windowMs: 60_000 });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.programBatch.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Batch tidak ditemukan." }, { status: 404 });

  await prisma.programBatch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
