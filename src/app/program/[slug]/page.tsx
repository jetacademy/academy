import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WaFloat from "@/components/WaFloat";
import Faq from "@/components/Faq";
import RegisterForm from "@/components/RegisterForm";
import ValueStack from "@/components/ValueStack";
import OfferTimer from "@/components/OfferTimer";
import Testimonials from "@/components/Testimonials";
import Icon from "@/components/Icon";
import ProgramContentBlocks from "@/components/ProgramContentBlocks";
import { getProgramBySlug } from "@/lib/programs";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";
import Image from "next/image";
import { formatJadwal, formatHari, formatJam, rupiah } from "@/lib/format";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

// Catatan: halaman ini membaca sesi member (cookie) untuk mengisi otomatis
// form pendaftaran, jadi Next selalu merender secara dinamis per-permintaan —
// `revalidate` di sini tidak berlaku efektif (tidak ada shell statis untuk
// di-ISR). Jangan tambahkan header Cache-Control publik untuk rute ini di
// next.config.ts karena HTML-nya bisa memuat data pribadi member (nama,
// email, WhatsApp, instansi).

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

const TYPE_CLASS: Record<ProgramType, string> = {
  WEBINAR: "type-webinar",
  KELAS: "type-kelas",
  WORKSHOP: "type-workshop",
  BOOTCAMP: "type-bootcamp",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { program } = await getProgramBySlug(slug);
  if (!program) return { title: "Program tidak ditemukan" };

  const title = `${program.title} — Kursus AI Bersertifikat`;
  return {
    title,
    description: program.tagline,
    alternates: { canonical: `/program/${program.slug}` },
    openGraph: {
      type: "website",
      title,
      description: program.tagline,
      images: program.imageUrl ? [{ url: program.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: program.tagline,
      images: program.imageUrl ? [program.imageUrl] : undefined,
    },
  };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { program } = await getProgramBySlug(slug);
  if (!program) notFound();

  const sessionVal = await getMemberSession();
  let memberProfile = null;
  let isAlreadyRegistered = false;
  if (sessionVal) {
    // Parallel queries untuk profil member & cek registrasi
    const [user, lastReg, existingReg] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [{ email: sessionVal }, { whatsapp: sessionVal }],
        },
        select: {
          name: true,
          email: true,
          whatsapp: true,
        },
      }),
      prisma.registration.findFirst({
        where: {
          OR: [{ email: sessionVal }, { whatsapp: sessionVal }],
        },
        select: {
          name: true,
          email: true,
          whatsapp: true,
          institution: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.registration.findFirst({
        where: {
          programId: program.id,
          OR: [{ email: sessionVal }, { whatsapp: sessionVal }],
        },
      }),
    ]);

    if (user) {
      memberProfile = {
        name: user.name || lastReg?.name || "",
        email: user.email || lastReg?.email || "",
        whatsapp: user.whatsapp || lastReg?.whatsapp || "",
        institution: lastReg?.institution || "",
      };
    } else if (lastReg) {
      memberProfile = {
        name: lastReg.name,
        email: lastReg.email,
        whatsapp: lastReg.whatsapp,
        institution: lastReg.institution,
      };
    }

    if (existingReg) {
      isAlreadyRegistered = true;
    }
  }

  const isFree = program.price === 0;
  const hasBlocks = !!(program.contentBlocks && program.contentBlocks.length > 0);
  const isTeacherProgram = program.slug === "modul-ajar-ai-untuk-guru";
  const isAiForTeachers = program.slug === "ai-for-teachers";
  const isZeroHuman = program.slug === "zero-human-company";
  const jadwal = formatJadwal(program.scheduleAt);
  const priceLabel = isFree ? "GRATIS" : rupiah(program.price);
  const earlyBirdDeadline = new Date(Date.now() + 5 * 86400000).toISOString();


  const faqItems = isAiForTeachers
    ? [
        {
          q: "Apakah program ini benar-benar gratis?",
          a: "Ya, sesi webinar ini 100% gratis tanpa biaya pendaftaran. Anda bisa mengikuti seluruh sesi live dan mengakses materi LMS tanpa dipungut biaya.",
        },
        {
          q: "Apakah cocok untuk pemula yang tidak paham AI?",
          a: "Sangat cocok. Program ini dirancang khusus untuk guru tanpa latar belakang IT atau AI. Semua demo dipandu langkah demi langkah.",
        },
        {
          q: "Bagaimana jika berhalangan hadir pada sesi live?",
          a: "Rekaman sesi tersedia dan dapat diakses kapan saja melalui LMS. Anda tetap bisa mengikuti seluruh materi.",
        },
        {
          q: "Apa saja yang perlu disiapkan?",
          a: "Cukup HP atau laptop dengan koneksi internet. Tidak perlu install software khusus — semua tools berbasis web.",
        },
      ]
    : isZeroHuman
    ? [
        {
          q: "Saya nggak bisa coding, apa bisa ikut?",
          a: "Bisa banget. Workshop ini pake antarmuka visual. Kalau kamu bisa kirim WhatsApp dan buka browser, kamu sudah bisa ikut. Nggak perlu 1 baris kode pun.",
        },
        {
          q: "Agent-nya langsung bisa dipakai setelah workshop?",
          a: "Ya. Setiap sesi praktik langsung bangun Agent dan connect ke WhatsApp kamu. Selesai workshop, Agent udah siap kerja. Bukan teori — beneran jalan.",
        },
        {
          q: "Apa bedanya sama webinar biasa?",
          a: "Kalau webinar: dengerin 2 jam, selesai, lupain. Kalau workshop ini: kamu bikin sendiri 6 Agent, dipandu langkah demi langkah. Pulang bawa hasil yang beneran kerja.",
        },
        {
          q: "Ada garansi uang kembali nggak?",
          a: "Ada. 100% uang kembali jika workshop nggak sesuai deskripsi. Kami percaya sama kualitas — kamu juga harus percaya sebelum bayar.",
        },
        {
          q: "Sertifikat termasuk di harga Rp225rb?",
          a: "Iya, sudah termasuk. e-Sertifikat resmi QR code bisa kamu dapatkan setelah workshop. Nggak ada biaya tambahan.",
        },
        {
          q: "Apa yang harus saya siapkan?",
          a: "Laptop/komputer (browser aja, nggak perlu install apapun), koneksi internet 5 Mbps, dan nomor WA aktif buat connect Agent.",
        },
      ]
    : [
        {
          q: isFree ? "Apakah program ini benar-benar gratis?" : "Apakah ada biaya tambahan?",
          a: isFree
            ? "Ya, sesi webinar ini 100% gratis tanpa biaya pendaftaran."
            : "Tidak ada. ${rupiah(program.price)} sudah mencakup seluruh materi, akses, dan e-sertifikat.",
        },
        {
          q: "Apakah cocok untuk pemula?",
          a: "Ya. Program ini dirancang untuk peserta tanpa latar belakang khusus, dengan penyampaian yang mudah diikuti.",
        },
        {
          q: "Bagaimana jika berhalangan hadir pada sesi live?",
          a: "Rekaman sesi tersedia dan dapat diakses kapan saja. Anda tetap dapat menyelesaikan evaluasi dan memperoleh sertifikat.",
        },
        {
          q: "Kapan sertifikat diterbitkan?",
          a: "Secara otomatis setelah Anda dinyatakan lulus evaluasi — dengan garansi penerbitan maksimal 1×24 jam.",
        },
      ];

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.title,
    description: program.description,
    provider: {
      "@type": "Organization",
      name: "Jetschool Academy",
      sameAs: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: program.price,
      priceCurrency: "IDR",
      category: isFree ? "Free" : "Paid",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/program/${program.slug}`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      startDate: program.scheduleAt.toISOString(),
      instructor: { "@type": "Person", name: program.mentorName },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Program", item: `${SITE_URL}/program` },
      { "@type": "ListItem", position: 3, name: program.title, item: `${SITE_URL}/program/${program.slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Navigasi minimal: logo + satu tombol. */}
      <Navbar minimal ctaHref={isAlreadyRegistered ? "/member" : "#daftar"} ctaLabel={isAlreadyRegistered ? "Buka Dashboard" : (isFree ? "Daftar Gratis" : "Daftar")} />

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="container">
          <div className="prg-hero-wrap">

            {/* Kolom kiri — teks */}
            <div className="prg-hero-content">
              <span className={`type-tag ${TYPE_CLASS[program.type]}`} style={{ marginBottom: "1.2rem", display: "inline-block" }}>
                {TYPE_LABEL[program.type]}
              </span>
              <h1 className="prg-hero-h1">{program.title}</h1>
              <p className="prg-hero-lead">{program.tagline}</p>
              {isZeroHuman && (
                <div style={{ marginTop: "1.2rem", padding: "0.7rem 1.2rem", background: "rgba(46, 204, 113, 0.08)", borderLeft: "4px solid #27ae60", borderRadius: "0 12px 12px 0", display: "inline-block" }}>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#27ae60" }}>
                    💤 Owner tidur — bisnis tetap jalan.
                  </p>
                </div>
              )}
            </div>

            {/* Kolom kanan — Gambar Program (upload admin) atau ilustrasi bawaan */}
            <div className="prg-hero-visual">
              <div className={`prg-hero-image-panel ${program.imageUrl ? "prg-hero-image-panel-dynamic" : ""}`}>
                {program.imageUrl ? (
                  <Image
                    src={program.imageUrl}
                    alt={program.title}
                    width={600}
                    height={400}
                    className="prg-hero-image-dynamic"
                    priority
                  />
                ) : (
                  <Image
                    src="/hero2.webp"
                    alt={program.title}
                    fill
                    className="prg-hero-image"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== DESCRIPTION & CTA BAR ===== */}
      <section className="section-sm" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="container">
          <div className={hasBlocks ? "prg-desc-cta-card no-desc" : "prg-desc-cta-card"}>
            {!hasBlocks && (
              <div className="prg-desc-col">
                <h3 className="prg-desc-title">Deskripsi Program</h3>
                <p className="prg-desc-text">{program.description}</p>
              </div>
            )}
            <div className="prg-cta-col">
              {isAlreadyRegistered ? (
                <Link href="/member" className="btn btn-purple btn-lg btn-block" style={{ width: "100%", textAlign: "center" }}>
                  Buka Kelas di Dashboard
                </Link>
              ) : (
                <a href="#daftar" className="btn btn-purple btn-lg btn-block" style={{ width: "100%", textAlign: "center" }}>
                  {isFree ? "Daftar Gratis Sekarang" : `Daftar — ${priceLabel}`}
                </a>
              )}
              {!isFree && program.priceOld && (
                <span className="prg-hero-strike" style={{ color: "var(--ink-soft)", textDecoration: "line-through", display: "block", textAlign: "center", marginTop: "0.2rem" }}>
                  {rupiah(program.priceOld)}
                </span>
              )}
              <div className="prg-cta-meta-list" style={{ marginTop: "0.5rem" }}>
                <div className="cta-meta-item">
                  <Icon name="calendar" size={14} />
                  <span>{formatHari(program.scheduleAt)}, {formatJam(program.scheduleAt)}</span>
                </div>
                <div className="cta-meta-item">
                  <Icon name="award" size={14} />
                  <span>{isAiForTeachers ? "Live Zoom 2 jam · 6 Demo Langsung" : isZeroHuman ? "Live Zoom 3 jam · 6 AI Agent" : "Komunitas + Rekaman + Sertifikat 32 JP"}</span>
                </div>
              </div>
              <OfferTimer target={program.scheduleAt.toISOString()} note="Sesi dimulai dalam" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== BODY: editor blok (jika ada) menggantikan seluruh section di bawah ini ===== */}
      {hasBlocks ? (
        <section className="section">
          <div className="container">
            <ProgramContentBlocks blocks={program.contentBlocks ?? []} />
          </div>
        </section>
      ) : (
      <>
      {/* ===== KHUSUS GURU: PERSUASIF & RELEVAN ===== */}
      {isTeacherProgram && (
        <>
          {/* Section 1: Pain Points & Tantangan Guru */}
          <section className="section" style={{ background: "var(--chip)", paddingBottom: "3.5rem" }}>
            <div className="container">
              <div className="section-head center">
                <span className="type-tag type-kelas" style={{ marginBottom: "0.8rem" }}>Masalah &amp; Tantangan</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Administrasi Mengajar Menyita Waktu Anda?</h2>
                <p style={{ maxWidth: "36rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                  Sebagai pendidik, waktu berharga Anda seharusnya fokus mendampingi siswa, bukan habis di depan laptop untuk administrasi Kurikulum Merdeka.
                </p>
              </div>

              <div className="pain-points-grid" style={{ marginTop: "2.5rem" }}>
                <div className="pain-card problem-card">
                  <div className="pain-icon-wrapper">
                    <Icon name="alert-triangle" size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Beban Administrasi Modul Ajar</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
                      Menyusun CP, TP, ATP, Asesmen, hingga RPP Kurikulum Merdeka secara manual dari nol sangat menyita waktu istirahat guru.
                    </p>
                  </div>
                </div>

                <div className="pain-card solution-card">
                  <div className="pain-icon-wrapper">
                    <Icon name="check" size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Solusi Asisten AI Guru</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
                      Pangkas waktu penyusunan administrasi menjadi hanya 2 menit. Dapatkan draf utuh berformat Microsoft Word (.docx) siap pakai dan siap edit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Product Preview / Cara Kerja */}
          <section className="section">
            <div className="container">
              <div className="hero-card" style={{ alignItems: "center", gap: "3rem" }}>
                <div style={{ flex: 1 }}>
                  <span className="type-tag type-webinar" style={{ marginBottom: "0.8rem" }}>Demo Aplikasi</span>
                  <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginBottom: "1rem" }}>
                    Intip Kemudahan Membuat Modul Ajar RPP
                  </h2>
                  <p style={{ color: "var(--ink-soft)", marginBottom: "1.2rem", lineHeight: 1.6 }}>
                    Tidak perlu lagi bingung menulis perintah prompt AI yang rumit. Cukup pilih mata pelajaran, kelas, dan topik materi pokok. Sistem AI kami akan merancang modul ajar Kurikulum Merdeka yang terstruktur lengkap.
                  </p>
                  <ul className="check-list" style={{ gap: "0.8rem" }}>
                    <li>Menghasilkan Capaian &amp; Tujuan Pembelajaran secara runtun</li>
                    <li>Menyusun skenario aktivitas pembelajaran berbasis keaktifan siswa</li>
                    <li>Dilengkapi instrumen asesmen rubrik penilaian dan LKPD siswa</li>
                    <li>Unduh instan format Word (.docx) langsung ke laptop/ponsel Anda</li>
                  </ul>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <div className="mock-browser">
                    <div className="mock-browser-header">
                      <span className="mock-dot mock-dot-red"></span>
                      <span className="mock-dot mock-dot-yellow"></span>
                      <span className="mock-dot mock-dot-green"></span>
                      <div className="mock-browser-address">guru.jetschool.id/asisten-ai</div>
                    </div>
                    <div className="mock-browser-content">
                      <Image
                        src="/asisten_ai_guru_preview.png"
                        alt="Preview Asisten AI Guru"
                        width={600}
                        height={400}
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: PMM Bukti Dukung Validation */}
          <section className="section" style={{ background: "var(--chip)", paddingTop: "3rem", paddingBottom: "3rem" }}>
            <div className="container">
              <div className="bento pmm-validation-box" style={{ background: "var(--white)", border: "1px solid var(--border)", padding: "2.5rem" }}>
                <div className="section-head" style={{ marginBottom: "2rem" }}>
                  <span className="type-tag type-kelas" style={{ marginBottom: "0.8rem", background: "rgba(35, 33, 118, 0.08)", color: "var(--purple)" }}>Validasi PMM</span>
                  <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", marginBottom: "0.8rem" }}>
                    Sertifikat Pelatihan Nasional 32 JP Resmi &amp; Valid
                  </h2>
                  <p style={{ color: "var(--ink-soft)", maxWidth: "42rem", lineHeight: 1.6 }}>
                    Khawatir sertifikat Anda ditolak di PMM? Kami memastikan sertifikat yang Anda dapatkan memiliki kelayakan administrasi penuh untuk menunjang Sasaran Kinerja Pegawai (SKP) Anda.
                  </p>
                </div>

                <div className="pmm-grid">
                  <div className="pmm-card">
                    <span className="pmm-icon-check">✓</span>
                    <span className="pmm-text">Tanda Tangan &amp; Cap Resmi</span>
                  </div>
                  <div className="pmm-card">
                    <span className="pmm-icon-check">✓</span>
                    <span className="pmm-text">QR Code Verifikasi Online</span>
                  </div>
                  <div className="pmm-card">
                    <span className="pmm-icon-check">✓</span>
                    <span className="pmm-text">Rincian Struktur Materi Lengkap</span>
                  </div>
                  <div className="pmm-card">
                    <span className="pmm-icon-check">✓</span>
                    <span className="pmm-text">Bukti Dukung Valid PMM</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== AI FOR TEACHERS: PERSEMBAHAN 6 DEMO + FREE LMS ===== */}
      {isAiForTeachers && (
        <>
          {/* Section 1: 6 Demo — Apa yang Akan Anda Kuasai */}
          <section className="section" style={{ paddingBottom: "3.5rem" }}>
            <div className="container">
              <div className="section-head center">
                <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>6 Demo Langsung</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Dalam 2 Jam, Kuasai 6 Metode AI untuk Mengajar</h2>
                <p style={{ maxWidth: "36rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                  Sesi live Zoom interaktif — lihat langsung, praktikkan sendiri, hasil instan.
                </p>
              </div>

              <div className="hero-card" style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
                {[
                  { icon: "📝", title: "Modul Ajar RPP", desc: "Buat Modul Ajar Kurikulum Merdeka lengkap dengan 1 prompt sederhana. Hasil dalam 2 menit.", time: "20 menit" },
                  { icon: "🧠", title: "Soal HOTS", desc: "Hasilkan soal HOTS dengan stimulus studi kasus, kunci jawaban, dan indikator soal.", time: "15 menit" },
                  { icon: "🎬", title: "Video Pembelajaran", desc: "Dari script → gambar → video bergerak → siap tayang. Alur AI terstruktur.", time: "20 menit" },
                  { icon: "🎙️", title: "Audio Podcast", desc: "Ubah teks modul menjadi audio/podcast natural untuk siswa auditori.", time: "10 menit" },
                  { icon: "📊", title: "Presentasi AI", desc: "Generate slide dengan desain otomatis. Struktur lengkap: pembuka, isi, evaluasi.", time: "15 menit" },
                  { icon: "🎨", title: "Infografis", desc: "Visualisasikan materi abstrak jadi infografis, concept map, dan mind map.", time: "10 menit" },
                ].map((demo, i) => (
                  <div key={i} className="bento" style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--white)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <span style={{ fontSize: "2rem" }}>{demo.icon}</span>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{demo.title}</h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--purple)", fontWeight: 700 }}>⏱ {demo.time}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{demo.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== ZERO HUMAN COMPANY: 6 AI AGENT ===== */}
      {isZeroHuman && (
        <>
          {/* Section 0: PAIN — Adegan Sehari-hari */}
          <section className="section" style={{ background: "var(--chip)", paddingBottom: "3.5rem" }}>
            <div className="container">
              <div className="section-head center">
                <span className="type-tag" style={{ marginBottom: "0.8rem", background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c" }}>Rasanya, Kan?</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Pernah Ngerasain Ini?</h2>
                <p style={{ maxWidth: "36rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                  Bukan salah kamu. Bisnis emang gitu. Tapi sekarang ada jalannya.
                </p>
              </div>

              <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
                {[
                  { icon: "😩", time: "Setiap hari", title: "Follow-up client? Lupa terus", desc: "Udah nego-nego, tinggal closing. Eh besoknya lupa. Pelanggan potensial lenyap gitu aja. Kehilangan duit." },
                  { icon: "😮‍💨", time: "Setiap minggu", title: "Cari customer baru? Capek", desc: "Harus promosi manual, chat satu-satu, hunting prospek sendiri. Hasil? Nggak sebanding sama tenaga yang dikeluarin." },
                  { icon: "😤", time: "Setiap malam", title: "Bikin laporan? Ngitung manual", desc: "Setelah tutup toko, masih harus rekap pemasukan, stok, pengeluaran. Pake kalkulator HP. Capek, rentan salah." },
                  { icon: "😩", time: "Setiap saat", title: "Kelola website sendiri? Bingung", desc: "Mau update konten, ganti promo, tambah produk. Tapi ribet, harus call teknisi, bayar lagi. Jadinya diemin aja." },
                  { icon: "😫", time: "Setiap bulan", title: "Gaji 2 orang Rp7jt — kerjaan nggak beres", desc: "Bayar karyawan buat CS, admin, sales. Tapi masih harus ngecek. Uang keluar, kepala pusing." },
                  { icon: "😰", time: "Setiap saat", title: "Bingung mulai pake AI", desc: "Tools AI di luar banyak, tapi ribet, perlu coding, mahal. Kamu cuma mau yang beneran jalan — langsung kepake." },
                ].map((pain, i) => (
                  <div key={i} className="bento" style={{ padding: "1.5rem", border: "1px solid rgba(231, 76, 60, 0.15)", background: "var(--white)", borderRadius: "var(--r-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" }}>
                      <span style={{ fontSize: "2rem" }}>{pain.icon}</span>
                      <div>
                        <span style={{ fontSize: "0.72rem", color: "var(--purple)", fontWeight: 700 }}>{pain.time}</span>
                        <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>{pain.title}</h3>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{pain.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--purple)" }}>
                  ✋ Tenang — ini bukan akhir. Ini awal dari solusinya. 👇
                </p>
              </div>
            </div>
          </section>

          {/* Section 0.5: TESTIMONI REAL */}
          <section className="section" style={{ paddingBottom: "3.5rem" }}>
            <div className="container">
              <div className="section-head center">
                <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Kata Mereka</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Yang Udah Ikut Bilang...</h2>
              </div>
              <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {[
                  { name: "Rina Wijaya", role: "Owner UMKM Fashion", text: "Dulu saya balas WA pelanggan sampe jam 12 malem sendiri. Sekarang CS Agent yang handle — saya tinggal tidur. Pelanggan seneng, saya juga seneng.", stars: 5 },
                  { name: "Dimas Pratama", role: "Founder Startup Kreatif", text: "Konten agency saya dulu mandek berminggu-minggu. Content Agent sekarang nulis artikel tiap minggu. Tinggal set topik, beres.", stars: 5 },
                  { name: "Sari Dewi", role: "Owner Bisnis Jasa", text: "Sales Agent yang follow-up otomatis bikin booking naik 40% dalam sebulan. Saya nggak nyangka segampang ini.", stars: 5 },
                ].map((t, i) => (
                  <div key={i} className="bento" style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--white)", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <div style={{ fontSize: "0.9rem", color: "#f59e0b", letterSpacing: "2px" }}>{'★'.repeat(t.stars)}</div>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--ink-soft)", fontStyle: "italic", margin: 0 }}>"{t.text}"</p>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem", marginTop: "auto" }}>
                      <b style={{ fontSize: "0.9rem" }}>{t.name}</b>
                      <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", margin: 0 }}>{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 1: 6 AI Agent Cards */}
          <section className="section" style={{ paddingBottom: "3.5rem" }}>
            <div className="container">
              <div className="section-head center">
                <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>6 AI Agent Siap Pakai</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Dalam 3 Jam, Praktekkan Langsung 6 AI Agent untuk Bisnis Anda</h2>
                <p style={{ maxWidth: "36rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                  Bukan teori — Anda yang membangun sendiri, dipandu langkah demi langkah. Agent Anda terhubung ke WhatsApp sebelum workshop selesai.
                </p>
              </div>
              
              <div className="eb-card" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                <div className="eb-top">
                  <span className="eb-badge">
                    <span className="eb-badge-dot" />
                    🔥 Early Bird
                  </span>
                  <span className="eb-deadline">⏰ Sampai H-4 sebelum workshop</span>
                </div>
                <div className="eb-price-row">
                  <span className="eb-price">Rp 225.000</span>
                  <span className="eb-price-old">Rp 490.000</span>
                  <span className="eb-save">Hemat 54%</span>
                </div>
                <p className="eb-note">Kunci harga spesial ini sekarang — setelah H-4 sebelum workshop, harga kembali ke Rp 490.000.</p>
                <div style={{ marginTop: "0.8rem" }}>
                  <OfferTimer target={earlyBirdDeadline} note="🔥 Promo early bird berakhir dalam" />
                </div>
              </div>

              <div className="hero-card" style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
                {[
                  { icon: "💬", title: "Customer Service Agent", desc: "Jawab pertanyaan pelanggan di WhatsApp 24 jam. Paham produk Anda, bisa cek status pesanan, jam operasional.", time: "45 menit" },
                  { icon: "✍️", title: "Content Agent", desc: "Tulis & publikasi artikel blog otomatis ke website. SEO-friendly. Cukup set topik, dia yang nulis.", time: "" },
                  { icon: "📢", title: "Marketing Agent", desc: "Riset kata kunci, buat caption promosi, jadwalkan konten media sosial. Satu perintah, semua beres.", time: "40 menit" },
                  { icon: "🤝", title: "Sales Agent", desc: "Follow-up prospek otomatis & terstruktur. Kirim pesan terjadwal, catat status, tutup lebih banyak deal.", time: "" },
                  { icon: "🔧", title: "Developer Agent", desc: "Perbaiki bug & tambah fitur website tanpa coding. Cukup jelaskan apa yang ingin diubah.", time: "25 menit" },
                  { icon: "📊", title: "Report Agent", desc: "Kirim laporan bisnis harian via WhatsApp setiap pagi. Tahu persis perkembangan bisnis tanpa buka dashboard.", time: "40 menit" },
                ].map((agent, i) => (
                  <div key={i} className="bento" style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--white)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <span style={{ fontSize: "2rem" }}>{agent.icon}</span>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{agent.title}</h3>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{agent.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: What to Prepare */}
          <section className="section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
            <div className="container">
              <div className="bento" style={{ padding: "2rem", border: "1px solid var(--border)" }}>
                <div className="section-head center" style={{ marginBottom: "1.5rem" }}>
                  <span className="type-tag type-webinar" style={{ marginBottom: "0.8rem", background: "rgba(230, 126, 34, 0.08)", color: "#e67e22" }}>Persiapan</span>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>Yang Perlu Disiapkan</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", maxWidth: "40rem", marginInline: "auto" }}>
                  {[
                    { icon: "💻", title: "Laptop/Komputer", desc: "Bukan HP — Anda perlu browser untuk mengatur dashboard Agent." },
                    { icon: "📶", title: "Internet Stabil", desc: "Koneksi minimal 5 Mbps untuk mengikuti sesi live Zoom." },
                    { icon: "📱", title: "WhatsApp Aktif", desc: "Nomor WA untuk menghubungkan Agent — bisa nomor bisnis atau pribadi." },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "1rem" }}>
                      <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>{item.icon}</span>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.3rem" }}>{item.title}</h3>
                      <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.4, margin: 0 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Bayangkan Jika — Before vs After AI Agent */}
          <section className="section" style={{ background: "var(--chip)", paddingTop: "3rem", paddingBottom: "3rem" }}>
            <div className="container">
              <div className="section-head center">
                <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem", background: "rgba(108, 92, 231, 0.08)", color: "var(--purple)" }}>Bayangkan Jika</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Bisnis Anda Tanpa vs Dengan 6 AI Agent</h2>
                <p style={{ maxWidth: "36rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                  Perubahan kecil — dampak besar. Lihat sendiri perbedaan sebelum dan sesudah.
                </p>
              </div>
              <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", maxWidth: "40rem", marginInline: "auto" }}>
                <div className="bento" style={{ padding: "2rem", border: "1px solid rgba(231, 76, 60, 0.2)", background: "rgba(231, 76, 60, 0.03)", borderRadius: "var(--r-md)" }}>
                  <span className="type-tag" style={{ background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c", marginBottom: "1rem", display: "inline-block", fontWeight: 800 }}>Tanpa AI Agent</span>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {[
                      { icon: "😤", text: "Pelanggan WA menumpuk — balas satu per satu, sering telat" },
                      { icon: "📝", text: "Bikin konten & artikel manual — butuh waktu berjam-jam" },
                      { icon: "📉", text: "Follow-up prospek keteteran — banyak bocor" },
                      { icon: "⏰", text: "Rekap laporan bisnis manual — rentan salah" },
                      { icon: "💸", text: "Bayar 2-3 karyawan untuk tugas repetitif" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bento" style={{ padding: "2rem", border: "1px solid rgba(46, 204, 113, 0.2)", background: "rgba(46, 204, 113, 0.03)", borderRadius: "var(--r-md)" }}>
                  <span className="type-tag" style={{ background: "rgba(46, 204, 113, 0.1)", color: "#27ae60", marginBottom: "1rem", display: "inline-block", fontWeight: 800 }}>Dengan AI Agent</span>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {[
                      { icon: "🤖", text: "CS Agent jawab pelanggan 24 jam — langsung, cepat, konsisten" },
                      { icon: "✍️", text: "Content Agent tulis & publish artikel — tinggal set topik" },
                      { icon: "📈", text: "Sales Agent follow-up otomatis — deal meningkat" },
                      { icon: "📊", text: "Report Agent kirim laporan harian — otomatis ke WA" },
                      { icon: "💰", text: "Hemat biaya: 6 Agent = Rp 0 karyawan tambahan" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Gelombang AI Agent Global */}
          <section className="section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
            <div className="container">
              <div className="bento" style={{ padding: "2.5rem", border: "1px solid var(--border)", background: "var(--white)", borderRadius: "var(--r-md)" }}>
                <div className="section-head center" style={{ marginBottom: "2rem" }}>
                  <span className="type-tag type-kelas" style={{ marginBottom: "0.8rem", background: "rgba(35, 33, 118, 0.08)", color: "var(--purple)" }}>Gelombang Global</span>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>China Menargetkan 70% Perusahaan Gunakan AI Agent pada 2027</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--chip)", borderRadius: "var(--r-md)" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--purple)", display: "block" }}>¥890</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>MILIYAR</span>
                    <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>Investasi AI China 2026<br/>(~$125 Miliar — 38% global)</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--chip)", borderRadius: "var(--r-md)" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--orange)", display: "block" }}>70%</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>TARGET 2027</span>
                    <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>Adopsi AI Agent di sektor<br/>kunci — target negara</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--chip)", borderRadius: "var(--r-md)" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#2ecc71", display: "block" }}>250<span style={{ fontSize: "1.2rem" }}> Juta</span></span>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>PENGGUNA AI</span>
                    <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>Pengguna AI generatif<br/>di China (Feb 2025)</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--chip)", borderRadius: "var(--r-md)" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#e67e22", display: "block" }}>90%</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>TARGET 2030</span>
                    <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>Target adopsi AI penuh<br/>di seluruh sektor</p>
                  </div>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--ink-faint)", textAlign: "center", marginTop: "1rem", lineHeight: 1.5 }}>
                  Sumber: State Council China — "AI+" Initiative (Agustus 2025) · Second Talent (2026) · Fortune Business Insights / Roland Berger (2025)
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== VALUE STACK + MATERI ===== */}
      <section className="section">
        <div className="container">
          <div className="hero-card">
            <div className="bento reveal">
              <h2 style={{ marginBottom: "1.2rem" }}>Yang Anda <span className="acc-p">terima</span></h2>
              <ValueStack
                deliverables={program.deliverables}
                price={isFree ? 0 : program.price}
                priceOld={isFree ? null : program.priceOld}
                ctaHref="#daftar"
                ctaLabel={isFree ? "Ikuti Sesi Gratis" : "Daftar Sekarang"}
                isFree={isFree}
              />
              {isFree && (
                <p className="reg-note">* Seluruh fasilitas di atas dapat diakses secara gratis oleh peserta webinar.</p>
              )}
            </div>
            <div className="bento reveal">
              <h2 style={{ marginBottom: "1.2rem" }}>Yang Anda <span className="acc-o">pelajari</span></h2>
              <ul className="check-list">
                {program.materi.slice(0, 5).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
              <div className="chip-box" style={{ marginTop: ".8rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                <span className="dot-btn dot-p"><Icon name="user" /></span>
                <div>
                  <h3>{program.mentorName}</h3>
                  <p>{program.mentorBio}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== JAMINAN PENERBITAN ===== */}
      {program.guarantee && !isFree && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container reveal">
            <div className="guarantee" style={{ background: "rgba(108, 92, 231, 0.05)", border: "1px solid rgba(108, 92, 231, 0.1)" }}>
              <div className="seal" style={{ background: "var(--purple)" }}>INFO<br />RESMI</div>
              <div>
                <h3>Penerbitan e-Sertifikat</h3>
                <p>{program.guarantee}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      </>
      )}

      {/* ===== ALASAN IKUT (khusus guru) ===== */}
      {isAiForTeachers ? (
        <section className="section" id="kenapa-pilih">
          <div className="container">
            <div className="bento reveal">
              <div className="section-head">
                <h2>Kenapa Ikut <span className="acc-o">Program Ini</span>?</h2>
                <p className="lead" style={{ color: "var(--ink-soft)" }}>
                  Dirancang khusus untuk guru — tanpa jargon teknis, langsung praktik.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
                {[
                  { icon: "⚡", title: "Praktik Langsung, Bukan Teori", desc: "Setiap sesi demo langsung — lihat, tiru, praktikkan sendiri. Pulang-pulang sudah bisa bikin modul ajar." },
                  { icon: "🎓", title: "Dirancang untuk Guru", desc: "Materi disesuaikan dengan kebutuhan guru Indonesia. Dari modul ajar, soal HOTS, hingga media pembelajaran." },
                  { icon: "🤖", title: "Gratis Akses AI Tools", desc: "Dapatkan akses ke platform AI yang sudah dioptimalkan untuk kebutuhan pembelajaran Kurikulum Merdeka." },
                  { icon: "💬", title: "Bimbingan Komunitas", desc: "Bergabung dengan grup WhatsApp alumni. Tanya jawab, sharing, dan dukungan dari sesama guru." },
                  { icon: "📱", title: "Bisa dari HP", desc: "Tidak perlu laptop canggih. Cukup HP dan koneksi internet — semua demo bisa diikuti dari ponsel." },
                  { icon: "🔁", title: "Rekaman Bisa Ditonton Ulang", desc: "Tidak sempat ikut live? Rekaman webinar tersedia. Belajar kapan saja, di mana saja." },
                ].map((r, i) => (
                  <div key={i} style={{ background: "var(--chip)", borderRadius: "16px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span style={{ fontSize: "2rem" }}>{r.icon}</span>
                    <b style={{ fontSize: "1rem", marginTop: "0.3rem" }}>{r.title}</b>
                    <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Testimonials limit={3} />
      )}

      {/* ===== FORM DAFTAR ===== */}
      <section className="section" id="daftar">
        <div className="container">
          <div className="bento bento-purple reveal" style={{ padding: "clamp(1rem, 5vw, 3rem)" }}>
            <div className="hero-card" style={{ alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "clamp(1.9rem, 4.5vw, 3rem)", marginBottom: ".8rem" }}>
                  Amankan kursi Anda.
                </h2>
                <p style={{ fontWeight: 700, opacity: .85 }}>
                  Pendaftaran satu menit. Akses instan di web &amp; dikirim via WhatsApp.
                </p>
              </div>
              <RegisterForm
                programSlug={program.slug}
                programTitle={program.title}
                jadwal={jadwal}
                price={program.price}
                priceLabel={priceLabel}
                memberProfile={memberProfile}
                isAlreadyRegistered={isAlreadyRegistered}
                batches={program.batches?.map((b) => ({ id: b.id, scheduleAt: b.scheduleAt.toISOString(), seatsLeft: b.seatsLeft }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section">
        <div className="container">
          <div className="bento reveal">
            <div className="section-head center">
              <h2>Pertanyaan umum.</h2>
            </div>
            <Faq items={faqItems} />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-card-premium">
            {/* Column 1: Brand Info */}
            <div className="footer-brand-sec">
              <div className="brand">
                <Image
                  src="/iconjetschool academy.png"
                  alt="Jetschool Academy"
                  width={40}
                  height={40}
                  style={{ objectFit: "contain" }}
                />
                <span className="brand-title">Jetschool Academy</span>
              </div>
              <p className="footer-company-name">PT Jetschool Academy Indonesia</p>
              <p className="footer-ahu">AHU-0056382.AH.01.01.TAHUN 2020</p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="footer-nav-group">
              <h4 className="footer-nav-title">Aksi</h4>
              <nav className="footer-nav-links">
                <Link href="/">Kembali ke Beranda</Link>
              </nav>
            </div>

            {/* Column 3: Legal Links */}
            <div className="footer-nav-group">
              <h4 className="footer-nav-title">Hukum & Kebijakan</h4>
              <nav className="footer-nav-links">
                <Link href="/terms">Syarat & Ketentuan</Link>
                <Link href="/privacy-policy">Kebijakan Privasi</Link>
              </nav>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Jetschool Academy. Semua hak dilindungi.</span>
          </div>
        </div>
      </footer>

      <div className="sticky-spacer" />

      {/* Bar CTA lengket di mobile */}
      <div className="sticky-cta">
        <div><b>{priceLabel}</b><small>{formatHari(program.scheduleAt)}, {formatJam(program.scheduleAt)}</small></div>
        {isAlreadyRegistered ? (
          <Link href="/member" className="btn btn-lime">Buka Kelas</Link>
        ) : (
          <a href="#daftar" className="btn btn-lime">{isFree ? "Daftar Gratis" : "Daftar"}</a>
        )}
      </div>

      <WaFloat text={`Halo, saya ingin bertanya mengenai program ${program.title}`} />
    </>
  );
}
