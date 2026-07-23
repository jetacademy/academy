"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import { getAffiliateBalance, getAffiliateSettings, normalizeCustomCode } from "@/lib/affiliate";
import type { Affiliate } from "@prisma/client";

/** Ambil affiliate milik member yang sedang login (via cookie session email/WA), atau null. */
export async function getMyAffiliate(): Promise<Affiliate | null> {
  const sessionVal = await getMemberSession();
  if (!sessionVal) return null;
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: sessionVal }, { whatsapp: sessionVal }] },
  });
  if (!user) return null;
  return prisma.affiliate.findUnique({ where: { userId: user.id } });
}

function optStr(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length > 0 ? v : null;
}

// ─── Respons undangan ────────────────────────────────────────────────

export async function respondToAffiliateInvite(formData: FormData): Promise<void> {
  const affiliate = await getMyAffiliate();
  if (!affiliate || affiliate.status !== "PENDING") redirect("/member/affiliate");

  const decision = String(formData.get("decision") ?? "");
  if (decision === "accept") {
    await prisma.affiliate.update({ where: { id: affiliate.id }, data: { status: "ACTIVE", respondedAt: new Date() } });
  } else if (decision === "decline") {
    await prisma.affiliate.update({ where: { id: affiliate.id }, data: { status: "REJECTED", respondedAt: new Date() } });
  }
  revalidatePath("/member/affiliate");
  revalidatePath("/member");
  redirect("/member/affiliate");
}

// ─── Kode referral custom ─────────────────────────────────────────────

export async function updateMyAffiliateCode(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const affiliate = await getMyAffiliate();
  if (!affiliate || affiliate.status !== "ACTIVE") return { error: "Affiliate tidak ditemukan atau belum aktif." };

  const code = normalizeCustomCode(String(formData.get("code") ?? ""));
  if (code.length < 3) return { error: "Kode minimal 3 karakter (huruf/angka/tanda hubung)." };

  try {
    await prisma.affiliate.update({ where: { id: affiliate.id }, data: { code } });
  } catch {
    return { error: "Kode ini sudah dipakai affiliate lain. Coba kode lain." };
  }
  revalidatePath("/member/affiliate");
  return { ok: true };
}

// ─── Info rekening/e-wallet untuk penarikan ───────────────────────────

export async function updateMyPayoutInfo(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const affiliate = await getMyAffiliate();
  if (!affiliate || affiliate.status !== "ACTIVE") return { error: "Affiliate tidak ditemukan atau belum aktif." };

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: {
      bankName: optStr(formData, "bankName"),
      bankAccountNumber: optStr(formData, "bankAccountNumber"),
      bankAccountName: optStr(formData, "bankAccountName"),
      ewalletChannel: optStr(formData, "ewalletChannel"),
      ewalletNumber: optStr(formData, "ewalletNumber"),
    },
  });
  revalidatePath("/member/affiliate");
  return { ok: true };
}

// ─── Pengajuan Penarikan ───────────────────────────────────────────────

export async function requestWithdrawal(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const affiliate = await getMyAffiliate();
  if (!affiliate || affiliate.status !== "ACTIVE") return { error: "Affiliate tidak ditemukan atau belum aktif." };

  const amount = Number(String(formData.get("amount") ?? "0").replace(/[^\d]/g, "")) || 0;
  const channelCode = String(formData.get("channelCode") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountHolderName = String(formData.get("accountHolderName") ?? "").trim();

  if (!channelCode || !accountNumber || !accountHolderName) {
    return { error: "Lengkapi tujuan pencairan (bank/e-wallet, nomor rekening, dan nama pemilik)." };
  }

  const settings = await getAffiliateSettings();
  if (amount < settings.minWithdrawal) {
    return { error: `Minimal sekali penarikan adalah Rp ${settings.minWithdrawal.toLocaleString("id-ID")}.` };
  }

  const balance = await getAffiliateBalance(affiliate.id);
  if (amount > balance.withdrawableNow) {
    return { error: `Saldo yang bisa ditarik hanya Rp ${balance.withdrawableNow.toLocaleString("id-ID")}.` };
  }

  // Ada pengajuan lain yang masih berjalan? Cegah pengajuan tumpuk tak terkendali.
  const activeCount = await prisma.affiliateWithdrawal.count({
    where: { affiliateId: affiliate.id, status: { in: ["REQUESTED", "PROCESSING"] } },
  });
  if (activeCount > 0) {
    return { error: "Anda masih punya pengajuan penarikan yang sedang diproses. Tunggu sampai selesai sebelum mengajukan lagi." };
  }

  await prisma.affiliateWithdrawal.create({
    data: { affiliateId: affiliate.id, amount, channelCode, accountNumber, accountHolderName },
  });

  revalidatePath("/member/affiliate");
  return { ok: true };
}

// ─── Tiket Dukungan (bisa dipakai user biasa maupun affiliate) ─────────

export async function createTicket(formData: FormData): Promise<{ ok?: true; ticketId?: string; error?: string }> {
  const sessionVal = await getMemberSession();
  if (!sessionVal) return { error: "Sesi tidak valid. Silakan login ulang." };

  const user = await prisma.user.findFirst({ where: { OR: [{ email: sessionVal }, { whatsapp: sessionVal }] } });
  if (!user) return { error: "Akun tidak ditemukan." };

  const subject = String(formData.get("subject") ?? "").trim().slice(0, 150);
  const category = String(formData.get("category") ?? "LAINNYA") as "KOMISI" | "PENARIKAN" | "AKUN" | "TEKNIS" | "LAINNYA";
  const message = String(formData.get("message") ?? "").trim();
  if (!subject || !message) return { error: "Subjek dan pesan wajib diisi." };

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });

  const ticket = await prisma.ticket.create({
    data: {
      affiliateId: affiliate?.id ?? null,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      subject,
      category,
      messages: { create: { senderRole: "USER", senderName: user.name, message } },
    },
  });

  revalidatePath("/member/affiliate/tiket");
  return { ok: true, ticketId: ticket.id };
}

export async function replyTicketAsUser(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const sessionVal = await getMemberSession();
  if (!sessionVal) return { error: "Sesi tidak valid." };

  const ticketId = String(formData.get("ticketId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Pesan tidak boleh kosong." };

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.email !== sessionVal) return { error: "Tiket tidak ditemukan." };

  await prisma.ticketMessage.create({
    data: { ticketId, senderRole: "USER", senderName: ticket.name, message },
  });
  revalidatePath(`/member/affiliate/tiket/${ticketId}`);
  return { ok: true };
}
