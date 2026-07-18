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
import { getProgramBySlug } from "@/lib/programs";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";
import Image from "next/image";
import { formatJadwal, formatHari, formatJam, rupiah } from "@/lib/format";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // ISR: re-generate every 1 hour

const TYPE_CLASS: Record<ProgramType, string> = {
  WEBINAR: "type-webinar",
  KELAS: "type-kelas",
  WORKSHOP: "type-workshop",
  BOOTCAMP: "type-bootcamp",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { program } = await getProgramBySlug(slug);
  if (!program) return { title: "Program tidak ditemukan — Jetschool Academy" };
  return { title: `${program.title} — Jetschool Academy`, description: program.tagline };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { program } = await getProgramBySlug(slug);
  if (!program) notFound();

  const sessionVal = await getMemberSession();
  let memberProfile = null;
  if (sessionVal) {
    memberProfile = await prisma.registration.findFirst({
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
    });
  }

  const isFree = program.price === 0;
  const isTeacherProgram = program.slug === "modul-ajar-ai-untuk-guru";
  const jadwal = formatJadwal(program.scheduleAt);
  const priceLabel = isFree ? "GRATIS" : rupiah(program.price);


  const faqItems = [
    {
      q: isFree ? "Apakah program ini benar-benar gratis?" : "Apakah ada biaya tambahan?",
      a: isFree
        ? `Ya, sesi webinar ini 100% gratis tanpa biaya pendaftaran.`
        : `Tidak ada. ${rupiah(program.price)} sudah mencakup seluruh materi, akses, dan e-sertifikat.`,
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

  return (
    <>
      {/* Navigasi minimal: logo + satu tombol. */}
      <Navbar minimal ctaHref="#daftar" ctaLabel={isFree ? "Daftar Gratis" : "Daftar"} />

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
            </div>

            {/* Kolom kanan — Hero Image Mockup */}
            <div className="prg-hero-visual">
              <div className="prg-hero-image-panel">
                <Image
                  src="/hero2.webp"
                  alt="Webinar Jetschool Academy"
                  width={600}
                  height={400}
                  className="prg-hero-image"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== DESCRIPTION & CTA BAR ===== */}
      <section className="section-sm" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="container">
          <div className="prg-desc-cta-card">
            <div className="prg-desc-col">
              <h3 className="prg-desc-title">Deskripsi Program</h3>
              <p className="prg-desc-text">{program.description}</p>
            </div>
            <div className="prg-cta-col">
              <a href="#daftar" className="btn btn-purple btn-lg btn-block" style={{ width: "100%", textAlign: "center" }}>
                {isFree ? "Daftar Gratis Sekarang" : `Daftar — ${priceLabel}`}
              </a>
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
                  <span>Komunitas + Rekaman + Sertifikat 32 JP</span>
                </div>
                {program.seatsLeft != null && (
                  <div className="cta-meta-item" style={{ color: "var(--orange)" }}>
                    <Icon name="users" size={14} />
                    <span>{program.seatsLeft} Kursi Tersisa</span>
                  </div>
                )}
              </div>
              <OfferTimer target={program.scheduleAt.toISOString()} note="Sesi dimulai dalam" />
            </div>
          </div>
        </div>
      </section>

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

      {/* ===== TESTIMONI ===== */}
      <Testimonials limit={3} />

      {/* ===== FORM DAFTAR ===== */}
      <section className="section" id="daftar">
        <div className="container">
          <div className="bento bento-purple reveal" style={{ padding: "clamp(1.6rem, 4vw, 3rem)" }}>
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
          <div className="footer-card">
            <div className="brand">
              <Image src="/iconjetschool academy.png" alt="Jetschool Academy" width={44} height={44} style={{ objectFit: "contain" }} />
              Jetschool Academy
            </div>
            <Link href="/">Kembali ke Beranda</Link>
            <span style={{ fontSize: ".78rem" }}>© {new Date().getFullYear()} Jetschool Academy</span>
          </div>
        </div>
      </footer>

      <div className="sticky-spacer" />

      {/* Bar CTA lengket di mobile */}
      <div className="sticky-cta">
        <div><b>{priceLabel}</b><small>{formatHari(program.scheduleAt)}, {formatJam(program.scheduleAt)}</small></div>
        <a href="#daftar" className="btn btn-lime">{isFree ? "Daftar Gratis" : "Daftar"}</a>
      </div>

      <WaFloat text={`Halo, saya ingin bertanya mengenai program ${program.title}`} />
    </>
  );
}
