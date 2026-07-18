// Seed: 4 program (webinar gratis, kelas LMS, workshop, bootcamp) + soal post-test.
// Jalankan: npm run db:seed  (setelah `npx prisma db push`)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Jadwal contoh: hari tertentu terdekat, jam WIB */
function nextDay(dayOfWeek, hour) {
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  let add = (dayOfWeek - d.getDay() + 7) % 7;
  if (add === 0 && d <= now) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

const GUARANTEE =
  "E-sertifikat resmi diterbitkan secara otomatis setelah Anda menyelesaikan evaluasi pasca-pelatihan.";

const programs = [
  // ── 1. WEBINAR GRATIS (pintu masuk funnel iklan) ─────────────────
  {
    slug: "digital-marketing-pemula",
    categorySlug: "bisnis-pemasaran",
    type: "WEBINAR",
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
    scheduleAt: nextDay(6, 19),
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
    type: "KELAS",
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
    scheduleAt: nextDay(1, 9),
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
    type: "WORKSHOP",
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
    scheduleAt: nextDay(0, 9),
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
];

async function main() {
  const seedCategories = [
    { name: "Teknologi & AI", slug: "teknologi-ai", isFeatured: true },
    { name: "Bisnis & Pemasaran", slug: "bisnis-pemasaran", isFeatured: true },
    { name: "Produktivitas & Desain", slug: "produktivitas-desain", isFeatured: false },
  ];

  const categoryMap = {};
  for (const cat of seedCategories) {
    const dbCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: cat,
    });
    categoryMap[cat.slug] = dbCat.id;
  }

  // Set bootcamp digital marketing menjadi tidak aktif agar tidak tampil di frontend
  // tanpa menghapus pendaftaran & sertifikat yang sudah ada.
  const progToDelete = await prisma.program.findUnique({ where: { slug: "bootcamp-digital-marketing" } });
  if (progToDelete) {
    await prisma.program.update({
      where: { slug: "bootcamp-digital-marketing" },
      data: { isActive: false },
    });
    console.log(`✓ [DEPRECATED] Bootcamp Digital Marketing dinonaktifkan (data sebelumnya tetap aman)`);
  }

  for (const p of programs) {
    const { questions, categorySlug, ...data } = p;
    const programData = {
      ...data,
      categoryId: categorySlug ? categoryMap[categorySlug] : null,
    };
    const program = await prisma.program.upsert({
      where: { slug: p.slug },
      create: programData,
      update: programData,
    });

    // Hanya masukkan soal jika belum ada soal terdaftar untuk program ini
    const existingQuestionsCount = await prisma.question.count({ where: { programId: program.id } });
    if (existingQuestionsCount === 0) {
      await prisma.question.createMany({
        data: questions.map((q, i) => ({ ...q, programId: program.id, order: i })),
      });
      console.log(`✓ [${p.type}] ${program.title} (${questions.length} soal baru dibuat)`);
    } else {
      console.log(`✓ [${p.type}] ${program.title} (lewati pembuatan soal karena sudah ada data sebelumnya)`);
    }
  }
  console.log("\nSeed selesai! Buka http://localhost:3000");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
