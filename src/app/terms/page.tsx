import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";

export const metadata = {
  title: "Syarat & Ketentuan — Jetschool Academy",
  description: "Syarat dan ketentuan layanan penggunaan platform Jetschool Academy.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <section className="section" style={{ minHeight: "80vh", padding: "4rem 0 6rem", background: "var(--bg-warm)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="bento" style={{ padding: "3rem 2.5rem" }}>
            <span className="kicker" style={{ marginBottom: "0.5rem" }}>Legalitas & Ketentuan</span>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              Syarat & <span className="acc-p">Ketentuan</span>
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "2.5rem" }}>
              Terakhir diperbarui: 19 Juli 2026
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", lineHeight: 1.7, color: "var(--ink-soft)" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  1. Ketentuan Umum
                </h2>
                <p>
                  Dengan mengakses dan menggunakan platform Jetschool Academy, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda disarankan untuk tidak menggunakan platform kami.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  2. Pendaftaran dan Keamanan Akun
                </h2>
                <p>
                  Untuk menggunakan layanan kami, Anda diharuskan mendaftar dengan menyediakan informasi yang akurat, lengkap, dan terbaru.
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", listStyleType: "disc" }}>
                  <li>Pendaftaran dilakukan menggunakan akun Google dan nomor WhatsApp aktif Anda.</li>
                  <li>Anda bertanggung jawab atas keamanan kode verifikasi OTP yang dikirimkan ke perangkat Anda. Jangan pernah membagikan kode OTP kepada siapa pun, termasuk staf Jetschool Academy.</li>
                  <li>Satu akun hanya boleh digunakan oleh satu pengguna terdaftar dan tidak boleh dialihkan ke pihak lain tanpa izin tertulis dari kami.</li>
                </ul>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  3. Transaksi dan Pembayaran
                </h2>
                <p>
                  Semua transaksi pembayaran program pelatihan berbayar diproses secara aman melalui gerbang pembayaran (payment gateway) resmi yang bekerja sama dengan kami.
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", listStyleType: "disc" }}>
                  <li>Harga yang tertera pada platform kami adalah sah dan mengikat pada saat transaksi dilakukan.</li>
                  <li>Pembayaran harus diselesaikan dalam batas waktu yang ditentukan sebelum pendaftaran Anda dinyatakan sah dan akses pembelajaran dibuka.</li>
                  <li>Semua biaya transaksi yang timbul dari metode pembayaran yang dipilih sepenuhnya menjadi tanggung jawab pengguna.</li>
                </ul>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  4. Kebijakan Pembatalan dan Pengembalian Dana (Refund)
                </h2>
                <p>
                  Kecuali dinyatakan lain secara eksplisit pada deskripsi program pelatihan:
                </p>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", listStyleType: "disc" }}>
                  <li>Semua transaksi pembayaran yang telah berhasil diproses bersifat final dan tidak dapat dibatalkan atau dikembalikan dana (non-refundable).</li>
                  <li>Jika terjadi pembatalan kelas atau perubahan jadwal sepihak oleh Jetschool Academy yang mengakibatkan peserta tidak dapat mengikuti kelas, kami akan memberikan opsi penjadwalan ulang atau pengembalian dana penuh.</li>
                </ul>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  5. Hak Kekayaan Intelektual
                </h2>
                <p>
                  Seluruh materi pelatihan, video, modul, slide presentasi, logo, desain, dan konten lain yang disediakan di platform Jetschool Academy adalah milik eksklusif PT Jetschool Academy Indonesia dan dilindungi oleh undang-undang hak cipta. Anda dilarang keras merekam, menyebarluaskan, memperbanyak, menjual kembali, atau menyalahgunakan materi tersebut untuk kepentingan komersial tanpa izin tertulis dari kami.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  6. e-Sertifikat Resmi
                </h2>
                <p>
                  e-Sertifikat resmi hanya akan diterbitkan untuk peserta yang memenuhi kriteria kelulusan program, termasuk namun tidak terbatas pada menyelesaikan seluruh modul materi, mengikuti evaluasi/tes akhir (jika ada), dan menyelesaikan kewajiban administrasi terkait program tersebut.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--ink)", fontWeight: 800, marginBottom: "0.8rem" }}>
                  7. Hukum yang Berlaku
                </h2>
                <p>
                  Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia. Setiap perselisihan yang timbul dari atau terkait dengan penggunaan platform kami akan diselesaikan secara musyawarah untuk mufakat, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan negeri yang berwenang.
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
