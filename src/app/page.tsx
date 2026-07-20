import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";
import Faq from "@/components/Faq";
import Icon, { TYPE_ICON } from "@/components/Icon";
import { getPrograms } from "@/lib/programs";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";
import { formatHari, formatJam, rupiah, getDaysLeft } from "@/lib/format";

// ISR: regenerate setiap 5 menit. Program jarang berubah & tidak ada data personal di sini.
export const revalidate = 300;

const TYPE_CLASS: Record<ProgramType, string> = {
  WEBINAR: "type-webinar",
  KELAS: "type-kelas",
  WORKSHOP: "type-workshop",
  BOOTCAMP: "type-bootcamp",
};

const FAQ_ITEMS = [
  {
    q: "Apakah program benar-benar gratis?",
    a: "Ya. Program gratis dapat diikuti tanpa biaya pendaftaran. Untuk program berbayar, seluruh biaya sudah mencakup materi, akses, dan pendampingan.",
  },
  {
    q: "Bagaimana cara mengikuti program?",
    a: "Daftar melalui halaman program, ikuti sesi sesuai jadwal, dan akses materi pembelajaran melalui dashboard member Anda.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "QRIS, transfer bank (virtual account), OVO, DANA, GoPay, dan ShopeePay. Seluruh transaksi diproses secara aman melalui Xendit.",
  },
  {
    q: "Bagaimana jika saya berhalangan hadir pada sesi live?",
    a: "Setiap sesi terekam dan dapat diakses kembali melalui LMS. Anda tetap bisa mengikuti seluruh materi kapan saja.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default async function Home() {
  const { programs } = await getPrograms();

  const webinarGratis = programs.find((p) => p.type === "WEBINAR" && p.price === 0);
  const programTerdekat = webinarGratis ?? programs[0] ?? null;
  const daysLeft = programTerdekat
    ? getDaysLeft(programTerdekat.scheduleAt)
    : null;

  // Filter programs based on featured status.
  const displayPrograms = programs.filter((p) => p.isFeatured);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar ctaHref="/program" ctaLabel="Lihat Program" />

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="container">
          <div className="hero-wrap">
            {/* Kolom kiri: teks */}
            <div className="hero-content">
              <span className="kicker kicker-ai">
                <span className="kicker-dot" />
                Platform Pelatihan AI Bersertifikat
              </span>
              <h1 className="hero-h1">
                Bangun Talenta<br />
                <span className="hero-h1-accent">AI Masa Depan.</span>
              </h1>
              <p className="lead hero-lead">
                Belajar AI dari praktisi, ikuti pelatihan bersertifikat, dapatkan pendampingan, dan bergabung dengan komunitas yang terus berkembang.
              </p>
              <div className="hero-cta">
                <Link href="/program" className="btn btn-purple btn-lg">Lihat Program</Link>
                <a href="#cara" className="btn btn-line btn-lg">Cara Kerjanya</a>
              </div>
            </div>

            {/* Kolom kanan: gambar */}
            <div className="hero-visual-wrap">
              <div className="hero-img-wrap">
                <Image
                  src="/hero2.webp"
                  alt="Peserta Jetschool Academy sedang belajar"
                  width={511}
                  height={416}
                  priority
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROGRAM ===== */}
      <section className="section" id="program">
        <div className="container">
          <div className="bento reveal">
            <div className="section-head">
              <h2>Program Unggulan Pilihan.</h2>
              <p className="lead" style={{ marginTop: "0.2rem", color: "var(--ink-soft)" }}>
                Ikuti program terbaik yang direkomendasikan langsung untuk Anda.
              </p>
            </div>
            <div className="prg-grid">
              {displayPrograms.map((p) => (
                <Link key={p.slug} href={`/program/${p.slug}`} className="prg-card">
                  <div className={`prg-card-thumb ${p.imageUrl ? "prg-card-thumb-dynamic" : ""}`}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.title}
                        width={600}
                        height={480}
                        className="prg-card-thumb-img-dynamic"
                        sizes="(max-width: 780px) 92vw, 46vw"
                      />
                    ) : (
                      <span className="prg-card-thumb-fallback">{p.emoji}</span>
                    )}
                  </div>
                  <div className="prg-top">
                    <span className={`type-tag ${TYPE_CLASS[p.type]}`}>{TYPE_LABEL[p.type]}</span>
                    <span className="dot-btn dot-p" style={{ width: 38, height: 38 }}>
                      <Icon name={TYPE_ICON[p.type]} />
                    </span>
                  </div>
                  <h3>{p.title}</h3>
                  <p className="desc">{formatHari(p.scheduleAt)}, {formatJam(p.scheduleAt)} · {p.durationLabel}</p>
                  <div className="prg-foot">
                    <div className="prg-price">
                      {p.price === 0
                        ? <b className="free">GRATIS</b>
                        : <b>{rupiah(p.price)}</b>}
                      {p.priceOld && <span style={{ textDecoration: "line-through" }}>{rupiah(p.priceOld)}</span>}
                    </div>
                    <span className="dot-btn dot-k"><Icon name="arrowRight" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="section" id="cara">
        <div className="container">
          <div className="bento reveal">
            <div className="section-head">
              <h2>Tiga langkah mudah.</h2>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <h3>Daftar</h3>
                <p>Cukup nama dan nomor WhatsApp. Selesai dalam satu menit.</p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <h3>Ikuti Program</h3>
                <p>Tautan kelas dan materi dikirim otomatis melalui WhatsApp.</p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <h3>Terima Sertifikat</h3>
                <p>Lulus evaluasi akhir — e-sertifikat terbit secara otomatis.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ===== FAQ ===== */}
      <section className="section" id="faq">
        <div className="container">
          <div className="bento reveal">
            <div className="section-head center">
              <h2>Pertanyaan umum.</h2>
            </div>
            <Faq items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ===== CTA AKHIR ===== */}
      <section className="section">
        <div className="container">
          <div className="hero-card reveal">
            <div className="bento bento-orange" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 280 }}>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Mulai<br />hari ini.</h2>
              <p style={{ fontWeight: 700, fontSize: "1rem", maxWidth: "18rem" }}>
                Satu langkah kecil untuk karier yang lebih baik.
              </p>
            </div>
            <div className="bento bento-purple" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.4rem" }}>
              <div>
                <h2 style={{ marginBottom: ".5rem" }}>{webinarGratis ? "Webinar gratis" : "Program terdekat"}</h2>
                <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>
                  {webinarGratis
                    ? `${formatHari(webinarGratis.scheduleAt)}, ${formatJam(webinarGratis.scheduleAt)} — tanpa biaya.`
                    : "Pilih program yang sesuai untuk Anda."}
                </p>
                {daysLeft !== null && (
                  <span style={{
                    display: "inline-block",
                    marginTop: ".8rem",
                    background: "rgba(255,255,255,.15)",
                    border: "1px solid rgba(255,255,255,.25)",
                    color: "#fff",
                    borderRadius: "999px",
                    padding: ".3em .9em",
                    fontSize: ".8rem",
                    fontWeight: 700,
                    letterSpacing: ".04em",
                  }}>
                    {daysLeft === 0 ? "Hari ini" : daysLeft === 1 ? "Besok" : `${daysLeft} hari lagi`}
                  </span>
                )}
              </div>
              <Link href={webinarGratis ? `/program/${webinarGratis.slug}` : "/program"} className="btn btn-lime btn-lg" style={{ alignSelf: "flex-start" }}>
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
