import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWa } from "@/lib/wa";

export type BroadcastMessageType = "zoom" | "grup" | "custom";
export type BroadcastResult = { sent: number; failed: number; total: number };

export async function POST(req: Request) {
  // Auth via internal secret header (dikirim dari server action)
  const secret = req.headers.get("x-internal-secret");
  const key = process.env.JETSCHOOL_API_KEY || "internal";
  if (secret !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { programId?: string; batchId?: string; messageType?: string; customMessage?: string };
    const { programId, batchId, messageType, customMessage } = body;

    if (!messageType) {
      return NextResponse.json({ error: "Tipe pesan wajib diisi." }, { status: 400 });
    }
    if (!programId && !batchId) {
      return NextResponse.json({ error: "Pilih target program atau batch." }, { status: 400 });
    }
    if (messageType === "custom" && !customMessage?.trim()) {
      return NextResponse.json({ error: "Pesan custom wajib diisi." }, { status: 400 });
    }

    // ── Build where clause ──────────────────────────────────────
    const where: { programId?: string; batchId?: string; whatsapp?: string } = {};
    if (batchId) {
      where.batchId = batchId;
    } else if (programId) {
      where.programId = programId;
    }

    // ── Fetch recipients ────────────────────────────────────────
    const registrations = await prisma.registration.findMany({
      where,
      select: {
        id: true,
        name: true,
        whatsapp: true,
        programId: true,
        batchId: true,
        program: { select: { title: true, zoomLink: true, waGroupLink: true } },
        batch: { select: { scheduleAt: true } },
      },
    });

    if (registrations.length === 0) {
      return NextResponse.json({ error: "Tidak ada penerima yang cocok." }, { status: 400 });
    }

    // ── Build message ──────────────────────────────────────────
    const program = programId
      ? await prisma.program.findUnique({ where: { id: programId }, select: { zoomLink: true, waGroupLink: true, title: true } })
      : null;

    let messageText = "";
    if (messageType === "zoom") {
      const link = program?.zoomLink;
      if (!link) {
        return NextResponse.json({ error: "Program ini tidak memiliki link Zoom." }, { status: 400 });
      }
      messageText = `Halo {{name}},\n\nBerikut link Zoom untuk program "${program?.title}":\n${link}\n\nJangan lupa catat jadwalnya ya. Sampai jumpa! 😊`;
    } else if (messageType === "grup") {
      const link = program?.waGroupLink;
      if (!link) {
        return NextResponse.json({ error: "Program ini tidak memiliki link grup WA." }, { status: 400 });
      }
      messageText = `Halo {{name}},\n\nBergabunglah dengan grup WhatsApp peserta program "${program?.title}":\n${link}\n\nDiskusikan materi dan dapatkan info terbaru di grup ya! 😊`;
    } else if (messageType === "custom") {
      messageText = customMessage?.trim() ?? "";
    }

    if (!messageText) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    // ── Send broadcast (batch: 5 per group, jeda 3 detik) ──
    let sent = 0;
    let failed = 0;
    const batchSize = 5;
    for (let i = 0; i < registrations.length; i += batchSize) {
      const batch = registrations.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (reg) => {
          if (!reg.whatsapp) return false;
          return sendWa(reg.whatsapp, messageText.replace(/\{\{name\}\}/g, reg.name));
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) sent++;
        else failed++;
      }
      if (i + batchSize < registrations.length) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    const result: BroadcastResult = { sent, failed, total: registrations.length };
    console.log(`[broadcast] admin — ${messageType} → ${registrations.length} penerima (${sent} terkirim, ${failed} gagal)`);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[broadcast] error:", err);
    return NextResponse.json({ error: "Gagal mengirim broadcast." }, { status: 500 });
  }
}
