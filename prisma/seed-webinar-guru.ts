/**
 * Seed: Webinar Gratis — Modul Ajar AI untuk Guru
 * Jalankan: npx tsx prisma/seed-webinar-guru.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.program.findUnique({ where: { slug: "modul-ajar-ai-untuk-guru" } });
  if (existing) {
    await prisma.question.deleteMany({ where: { programId: existing.id } });
    await prisma.registration.deleteMany({ where: { programId: existing.id } });
    await prisma.program.delete({ where: { id: existing.id } });
  }

  const program = await prisma.program.create({
    data: {
      slug: "modul-ajar-ai-untuk-guru",
      type: "WEBINAR",
      title: "Webinar Nasional: Optimalisasi AI untuk Penyusunan Modul Ajar Kurikulum Merdeka",
      tagline:
        "Susun Modul Ajar RPP Kurikulum Merdeka 10x Lebih Cepat dengan AI.",
      description:
        "Pangkas beban administrasi mengajar Anda. Ikuti sesi webinar gratis dan dapatkan Akses Komunitas AI for Teacher + Rekaman Sesi + Sertifikat Pelatihan 32 JP.",
      emoji: "🤖",
      mentorName: "Tim Jetschool",
      mentorBio:
        "Pengembang guru.jetschool.id — platform AI untuk guru yang membantu ribuan pendidik di seluruh Indonesia membuat modul ajar lebih cepat, lebih lengkap, dan lebih bermakna.",
      materi: [
        "Strategi memangkas beban administrasi guru menggunakan asisten AI pintar",
        "Penyusunan komponen lengkap modul ajar (CP, TP, ATP, Asesmen & LKPD) dalam 2 menit",
        "Langkah validasi hasil AI agar sesuai dengan Kurikulum Merdeka & KBC (Kurikulum Berbasis Cinta)",
        "Praktik mandiri: Unduh hasil modul ajar dalam format Word (.docx) siap edit",
        "Cara bergabung ke Komunitas AI for Teacher untuk pendampingan & klaim Sertifikat Pelatihan 32 JP",
      ],
      deliverables: [
        { label: "Akses Komunitas AI for Teacher (Pendampingan & Diskusi)", value: 150000 },
        { label: "Sertifikat Pelatihan Nasional 32 JP (PMM Bukti Dukung)", value: 100000 },
        { label: "Rekaman Sesi Webinar & Slide Materi Lengkap", value: 50000 },
        { label: "Akses Penuh Asisten Pembuat Modul Ajar AI (Gratis)", value: 0 },
      ],
      guarantee:
        "Dapatkan pendampingan langsung di komunitas hingga Anda berhasil mengunduh sertifikat pelatihan secara resmi.",
      imageUrl: "/asisten_ai_guru_preview.png",
      // Sabtu, 2 Agustus 2026, 19:00 WIB (UTC+7 → UTC = 12:00)
      scheduleAt: new Date("2026-08-02T12:00:00.000Z"),
      durationLabel: "32 JP",
      price: 0,
      certPrice: 49000,
      certPriceOld: 99000,
      seatsLeft: 300,
      passingScore: 70,
      isActive: true,
      // Isi setelah Zoom room dibuat:
      // zoomLink: "https://zoom.us/j/...",
      // waGroupLink: "https://chat.whatsapp.com/...",
    },
  });

  console.log("✅ Program dibuat:", program.slug);

  // Soal post-test (10 soal pilihan ganda, minimal skor 70 untuk lulus)
  const soal = [
    {
      text: "Apa kepanjangan dari CP dalam komponen modul ajar Kurikulum Merdeka?",
      optionA: "Capaian Pendidikan",
      optionB: "Capaian Pembelajaran",
      optionC: "Catatan Penilaian",
      optionD: "Cara Pengajaran",
      correct: "B",
      order: 1,
    },
    {
      text: "Berapa menit yang dibutuhkan AI di guru.jetschool.id untuk menghasilkan modul ajar lengkap?",
      optionA: "30 menit",
      optionB: "15 menit",
      optionC: "2 menit",
      optionD: "1 jam",
      correct: "C",
      order: 2,
    },
    {
      text: "Format file yang dihasilkan oleh AI di guru.jetschool.id adalah...",
      optionA: "PDF",
      optionB: "PowerPoint (.pptx)",
      optionC: "Google Docs",
      optionD: "Word (.docx)",
      correct: "D",
      order: 3,
    },
    {
      text: "Komponen manakah yang BUKAN bagian dari modul ajar Kurikulum Merdeka?",
      optionA: "Tujuan Pembelajaran (TP)",
      optionB: "Alur Tujuan Pembelajaran (ATP)",
      optionC: "Rencana Pelaksanaan Pembelajaran (RPP)",
      optionD: "Lembar Kerja Peserta Didik (LKPD)",
      correct: "C",
      order: 4,
    },
    {
      text: "Setelah modul ajar dihasilkan AI, langkah yang tepat adalah...",
      optionA: "Langsung dicetak tanpa diperiksa",
      optionB: "Dihapus dan dibuat ulang manual",
      optionC: "Disesuaikan dengan kondisi dan karakter kelas",
      optionD: "Dikirim ke kepala sekolah tanpa diedit",
      correct: "C",
      order: 5,
    },
    {
      text: "Kurikulum Berbasis Cinta (KBC) di guru.jetschool.id diperuntukkan untuk...",
      optionA: "Sekolah umum (SD, SMP, SMA)",
      optionB: "Madrasah (MI, MTs, MA)",
      optionC: "Perguruan tinggi",
      optionD: "Semua jenjang tanpa pengecualian",
      correct: "B",
      order: 6,
    },
    {
      text: "Manfaat utama menggunakan AI untuk membuat modul ajar adalah...",
      optionA: "Modul ajar tidak perlu diperiksa guru",
      optionB: "Menghemat waktu administrasi agar guru bisa fokus mengajar",
      optionC: "AI bisa menggantikan peran guru sepenuhnya",
      optionD: "Modul ajar tidak perlu disesuaikan dengan peserta didik",
      correct: "B",
      order: 7,
    },
    {
      text: "Guru.jetschool.id dapat diakses oleh guru dengan biaya...",
      optionA: "Rp 50.000/bulan",
      optionB: "Rp 100.000/tahun",
      optionC: "Gratis",
      optionD: "Berbayar sesuai paket",
      correct: "C",
      order: 8,
    },
    {
      text: "ATP dalam modul ajar Kurikulum Merdeka adalah...",
      optionA: "Asesmen Tengah Pembelajaran",
      optionB: "Alur Tujuan Pembelajaran",
      optionC: "Aplikasi Teknologi Pendidikan",
      optionD: "Agenda Tahunan Pendidik",
      correct: "B",
      order: 9,
    },
    {
      text: "Apa yang dimaksud 'modul ajar siap pakai' pada platform guru.jetschool.id?",
      optionA: "Modul yang bisa langsung dicetak tanpa diperiksa",
      optionB: "Modul yang telah memuat semua komponen wajib dan bisa diunduh sebagai file Word",
      optionC: "Modul yang sudah disahkan oleh Kemendikbud",
      optionD: "Modul yang hanya berlaku untuk satu sekolah",
      correct: "B",
      order: 10,
    },
  ];

  for (const s of soal) {
    await prisma.question.create({
      data: { ...s, correct: s.correct as "A" | "B" | "C" | "D", programId: program.id },
    });
  }

  console.log(`✅ ${soal.length} soal post-test ditambahkan.`);
  console.log("\n📋 Detail program:");
  console.log(`   URL  : /program/${program.slug}`);
  console.log(`   Jadwal: Sabtu, 2 Agustus 2026 · 19:00 WIB`);
  console.log(`   Harga : Gratis · Sertifikat Rp 49.000`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
