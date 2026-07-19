/**
 * Seed: Zero Human Company — Workshop 6 AI Agent untuk Bisnis
 * Program WORKSHOP berbayar Rp 225.000, batch berurutan.
 *
 * Jalankan: npx tsx prisma/seed-zero-human-company.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sabtuDate(day: number, month: number): Date {
  return new Date(Date.UTC(2026, month - 1, day, 6, 0, 0)); // 13:00 WIB = 06:00 UTC
}

async function main() {
  console.log("=== SEED: Zero Human Company ===");

  // ── 1. KATEGORI ──────────────────────────────────────────────────
  await prisma.category.upsert({
    where: { slug: "ai-bisnis-digital" },
    create: { slug: "ai-bisnis-digital", name: "AI & Bisnis Digital", isFeatured: true },
    update: {},
  });
  const category = await prisma.category.findUnique({ where: { slug: "ai-bisnis-digital" } });

  // ── 2. PROGRAM ────────────────────────────────────────────────────
  const program = await prisma.program.create({
    data: {
      slug: "zero-human-company",
      type: "WORKSHOP",
      title: "Zero Human Company: Membangun Perusahaan Tanpa Karyawan dengan Agent AI",
      tagline: "Bangun 6 AI Agent untuk Bisnis Anda dalam 3 Jam — Tanpa Coding, Siap Jalan.",
      description:
        "Workshop intensif 3 jam: pelajari cara membangun dan mengoperasikan 6 AI Agent untuk mengotomatisasi customer service, konten, marketing, sales, developer, dan laporan bisnis Anda. Pulang-pulang, Agent Anda sudah terhubung ke WhatsApp dan siap bekerja.",
      emoji: "🤖",
      mentorName: "Tim Jetschool Academy",
      mentorBio:
        "Tim praktisi AI yang telah membantu puluhan UMKM dan startup Indonesia mengotomatisasi operasional bisnis mereka menggunakan AI Agent.",
      materi: [
        "Customer Service Agent — jawab pelanggan 24 jam via WA",
        "Content Agent — tulis & publikasi artikel otomatis",
        "Marketing Agent — riset konten, caption, penjadwalan",
        "Sales Agent — follow-up prospek otomatis & terstruktur",
        "Developer Agent — perbaiki bugs & tambah fitur website",
        "Report Agent — laporan bisnis harian otomatis via WA",
      ],
      deliverables: [
        { label: "6 AI Agent siap pakai (Customer Service, Content, Marketing, Sales, Developer, Report)", value: 299000 },
        { label: "Setup & Hubungkan Agent dengan WhatsApp", value: 199000 },
        { label: "Template Agent + Rekaman Workshop (akses seumur hidup)", value: 149000 },
        { label: "e-Sertifikat Resmi + Grup WA Alumni", value: 0 },
      ],
      guarantee:
        "Garansi 100%: jika setelah workshop Agent Anda belum terhubung ke WhatsApp dan siap bekerja, kami bantu sampai jadi — tanpa biaya tambahan.",
      scheduleAt: sabtuDate(25, 7),
      durationLabel: "3 jam · Live Zoom",
      price: 225000,
      priceOld: 450000,
      certPrice: 0,
      seatsLeft: 20,
      passingScore: 70,
      isActive: true,
      isFeatured: true,
      categoryId: category?.id ?? null,
    },
  });
  console.log(`✓ Program dibuat: ${program.slug} (ID: ${program.id})`);

  // ── 3. BATCH ──────────────────────────────────────────────────────
  const batchDates = [
    { label: "BATCH-001", date: sabtuDate(25, 7) },
    { label: "BATCH-002", date: sabtuDate(8, 8) },
    { label: "BATCH-003", date: sabtuDate(22, 8) },
  ];

  for (const b of batchDates) {
    await prisma.programBatch.create({
      data: { programId: program.id, scheduleAt: b.date, seatsLeft: 20, isActive: true },
    });
    console.log(`   ${b.label}: ${b.date.toISOString()}`);
  }

  // ── 4. LMS — GRUP + MODUL + PELAJARAN ────────────────────────────
  const group = await prisma.lmsGroup.create({
    data: { programId: program.id, title: "Materi Workshop (3 Jam)", order: 0 },
  });

  const sesi = [
    { title: "Sesi 1: Pembukaan & Konsep AI Agent", durasi: "10 menit", konten: "# Pembukaan & Konsep AI Agent\n\n## AI Agent vs Chatbot\n\n- **Chatbot**: Menjawab pertanyaan berdasarkan aturan tetap\n- **AI Agent**: Bisa berpikir, merencanakan, dan bertindak mandiri\n\n## Studi Kasus\nSeorang pebisnis UKM memiliki 3 karyawan: 1 admin WA, 1 content writer, 1 sales. Dengan AI Agent, ia menggantikan ketiganya dengan 6 Agent yang bekerja 24 jam.\n\n## Yang Akan Anda Bawa Pulang\n1. CS Agent — jawab pelanggan otomatis\n2. Content Agent — tulis artikel\n3. Marketing Agent — promosi\n4. Sales Agent — follow-up\n5. Developer Agent — perbaiki website\n6. Report Agent — laporan harian" },
    { title: "Sesi 2: Persiapan & Setup", durasi: "10 menit", konten: "# Persiapan & Setup\n\n## Yang Perlu Disiapkan\n1. Laptop/komputer\n2. Koneksi internet stabil\n3. Nomor WhatsApp aktif\n4. Akun platform Agent (tautan dibagikan saat workshop)\n\n## Platform yang Digunakan\n- Tools visual — tidak perlu coding\n- Berbasis web — tidak perlu install\n- Dashboard dalam Bahasa Indonesia" },
    { title: "Sesi 3: Customer Service Agent", durasi: "45 menit", konten: "# Customer Service Agent\n\n## Fungsi\nMenjawab pertanyaan pelanggan di WhatsApp 24 jam — tanpa perlu admin.\n\n## Yang Akan Dibangun\n- Agent yang paham produk/jasa Anda\n- Bisa menjawab FAQ, cek status pesanan, jam operasional\n- Terintegrasi dengan WhatsApp\n\n## Praktek: Setup & Hubungkan Agent dengan WA\n1. Buat Agent baru\n2. Input data bisnis (nama, produk, FAQ)\n3. Hubungkan dengan nomor WhatsApp\n4. Kirim pesan uji coba\n5. Lihat respons otomatis" },
    { title: "Sesi 4: Content & Marketing Agent", durasi: "40 menit", konten: "# Content & Marketing Agent\n\n## Content Agent\n- Menulis artikel blog otomatis\n- Publikasi ke website\n- SEO-friendly\n\n## Marketing Agent\n- Riset kata kunci\n- Membuat caption promosi\n- Jadwalkan konten\n\n## Praktek\n1. Set topik → Content Agent tulis artikel\n2. Set produk → Marketing Agent buat 3 caption\n3. Jadwalkan publikasi" },
    { title: "Sesi 5: Sales & Report Agent", durasi: "40 menit", konten: "# Sales & Report Agent\n\n## Sales Agent\n- Follow-up prospek otomatis\n- Kirim pesan follow-up terjadwal\n- Catat status prospek\n\n## Report Agent\n- Kirim laporan harian via WA setiap pagi\n- Data: jumlah prospek baru, penjualan, tugas hari ini\n- Bisa dikustomisasi\n\n## Praktek\n1. Buat Sales Agent dengan skenario follow-up\n2. Atur Report Agent kirim laporan\n3. Uji coba terima laporan di WA" },
    { title: "Sesi 6: Developer Agent & Integrasi", durasi: "35 menit", konten: "# Developer Agent & Integrasi\n\n## Developer Agent\n- Bisa membaca kode website Anda\n- Memperbaiki bug sederhana\n- Menambahkan fitur kecil\n- Tidak perlu bisa coding — cukup jelaskan apa yang ingin diubah\n\n## Integrasi Semua Agent\nSemua Agent bisa bekerja bersama:\n1. CS Agent terima pertanyaan\n2. Sales Agent follow-up\n3. Content Agent publish artikel\n4. Report Agent kirim ringkasan\n\n## Tanya Jawab\nKonsultasi langsung dengan tim tentang kebutuhan spesifik bisnis Anda." },
  ];

  for (let i = 0; i < sesi.length; i++) {
    const mod = await prisma.lmsModule.create({
      data: { programId: program.id, groupId: group.id, title: sesi[i].title, order: i },
    });
    await prisma.lesson.create({
      data: {
        moduleId: mod.id,
        title: sesi[i].title,
        type: "TEXT",
        content: sesi[i].konten,
        duration: sesi[i].durasi,
        order: 0,
      },
    });
  }

  // ── 5. POST-TEST (5 SOAL) ────────────────────────────────────────
  const quizMod = await prisma.lmsModule.create({
    data: { programId: program.id, title: "Evaluasi & Sertifikat", order: 1 },
  });
  const quiz = await prisma.lesson.create({
    data: { moduleId: quizMod.id, title: "Post-Test Zero Human Company", type: "QUIZ", duration: "10 menit", passingScore: 70, order: 0 },
  });

  const questions = [
    { text: "Apa perbedaan utama antara AI Agent dan chatbot biasa?", optionA: "Chatbot lebih pintar", optionB: "AI Agent bisa berpikir, merencanakan, dan bertindak mandiri", optionC: "Tidak ada perbedaan", optionD: "AI Agent hanya untuk coding", correct: "B" },
    { text: "Berapa jumlah AI Agent yang akan dibangun dalam workshop ini?", optionA: "3 Agent", optionB: "4 Agent", optionC: "6 Agent", optionD: "10 Agent", correct: "C" },
    { text: "Apa yang diperlukan untuk menghubungkan Agent ke WhatsApp?", optionA: "Server sendiri", optionB: "Nomor WhatsApp aktif + platform Agent", optionC: "Izin dari Google", optionD: "Aplikasi desktop", correct: "B" },
    { text: "Agent mana yang bertugas mengirim laporan bisnis harian?", optionA: "Sales Agent", optionB: "Marketing Agent", optionC: "Report Agent", optionD: "Developer Agent", correct: "C" },
    { text: "Siapa target utama program Zero Human Company?", optionA: "Programmer profesional", optionB: "Pebisnis UKM, founder, freelancer tanpa coding", optionC: "Siswa SMA", optionD: "Guru", correct: "B" },
  ];

  for (let i = 0; i < questions.length; i++) {
    await prisma.question.create({
      data: { programId: program.id, lessonId: quiz.id, ...questions[i], correct: questions[i].correct as "A" | "B" | "C" | "D", order: i },
    });
  }
  console.log(`✓ ${questions.length} soal post-test dibuat.`);

  console.log("\n=== SEED SELESAI ===");
  console.log(`📋 Program: Zero Human Company`);
  console.log(`   URL     : /program/zero-human-company`);
  console.log(`   Harga   : Rp 225.000 (WORKSHOP)`);
  console.log(`   Batch   : 3 batch (25 Jul — 22 Agu 2026)`);
  console.log(`   Modul   : 6 sesi + 1 post-test (5 soal)`);
}

main()
  .catch((e) => { console.error("❌ Gagal:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
