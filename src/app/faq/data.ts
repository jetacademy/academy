export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const FAQ_DATA: FaqItem[] = [
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
