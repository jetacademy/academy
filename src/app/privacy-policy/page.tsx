import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";

export const metadata = {
  title: "Kebijakan Privasi — Jetschool Academy",
  description: "Kebijakan privasi dan perlindungan data peserta di Jetschool Academy.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <section className="section" style={{ minHeight: "80vh", padding: "4rem 0 6rem", background: "var(--bg-warm)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="bento" style={{ padding: "3rem 2.5rem" }}>
            <span className="kicker" style={{ marginBottom: "0.5rem" }}>Legalitas & Keamanan</span>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              Kebijakan <span className="acc-p">Privasi</span>
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "2.5rem" }}>
              Terakhir diperbarui: 19 Juli 2026
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", lineHeight: 1.7, color: "var(--ink-soft)" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  1. Pengantar
                </h2>
                <p>
                  Selamat datang di Jetschool Academy. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan kepada kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan platform kami.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  2. Informasi yang Kami Kumpulkan
                </h2>
                <p>
                  Kami mengumpulkan informasi yang Anda berikan secara langsung saat melakukan pendaftaran atau interaksi di platform kami, termasuk namun tidak terbatas pada:
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", listStyleType: "disc" }}>
                  <li>Nama Lengkap</li>
                  <li>Nomor WhatsApp (untuk pengiriman kode OTP dan informasi pelatihan)</li>
                  <li>Alamat Email (untuk autentikasi Google dan verifikasi tambahan)</li>
                  <li>Nama Instansi / Sekolah / Perusahaan</li>
                  <li>Detail Transaksi Pembayaran</li>
                </ul>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  3. Penggunaan Informasi
                </h2>
                <p>
                  Informasi yang kami kumpulkan digunakan untuk tujuan berikut:
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", listStyleType: "disc" }}>
                  <li>Menyediakan, mengoperasikan, dan memelihara platform pelatihan kami.</li>
                  <li>Memproses pendaftaran program dan transaksi pembayaran Anda secara aman.</li>
                  <li>Mengirimkan kode verifikasi OTP (One-Time Password) ke WhatsApp atau Email Anda.</li>
                  <li>Menerbitkan e-sertifikat resmi setelah Anda menyelesaikan pelatihan.</li>
                  <li>Mengirimkan informasi pembaruan pelatihan, materi, serta pemberitahuan penting lainnya.</li>
                </ul>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  4. Keamanan dan Perlindungan Data
                </h2>
                <p>
                  Keamanan data Anda adalah prioritas kami. Kami menggunakan teknologi enkripsi SSL (Secure Sockets Layer), metode penyimpanan database yang aman, dan protokol pembayaran terenkripsi untuk mencegah akses yang tidak sah, pengungkapan, atau penyalahgunaan data pribadi Anda.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  5. Pembagian Informasi dengan Pihak Ketiga
                </h2>
                <p>
                  Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga. Kami hanya membagikan informasi Anda kepada mitra tepercaya yang membantu kami dalam mengoperasikan platform, seperti penyedia layanan pembayaran (payment gateway) dan penyedia layanan pengiriman WhatsApp/Email OTP, dengan ketentuan bahwa pihak-pihak tersebut setuju untuk menjaga kerahasiaan informasi Anda.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  6. Hak Pengguna
                </h2>
                <p>
                  Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan informasi pribadi Anda dari sistem kami. Silakan hubungi kami melalui kontak layanan pelanggan resmi jika Anda memerlukan bantuan terkait pengelolaan data Anda.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  7. Perubahan Kebijakan Privasi
                </h2>
                <p>
                  Kami berhak untuk memperbarui Kebijakan Privasi ini dari waktu ke waktu. Setiap perubahan akan diumumkan di halaman ini dengan memperbarui tanggal revisi di bagian atas kebijakan. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.
                </p>
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
