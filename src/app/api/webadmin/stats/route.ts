import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

type RevenueByProgram = {
  programId: string;
  programTitle: string;
  programSlug: string;
  revenue: number;
};

type PaidCountByProgram = {
  programId: string;
  programTitle: string;
  programSlug: string;
  count: number;
};

type RevenueByBatch = {
  batchId: string | null;
  batchSchedule: string | null;
  revenue: number;
  count: number;
};

type StatsResponse = {
  totalRevenue: number;
  revenueByProgram: RevenueByProgram[];
  revenueFromVouchers: number;
  revenueNonVoucher: number;
  paidCountByProgram: PaidCountByProgram[];
  avgPerPendaftar: number;
  revenueByBatch: RevenueByBatch[];
};

export async function PATCH(): Promise<NextResponse<StatsResponse | { error: string }>> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.$queryRaw<
      Array<{
        registrationId: string;
        amount: number;
        discountAmount: number;
        voucherId: string | null;
        programId: string;
        programTitle: string;
        programSlug: string;
        batchId: string | null;
        batchSchedule: Date | null;
      }>
    >`
      SELECT
        p.registrationId,
        p.amount,
        p.discountAmount,
        p.voucherId,
        r.programId,
        pr.title AS programTitle,
        pr.slug  AS programSlug,
        r.batchId,
        pb.scheduleAt AS batchSchedule
      FROM payment p
      JOIN registration r  ON r.id  = p.registrationId
      JOIN program pr      ON pr.id = r.programId
      LEFT JOIN programbatch pb ON pb.id = r.batchId
      WHERE p.status = 'PAID'
    `;

    const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);

    const revMap = new Map<string, RevenueByProgram>();
    const countMap = new Map<string, number>();

    for (const r of rows) {
      const existing = revMap.get(r.programId);
      if (existing) {
        existing.revenue += r.amount;
      } else {
        revMap.set(r.programId, {
          programId: r.programId,
          programTitle: r.programTitle,
          programSlug: r.programSlug,
          revenue: r.amount,
        });
      }
      countMap.set(r.programId, (countMap.get(r.programId) ?? 0) + 1);
    }

    const revenueByProgram = Array.from(revMap.values());
    const paidCountByProgram: PaidCountByProgram[] = Array.from(countMap.entries()).map(([programId, count]) => {
      const prog = revMap.get(programId);
      return { programId, programTitle: prog?.programTitle ?? "Unknown", programSlug: prog?.programSlug ?? "", count };
    });

    const revenueFromVouchers = rows.filter((r) => r.voucherId !== null).reduce((sum, r) => sum + r.discountAmount, 0);
    const revenueNonVoucher = rows.filter((r) => r.voucherId === null).reduce((sum, r) => sum + r.amount, 0);
    const uniqueRegistrations = new Set(rows.map((r) => r.registrationId));
    const avgPerPendaftar = uniqueRegistrations.size > 0 ? Math.round(totalRevenue / uniqueRegistrations.size) : 0;

    // ─── Revenue per Batch ──────────────────────────────────
    const batchMap = new Map<string, RevenueByBatch>();
    for (const r of rows) {
      const key = r.batchId ?? "no-batch";
      const existing = batchMap.get(key);
      if (existing) {
        existing.revenue += r.amount;
        existing.count += 1;
      } else {
        batchMap.set(key, {
          batchId: r.batchId,
          batchSchedule: r.batchSchedule ? r.batchSchedule.toISOString() : null,
          revenue: r.amount,
          count: 1,
        });
      }
    }
    const revenueByBatch = Array.from(batchMap.values()).sort((a, b) => {
      if (!a.batchSchedule) return 1;
      if (!b.batchSchedule) return -1;
      return a.batchSchedule.localeCompare(b.batchSchedule);
    });

    return NextResponse.json({
      totalRevenue,
      revenueByProgram,
      revenueFromVouchers,
      revenueNonVoucher,
      paidCountByProgram,
      avgPerPendaftar,
      revenueByBatch,
    });
  } catch (err) {
    console.error("[webadmin stats]", err);
    return NextResponse.json({ error: "Gagal mengambil statistik." }, { status: 500 });
  }
}
