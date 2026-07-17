"use server";

import { prisma } from "@/lib/prisma";
import { createMemberSession, destroyMemberSession } from "@/lib/member-auth";

import { forceAdminSession } from "@/lib/admin-auth";

export async function memberLogin(identifier: string) {

  const cleanVal = identifier.trim();
  if (!cleanVal) {
    return { error: "WhatsApp atau Email tidak boleh kosong." };
  }

  const isSuperadmin = cleanVal.toLowerCase() === "jetschool.id@gmail.com";

  if (!isSuperadmin) {
    // Cari apakah ada pendaftaran dengan WhatsApp atau Email tersebut
    const exists = await prisma.registration.findFirst({
      where: {
        OR: [
          { email: cleanVal },
          { whatsapp: cleanVal },
        ],
      },
    });

    if (!exists) {
      return {
        error: "Nomor WhatsApp atau Email belum terdaftar pada program apa pun. Silakan mendaftar terlebih dahulu.",
      };
    }
  } else {
    // Jika superadmin, buat sesi admin juga
    await forceAdminSession();
  }

  // Buat sesi member
  await createMemberSession(cleanVal);
  return { ok: true, isAdmin: isSuperadmin };
}

export async function memberLogout() {
  await destroyMemberSession();
}

import { revalidatePath } from "next/cache";

export async function completeLesson(registrationId: string, lessonId: string) {
  await prisma.completion.upsert({
    where: {
      registrationId_lessonId: {
        registrationId,
        lessonId,
      },
    },
    create: {
      registrationId,
      lessonId,
    },
    update: {},
  });
  revalidatePath(`/member/lms/${registrationId}`);
}
