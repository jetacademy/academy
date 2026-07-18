import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const GUARANTEE =
  "E-sertifikat resmi diterbitkan secara otomatis setelah Anda menyelesaikan evaluasi pasca-pelatihan.";

const seedCategories = [
  { name: "Teknologi & AI", slug: "teknologi-ai", isFeatured: true },
  { name: "Bisnis & Pemasaran", slug: "bisnis-pemasaran", isFeatured: true },
  { name: "Produktivitas & Desain", slug: "produktivitas-desain", isFeatured: false },
  { name: "Desain Grafis & UI/UX", slug: "desain-grafis", isFeatured: false },
];

const programs = [
  // ── 1. WEBINAR GRATIS ─────────────────
  {
    slug: "digital-marketing-pemula",
    categorySlug: "bisnis-pemasaran",
    type: "WEBINAR" as const,
    title: "Digital Marketing untuk Pemula",
    tagline: "Dapatkan Pelanggan Pertama Anda dari Instagram dalam 30 Hari.",
    description: "Webinar live: strategi pemasaran melalui media sosial dan iklan Meta — dari nol hingga siap dipraktikkan.",
    emoji: "📱",
    mentorName: "Arif Pratama",
    mentorBio: "Praktisi digital marketing 8+ tahun; mengelola iklan dengan total belanja miliaran rupiah untuk UMKM Indonesia.",
    materi: [
      "Pola pikir pemasaran online yang tepat untuk memulai",
      "Riset produk dan target pasar secara cepat dan terarah",
      "Membuat konten media sosial yang menjual, tanpa keahlian desain",
      "Dasar-dasar iklan Meta (Facebook & Instagram Ads)",
      "Rencana kerja 30 hari pertama memulai penjualan online",
    ],
    deliverables: [
      { label: "e-Sertifikat resmi ber-QR code", value: 149000 },
      { label: "Rekaman full webinar (akses selamanya)", value: 99000 },
      { label: "Template konten 30 hari siap pakai", value: 79000 },
      { label: "Grup alumni & tanya-jawab mentor", value: 0 },
    ],
    guarantee: GUARANTEE,
    scheduleAt: new Date("2026-07-25T19:00:00.000Z"),
    durationLabel: "2 jam · live Zoom",
    waGroupLink: "https://chat.whatsapp.com/GANTI_LINK_GRUP_DM",
    zoomLink: "https://zoom.us/j/GANTI_LINK_ZOOM",
    price: 0,
    priceOld: null,
    certPrice: 49000,
    certPriceOld: 149000,
    seatsLeft: 100,
    questions: [
      { text: "Apa langkah PERTAMA yang paling tepat sebelum mulai berjualan online?", optionA: "Langsung pasang iklan sebanyak-banyaknya", optionB: "Riset produk dan target pasar", optionC: "Membuat logo yang bagus", optionD: "Menunggu ada modal besar", correct: "B" },
      { text: "Platform iklan Meta mencakup...", optionA: "Facebook dan Instagram", optionB: "TikTok dan YouTube", optionC: "Google dan Bing", optionD: "Shopee dan Tokopedia", correct: "A" },
      { text: "Konten media sosial yang baik untuk jualan adalah konten yang...", optionA: "Sering repost punya orang lain", optionB: "Hanya berisi promosi harga", optionC: "Memberi manfaat lalu mengarahkan ke penawaran", optionD: "Diposting sekali seminggu saja", correct: "C" },
      { text: "Apa tujuan utama riset target pasar?", optionA: "Tahu siapa calon pembeli dan kebutuhannya", optionB: "Meniru kompetitor persis", optionC: "Membuat produk terlihat mahal", optionD: "Tidak ada tujuan khusus", correct: "A" },
      { text: "Kesalahan pemula yang paling sering membuat iklan tidak efektif adalah...", optionA: "Target audiens terlalu luas tanpa strategi", optionB: "Memakai foto produk yang jelas", optionC: "Menulis judul iklan menarik", optionD: "Mengatur anggaran harian", correct: "A" },
    ],
  },

  // ── 2. KELAS ONLINE / LMS BERBAYAR ───────────────────────────────
  {
    slug: "kelas-ai-untuk-kerja",
    categorySlug: "teknologi-ai",
    type: "KELAS" as const,
    title: "Kelas Online: AI untuk Dunia Kerja",
    tagline: "Selesaikan Pekerjaan Kantor 2× Lebih Cepat dengan Bantuan AI — Bersertifikat.",
    description: "Kelas online mandiri: memanfaatkan ChatGPT dan AI tools untuk laporan, email, presentasi, dan analisis data.",
    emoji: "🤖",
    mentorName: "Nadia Rahma",
    mentorBio: "AI trainer korporat; telah melatih 3.000+ karyawan perusahaan nasional menggunakan AI secara produktif dan aman.",
    materi: [
      "Dasar penyusunan prompt agar hasil AI akurat",
      "30 prompt siap pakai: laporan, email, notulen, presentasi",
      "Analisis data di Excel dengan bantuan AI",
      "Etika dan keamanan data dalam penggunaan AI di kantor",
      "Studi kasus efisiensi pekerjaan harian",
    ],
    deliverables: [
      { label: "Akses materi selamanya (video & modul)", value: 299000 },
      { label: "30 prompt siap pakai untuk pekerjaan kantor", value: 149000 },
      { label: "e-Sertifikat resmi ber-QR code (3 JP)", value: 149000 },
      { label: "Grup alumni + update materi gratis", value: 0 },
    ],
    guarantee: GUARANTEE,
    scheduleAt: new Date("2026-07-27T09:00:00.000Z"),
    durationLabel: "Belajar mandiri · akses selamanya",
    waGroupLink: "https://chat.whatsapp.com/GANTI_LINK_GRUP_AI",
    lmsLink: "https://lms.jetschool.id/GANTI_LINK_KELAS_AI",
    price: 149000,
    priceOld: 299000,
    certPrice: 0,
    certPriceOld: null,
    seatsLeft: null,
    questions: [
      { text: "Apa kunci utama agar jawaban AI akurat dan sesuai kebutuhan?", optionA: "Prompt yang jelas: konteks, tugas, dan format hasil", optionB: "Bertanya sesingkat mungkin", optionC: "Selalu memakai bahasa Inggris", optionD: "Mengulang pertanyaan yang sama", correct: "A" },
      { text: "Data apa yang TIDAK boleh dimasukkan ke AI publik?", optionA: "Contoh email umum", optionB: "Data rahasia perusahaan & data pribadi pelanggan", optionC: "Draf presentasi umum", optionD: "Pertanyaan seputar rumus Excel", correct: "B" },
      { text: "Cara paling tepat memakai hasil AI untuk laporan kerja adalah...", optionA: "Langsung kirim tanpa dibaca", optionB: "Direview dan diverifikasi dulu kebenarannya", optionC: "Menghapus semua hasilnya", optionD: "Menyalin jawaban orang lain", correct: "B" },
      { text: "Struktur prompt yang baik minimal memuat...", optionA: "Emoji yang banyak", optionB: "Konteks, instruksi tugas, dan format output", optionC: "Kata 'tolong' berulang-ulang", optionD: "Huruf kapital semua", correct: "B" },
      { text: "Manfaat utama AI untuk pekerjaan kantor adalah...", optionA: "Menggantikan seluruh karyawan", optionB: "Mempercepat pekerjaan rutin agar fokus ke hal penting", optionC: "Membuat pekerjaan lebih lambat", optionD: "Tidak ada manfaatnya", correct: "B" },
    ],
  },

  // ── 3. WORKSHOP BERBAYAR ─────────────────────────────────────────
  {
    slug: "workshop-excel-praktik",
    categorySlug: "produktivitas-desain",
    type: "WORKSHOP" as const,
    title: "Workshop Excel: Laporan Otomatis dalam 1 Hari",
    tagline: "Satu Hari Praktik, Laporan Bulanan Anda Menjadi Otomatis.",
    description: "Workshop live dengan praktik langsung: menyusun laporan dan dashboard otomatis dari data mentah, dipandu tahap demi tahap.",
    emoji: "📊",
    mentorName: "Sinta Dewi",
    mentorBio: "Data analyst & trainer korporat; 6 tahun melatih karyawan perusahaan nasional menggunakan Excel secara efisien.",
    materi: [
      "Rumus penting dunia kerja: VLOOKUP, IF, SUMIFS",
      "Pivot table: merangkum ribuan baris data dalam hitungan detik",
      "Menyusun dashboard laporan otomatis dari nol",
      "Teknik format dan pintasan untuk bekerja lebih cepat",
      "Praktik langsung dengan pendampingan mentor",
    ],
    deliverables: [
      { label: "Sesi live 4 jam + praktik dipandu", value: 199000 },
      { label: "Template dashboard siap pakai", value: 99000 },
      { label: "e-Sertifikat resmi ber-QR code", value: 149000 },
      { label: "Rekaman workshop (akses selamanya)", value: 99000 },
    ],
    guarantee: GUARANTEE,
    scheduleAt: new Date("2026-07-26T09:00:00.000Z"),
    durationLabel: "1 hari · 4 jam live",
    waGroupLink: "https://chat.whatsapp.com/GANTI_LINK_GRUP_EXCEL",
    zoomLink: "https://zoom.us/j/GANTI_LINK_ZOOM",
    price: 99000,
    priceOld: 199000,
    certPrice: 0,
    certPriceOld: null,
    seatsLeft: 25,
    questions: [
      { text: "Fungsi VLOOKUP digunakan untuk...", optionA: "Menjumlahkan angka", optionB: "Mencari data pada tabel berdasarkan nilai kunci", optionC: "Membuat grafik", optionD: "Mengubah warna sel", correct: "B" },
      { text: "Pivot table paling berguna untuk...", optionA: "Merangkum dan menganalisis data besar", optionB: "Mengetik surat", optionC: "Menggambar diagram alur", optionD: "Menyimpan foto", correct: "A" },
      { text: "Rumus =IF(A1>=60;\"LULUS\";\"GAGAL\") menghasilkan LULUS jika...", optionA: "A1 kosong", optionB: "A1 kurang dari 60", optionC: "A1 sama dengan atau lebih dari 60", optionD: "A1 berisi teks", correct: "C" },
      { text: "Fungsi SUMIFS digunakan untuk...", optionA: "Menjumlahkan dengan lebih dari satu kriteria", optionB: "Menghitung rata-rata", optionC: "Mencari nilai terbesar", optionD: "Menggabungkan teks", correct: "A" },
      { text: "Shortcut menyimpan file di Excel adalah...", optionA: "Ctrl + P", optionB: "Ctrl + S", optionC: "Ctrl + X", optionD: "Ctrl + B", correct: "B" },
    ],
  },

  // ── 4. WEBINAR GURU (AI MODUL AJAR) ───────────────────────────────
  {
    slug: "modul-ajar-ai-untuk-guru",
    categorySlug: "teknologi-ai",
    type: "WEBINAR" as const,
    title: "Webinar Nasional: Optimalisasi AI untuk Penyusunan Modul Ajar Kurikulum Merdeka",
    tagline: "Susun Modul Ajar RPP Kurikulum Merdeka 10x Lebih Cepat dengan AI.",
    description: "Pangkas beban administrasi mengajar Anda. Ikuti sesi webinar gratis dan dapatkan Akses Komunitas AI for Teacher + Rekaman Sesi + Sertifikat Pelatihan 32 JP.",
    emoji: "🤖",
    mentorName: "Tim Jetschool",
    mentorBio: "Pengembang guru.jetschool.id — platform AI untuk guru yang membantu ribuan pendidik di seluruh Indonesia membuat modul ajar lebih cepat, lebih lengkap, dan lebih bermakna.",
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
    guarantee: "Dapatkan pendampingan langsung di komunitas hingga Anda berhasil mengunduh sertifikat pelatihan secara resmi.",
    scheduleAt: new Date("2026-08-02T12:00:00.000Z"),
    durationLabel: "32 JP",
    waGroupLink: null,
    zoomLink: null,
    price: 0,
    priceOld: null,
    certPrice: 49000,
    certPriceOld: 99000,
    seatsLeft: 300,
    imageUrl: "/asisten_ai_guru_preview.png",
    questions: [
      { text: "Apa kepanjangan dari CP dalam komponen modul ajar Kurikulum Merdeka?", optionA: "Capaian Pendidikan", optionB: "Capaian Pembelajaran", optionC: "Catatan Penilaian", optionD: "Cara Pengajaran", correct: "B" },
      { text: "Berapa menit yang dibutuhkan AI di guru.jetschool.id untuk menghasilkan modul ajar lengkap?", optionA: "30 menit", optionB: "15 menit", optionC: "2 menit", optionD: "1 jam", correct: "C" },
      { text: "Format file yang dihasilkan oleh AI di guru.jetschool.id adalah...", optionA: "PDF", optionB: "PowerPoint (.pptx)", optionC: "Google Docs", optionD: "Word (.docx)", correct: "D" },
      { text: "Komponen manakah yang BUKAN bagian dari modul ajar Kurikulum Merdeka?", optionA: "Tujuan Pembelajaran (TP)", optionB: "Alur Tujuan Pembelajaran (ATP)", optionC: "Rencana Pelaksanaan Pembelajaran (RPP)", optionD: "Lembar Kerja Peserta Didik (LKPD)", correct: "C" },
      { text: "Setelah modul ajar dihasilkan AI, langkah yang tepat adalah...", optionA: "Langsung dicetak tanpa diperiksa", optionB: "Dihapus dan dibuat ulang manual", optionC: "Disesuaikan dengan kondisi dan karakter kelas", optionD: "Dikirim ke kepala sekolah tanpa diedit", correct: "C" },
      { text: "Kurikulum Berbasis Cinta (KBC) di guru.jetschool.id diperuntukkan untuk...", optionA: "Sekolah umum (SD, SMP, SMA)", optionB: "Madrasah (MI, MTs, MA)", optionC: "Perguruan tinggi", optionD: "Semua jenjang tanpa pengecualian", correct: "B" },
      { text: "Manfaat utama menggunakan AI untuk membuat modul ajar adalah...", optionA: "Modul ajar tidak perlu diperiksa guru", optionB: "Menghemat waktu administrasi agar guru bisa fokus mengajar", optionC: "AI bisa menggantikan peran guru sepenuhnya", optionD: "Modul ajar tidak perlu disesuaikan dengan peserta didik", correct: "B" },
      { text: "Guru.jetschool.id dapat diakses oleh guru dengan biaya...", optionA: "Rp 50.000/bulan", optionB: "Rp 100.000/tahun", optionC: "Gratis", optionD: "Berbayar sesuai paket", correct: "C" },
      { text: "ATP dalam modul ajar Kurikulum Merdeka adalah...", optionA: "Asesmen Tengah Pembelajaran", optionB: "Alur Tujuan Pembelajaran", optionC: "Aplikasi Teknologi Pendidikan", optionD: "Agenda Tahunan Pendidik", correct: "B" },
      { text: "Apa yang dimaksud 'modul ajar siap pakai' pada platform guru.jetschool.id?", optionA: "Modul yang bisa langsung dicetak tanpa diperiksa", optionB: "Modul yang telah memuat semua komponen wajib dan bisa diunduh sebagai file Word", optionC: "Modul yang sudah disahkan oleh Kemendikbud", optionD: "Modul yang hanya berlaku untuk satu sekolah", correct: "B" },
    ],
  },
];

export async function GET() {
  try {
    const existingCount = await prisma.program.count();
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Database sudah memiliki ${existingCount} program. Seeding dilewati untuk keamanan data Anda.`,
      });
    }

    // Buat Kategori
    const categoryMap: Record<string, string> = {};
    for (const cat of seedCategories) {
      const dbCat = await prisma.category.upsert({
        where: { slug: cat.slug },
        create: cat,
        update: cat,
      });
      categoryMap[cat.slug] = dbCat.id;
    }

    // Buat Program dan Soal
    for (const p of programs) {
      const { questions, categorySlug, ...data } = p;
      const programData = {
        ...data,
        categoryId: categorySlug ? categoryMap[categorySlug] : null,
      };
      const program = await prisma.program.create({
        data: programData,
      });

      // Buat Soal
      await prisma.question.createMany({
        data: questions.map((q, i) => ({
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correct: q.correct,
          programId: program.id,
          order: i,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seeding database produksi berhasil diselesaikan!",
      seededPrograms: programs.map(p => p.slug),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || err,
    }, { status: 500 });
  }
}
