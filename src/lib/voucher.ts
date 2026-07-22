import { prisma } from "@/lib/prisma";
import type { Voucher } from "@prisma/client";

export type VoucherApplication = {
  voucher: Voucher;
  discountAmount: number;
  finalAmount: number;
};

/**
 * Validasi kode voucher terhadap harga dasar transaksi. Voucher berlaku
 * global — bisa dipakai untuk checkout program berbayar maupun paket
 * sertifikat webinar. Increment `usedCount` TIDAK dilakukan di sini —
 * caller yang melakukannya di dalam transaksi yang sama dengan pembuatan Payment.
 */
export async function validateVoucher(
  codeInput: string,
  baseAmount: number
): Promise<VoucherApplication | { error: string }> {
  const code = codeInput.trim().toUpperCase();
  if (!code) return { error: "Kode voucher tidak boleh kosong." };

  const voucher = await prisma.voucher.findUnique({ where: { code } });
  if (!voucher || !voucher.isActive) {
    return { error: "Kode voucher tidak valid." };
  }

  const now = new Date();
  if (voucher.validFrom && now < voucher.validFrom) {
    return { error: "Voucher ini belum berlaku." };
  }
  if (voucher.validUntil && now > voucher.validUntil) {
    return { error: "Voucher ini sudah kedaluwarsa." };
  }
  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
    return { error: "Kuota pemakaian voucher ini sudah habis." };
  }

  let discountAmount: number;
  if (voucher.type === "PERCENT") {
    discountAmount = Math.floor((baseAmount * voucher.value) / 100);
    if (voucher.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else {
    discountAmount = voucher.value;
  }
  discountAmount = Math.max(0, Math.min(discountAmount, baseAmount));

  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return { voucher, discountAmount, finalAmount };
}
