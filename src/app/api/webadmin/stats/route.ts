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

type StatsResponse = {
  totalRevenue: number;
  revenueByProgram: RevenueByProgram[];
  revenueFromVouchers: number;
  revenueNonVoucher: number;
  paidCountByProgram: PaidCountByProgram[];
  avgPerPendaftar: number;
};

/**
 * PATCH /api/webadmin/stats — mengembalikan agregat statistik pembayaran.
 * Hanya bisa diakses oleh admin yang sudah login.
 *
 * Return:
 *  - totalRevenue: total pemasukan dari pembayaran PAID
 *  - revenueByProgram: pemasukan per program
 *  - revenueFromVouchers: total diskon dari voucher
 *  - revenueNonVoucher: pemasukan dari transaksi tanpa voucher
 *  - paidCountByProgram: jumlah peserta lunas per program
 *  - avgPerPendaftar: rata-rata nominal per pendaftar unik
 */
export async function PATCH(): Promise<NextResponse<StatsResponse | { error: string }>> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Gunakan raw query untuk menghindari Prisma intersection type depth issues
    const rows = await prisma.$queryRaw<
      Array<{
        registrationId: string;
        amount: number;
        discountAmount: number;
        voucherId: string | null;
        programId: string;
        programTitle: string;
        programSlug: string;
      }>
    >`
      SELECT
        p.registrationId,
        p.amount,
        p.discountAmount,
        p.voucherId,
        r.programId,
        pr.title AS programTitle,
        pr.slug  AS programSlug
      FROM payment p
      JOIN registration r  ON r.id  = p.registrationId
      JOIN program pr      ON pr.id = r.programId
      WHERE p.status = 'PAID'
    `;

    // ─── 1. Total Revenue ───────────────────────────────────────────
    const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);

    // ─── 2. Revenue by Program & 5. Jumlah Lunas per Program ────────
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
      return {
        programId,
        programTitle: prog?.programTitle ?? "Unknown",
        programSlug: prog?.programSlug ?? "",
        count,
      };
    });

    // ─── 3. Revenue from Vouchers (total diskon dari voucher) ───────
    const revenueFromVouchers = rows
      .filter((r) => r.voucherId !== null)
      .reduce((sum, r) => sum + r.discountAmount, 0);

    // ─── 4. Revenue Non-Voucher (pembayaran tanpa voucher) ──────────
    const revenueNonVoucher = rows
      .filter((r) => r.voucherId === null)
      .reduce((sum, r) => sum + r.amount, 0);

    // ─── 6. Rata-rata per Pendaftar ─────────────────────────────────
    const uniqueRegistrations = new Set(rows.map((r) => r.registrationId));
    const avgPerPendaftar = uniqueRegistrations.size > 0
      ? Math.round(totalRevenue / uniqueRegistrations.size)
      : 0;

    return NextResponse.json({
      totalRevenue,
      revenueByProgram,
      revenueFromVouchers,
      revenueNonVoucher,
      paidCountByProgram,
      avgPerPendaftar,
    });
  } catch (err) {
    console.error("[webadmin stats]", err);
    return NextResponse.json({ error: "Gagal mengambil statistik." }, { status: 500 });
  }
}
