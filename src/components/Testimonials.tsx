"use client";

const reasons = [
  {
    icon: "⚡",
    title: "Praktik Langsung, Bukan Teori",
    desc: "Setiap sesi Anda akan mempraktikkan langsung cara membuat AI Agent. Pulang-pulang, agent Anda sudah siap jalan.",
  },
  {
    icon: "🎓",
    title: "Dari Praktisi, Bukan Akademisi",
    desc: "Dibimbing oleh tim yang setiap hari ngoprek AI Agent untuk UMKM dan startup Indonesia. Bukan teori kampus.",
  },
  {
    icon: "📱",
    title: "Kendalikan dari WhatsApp",
    desc: "Semua agent bisa Anda atur dari HP. Tidak perlu dashboard ribet. Cukup chat, agent bekerja.",
  },
  {
    icon: "🔧",
    title: "Tanpa Coding, Tanpa IT Background",
    desc: "Dirancang untuk pemilik bisnis. Jika bisa kirim WhatsApp, Anda bisa ikut workshop ini.",
  },
  {
    icon: "💬",
    title: "Grup Alumni & Konsultasi",
    desc: "Setelah workshop, Anda tidak sendiri. Ada grup WhatsApp untuk tanya jawab dan diskusi dengan mentor.",
  },
  {
    icon: "📜",
    title: "Rekaman + Sertifikat Resmi",
    desc: "Akses rekaman seumur hidup dan e-sertifikat ber-QR code yang bisa dipakai untuk portofolio atau kenaikan pangkat.",
  },
];

export default function Testimonials({ limit }: { limit?: number }) {
  const items = limit ? reasons.slice(0, limit) : reasons;

  return (
    <section className="section" id="kenapa-pilih">
      <div className="container">
        <div className="bento reveal">
          <div className="section-head">
            <h2>
              Kenapa Pilih <span className="acc-o">Program Ini</span>?
            </h2>
            <p className="lead" style={{ color: "var(--ink-soft)" }}>
              Bukan sekadar webinar. Anda pulang dengan AI Agent yang benar-benar bekerja untuk bisnis Anda.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            {items.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "var(--chip)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "2rem" }}>{r.icon}</span>
                <b style={{ fontSize: "1rem", marginTop: "0.3rem" }}>{r.title}</b>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
