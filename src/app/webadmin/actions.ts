"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, createAdminSession, destroyAdminSession } from "@/lib/admin-auth";
import { hashPassword, generateApiKey } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendWa, msgAccess, msgPaid, normalizeWa } from "@/lib/wa";
import { formatJadwal } from "@/lib/format";
import { sendEmail, getPaidEmailHtml } from "@/lib/email";

// ─── Auth ────────────────────────────────────────────────────────

export async function adminLogin(formData: FormData) {
  const { headers } = await import("next/headers");
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "admin-login";
  const limit = checkRateLimit(`admin-login:${ip}`, 5, 60_000);
  if (!limit.ok) redirect("/webadmin/login?e=ratelimit");

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await createAdminSession(email, password);
  if (!ok) redirect("/webadmin/login?e=1");
  redirect("/webadmin");
}

export async function adminLogout() {
  await destroyAdminSession();
  try {
    const { cookies } = await import("next/headers");
    (await cookies()).delete("jsa_member");
  } catch {}
  redirect("/webadmin/login");
}

// ─── Helpers ─────────────────────────────────────────────────────

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

function isUniqueError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

// ─── DOMPurify singleton (inisialisasi sekali di module level) ────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let purifyInstance: any = null;

async function getPurify() {
  if (purifyInstance) return purifyInstance;
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("");
  const createDOMPurify = await import("isomorphic-dompurify");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purifyInstance = createDOMPurify.default(dom.window as any);
  // Hook: bersihkan javascript: dan data: dari href
  purifyInstance.addHook("afterSanitizeAttributes", function (node: Element) {
    if (node.tagName === "A" && node.getAttribute("href")) {
      const href = node.getAttribute("href")!;
      if (/^\s*(javascript|data|vbscript):/i.test(href)) {
        node.setAttribute("href", "#");
      }
    }
    if (node.tagName === "IMG" && node.getAttribute("src")) {
      const src = node.getAttribute("src")!;
      if (/^\s*(javascript|data):/i.test(src)) {
        node.removeAttribute("src");
      }
    }
  });
  return purifyInstance;
}

/** Sanitasi HTML dari rich text editor — pakai DOMPurify singleton di atas. */
async function sanitizeHtml(html: string | null): Promise<string | null> {
  if (!html) return null;
  const purify = await getPurify();
  const cleaned = purify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "u", "strong", "em", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "img", "hr", "blockquote",
      "pre", "code", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  });
  const trimmed = cleaned.trim();
  const textOnly = trimmed.replace(/<[^>]*>/g, "").trim();
  return textOnly.length > 0 || /<img\b/i.test(trimmed) ? trimmed : null;
}

// ─── Program ─────────────────────────────────────────────────────

export async function saveProgram(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const rawTagline = String(formData.get("tagline") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "").trim();
  const rawMentorBio = String(formData.get("mentorBio") ?? "").trim();
  const rawGuarantee = String(formData.get("guarantee") ?? "").trim();
  const data = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    type: String(formData.get("type") ?? "WEBINAR") as "WEBINAR" | "KELAS" | "WORKSHOP" | "BOOTCAMP",
    title: String(formData.get("title") ?? "").trim(),
    tagline: await sanitizeHtml(rawTagline) ?? rawTagline,
    description: await sanitizeHtml(rawDescription) ?? rawDescription,
    emoji: String(formData.get("emoji") ?? "🎓").trim() || "🎓",
    imageUrl: optStr(formData, "imageUrl"),
    mentorName: String(formData.get("mentorName") ?? "").trim(),
    mentorBio: await sanitizeHtml(rawMentorBio) ?? rawMentorBio,
    materi: parseLines(String(formData.get("materi") ?? "")),
    deliverables: parseDeliverables(String(formData.get("deliverables") ?? "")),
    guarantee: rawGuarantee ? (await sanitizeHtml(rawGuarantee) ?? rawGuarantee) : null,
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
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    categoryId: optStr(formData, "categoryId"),
  };

  if (!data.slug || !data.title) redirect(id ? `/webadmin/program/${id}?e=lengkapi` : "/webadmin/program/new?e=lengkapi");
  if (Number.isNaN(data.scheduleAt.getTime())) {
    redirect(id ? `/webadmin/program/${id}?e=tanggaltidakvalid` : "/webadmin/program/new?e=tanggaltidakvalid");
  }

  try {
    if (id) {
      await prisma.program.update({ where: { id }, data });
    } else {
      await prisma.program.create({ data });
    }
  } catch (err) {
    if (isUniqueError(err)) {
      // slug sudah dipakai program lain
      redirect(id ? `/webadmin/program/${id}?e=slug` : "/webadmin/program/new?e=slug");
    }
    throw err;
  }
  revalidatePath("/");
  revalidatePath("/webadmin/program");
  redirect("/webadmin/program?ok=1");
}

/** Pengaturan kriteria kelulusan & sertifikat (tab Kelulusan) */
export async function saveGraduationSettings(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const completionCriteria = (formData.get("completionCriteria") ?? "ALL_LESSONS") as
    | "ALL_LESSONS" | "ALL_QUIZZES";
  const certKind = (formData.get("certKind") ?? "ACHIEVEMENT") as
    | "PARTICIPATION" | "COMPLETION" | "ACHIEVEMENT";
  const passingScore = Math.min(100, Math.max(0, num(formData, "passingScore") || 60));
  const maxTestAttempts = Math.max(0, num(formData, "maxTestAttempts"));

  await prisma.program.update({
    where: { id },
    data: { completionCriteria, certKind, passingScore, maxTestAttempts },
  });
  revalidatePath(`/webadmin/program/${id}/kelulusan`);
  redirect(`/webadmin/program/${id}/kelulusan?ok=1`);
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
    // modul & lesson ikut terhapus via onDelete: Cascade; soal dihapus manual
    await prisma.question.deleteMany({ where: { programId: id } });
    await prisma.program.delete({ where: { id } });
  }
  revalidatePath("/webadmin/program");
  revalidatePath("/");
}

// ─── Soal kuis ───────────────────────────────────────────────────

/** Tujuan kembali setelah simpan/hapus soal: halaman materi kuis (fallback: kurikulum) */
function questionBackUrl(programId: string, lessonId: string | null): string {
  return lessonId
    ? `/webadmin/program/${programId}/lms/lesson/${lessonId}`
    : `/webadmin/program/${programId}/lms`;
}

export async function saveQuestion(formData: FormData) {
  await requireAdmin();
  const id = optStr(formData, "id");
  const programId = String(formData.get("programId"));
  const lessonId = optStr(formData, "lessonId"); // terisi = soal kuis materi
  const data = {
    text: String(formData.get("text") ?? "").trim(),
    optionA: String(formData.get("optionA") ?? "").trim(),
    optionB: String(formData.get("optionB") ?? "").trim(),
    optionC: String(formData.get("optionC") ?? "").trim(),
    optionD: String(formData.get("optionD") ?? "").trim(),
    correct: (["A", "B", "C", "D"].includes(String(formData.get("correct"))) ? String(formData.get("correct")) : "A") as "A" | "B" | "C" | "D",
    order: num(formData, "order"),
  };
  if (!data.text) redirect(questionBackUrl(programId, lessonId));

  if (id) {
    await prisma.question.update({ where: { id }, data });
  } else {
    // urutan otomatis di akhir jika tidak diisi
    if (!data.order) {
      const last = await prisma.question.findFirst({
        where: lessonId ? { lessonId } : { programId, lessonId: null },
        orderBy: { order: "desc" },
      });
      data.order = (last?.order ?? 0) + 1;
    }
    await prisma.question.create({ data: { ...data, programId, lessonId } });
  }
  revalidatePath(`/webadmin/program/${programId}/soal`);
  revalidatePath(`/webadmin/program/${programId}/lms`);

  // "Simpan & Tambah Lagi" → langsung ke form soal baru berikutnya
  if (String(formData.get("intent") ?? "") === "next" && lessonId) {
    redirect(`/webadmin/program/${programId}/soal/new?lesson=${lessonId}&ok=1`);
  }
  redirect(`${questionBackUrl(programId, lessonId)}?ok=1`);
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  const existing = await prisma.question.findUnique({ where: { id }, select: { lessonId: true } });
  await prisma.question.delete({ where: { id } }).catch((err) => console.error("[deleteQuestion] Gagal:", err));
  revalidatePath(`/webadmin/program/${programId}/soal`);
  revalidatePath(`/webadmin/program/${programId}/lms`);
  redirect(`${questionBackUrl(programId, existing?.lessonId ?? null)}?deleted=1`);
}

// ─── Kelompok Modul ──────────────────────────────────────────────

export async function saveLmsGroup(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const programId = String(formData.get("programId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!programId || !title) redirect(`/webadmin/program/${programId}/lms?e=lengkapi`);

  if (id) {
    await prisma.lmsGroup.update({ where: { id }, data: { title } });
  } else {
    const last = await prisma.lmsGroup.findFirst({ where: { programId }, orderBy: { order: "desc" } });
    await prisma.lmsGroup.create({ data: { programId, title, order: (last?.order ?? 0) + 1 } });
  }

  revalidatePath(`/webadmin/program/${programId}/lms`);
}

/** Hapus kelompok — modul di dalamnya TIDAK ikut terhapus (menjadi tanpa kelompok) */
export async function deleteLmsGroup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  await prisma.lmsGroup.delete({ where: { id } }).catch((err) => console.error("[deleteLmsGroup] Gagal:", err));
  revalidatePath(`/webadmin/program/${programId}/lms`);
  revalidatePath(`/member/lms`);
}

export async function moveLmsGroup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  const dir = String(formData.get("dir")) === "up" ? "up" : "down";

  const groups = await prisma.lmsGroup.findMany({ where: { programId }, orderBy: { order: "asc" } });
  const idx = groups.findIndex((g) => g.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= groups.length) return;

  const reordered = [...groups];
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

  await prisma.$transaction(
    reordered.map((g, i) => prisma.lmsGroup.update({ where: { id: g.id }, data: { order: i + 1 } }))
  );

  revalidatePath(`/webadmin/program/${programId}/lms`);
}

// ─── Modul LMS ───────────────────────────────────────────────────

export async function saveLmsModule(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const programId = String(formData.get("programId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  // groupId dari form: "" = tanpa kelompok
  const hasGroupField = formData.has("groupId");
  const groupId = optStr(formData, "groupId");

  if (!programId || !title) redirect(`/webadmin/program/${programId}/lms?e=lengkapi`);

  if (id) {
    await prisma.lmsModule.update({
      where: { id },
      data: hasGroupField ? { title, groupId } : { title },
    });
  } else {
    const last = await prisma.lmsModule.findFirst({ where: { programId, groupId }, orderBy: { order: "desc" } });
    await prisma.lmsModule.create({ data: { programId, groupId, title, order: (last?.order ?? 0) + 1 } });
  }

  revalidatePath(`/webadmin/program/${programId}/lms`);
}

export async function deleteLmsModule(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  await prisma.lmsModule.delete({ where: { id } }).catch((err) => console.error("[deleteLmsModule] Gagal:", err));
  revalidatePath(`/webadmin/program/${programId}/lms`);
}

/** Geser urutan modul ke atas / bawah — dalam lingkup kelompoknya */
export async function moveLmsModule(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  const dir = String(formData.get("dir")) === "up" ? "up" : "down";

  const current = await prisma.lmsModule.findUnique({ where: { id }, select: { groupId: true } });
  if (!current) return;

  const modules = await prisma.lmsModule.findMany({
    where: { programId, groupId: current.groupId },
    orderBy: { order: "asc" },
  });
  const idx = modules.findIndex((m) => m.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= modules.length) return;

  const reordered = [...modules];
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

  await prisma.$transaction(
    reordered.map((m, i) => prisma.lmsModule.update({ where: { id: m.id }, data: { order: i + 1 } }))
  );

  revalidatePath(`/webadmin/program/${programId}/lms`);
}

// ─── Materi (Lesson) ─────────────────────────────────────────────

const LESSON_TYPES = ["VIDEO", "TEXT", "PDF", "QUIZ"] as const;
type LessonTypeStr = (typeof LESSON_TYPES)[number];

export async function saveLmsLesson(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const programId = String(formData.get("programId") ?? "").trim();
  const moduleId = String(formData.get("moduleId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const rawType = String(formData.get("type") ?? "VIDEO");
  const type: LessonTypeStr = (LESSON_TYPES as readonly string[]).includes(rawType) ? (rawType as LessonTypeStr) : "VIDEO";
  const videoUrl = optStr(formData, "videoUrl");
  // Validasi video URL: hanya YouTube/Vimeo yang diizinkan
  if (videoUrl) {
    const ytRe = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
    const vimeoRe = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/i;
    if (!ytRe.test(videoUrl) && !vimeoRe.test(videoUrl)) {
      redirect(`/webadmin/program/${programId}/lms/lesson/${id || "new"}?e=video`);
    }
  }
  const fileUrl = optStr(formData, "fileUrl");
  const content = await sanitizeHtml(optStr(formData, "content"));
  const duration = String(formData.get("duration") ?? "10 menit").trim() || "10 menit";
  const passingScoreRaw = num(formData, "passingScore");
  const hasPassingScore = formData.has("passingScore") && String(formData.get("passingScore")).trim() !== "";
  const passingScore = type === "QUIZ" && hasPassingScore ? Math.min(100, Math.max(0, passingScoreRaw)) : null;
  const isPreview = formData.get("isPreview") === "on";

  if (!programId || !moduleId || !title) redirect(`/webadmin/program/${programId}/lms?e=lengkapi`);

  const data = { moduleId, title, type, videoUrl, fileUrl, content, duration, passingScore, isPreview };

  let lessonId = id;
  if (id) {
    await prisma.lesson.update({ where: { id }, data });
  } else {
    const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { order: "desc" } });
    const created = await prisma.lesson.create({ data: { ...data, order: (last?.order ?? 0) + 1 } });
    lessonId = created.id;
  }

  revalidatePath(`/webadmin/program/${programId}/lms`);
  // Materi kuis baru → langsung ke editornya agar admin bisa menambah soal;
  // selain itu kembali ke outline kurikulum.
  if (!id && type === "QUIZ") {
    redirect(`/webadmin/program/${programId}/lms/lesson/${lessonId}?ok=baru`);
  }
  redirect(`/webadmin/program/${programId}/lms?ok=1`);
}

export async function deleteLmsLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  await prisma.lesson.delete({ where: { id } }).catch((err) => console.error("[deleteLmsLesson] Gagal:", err));
  revalidatePath(`/webadmin/program/${programId}/lms`);
  redirect(`/webadmin/program/${programId}/lms?deleted=1`);
}

/** Geser urutan materi dalam satu modul */
export async function moveLmsLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  const moduleId = String(formData.get("moduleId"));
  const dir = String(formData.get("dir")) === "up" ? "up" : "down";

  const lessons = await prisma.lesson.findMany({ where: { moduleId }, orderBy: { order: "asc" } });
  const idx = lessons.findIndex((l) => l.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= lessons.length) return;

  const reordered = [...lessons];
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

  await prisma.$transaction(
    reordered.map((l, i) => prisma.lesson.update({ where: { id: l.id }, data: { order: i + 1 } }))
  );

  revalidatePath(`/webadmin/program/${programId}/lms`);
}

// ─── Pendaftar ───────────────────────────────────────────────────

/** Tandai lunas manual (mis. transfer langsung) + kirim WA akses */
export async function markPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const reg = await prisma.registration.findUnique({ where: { id }, include: { program: true, payment: true } });
  const MARKPAID_ALLOWED = ["REGISTERED", "EXPIRED", "FAILED"];
  if (!reg || !MARKPAID_ALLOWED.includes(reg.status)) return;

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
  const memberUrl = `${baseUrl}/member`;
  if (reg.program.price > 0) {
    await sendWa(reg.whatsapp, msgAccess({
      name: reg.name,
      programTitle: reg.program.title,
      schedule: formatJadwal(reg.program.scheduleAt),
      zoomLink: reg.program.zoomLink,
      waGroupLink: reg.program.waGroupLink,
      lmsLink: reg.program.lmsLink,
      memberUrl,
    }));
  } else {
    await sendWa(reg.whatsapp, msgPaid(reg.name, reg.program.title, memberUrl));
  }

  // Kirim email pembayaran sukses — best-effort
  await sendEmail({
    to: reg.email,
    subject: `Pembayaran Berhasil: Akses Pelatihan ${reg.program.title}`,
    html: getPaidEmailHtml(reg.name, reg.program.title, memberUrl, reg.program.zoomLink, reg.program.waGroupLink, reg.program.lmsLink),
  }).catch((err) => console.error("Gagal mengirim email manual markPaid:", err));

  revalidatePath("/webadmin/pendaftar");
  revalidatePath("/webadmin");
}

export async function deleteRegistration(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.certificate.deleteMany({ where: { registrationId: id } });
  await prisma.testAttempt.deleteMany({ where: { registrationId: id } });
  await prisma.payment.deleteMany({ where: { registrationId: id } });
  await prisma.registration.delete({ where: { id } }).catch((err) => console.error("[deleteRegistration] Gagal:", err));
  revalidatePath("/webadmin/pendaftar");
  revalidatePath("/webadmin");
}

export async function saveRegistration(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const programId = String(formData.get("programId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const whatsappInput = String(formData.get("whatsapp") ?? "").trim();
  const whatsapp = whatsappInput ? normalizeWa(whatsappInput) : whatsappInput;
  const email = String(formData.get("email") ?? "").trim();
  const status = String(formData.get("status") ?? "REGISTERED") as "REGISTERED" | "PAID" | "PASSED";
  const institution = optStr(formData, "institution");

  if (!programId || !name || !whatsapp || !email) {
    redirect("/webadmin/pendaftar?e=lengkapi");
  }

  const data = { programId, name, whatsapp, email, status, institution };

  try {
    let regId: string;
    if (id) {
      await prisma.registration.update({ where: { id }, data });
      regId = id;
    } else {
      const created = await prisma.registration.create({ data });
      regId = created.id;
    }

    // Pastikan ada User record agar peserta bisa login member
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { whatsapp }] },
      select: { id: true },
    });
    const userId = existingUser?.id ?? (
      await prisma.user.create({
        data: { name, email, whatsapp, role: "STUDENT" },
        select: { id: true },
      })
    ).id;

    // Hubungkan semua registrasi dengan email/WA ini yang belum punya userId
    await prisma.registration.updateMany({
      where: { userId: null, OR: [{ email }, { whatsapp }] },
      data: { userId },
    });
    // Pastikan registrasi ini terhubung juga
    await prisma.registration.update({
      where: { id: regId },
      data: { userId },
    });
  } catch (err) {
    if (isUniqueError(err)) {
      redirect("/webadmin/pendaftar?e=duplikat");
    }
    throw err;
  }

  revalidatePath("/webadmin/pendaftar");
  revalidatePath("/webadmin");
  redirect("/webadmin/pendaftar?ok=1");
}

// ─── Upload & Sertifikat ─────────────────────────────────────────

const ALLOWED_UPLOAD_EXT = ["pdf", "png", "jpg", "jpeg", "webp"];
const ALLOWED_UPLOAD_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Upload file ke public/uploads. TIDAK melempar error — di production Next
 * menyembunyikan pesan error server action, jadi kembalikan { url | error }.
 */
export async function uploadFileAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");

    await requireAdmin();
    const file = formData.get("file") as File;
    if (!file || file.size === 0) return { error: "File kosong atau tidak terbaca." };
    if (file.size > MAX_UPLOAD_BYTES) return { error: "Ukuran file maksimal 20 MB." };

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_UPLOAD_EXT.includes(ext)) {
      return { error: `Tipe file .${ext} tidak diizinkan. Gunakan: ${ALLOWED_UPLOAD_EXT.join(", ")}.` };
    }
    // Validasi MIME type dari server (bukan dari client) — cegah rename berbahaya
    if (!ALLOWED_UPLOAD_MIME.includes(file.type)) {
      return { error: `Format file tidak dikenali. Gunakan PDF atau gambar (PNG/JPG/WebP).` };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}-${cleanName}`;
    await writeFile(join(uploadDir, filename), buffer);

    return { url: `/uploads/${filename}` };
  } catch (err) {
    console.error("[uploadFileAction]", err);
    return { error: `Gagal menyimpan file di server: ${err instanceof Error ? err.message : "kesalahan tak dikenal"}.` };
  }
}

export async function saveCertTemplate(programId: string, certBgUrl: string | null, certConfig: unknown) {
  await requireAdmin();
  await prisma.program.update({
    where: { id: programId },
    data: {
      certBgUrl,
      certConfig: certConfig ? (JSON.parse(JSON.stringify(certConfig)) as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });
  revalidatePath(`/webadmin/program/${programId}`);
  revalidatePath(`/webadmin/program/${programId}/cert`);
}

// ─── Kategori ────────────────────────────────────────────────────

export async function saveCategory(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const isFeatured = formData.get("isFeatured") === "on";

  if (!name) redirect("/webadmin/kategori?e=lengkapi");
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  }

  const data = {
    name,
    slug,
    isFeatured,
  };

  try {
    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch (err) {
    if (isUniqueError(err)) {
      redirect(id ? `/webadmin/kategori?id=${id}&e=slug` : "/webadmin/kategori?e=slug");
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/webadmin/kategori");
  redirect("/webadmin/kategori?ok=1");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.category.delete({ where: { id } }).catch((err) => console.error("[deleteCategory] Gagal:", err));
  revalidatePath("/");
  revalidatePath("/webadmin/kategori");
  redirect("/webadmin/kategori?deleted=1");
}

// ─── User Management ─────────────────────────────────────────────

export async function saveUser(formData: FormData) {
  await requireAdmin();

  const id = optStr(formData, "id");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const whatsappInput = optStr(formData, "whatsapp");
  const whatsapp = whatsappInput ? normalizeWa(whatsappInput) : whatsappInput;
  const role = String(formData.get("role") ?? "STUDENT") as "ADMIN" | "TEACHER" | "STUDENT";
  const password = String(formData.get("password") ?? "");

  if (!name || !email) {
    redirect("/webadmin/user?e=lengkapi");
  }

  const data: Prisma.UserUpdateInput = {
    name,
    email,
    whatsapp,
    role,
  };

  if (password.length > 0) {
    data.passwordHash = hashPassword(password);
  }

  try {
    if (id) {
      await prisma.user.update({ where: { id }, data });
    } else {
      if (password.length === 0 && role !== "STUDENT") {
        redirect("/webadmin/user?e=password-wajib");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.user.create({ data: data as any });
    }
  } catch (err) {
    if (isUniqueError(err)) {
      redirect(id ? `/webadmin/user?id=${id}&e=duplikat` : "/webadmin/user?e=duplikat");
    }
    throw err;
  }

  revalidatePath("/webadmin/user");
  redirect("/webadmin/user?ok=1");
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.user.delete({ where: { id } }).catch((err) => console.error("[deleteUser] Gagal:", err));
  revalidatePath("/webadmin/user");
  redirect("/webadmin/user?deleted=1");
}

// ─── Batch Program (jadwal berulang / angkatan) ──────────────────

export async function createBatch(formData: FormData) {
  await requireAdmin();
  const programId = String(formData.get("programId") ?? "").trim();
  const scheduleAtRaw = String(formData.get("scheduleAt") ?? "").trim();
  const seatsLeftRaw = optStr(formData, "seatsLeft");

  if (!programId) redirect("/webadmin/program");
  if (!scheduleAtRaw) redirect(`/webadmin/program/${programId}/batch?e=lengkapi`);

  const scheduleAt = new Date(scheduleAtRaw);
  if (isNaN(scheduleAt.getTime())) redirect(`/webadmin/program/${programId}/batch?e=tanggal`);

  await prisma.programBatch.create({
    data: {
      programId,
      scheduleAt,
      seatsLeft: seatsLeftRaw ? parseInt(seatsLeftRaw, 10) : null,
    },
  });

  revalidatePath(`/webadmin/program/${programId}/batch`);
  redirect(`/webadmin/program/${programId}/batch?ok=1`);
}

export async function toggleBatch(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  const batch = await prisma.programBatch.findUnique({ where: { id } });
  if (batch) await prisma.programBatch.update({ where: { id }, data: { isActive: !batch.isActive } });
  revalidatePath(`/webadmin/program/${programId}/batch`);
}

export async function deleteBatch(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const programId = String(formData.get("programId"));
  // Registration.batchId pakai onDelete: SetNull — histori pendaftaran tetap ada, cuma tautan batch-nya dilepas.
  await prisma.programBatch.delete({ where: { id } }).catch((err) => console.error("[deleteBatch] Gagal:", err));
  revalidatePath(`/webadmin/program/${programId}/batch`);
  redirect(`/webadmin/program/${programId}/batch?deleted=1`);
}

// ─── Integrasi API (Hermes agent, dll.) ──────────────────────────

/** Ambil key aktif, atau buat satu jika belum ada — supaya halaman selalu punya key untuk ditampilkan. */
export async function ensureApiKey(): Promise<string> {
  await requireAdmin();
  const existing = await prisma.apiKey.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  if (existing) return existing.key;

  const created = await prisma.apiKey.create({
    data: { key: generateApiKey(), label: "Hermes Agent Marketing" },
  });
  return created.key;
}

/** Nonaktifkan key lama, buat key baru — key lama langsung berhenti berfungsi. */
export async function regenerateApiKey() {
  await requireAdmin();
  await prisma.apiKey.updateMany({ where: { isActive: true }, data: { isActive: false } });
  await prisma.apiKey.create({
    data: { key: generateApiKey(), label: "Hermes Agent Marketing" },
  });
  revalidatePath("/webadmin/integrasi");
  redirect("/webadmin/integrasi?ok=1");
}
