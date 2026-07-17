import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WaFloat from "@/components/WaFloat";
import Faq from "@/components/Faq";
import RegisterForm from "@/components/RegisterForm";
import ValueStack from "@/components/ValueStack";
import Icon from "@/components/Icon";
import { getProgramBySlug } from "@/lib/programs";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";
import Image from "next/image";
import { formatJadwal, formatHari, formatJam, rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

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

  const isFree = program.price === 0;
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
            </div>
          </div>
        </div>
      </section>



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

      {/* ===== GARANSI ===== */}
      {program.guarantee && !isFree && (
        <section className="section">
          <div className="container reveal">
            <div className="guarantee">
              <div className="seal">GARANSI<br />100%</div>
              <div>
                <h3>Tanpa risiko.</h3>
                <p>{program.guarantee}</p>
              </div>
            </div>
          </div>
        </section>
      )}

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
                  Pendaftaran satu menit. Seluruh akses dikirim melalui WhatsApp.
                </p>
              </div>
              <RegisterForm
                programSlug={program.slug}
                programTitle={program.title}
                jadwal={jadwal}
                price={program.price}
                priceLabel={priceLabel}
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
