"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    category: "Umum",
    question: "Apa itu Jetschool Academy?",
    answer: "Jetschool Academy adalah platform pelatihan digital bersertifikat resmi yang dirancang untuk membantu guru, profesional, dan pemula menguasai berbagai keterampilan baru (termasuk teknologi, AI, bisnis, dan produktivitas) dengan bimbingan mentor berpengalaman."
  },
  {
    category: "Pendaftaran",
    question: "Bagaimana cara mendaftar pelatihan di Jetschool Academy?",
    answer: "Caranya sangat mudah! Cukup klik tombol 'Daftar' di navbar atau pilih salah satu program pelatihan yang Anda inginkan. Daftarkan diri Anda menggunakan akun Google (1-klik) kemudian isi nomor WhatsApp aktif Anda untuk menyelesaikan proses verifikasi OTP."
  },
  {
    category: "Akun & OTP",
    question: "Mengapa saya belum menerima kode verifikasi OTP WhatsApp?",
    answer: "OTP WhatsApp terkadang mengalami keterlambatan tergantung pada kestabilan jaringan operator Anda. Jika dalam waktu 2 menit Anda belum menerima OTP, Anda dapat mengklik tombol 'Kirim OTP via Email' di halaman verifikasi untuk menerima kode melalui inbox email Anda."
  },
  {
    category: "Sertifikat",
    question: "Apakah semua program pelatihan mendapatkan sertifikat resmi?",
    answer: "Ya! Semua program di Jetschool Academy (termasuk webinar gratis) dilengkapi dengan e-sertifikat resmi yang diterbitkan secara otomatis setelah Anda menyelesaikan tugas evaluasi, tes akhir, atau claim post-test di platform kami."
  },
  {
    category: "Sertifikat",
    question: "Bagaimana cara mengunduh sertifikat yang telah terbit?",
    answer: "Anda dapat melihat dan mengunduh seluruh sertifikat yang telah diterbitkan melalui dashboard akun Anda di menu 'Member' -> 'Program Pelatihan Saya'. Setiap sertifikat memiliki tautan verifikasi publik dan QR Code unik untuk menjamin keabsahannya."
  },
  {
    category: "Pembayaran",
    question: "Apa saja metode pembayaran yang didukung di platform ini?",
    answer: "Kami bekerja sama dengan payment gateway resmi (Xendit) untuk menyediakan berbagai pilihan metode pembayaran instan dan aman, seperti Virtual Account Bank (Mandiri, BRI, BNI, Permata, dll), E-Wallet (OVO, DANA, LinkAja, ShopeePay), QRIS, serta pembayaran retail (Alfamart)."
  },
  {
    category: "Akses Belajar",
    question: "Apakah materi pelatihan dapat diakses selamanya?",
    answer: "Untuk program kelas online, workshop, dan bootcamp, Anda mendapatkan hak akses materi (video pembelajaran, template, prompt, dan modul PDF) selamanya (lifetime access), sehingga Anda bebas belajar kapan saja dan di mana saja."
  }
];

export default function FaqPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const categories = ["Semua", "Umum", "Pendaftaran", "Akun & OTP", "Sertifikat", "Pembayaran", "Akses Belajar"];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />

      <section className="section" style={{ minHeight: "80vh", padding: "4rem 0 6rem", background: "var(--bg-warm)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          
          {/* Header */}
          <div className="section-head center" style={{ marginBottom: "3rem" }}>
            <span className="kicker center">Pusat Bantuan</span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 800 }}>
              Pertanyaan yang <span className="acc-p">Sering Diajukan</span>
            </h1>
            <p className="lead" style={{ margin: "0.8rem auto 0", color: "var(--ink-soft)" }}>
              Temukan jawaban cepat atas pertanyaan seputar program, akun, pembayaran, dan e-sertifikat resmi di bawah ini.
            </p>
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", marginBottom: "2rem" }}>
            <span style={{
              position: "absolute",
              left: "1.2rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Ketik kata kunci pertanyaan Anda di sini..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "1rem 1rem 1rem 3rem",
                borderRadius: "999px",
                border: "1px solid var(--line)",
                background: "var(--white)",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "var(--ink)",
                boxShadow: "var(--shadow-sm)",
                outline: "none",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--purple)";
                e.target.style.boxShadow = "0 0 0 4px var(--purple-soft)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--line)";
                e.target.style.boxShadow = "var(--shadow-sm)";
              }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "3rem" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategory(cat); setActiveIndex(null); }}
                style={{
                  padding: "0.5rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid " + (selectedCategory === cat ? "var(--purple)" : "var(--line)"),
                  background: selectedCategory === cat ? "var(--purple)" : "var(--white)",
                  color: selectedCategory === cat ? "#fff" : "var(--ink-soft)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredFaqs.map((faq, index) => {
                const isOpen = activeIndex === index;
                return (
                  <div
                    key={index}
                    className="bento"
                    style={{
                      padding: "1.2rem 1.6rem",
                      background: "var(--white)",
                      borderRadius: "var(--r-md)",
                      boxShadow: "var(--shadow-sm)",
                      border: isOpen ? "1px solid var(--purple-soft)" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => toggleAccordion(index)}
                  >
                    {/* Question Header */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem"
                    }}>
                      <h3 style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: isOpen ? "var(--purple)" : "var(--ink)",
                        margin: 0,
                        transition: "color 0.2s ease"
                      }}>
                        {faq.question}
                      </h3>
                      <span style={{
                        color: isOpen ? "var(--purple)" : "var(--ink-faint)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        fontWeight: "bold",
                        fontSize: "1.2rem"
                      }}>
                        ↓
                      </span>
                    </div>

                    {/* Answer (Collapsible) */}
                    <div style={{
                      maxHeight: isOpen ? "300px" : "0",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.3s cubic-bezier(0, 1, 0, 1), opacity 0.2s ease",
                      marginTop: isOpen ? "1rem" : "0",
                      paddingTop: isOpen ? "0.5rem" : "0",
                      borderTop: isOpen ? "1px solid var(--line)" : "none",
                      color: "var(--ink-soft)",
                      fontSize: "0.92rem",
                      lineHeight: 1.6
                    }}>
                      {faq.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bento" style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--white)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Pertanyaan tidak ditemukan</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", maxWidth: "24rem", margin: "0 auto" }}>
                Kata kunci pencarian Anda tidak cocok dengan daftar tanya jawab kami. Silakan ketik kata kunci yang lain atau reset filter.
              </p>
            </div>
          )}

          {/* Need More Help CTA */}
          <div className="bento" style={{
            marginTop: "4rem",
            padding: "2rem",
            background: "linear-gradient(135deg, var(--purple-soft), rgba(108, 92, 231, 0.04))",
            border: "1.5px solid var(--purple-soft)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Punya Pertanyaan Lain?</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", maxWidth: "28rem", marginBottom: "1.5rem" }}>
              Tim Support Jetschool Academy siap membantu Anda 24/7 jika Anda mengalami kendala saat registrasi atau belajar.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_WA_ADMIN ? `https://wa.me/${process.env.NEXT_PUBLIC_WA_ADMIN}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-purple"
            >
              Hubungi Admin via WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
