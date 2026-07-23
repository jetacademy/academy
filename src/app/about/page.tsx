import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";

export const metadata = {
  title: "Tentang Kami — Jetschool Academy",
  description: "PT Jetschool Academy Indonesia — perusahaan teknologi yang membangun solusi Artificial Intelligence, otomatisasi, dan pelatihan transformasi digital.",
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
              Tentang Kami
            </span>
            <h1 style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: "1rem" }}>
              Membangun Masa Depan Bisnis dengan <span className="hero-h1-accent">Artificial Intelligence.</span>
            </h1>
            <p className="lead" style={{ color: "var(--ink-soft)", fontSize: "1.05rem", lineHeight: 1.6 }}>
              PT Jetschool Academy Indonesia adalah perusahaan teknologi yang berfokus pada solusi Artificial Intelligence, otomatisasi proses bisnis, dan pelatihan transformasi digital. Berawal dari pengembangan solusi digital untuk dunia pendidikan, kami kini membantu individu maupun organisasi memanfaatkan AI untuk bekerja lebih cerdas, lebih efisien, dan siap menghadapi masa depan.
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
                Menjadi perusahaan teknologi Indonesia yang menghadirkan solusi Artificial Intelligence dan transformasi digital untuk membantu organisasi bekerja lebih cerdas, lebih efisien, dan siap menghadapi masa depan.
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1.2rem" }}>Misi Kami</h2>
              <ul style={{ paddingLeft: "1.2rem", color: "var(--ink-soft)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.8rem", listStyleType: "decimal" }}>
                <li>Mengembangkan solusi AI yang mudah diterapkan oleh berbagai jenis organisasi.</li>
                <li>Membantu perusahaan meningkatkan produktivitas melalui otomatisasi proses bisnis.</li>
                <li>Menghadirkan teknologi yang sederhana namun memberikan dampak nyata dan terukur.</li>
                <li>Mendorong lahirnya talenta digital Indonesia melalui pelatihan dan edukasi teknologi.</li>
              </ul>
            </div>
            <div className="bento bento-purple" style={{ padding: "3rem 2rem", borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>💡</span>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem", color: "#fff" }}>Kenapa Memilih Kami?</h3>
              <p style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                Kami tidak hanya membangun perangkat lunak, tapi memahami proses bisnis di baliknya — merancang solusi yang praktis, berdampak terukur, dan terus berkembang mengikuti kebutuhan Anda. Kami percaya masa depan bukan tentang menggantikan manusia dengan teknologi, tapi memberdayakan manusia melaluinya.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
