import type { Program } from "@prisma/client";

type VibesProgram = Pick<
  Program,
  "title" | "tagline" | "price" | "priceOld" | "durationLabel" | "scheduleAt"
>;

/** Section persuasif khusus Vibes Coding — dirender di halaman program (bukan contentBlocks). */
export default function VibesLandingSections({ program }: { program: VibesProgram }) {
  return (
    <>
      {/* ── PAIN: Adegan sehari-hari ── */}
      <section className="section" style={{ background: "var(--chip)", paddingBottom: "3.5rem" }}>
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2.5rem" }}>
            <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Pernah Ngerasain Ini?</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Pengen Bikin Aplikasi, Tapi Gak Bisa Coding?</h2>
          </div>
          <div className="pain-points-grid">
            {[
              { icon: "😩", title: "Pengen bikin aplikasi, gak bisa coding", desc: "Ide udah ada di kepala, tapi berhenti di situ — karena nulis kode terasa bahasa alien." },
              { icon: "😤", title: "Bayar developer? Jutaan", desc: "Harga bikin aplikasi Rp5-20 juta, nunggu berbulan-bulan, dan kamu gak ngerti dia ngapain." },
              { icon: "😮‍💨", title: "Langganan aplikasi bulanan", desc: "Bayar terus tiap bulan, fiturnya gak sesuai, dan datamu ada di platform orang." },
              { icon: "😰", title: "Belajar coding dari nol", desc: "Setahun baru nyampe, udah gitu gampang nyerah di tengah jalan." },
            ].map((p, i) => (
              <div key={i} className="pain-card problem-card">
                <div className="pain-icon-wrapper">
                  <span style={{ fontSize: "1.6rem" }}>{p.icon}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", marginBottom: "0.4rem" }}>{p.title}</h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUAT KAMU KALAU: 6 persona ── */}
      <section className="section" style={{ paddingBottom: "3.5rem" }}>
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2.5rem" }}>
            <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Workshop Ini Buat Kamu, Kalau...</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Gak Perlu Jago Teknologi</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {[
              { icon: "🏪", t: "Punya Bisnis / UMKM", d: "Mau website sendiri tanpa bayar developer jutaan." },
              { icon: "💼", t: "Karyawan", d: "Mau tambah skill yang makin dicari industri." },
              { icon: "🎓", t: "Mahasiswa / Siswa", d: "Mau portofolio bikin aplikasi & game buat lamaran." },
              { icon: "🧑‍💻", t: "Penasaran AI", d: "Denger vibe coding, bingung mulai dari mana." },
              { icon: "🎮", t: "Gamer", d: "Mau bisa bikin game sendiri buat seru-seruan." },
              { icon: "✨", t: "Praktis & Cepat", d: "Gak mau 6 bulan belajar coding — 2 jam langsung bisa." },
            ].map((x, i) => (
              <div key={i} className="bento" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem" }}>{x.icon}</span>
                <b style={{ fontSize: "1rem" }}>{x.t}</b>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIBE CODING + ENTERPRISE ── */}
      <section className="section" style={{ background: "var(--chip)", paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div className="bento" style={{ padding: "2.5rem", border: "1px solid var(--border)", background: "var(--white)", borderRadius: "var(--r-md)" }}>
            <div className="section-head center" style={{ marginBottom: "2rem" }}>
              <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Vibe Coding</span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>Kamu yang Ngomong, AI yang Bikin</h2>
              <p className="lead" style={{ maxWidth: "38rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                Kamu jelasin maunya ke AI (Antigravity), AI yang nulis kodenya, kamu yang arahin.
                Bukan teori — kamu praktik langsung bikin 4 produk.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {[
                { icon: "⚡", t: "Cepat", d: "Next.js dioptimasi untuk performa kelas produksi." },
                { icon: "🔒", t: "Aman", d: "Praktik keamanan web standar industri." },
                { icon: "🚀", t: "Scalable", d: "Dari 1 pengguna ke jutaan — arsitekturnya sama." },
                { icon: "✅", t: "Siap Publish", d: "Aplikasimu bisa langsung di-deploy ke internet." },
              ].map((x, i) => (
                <div key={i} style={{ textAlign: "center", padding: "1.5rem 1rem", background: "var(--chip)", borderRadius: "var(--r-md)" }}>
                  <span style={{ fontSize: "2rem", display: "block" }}>{x.icon}</span>
                  <b style={{ display: "block", marginTop: "0.6rem", fontSize: "1.05rem" }}>{x.t}</b>
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.4rem", lineHeight: 1.5 }}>{x.d}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", textAlign: "center", marginTop: "1.2rem", lineHeight: 1.6 }}>
              Framework yang dipakai perusahaan besar — Netflix, TikTok, Uber. Bukan drag-and-drop, bukan toy project.
            </p>
          </div>

          {/* HIGHLIGHT: Bukan mainan — portofolio kelas industri */}
          <div
            style={{
              marginTop: "1.2rem",
              padding: "1.6rem 2rem",
              background: "linear-gradient(135deg, rgba(124, 92, 255, 0.08), rgba(46, 204, 113, 0.06))",
              border: "1.5px solid rgba(124, 92, 255, 0.35)",
              borderRadius: "var(--r-md)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)", fontWeight: 800, margin: 0, lineHeight: 1.5 }}>
              🏆 Bukan mainan. Ini portofolio kelas industri —{" "}
              <span style={{ color: "var(--purple)" }}>dibangun dengan standar perusahaan besar</span>,{" "}
              jadi bisa langsung dipakai, ditunjukkan ke klien, bahkan ditawarkan jadi layanan.
            </p>
          </div>
        </div>
      </section>

      {/* ── DEMO LIVE: Hasil Nyata Bisa Dicoba — SANGAT MENONJOL ── */}
      <section
        className="section"
        style={{
          paddingTop: "4.5rem",
          paddingBottom: "4.5rem",
          background:
            "radial-gradient(1200px 500px at 50% -100px, rgba(124, 92, 255, 0.18), transparent 60%), var(--white)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2.5rem" }}>
            <span
              className="type-tag type-workshop"
              style={{ marginBottom: "0.8rem", background: "var(--purple)", color: "#fff" }}
            >
              🕹️ Langsung Dicoba — Live Demo
            </span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginBottom: "0.6rem" }}>
              Ini Hasilnya. <span style={{ color: "var(--purple)" }}>Coba Sekarang.</span>
            </h2>
            <p className="lead" style={{ maxWidth: "38rem", marginInline: "auto", color: "var(--ink-soft)" }}>
              Dua produk yang kamu akan buat di workshop Vibes Coding —{" "}
              <b>game 3D &amp; aplikasi keuangan</b> — sudah jalan beneran dan bisa kamu mainkan sekarang.
              Gak perlu nebak, langsung rasakan.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.6rem",
              maxWidth: "56rem",
              marginInline: "auto",
            }}
          >
            {/* Card 1: Game 3D */}
            <a
              href="https://demo.jetschool.id/games/tetris-3d"
              target="_blank"
              rel="noreferrer"
              className="vibes-demo-card"
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                position: "relative",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                border: "1px solid rgba(124, 92, 255, 0.25)",
                boxShadow: "0 24px 48px -24px rgba(124, 92, 255, 0.35)",
                transition: "transform .25s ease, box-shadow .25s ease",
              }}
            >
              <div
                style={{
                  height: "220px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #0a0620 0%, #1a1140 55%, #2fd4c4 160%)",
                  fontSize: "4.5rem",
                }}
              >
                🪐
              </div>
              <div style={{ padding: "1.5rem 1.6rem 1.8rem", background: "var(--white)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "rgba(47, 212, 196, 0.15)", color: "#0f7d8c", borderRadius: 999, padding: ".2rem .7rem", fontSize: ".72rem", fontWeight: 700 }}>
                    🎮 GAME 3D
                  </span>
                  <span style={{ background: "rgba(124, 92, 255, 0.12)", color: "var(--purple)", borderRadius: 999, padding: ".2rem .7rem", fontSize: ".72rem", fontWeight: 700 }}>
                    ★ MINDBLOWING
                  </span>
                </div>
                <h3 style={{ margin: "0 0 .4rem", fontSize: "1.4rem", fontWeight: 800 }}>Tetris 3D — Space Odyssey</h3>
                <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", margin: "0 0 1.2rem", lineHeight: 1.6 }}>
                  Galaksi berputar, blok kristal neon, ledakan partikel tiap baris bersih. Game 3D beneran yang kamu bangun dari nol.
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".4rem",
                    background: "linear-gradient(135deg, #2fd4c4, #0f7d8c)",
                    color: "#fff",
                    fontWeight: 800,
                    padding: ".7rem 1.4rem",
                    borderRadius: 999,
                    fontSize: ".9rem",
                  }}
                >
                  🕹️ Mainkan Sekarang ↗
                </span>
              </div>
            </a>

            {/* Card 2: Aplikasi Keuangan */}
            <a
              href="https://demo.jetschool.id/apps/keuangan"
              target="_blank"
              rel="noreferrer"
              className="vibes-demo-card"
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                position: "relative",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                border: "1px solid rgba(255, 138, 122, 0.25)",
                boxShadow: "0 24px 48px -24px rgba(255, 138, 122, 0.35)",
                transition: "transform .25s ease, box-shadow .25s ease",
              }}
            >
              <div
                style={{
                  height: "220px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #2a0f14 0%, #4a1622 55%, #ff8a7a 160%)",
                  fontSize: "4.5rem",
                }}
              >
                📊
              </div>
              <div style={{ padding: "1.5rem 1.6rem 1.8rem", background: "var(--white)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "rgba(255, 138, 122, 0.15)", color: "#c8465e", borderRadius: 999, padding: ".2rem .7rem", fontSize: ".72rem", fontWeight: 700 }}>
                    💰 APP KEUANGAN
                  </span>
                  <span style={{ background: "rgba(47, 212, 196, 0.15)", color: "#0f7d8c", borderRadius: 999, padding: ".2rem .7rem", fontSize: ".72rem", fontWeight: 700 }}>
                    LENGKAP
                  </span>
                </div>
                <h3 style={{ margin: "0 0 .4rem", fontSize: "1.4rem", fontWeight: 800 }}>Aplikasi Keuangan — KasKu</h3>
                <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", margin: "0 0 1.2rem", lineHeight: 1.6 }}>
                  Kelola transaksi, invoice, laporan laba rugi, sampai pajak PPN/PPh. Lengkap kayak aplikasi bisnis beneran.
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".4rem",
                    background: "linear-gradient(135deg, #ff8a7a, #c8465e)",
                    color: "#fff",
                    fontWeight: 800,
                    padding: ".7rem 1.4rem",
                    borderRadius: 999,
                    fontSize: ".9rem",
                  }}
                >
                  💻 Coba Sekarang ↗
                </span>
              </div>
            </a>
          </div>

          <p style={{ textAlign: "center", fontSize: ".82rem", color: "var(--ink-faint)", marginTop: "2.2rem" }}>
            Dibangun dengan Next.js + React + Three.js — stack yang sama persis yang kamu pakai di workshop.{" "}
            <b style={{ color: "var(--purple)" }}>Hasil ini 100% bikinan peserta dengan bimbingan mentor.</b>
          </p>
        </div>
      </section>

      {/* ── ALUR WORKSHOP ── */}
      <section className="section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2rem" }}>
            <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Alur Workshop</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>2 Jam Padat Praktik</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {[
              { jam: "13.00–13.15", t: "Kenalan Sama Vibe Coding", d: "Apa itu vibe coding & Antigravity (AI IDE). Setup akun, siap-siap praktik." },
              { jam: "13.15–13.45", t: "Praktik 1: Game 3D #1", d: "Bikin game 3D pertama — jadi & bisa langsung dimainkan." },
              { jam: "13.45–14.15", t: "Praktik 2: Game 3D #2", d: "Variasi seru — kamu lihat polanya, makin pede bikin sendiri." },
              { jam: "14.15–14.45", t: "Praktik 3: Aplikasi Keuangan", d: "Catat pemasukan/pengeluaran — aplikasi beneran yang bisa kamu pakai." },
              { jam: "14.45–15.15", t: "Praktik 4: Website", d: "Company profile / UMKM — tinggal isi konten, langsung online." },
              { jam: "15.15–15.30", t: "Deploy & Next Steps", d: "Cara publish aplikasimu & lanjut pakai skill ini ke depan." },
            ].map((x, i) => (
              <div key={i} className="bento" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--purple)", letterSpacing: "0.04em" }}>{x.jam}</span>
                <b style={{ fontSize: "1.02rem" }}>{x.t}</b>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HITUNG-HITUNGAN ── */}
      <section className="section" style={{ background: "var(--chip)", paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div className="bento" style={{ padding: "2.5rem", border: "1px solid var(--border)", background: "var(--white)", borderRadius: "var(--r-md)" }}>
            <div className="section-head center" style={{ marginBottom: "2rem" }}>
              <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Hitung-Hitungannya</span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>Sekali Bayar, Bisa Bikin Sendiri</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {[
                { icon: "💸", t: "Bayar developer", v: "Rp5–20 juta", d: "sekali, gak ngerti dia ngapain" },
                { icon: "📉", t: "Langganan SaaS", v: "Rp200rb–2jt/bln", d: "terus bayar, fitur terbatas" },
                { icon: "📚", t: "Kursus coding", v: "Rp1–5jt, 3–6 bulan", d: "belum tentu jadi" },
                { icon: "✨", t: "Vibes Coding", v: "Rp365rb", d: "2 jam, langsung bisa" },
              ].map((x, i) => (
                <div key={i} style={{ textAlign: "center", padding: "1.5rem 1rem", background: "var(--chip)", borderRadius: "var(--r-md)", border: x.t === "Vibes Coding" ? "2px solid #2ecc71" : "none" }}>
                  <span style={{ fontSize: "1.8rem", display: "block" }}>{x.icon}</span>
                  <b style={{ display: "block", marginTop: "0.5rem", fontSize: "0.95rem" }}>{x.t}</b>
                  <span style={{ display: "block", fontSize: "1.3rem", fontWeight: 900, marginTop: "0.3rem", color: x.t === "Vibes Coding" ? "#27ae60" : "var(--ink)" }}>{x.v}</span>
                  <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.3rem" }}>{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEBELUM VS SESUDAH ── */}
      <section className="section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2rem" }}>
            <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Sebelum vs Sesudah</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>Bedanya Jauh Banget</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            <div className="bento" style={{ padding: "2rem", border: "1px solid rgba(231, 76, 60, 0.2)", background: "rgba(231, 76, 60, 0.03)", borderRadius: "var(--r-md)" }}>
              <span className="type-tag" style={{ background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c", marginBottom: "1rem", display: "inline-block", fontWeight: 800 }}>Tanpa Skill Ini</span>
              <div style={{ display: "grid", gap: "1rem" }}>
                {[
                  { icon: "😤", text: "Mau website → bayar developer jutaan, nunggu berbulan-bulan" },
                  { icon: "😮‍💨", text: "Mau aplikasi keuangan → pakai aplikasi orang, datanya di platform orang" },
                  { icon: "😰", text: "Mau game → cuma bisa main, gak bisa bikin" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bento" style={{ padding: "2rem", border: "1px solid rgba(46, 204, 113, 0.2)", background: "rgba(46, 204, 113, 0.03)", borderRadius: "var(--r-md)" }}>
              <span className="type-tag" style={{ background: "rgba(46, 204, 113, 0.1)", color: "#27ae60", marginBottom: "1rem", display: "inline-block", fontWeight: 800 }}>Setelah Ikut</span>
              <div style={{ display: "grid", gap: "1rem" }}>
                {[
                  { icon: "✅", text: "Website sendiri jadi dalam hitungan jam, bisa update kapan pun" },
                  { icon: "✅", text: "Aplikasi keuangan sendiri, data di tangan kamu" },
                  { icon: "✅", text: "Game bikinan sendiri — tinggal kasih tahu orang-orang" },
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

      {/* ── DARI 0 SAMPAI PUBLISH: HOSTING & DOMAIN ── */}
      <section className="section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2.5rem" }}>
            <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Bonus: Deploy & Publish</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>Dari 0 Sampai Online — Dibimbing Publish Beneran</h2>
            <p className="lead" style={{ maxWidth: "38rem", marginInline: "auto", color: "var(--ink-soft)" }}>
              Banyak yang bikin aplikasi, tapi berhenti di laptop sendiri. Di workshop ini kamu
              dibimbing sampai aplikasi & game-mu beneran online — bisa dibuka orang lain lewat link.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {[
              { step: "01", icon: "🎨", t: "Bikin Aplikasinya", d: "2 game 3D + aplikasi keuangan + website — pakai vibe coding (Antigravity + Next.js)." },
              { step: "02", icon: "☁️", t: "Siapkan Hosting", d: "Pilih hosting yang pas & terjangkau. Diajarin cara setup dari panel hosting — tanpa istilah rumit." },
              { step: "03", icon: "🚀", t: "Deploy / Upload", d: "Cara naikin aplikasi dari laptop ke hosting — build, upload, jalan. Tinggal follow step by step." },
              { step: "04", icon: "🌐", t: "Setting Domain", d: "Beli domain, arahkan DNS, sambungkan ke aplikasi. Dari 0 sampai nama domainmu kebuka di browser." },
              { step: "05", icon: "🔒", t: "Aktifkan HTTPS", d: "Gembok hijau & koneksi aman — syarat standar biar aplikasi layak dibuka publik." },
              { step: "06", icon: "🎉", t: "Online & Dibagikan", d: "Aplikasi/game live — kirim linknya ke siapa aja. Website bisa dipakai bisnis, game bisa dimainin orang." },
            ].map((x, i) => (
              <div key={i} className="bento" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.6rem" }}>{x.icon}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "var(--purple)", letterSpacing: "0.06em" }}>LANGKAH {x.step}</span>
                </div>
                <b style={{ fontSize: "1.02rem" }}>{x.t}</b>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{x.d}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-faint)", textAlign: "center", marginTop: "1.4rem", lineHeight: 1.6, maxWidth: "40rem", marginInline: "auto" }}>
            Hasilnya versi pertama yang berarsitektur industri — siap dikembangkan lebih jauh.
            Hosting & domain ditanggung peserta (opsional, mulai dari harga terjangkau) — ilmunya yang kamu bawa pulang.
          </p>
        </div>
      </section>

      {/* ── SKILL: Sekali Belajar ── */}
      <section className="section" style={{ background: "var(--chip)", paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="container">
          <div className="bento" style={{ padding: "2.5rem", border: "1px solid var(--border)", background: "var(--white)", borderRadius: "var(--r-md)" }}>
            <div className="section-head center" style={{ marginBottom: "2rem" }}>
              <span className="type-tag type-workshop" style={{ marginBottom: "0.8rem" }}>Bukan Cuma 4 Produk</span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>Sekali Belajar, Dipakai Selamanya</h2>
              <p className="lead" style={{ maxWidth: "36rem", marginInline: "auto", color: "var(--ink-soft)" }}>
                4 produk itu cuma hasil sampingan. Yang kamu bawa pulang beneran adalah skill:
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {[
                { icon: "🧠", t: "Skill bikin aplikasi", d: "Bisa bikin tools sendiri kapan pun — gak perlu nunggu orang lain." },
                { icon: "💼", t: "Portofolio 4 produk", d: "Modal lamaran kerja / freelance — bukti nyata, bukan janji." },
                { icon: "🔁", t: "Vibe coding", d: "Kemampuan yang makin dicari industri — makin langka, makin berharga." },
              ].map((x, i) => (
                <div key={i} style={{ textAlign: "center", padding: "1.5rem 1rem", background: "var(--chip)", borderRadius: "var(--r-md)" }}>
                  <span style={{ fontSize: "2rem", display: "block" }}>{x.icon}</span>
                  <b style={{ display: "block", marginTop: "0.6rem" }}>{x.t}</b>
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.4rem", lineHeight: 1.5 }}>{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
