/**
 * Seed: AI for Teachers — Optimasi Modul Ajar & Media Pembelajaran
 * Program WEBINAR gratis, bayar sertifikat di akhir.
 * Batch berurutan: 1 batch selesai → batch berikutnya dimulai.
 *
 * Jalankan: npx tsx prisma/seed-ai-for-teachers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Helper: buat Date untuk hari Sabtu tertentu jam 09:00 WIB (UTC 02:00) */
function sabtuDate(day: number, month: number, year: number = 2026): Date {
  return new Date(Date.UTC(year, month - 1, day, 2, 0, 0));
}

const GUARANTEE =
  "e-Sertifikat resmi 8 JP diterbitkan secara otomatis setelah Anda menyelesaikan tugas praktik & post-test (minimal nilai 70) dan melakukan pembayaran paket sertifikat.";

async function main() {
  console.log("=== SEED: AI for Teachers ===");

  // ── 1. HAPUS PROGRAM LAMA (modul-ajar-ai-untuk-guru) ───────────────
  const oldProgram = await prisma.program.findUnique({
    where: { slug: "modul-ajar-ai-untuk-guru" },
  });
  if (oldProgram) {
    // Hapus semua data terkait (cascade handle by Prisma schema — onDelete: Cascade)
    await prisma.question.deleteMany({ where: { programId: oldProgram.id } });
    await prisma.completion.deleteMany({
      where: { registration: { programId: oldProgram.id } },
    });
    await prisma.testAttempt.deleteMany({
      where: { registration: { programId: oldProgram.id } },
    });
    await prisma.certificate.deleteMany({
      where: { registration: { programId: oldProgram.id } },
    });
    await prisma.payment.deleteMany({
      where: { registration: { programId: oldProgram.id } },
    });
    await prisma.registration.deleteMany({ where: { programId: oldProgram.id } });
    await prisma.programBatch.deleteMany({ where: { programId: oldProgram.id } });
    await prisma.lesson.deleteMany({ where: { module: { programId: oldProgram.id } } });
    await prisma.lmsModule.deleteMany({ where: { programId: oldProgram.id } });
    await prisma.lmsGroup.deleteMany({ where: { programId: oldProgram.id } });
    await prisma.program.delete({ where: { id: oldProgram.id } });
    console.log("✓ Program lama 'modul-ajar-ai-untuk-guru' dihapus.");
  } else {
    console.log("- Program lama tidak ditemukan (ok, lanjut).");
  }

  // ── 2. BUAT PROGRAM BARU ────────────────────────────────────────────
  const program = await prisma.program.create({
    data: {
      slug: "ai-for-teachers",
      type: "WEBINAR",
      title: "AI for Teachers: Optimasi Modul Ajar & Media Pembelajaran",
      tagline:
        "Susun Modul Ajar, Soal HOTS, Video Pembelajaran, dan Media Lainnya 10x Lebih Cepat dengan AI.",
      description:
        "Pelatihan 8 Jam Pelajaran (JP) untuk guru SD, SMP, SMA, SMK, dan Madrasah. Kuasai 6 metode praktis memanfaatkan AI untuk menyusun perangkat pembelajaran — dari modul ajar, soal HOTS, video, audio, presentasi, hingga infografis. GRATIS akses penuh LMS, webinar, dan materi.",
      emoji: "🤖",
      imageUrl:
        "/uploads/1784375696711-Biru_Putih_dan_Kuning_Modern_Gradasi_3D_Webinar_Kecerdasan_Buatan_Latar_Belakang_Virtual_Zoom.png",
      mentorName: "Tim Jetschool Academy",
      mentorBio:
        "Tim pengembang platform AI untuk guru di Indonesia yang telah membantu ribuan pendidik mengadopsi teknologi AI dalam proses pembelajaran secara praktis dan aman.",
      materi: [
        "Menyusun Modul Ajar (RPP) Kurikulum Merdeka dalam 2 menit dengan AI",
        "Menghasilkan soal HOTS dengan stimulus studi kasus secara instan",
        "Membuat video pembelajaran dari script hingga siap tayang",
        "Mengubah teks modul menjadi audio/podcast pembelajaran",
        "Membuat presentasi & infografis pembelajaran tanpa skill desain",
      ],
      deliverables: [
        { label: "Akses penuh LMS: 5 Modul PDF + 30+ Template Prompt AI", value: 199000 },
        { label: "Rekaman Full Webinar (6 Demo Langsung — akses selamanya)", value: 99000 },
        { label: "Grup Alumni & Bimbingan WhatsApp (7 hari sprint)", value: 0 },
      ],
      guarantee: GUARANTEE,
      scheduleAt: sabtuDate(19, 7), // 19 Juli 2026
      durationLabel: "8 JP · Live Zoom 2 jam + LMS Mandiri",
      // zoomLink dan waGroupLink diisi setelah Zoom room dibuat
      price: 0,
      certPrice: 49000,
      certPriceOld: 149000,
      seatsLeft: 100,
      passingScore: 70,
      isActive: true,
      isFeatured: true,
    },
  });
  console.log(`✓ Program dibuat: ${program.slug} (ID: ${program.id})`);

  // ── 3. BUAT KATEGORI (jika belum ada) ───────────────────────────────
  await prisma.category.upsert({
    where: { slug: "ai-teknologi-pendidikan" },
    create: {
      slug: "ai-teknologi-pendidikan",
      name: "AI & Teknologi Pendidikan",
      isFeatured: true,
    },
    update: {},
  });
  // Update category program
  const category = await prisma.category.findUnique({ where: { slug: "ai-teknologi-pendidikan" } });
  if (category) {
    await prisma.program.update({
      where: { id: program.id },
      data: { categoryId: category.id },
    });
  }

  // ── 4. BUAT 4 BATCH BERURUTAN ──────────────────────────────────────
  const batchDates = [
    { label: "BATCH-001", date: sabtuDate(19, 7) },  // 19 Juli 2026
    { label: "BATCH-002", date: sabtuDate(26, 7) },  // 26 Juli 2026
    { label: "BATCH-003", date: sabtuDate(2, 8) },   // 2 Agustus 2026
    { label: "BATCH-004", date: sabtuDate(9, 8) },   // 9 Agustus 2026
  ];

  for (const b of batchDates) {
    await prisma.programBatch.create({
      data: {
        programId: program.id,
        scheduleAt: b.date,
        seatsLeft: 100,
        isActive: true,
      },
    });
    console.log(`   ${b.label}: ${b.date.toISOString()}`);
  }

  // ── 5. BUAT LMS: GRUP + MODUL + PELAJARAN ──────────────────────────

  // Grup 1: Materi Pembelajaran
  const group1 = await prisma.lmsGroup.create({
    data: {
      programId: program.id,
      title: "Materi Pembelajaran (5 Modul PDF)",
      order: 0,
    },
  });

  // Grup 2: Evaluasi
  const group2 = await prisma.lmsGroup.create({
    data: {
      programId: program.id,
      title: "Evaluasi & Sertifikat",
      order: 1,
    },
  });

  // Modul 1: Pengantar AI untuk Guru
  const mod1 = await prisma.lmsModule.create({
    data: {
      programId: program.id,
      groupId: group1.id,
      title: "Modul 1: Pengantar AI untuk Guru",
      order: 0,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: mod1.id,
      title: "📖 Pengantar AI untuk Guru",
      type: "TEXT",
      content: `# Pengantar AI untuk Guru

## Apa itu Artificial Intelligence (AI)?

AI (Kecerdasan Buatan) adalah teknologi yang memungkinkan komputer meniru kemampuan berpikir manusia. Dalam konteks pendidikan, AI dapat membantu guru menyelesaikan tugas-tugas administratif dan kreatif secara lebih cepat dan efisien.

## Manfaat AI untuk Guru

1. **Menghemat Waktu Administrasi** — Buat modul ajar, soal, dan administrasi dalam hitungan menit
2. **Meningkatkan Kreativitas** — Hasilkan ide-ide media pembelajaran baru
3. **Personalisasi** — Sesuaikan materi dengan kebutuhan setiap siswa
4. **Produktivitas** — Fokus pada interaksi dengan siswa, bukan kertas kerja

## Etika Penggunaan AI

- AI adalah MITRA, bukan pengganti guru
- Selalu VERIFIKASI hasil AI sebelum digunakan
- Jangan masukkan data pribadi siswa ke AI publik
- Gunakan AI sebagai alat bantu, bukan satu-satunya sumber

> "AI tidak akan menggantikan guru. Tapi guru yang menggunakan AI akan menggantikan guru yang tidak."
`,
      duration: "10 menit",
      isPreview: true,
      order: 0,
    },
  });

  // Modul 2: Prompt Engineering untuk Guru
  const mod2 = await prisma.lmsModule.create({
    data: {
      programId: program.id,
      groupId: group1.id,
      title: "Modul 2: Prompt Engineering untuk Guru",
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: mod2.id,
      title: "📖 Prompt Engineering untuk Guru",
      type: "TEXT",
      content: `# Prompt Engineering untuk Guru

## Apa itu Prompt?

Prompt adalah instruksi/perintah yang diberikan ke AI untuk menghasilkan output yang diinginkan. Semakin baik prompt Anda, semakin baik hasil AI.

## Rumus Prompt Efektif: KOTA

**K**onteks — Beri latar belakang
**O**utline — Jelaskan struktur yang diinginkan
**T**ugas — Sebutkan tugas spesifik
**A**tur — Tentukan format output

## Contoh untuk Guru

### Membuat Modul Ajar:
> "Saya guru kelas 4 SD mata pelajaran IPA. Buatkan modul ajar Kurikulum Merdeka untuk topik 'Siklus Air' dengan komponen: CP, TP, ATP, langkah pembelajaran saintifik, asesmen formatif, dan LKPD. Gunakan bahasa Indonesia yang sederhana."

### Membuat Soal:
> "Buatkan 5 soal HOTS pilihan ganda tentang 'Sistem Pernapasan Manusia' untuk SMA kelas 11. Setiap soal harus memiliki stimulus berupa studi kasus singkat, 4 opsi jawaban (A,B,C,D), dan kunci jawaban."

## Template Cepat

| Keperluan | Prompt Singkat |
|-----------|---------------|
| Modul Ajar | "Buat RPP Kurikulum Merdeka kelas [X] [mapel] topik [Y]" |
| Soal HOTS | "Buat 3 soal HOTS [mapel] kelas [X] dengan studi kasus" |
| Video Script | "Buat script video 3 menit tentang [topik] untuk siswa [kelas]" |
| Ringkasan | "Buat ringkasan 1 paragraf tentang [topik] bahasa mudah" |
`,
      duration: "10 menit",
      order: 1,
    },
  });

  // Modul 3: AI untuk Modul Ajar & Soal HOTS
  const mod3 = await prisma.lmsModule.create({
    data: {
      programId: program.id,
      groupId: group1.id,
      title: "Modul 3: AI untuk Modul Ajar & Soal HOTS",
      order: 2,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: mod3.id,
      title: "📖 AI untuk Modul Ajar & Soal HOTS",
      type: "TEXT",
      content: `# AI untuk Modul Ajar & Soal HOTS

## Membuat Modul Ajar dengan AI

### Langkah 1: Siapkan Data
- Mata pelajaran
- Kelas/Semester
- Topik/Materi pokok
- Alokasi waktu
- Model pembelajaran

### Langkah 2: Prompt ke AI
Contoh prompt lengkap:
> "Buat Modul Ajar Kurikulum Merdeka untuk:
> - Mapel: Matematika
> - Kelas: 5 SD
> - Topik: Pecahan
> - Alokasi: 2×35 menit
> - Model: Problem Based Learning
> 
> Sertakan:
> 1. Capaian Pembelajaran (CP)
> 2. Tujuan Pembelajaran (TP)
> 3. Alur Tujuan Pembelajaran (ATP)
> 4. Langkah-langkah pembelajaran (Pertemuan 1 & 2)
> 5. Asesmen formatif + rubrik penilaian
> 6. LKPD (Lembar Kerja Peserta Didik)
> 7. Refleksi guru & siswa"

### Langkah 3: Review & Sesuaikan
- Periksa kesesuaian dengan kondisi kelas Anda
- Edit bahasa agar sesuai karakteristik siswa
- Tambahkan kegiatan lokal/kontekstual

## Membuat Soal HOTS dengan AI

### Apa itu HOTS?
Higher Order Thinking Skills — soal yang mengukur kemampuan berpikir tingkat tinggi: menganalisis, mengevaluasi, dan mencipta.

### Template Prompt Soal HOTS:
> "Buat 5 soal HOTS pilihan ganda dengan stimulus untuk:
> - Mapel: [mapel]
> - Kelas: [kelas]
> - Materi: [topik]
> - Level kognitif: C4 (Analisis) dan C5 (Evaluasi)
> 
> Format setiap soal:
> - Stimulus (kasus/artikel/data 2-3 kalimat)
> - Pertanyaan
> - 4 opsi jawaban (A, B, C, D)
> - Kunci jawaban
> - Indikator soal"
`,
      duration: "10 menit",
      order: 2,
    },
  });

  // Modul 4: AI untuk Video & Audio
  const mod4 = await prisma.lmsModule.create({
    data: {
      programId: program.id,
      groupId: group1.id,
      title: "Modul 4: AI untuk Video & Audio Pembelajaran",
      order: 3,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: mod4.id,
      title: "📖 AI untuk Video & Audio Pembelajaran",
      type: "TEXT",
      content: `# AI untuk Video & Audio Pembelajaran

## Alur Pembuatan Video dengan AI

### Langkah 1: Generate Script
Prompt: "Buat script video pembelajaran 3 menit tentang [topik] untuk siswa [kelas]. Format: pembukaan (30 detik), isi (2 menit), kesimpulan (30 detik)."

### Langkah 2: Generate Gambar/Frame
Gunakan AI gambar (seperti Canva AI, Bing Image Creator) untuk membuat visual setiap adegan.

### Langkah 3: Generate Video
Gunakan tools AI video untuk mengubah gambar menjadi video bergerak dengan narasi.

### Langkah 4: Editing Akhir
Gabungkan semua segmen, tambahkan musik latar, teks, dan transisi.

## Membuat Audio/Podcast dengan AI

### Ubah Teks ke Audio:
1. Siapkan teks/naskah materi
2. Gunakan Text-to-Speech AI (seperti ElevenLabs, Google TTS)
3. Pilih suara yang natural (bahasa Indonesia)
4. Unduh file MP3

### Buat Podcast Pembelajaran:
- Format: 5-10 menit per episode
- Gaya: Narasi santai seperti bercerita
- Cocok untuk: siswa auditori, pembelajaran jarak jauh
`,
      duration: "10 menit",
      order: 3,
    },
  });

  // Modul 5: AI untuk Presentasi & Infografis
  const mod5 = await prisma.lmsModule.create({
    data: {
      programId: program.id,
      groupId: group1.id,
      title: "Modul 5: AI untuk Presentasi & Infografis",
      order: 4,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: mod5.id,
      title: "📖 AI untuk Presentasi & Infografis",
      type: "TEXT",
      content: `# AI untuk Presentasi & Infografis

## Membuat Presentasi dengan AI

### Metode 1: AI Presentation Generator
Gunakan tools seperti Gamma.app, Canva AI, atau Google Slides + AI add-on.

Prompt template:
> "Buat presentasi 10 slide tentang [topik] untuk kelas [kelas]. Struktur:
> 1. Slide judul
> 2-3. Apa itu [topik]?
> 4-5. Mengapa penting?
> 6-7. Contoh nyata
> 8. Kesimpulan
> 9. Evaluasi (3 pertanyaan)
> 10. Sumber & referensi
> Desain: bersih, warna cerah, banyak visual."

### Metode 2: Prompt ke ChatGPT → Copy ke Slides
1. Minta AI buat outline presentasi
2. Minta AI buat isi per slide
3. Salin ke Google Slides/PowerPoint
4. Gunakan template desain siap pakai

## Membuat Infografis dengan AI

### Prompt Infografis:
> "Buat infografis tentang [topik] untuk siswa [kelas]. Format:vertikal, warna menarik, sertakan ikon, gunakan bahasa sederhana."

### Tools Infografis AI:
- Canva AI — desain otomatis dari prompt
- Piktochart — template infografis pendidikan
- Napkin AI — ubah teks ke visual

### Tips Infografis untuk Guru:
- Satu infografis = satu konsep
- Gunakan ikon, bukan gambar kompleks
- Maksimal 7 poin per infografis
- Sertakan QR code ke materi lengkap
`,
      duration: "10 menit",
      order: 4,
    },
  });

  // ── 6. POST-TEST (10 Soal — di Grup 2: Evaluasi) ───────────────────
  const modQuiz = await prisma.lmsModule.create({
    data: {
      programId: program.id,
      groupId: group2.id,
      title: "Post-Test: Evaluasi Pemahaman",
      order: 0,
    },
  });

  const quizLesson = await prisma.lesson.create({
    data: {
      moduleId: modQuiz.id,
      title: "📝 Post-Test AI for Teachers (10 Soal)",
      type: "QUIZ",
      content: "Jawab 10 soal pilihan ganda berikut. Anda harus mencapai nilai minimal 70 untuk lulus.",
      duration: "22,5 menit",
      passingScore: 70,
      order: 0,
    },
  });

  const questions = [
    { text: "Apa kepanjangan dari AI?", optionA: "Automated Intelligence", optionB: "Artificial Intelligence", optionC: "Advanced Integration", optionD: "Automatic Input", correct: "B" },
    { text: "Apa fungsi utama AI dalam pembuatan modul ajar?", optionA: "Menggantikan guru sepenuhnya", optionB: "Menyusun modul ajar dengan cepat dan terstruktur", optionC: "Menilai siswa secara otomatis", optionD: "Membuat jadwal pelajaran", correct: "B" },
    { text: "Apa fungsi prompt engineering?", optionA: "Membuat AI bekerja lebih cepat", optionB: "Mendapatkan output AI yang sesuai dengan keinginan kita", optionC: "Memperbaiki bug pada AI", optionD: "Menginstall AI di komputer", correct: "B" },
    { text: "Soal HOTS mengukur kemampuan apa?", optionA: "Menghafal rumus", optionB: "Berpikir tingkat tinggi (analisis, evaluasi, kreasi)", optionC: "Kecepatan mengerjakan soal", optionD: "Kemampuan menulis indah", correct: "B" },
    { text: "Alur pembuatan video dengan AI dimulai dari...", optionA: "Video → Script → Gambar", optionB: "Script → Gambar → Video", optionC: "Gambar → Video → Script", optionD: "Audio → Video → Script", correct: "B" },
    { text: "AI bisa mengubah teks modul menjadi...", optionA: "Hanya gambar", optionB: "Audio/podcast pembelajaran", optionC: "Hanya video", optionD: "Tidak bisa diubah", correct: "B" },
    { text: "AI membantu pembuatan presentasi dengan fitur...", optionA: "Koreksi tata bahasa", optionB: "Desain slide otomatis", optionC: "Mengetik manual", optionD: "Mencetak slide", correct: "B" },
    { text: "Infografis berguna untuk...", optionA: "Membuat soal ujian", optionB: "Memvisualisasikan materi abstrak agar mudah dipahami", optionC: "Menghitung nilai siswa", optionD: "Membuat jadwal mengajar", correct: "B" },
    { text: "Pernyataan yang BENAR tentang AI untuk guru adalah...", optionA: "AI akan menggantikan profesi guru", optionB: "AI adalah mitra guru untuk meningkatkan produktivitas", optionC: "AI hanya untuk guru IT", optionD: "AI tidak berguna dalam pembelajaran", correct: "B" },
    { text: "Berapa total Jam Pelajaran (JP) program AI for Teachers ini?", optionA: "4 JP", optionB: "6 JP", optionC: "8 JP", optionD: "32 JP", correct: "C" },
  ];

  for (let i = 0; i < questions.length; i++) {
    await prisma.question.create({
      data: {
        programId: program.id,
        lessonId: quizLesson.id,
        text: questions[i].text,
        optionA: questions[i].optionA,
        optionB: questions[i].optionB,
        optionC: questions[i].optionC,
        optionD: questions[i].optionD,
        correct: questions[i].correct as "A" | "B" | "C" | "D",
        order: i,
      },
    });
  }
  console.log(`✓ ${questions.length} soal post-test dibuat.`);

  // ── SELESAI ─────────────────────────────────────────────────────────
  console.log("\n=== SEED SELESAI ===");
  console.log(`📋 Program: AI for Teachers`);
  console.log(`   URL     : /program/ai-for-teachers`);
  console.log(`   Batch   : 4 batch (19 Jul — 9 Agu 2026)`);
  console.log(`   Harga   : GRATIS · Sertifikat Rp 49.000`);
  console.log(`   Modul   : 5 modul PDF + 1 post-test (10 soal)`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
