"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, createAdminSession, destroyAdminSession } from "@/lib/admin-auth";
import { sendWa, msgAccess, msgPaid } from "@/lib/wa";
import { formatJadwal } from "@/lib/format";

// ─── Auth ────────────────────────────────────────────────────────

export async function adminLogin(formData: FormData) {
  const ok = await createAdminSession(String(formData.get("password") ?? ""));
  if (!ok) redirect("/webadmin/login?e=1");
  redirect("/webadmin");
}

export async function adminLogout() {
  await destroyAdminSession();
  redirect("/webadmin/login");
}

// ─── Program ─────────────────────────────────────────────────────

/** textarea "satu per baris" → array string */
function parseLines(v: string): string[] {
  return v.split("\n").map((s) => s.trim()).filter(Boolean);
}

/** textarea "Label | 99000" per baris → array { label, value } */
function parseDeliverables(v: string): { label: string; value: number }[] {
  return parseLines(v).map((line) => {
    const [label, val] = line.split("|").map((s) => s.trim());
    return { label, value: Number(val ?? 0) || 0 };
  });
}

function num(formData: FormData, key: string): number {
  return Number(String(formData.get(key) ?? "0").replace(/[^\d]/g, "")) || 0;
}

function optStr(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length > 0 ? v : null;
}

export async function saveProgram(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const data = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    type: String(formData.get("type") ?? "WEBINAR") as "WEBINAR" | "KELAS" | "WORKSHOP" | "BOOTCAMP",
    title: String(formData.get("title") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    emoji: String(formData.get("emoji") ?? "🎓").trim() || "🎓",
    mentorName: String(formData.get("mentorName") ?? "").trim(),
    mentorBio: String(formData.get("mentorBio") ?? "").trim(),
    materi: parseLines(String(formData.get("materi") ?? "")),
    deliverables: parseDeliverables(String(formData.get("deliverables") ?? "")),
    guarantee: optStr(formData, "guarantee"),
    scheduleAt: new Date(String(formData.get("scheduleAt"))),
    durationLabel: String(formData.get("durationLabel") ?? "2 jam").trim(),
    zoomLink: optStr(formData, "zoomLink"),
    waGroupLink: optStr(formData, "waGroupLink"),
    lmsLink: optStr(formData, "lmsLink"),
    price: num(formData, "price"),
    priceOld: num(formData, "priceOld") || null,
    certPrice: num(formData, "certPrice"),
    certPriceOld: num(formData, "certPriceOld") || null,
    seatsLeft: num(formData, "seatsLeft") || null,
    passingScore: num(formData, "passingScore") || 60,
    isActive: formData.get("isActive") === "on",
  };

  if (!data.slug || !data.title) redirect("/webadmin/program?e=lengkapi");

  if (id) {
    await prisma.program.update({ where: { id }, data });
  } else {
    await prisma.program.create({ data });
  }
  revalidatePath("/");
  revalidatePath("/webadmin/program");
  redirect("/webadmin/program?ok=1");
}

export async function toggleProgram(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const cur = await prisma.program.findUnique({ where: { id } });
  if (cur) await prisma.program.update({ where: { id }, data: { isActive: !cur.isActive } });
  revalidatePath("/webadmin/program");
  revalidatePath("/");
}

export async function deleteProgram(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const regCount = await prisma.registration.count({ where: { programId: id } });
  if (regCount > 0) {
    // ada pendaftar → jangan hapus data, cukup nonaktifkan
    await prisma.program.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.question.deleteMany({ where: { programId: id } });
    await prisma.program.delete({ where: { id } });
  }
  revalidatePath("/webadmin/program");
  revalidatePath("/");
}

// ─── Soal ────────────────────────────────────────────────────────

export async function saveQuestion(formData: FormData) {
  await requireAdmin();
  const id = optStr(formData, "id");
  const programId = String(formData.get("programId"));
  const data = {
    text: String(formData.get("text") ?? "").trim(),
    optionA: String(formData.get("optionA") ?? "").trim(),
    optionB: String(formData.get("optionB") ?? "").trim(),
    optionC: String(formData.get("optionC") ?? "").trim(),
    optionD: String(formData.get("optionD") ?? "").trim(),
    correct: String(formData.get("correct") ?? "A"),
    order: num(formData, "order"),
  };
  if (!data.text) return;

  if (id) {
    await prisma.question.update({ where: { id }, data });
  } else {
    await prisma.question.create({ data: { ...data, programId } });
  }
  revalidatePath(`/webadmin/program/${programId}/soal`);
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  await prisma.question.delete({ where: { id } });
  revalidatePath(`/webadmin/program/${programId}/soal`);
}

// ─── Pendaftar ───────────────────────────────────────────────────

/** Tandai lunas manual (mis. transfer langsung) + kirim WA akses */
export async function markPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const reg = await prisma.registration.findUnique({ where: { id }, include: { program: true, payment: true } });
  if (!reg || reg.status !== "REGISTERED") return;

  const amount = reg.program.price > 0 ? reg.program.price : reg.program.certPrice;
  await prisma.$transaction([
    prisma.payment.upsert({
      where: { registrationId: reg.id },
      create: { registrationId: reg.id, amount, status: "PAID", paidAt: new Date() },
      update: { status: "PAID", paidAt: new Date() },
    }),
    prisma.registration.update({ where: { id: reg.id }, data: { status: "PAID" } }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const postTestUrl = `${baseUrl}/post-test/${reg.id}`;
  if (reg.program.price > 0) {
    await sendWa(reg.whatsapp, msgAccess({
      name: reg.name,
      programTitle: reg.program.title,
      schedule: formatJadwal(reg.program.scheduleAt),
      zoomLink: reg.program.zoomLink,
      waGroupLink: reg.program.waGroupLink,
      lmsLink: reg.program.lmsLink,
      postTestUrl,
    }));
  } else {
    await sendWa(reg.whatsapp, msgPaid(reg.name, reg.program.title, postTestUrl));
  }
  revalidatePath("/webadmin/pendaftar");
  revalidatePath("/webadmin");
}

export async function deleteRegistration(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.certificate.deleteMany({ where: { registrationId: id } });
  await prisma.testAttempt.deleteMany({ where: { registrationId: id } });
  await prisma.payment.deleteMany({ where: { registrationId: id } });
  await prisma.registration.delete({ where: { id } }).catch(() => {});
  revalidatePath("/webadmin/pendaftar");
  revalidatePath("/webadmin");
}
