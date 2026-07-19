import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";

export const metadata = {
  title: "Tentang Kami — Jetschool Academy",
  description: "Profil, visi, dan misi Jetschool Academy dalam memberdayakan talenta digital Indonesia.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* ===== HERO TENTANG KAMI ===== */}
      <section className="section" style={{ background: "var(--purple-soft)", padding: "5rem 0 4rem" }}>
        <div className="container">
          <div style={{ maxWidth: "42rem" }}>
            <span className="kicker kicker-ai" style={{ marginBottom: "0.8rem" }}>
              <span className="kicker-dot" />
              Mengenal Kami Lebih Dekat
            </span>
            <h1 style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: "1rem" }}>
              Pionir Pendidikan Digital <span className="hero-h1-accent">Terpercaya.</span>
            </h1>
            <p className="lead" style={{ color: "var(--ink-soft)", fontSize: "1.05rem", lineHeight: 1.6 }}>
              Jetschool Academy didirikan untuk menjadi jembatan bagi guru, profesional, dan pemula dalam menguasai keterampilan masa depan dengan kurikulum yang relevan, praktis, dan bersertifikat resmi.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ISI PROFIL ===== */}
      <section className="section" style={{ padding: "4rem 0 6rem" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", marginBottom: "4rem" }}>
            <div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1.2rem" }}>Visi Kami</h2>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Menjadi platform peningkatan kapasitas digital terbesar dan tepercaya di Indonesia yang mampu menghasilkan talenta terampil dan siap menghadapi era perkembangan kecerdasan buatan (AI) serta otomatisasi global.
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1.2rem" }}>Misi Kami</h2>
              <ul style={{ paddingLeft: "1.2rem", color: "var(--ink-soft)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.8rem", listStyleType: "decimal" }}>
                <li>Menyediakan program pelatihan berbasis praktik langsung yang dipandu oleh praktisi ahli di bidangnya.</li>
                <li>Menghadirkan akses pembelajaran yang fleksibel, mudah dipahami, dan terintegrasi langsung dengan WhatsApp.</li>
                <li>Menerbitkan e-sertifikat yang terverifikasi secara resmi untuk membantu meningkatkan kredibilitas karier peserta.</li>
                <li>Mendampingi alumni secara berkelanjutan melalui grup komunitas diskusi yang aktif dan inklusif.</li>
              </ul>
            </div>
            <div className="bento bento-purple" style={{ padding: "3rem 2rem", borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>💡</span>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem", color: "#fff" }}>Kenapa Memilih Kami?</h3>
              <p style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                Kami memadukan kemudahan teknologi (pendaftaran tanpa ribet, verifikasi instan, serta notifikasi instan) dengan keabsahan legalitas sertifikat untuk menjamin setiap detik waktu belajar Anda dihargai di dunia profesional.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bento" style={{ padding: "3rem", background: "var(--white)" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, textAlign: "center", marginBottom: "2rem" }}>Pencapaian Jetschool Academy</h3>
            <div className="big-stats" style={{ justifyContent: "center", gap: "4rem" }}>
              <div className="big-stat center" style={{ textAlign: "center" }}>
                <b>35.000</b>
                <span>Peserta Terdaftar</span>
              </div>
              <div className="big-stat center" style={{ textAlign: "center" }}>
                <b>150</b>
                <span>Program Webinar & Kelas</span>
              </div>
              <div className="big-stat center" style={{ textAlign: "center" }}>
                <b>98%</b>
                <span>Tingkat Kepuasan Peserta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
