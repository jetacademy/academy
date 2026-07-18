# 📋 AUDIT SISTEM MENYELURUH — Jetschool Academy
**Tanggal:** 18 Juli 2026
**Total file diaudit:** 33 file
**Total temuan:** 12 🔴 Critical | 23 🟡 Medium | 12 🟢 Minor

---

## 🔴 CRITICAL (Harus diperbaiki SEKARANG)

### 1. Google data hilang setelah auth — duplikasi input (Register)
**File:** `src/app/daftar/page.tsx`
**Masalah:** Saat login Google gagal karena user belum punya akun, data Google (email, name) tidak disimpan ke state form. User harus mengetik ulang nama, email, dan WA dari awal.

### 2. RegisterForm buang Google credential token (Register)
**File:** `src/components/RegisterForm.tsx:90-95`
**Masalah:** `handleGoogleSelect()` hanya terima 2 parameter (email, name), tapi GoogleAuthModal kirim 3 parameter termasuk `response.credential` (token Google asli). Token dibuang — siapa pun bisa daftar pakai email palsu.

### 3. Auto-login setelah daftar SILENTLY gagal di production (Register)
**File:** `src/components/RegisterForm.tsx:70-74` + `src/app/member/actions.ts:114-117`
**Masalah:** `memberLogin()` menolak semua permintaan jika Google Client ID terisi & production mode. Tapi RegisterForm tidak cek return value. Akibat: user sukses daftar → redirect /member → tidak login → redirect /member/login. **Flow broken total.**

### 4. OTP gagal untuk user baru di /daftar (Register)
**File:** `src/lib/otp.ts:19-26` + `src/app/member/actions.ts:311-359`
**Masalah:** `sendOtp()` mencari **Registration** tapi user baru tidak punya registration entry. Error "Nomor WhatsApp/Email belum terdaftar." — user baru tidak bisa verifikasi OTP.

### 5. Webhook PAID tidak guard isCurrentInvoice (Payment)
**File:** `src/app/api/webhooks/xendit/route.ts:50-90`
**Masalah:** PAID webhook tidak cek apakah invoice masih berlaku. Pembayaran invoice lama bisa menandai lunas invoice baru dengan amount berbeda.

### 6. EXPIRED/FAILED bisa akses penuh LMS (Payment)
**File:** `src/app/member/lms/[registrationId]/page.tsx:124`
**Masalah:** Logika `hasPaid` hanya exclude REGISTERED. EXPIRED/FAILED lolos — user bisa akses full konten LMS dan klaim sertifikat.

### 7. EXPIRED/FAILED tidak punya tombol aksi (Payment)
**File:** `src/app/member/page.tsx:135-248`
**Masalah:** Tidak ada badge atau tombol untuk status EXPIRED/FAILED. User stuck — tidak bisa bayar ulang, harus kontak admin.

### 8. Sertifikat tidak auto-terbit (LMS)
**Masalah:** Setelah user lulus kuis/menyelesaikan materi, tidak ada mekanisme auto-claim sertifikat. User harus tahu cara claim manual.

### 9. Nomor sertifikat bisa diprediksi (LMS)
**Masalah:** Nomor sertifikat JSA-2026-XXXX menggunakan auto-increment integer — bisa ditebak dan dipalsukan.

### 10. Session tidak pernah di-refresh (LMS)
**Masalah:** Cookie session member tidak diperbarui `maxAge` setiap akses. User aktif bisa logout paksa setelah 24 jam.

### 11. Regex WhatsApp client vs server berbeda (Register)
- Client: `0[0-9]{8,13}` — lolos `01234567890`
- Server: `^08[0-9]{8,13}$` — hanya terima `08...`
- Input lolos client tapi ditolak server → error tanpa feedback jelas

### 12. "Gunakan akun Google lainnya" bypass Google auth (Register)
**File:** `src/components/GoogleAuthModal.tsx:235-299`
**Masalah:** Form manual menerima nama & email apa pun. Tidak ada validasi bahwa ini benar-benar akun Google.

---

## 🟡 MEDIUM (Harus diperbaiki MINGGU INI)

1. **Email tidak visible di RegisterForm** — user tidak tahu email apa yang dipakai dari Google
2. **Flow gratis broken** — sukses daftar → redirect /member → redirect /member/login
3. **Error Google auth tidak dibedakan** — semua error dianggap "belum daftar"
4. **Tidak ada cron cleanup** payment PENDING yang expired tanpa webhook
5. **Race condition** — webhook vs redirect user setelah bayar sukses
6. **Invoice URL reuse** — checkout kembalikan URL invoice yang sudah expired
7. **Pengecekan existingReg** — bisa multiple registration dengan data berbeda
8. **Tidak ada polling status payment** di member page setelah redirect dari Xendit
9. **Session member tanpa refresh** — user aktif bisa logout paksa
10. **QR code sertifikat regenerasi setiap akses** — boros komputasi
11. **Notifikasi WA/email duplikat** saat webhook retry
12. **OTP hanya via WA** — tidak ada fallback email jika WA down
13. **Post-test route adalah dead code** — hanya redirect ke LMS
14. **Member dashboard tidak muat banyak program** — layout broken
15. **Tidak ada halaman "Lupa Nomor WA"**
16. **Tidak ada validasi IP Xendit** di webhook
17. **Error message bocorkan detail internal** ke user
18. **Rate limit OTP tidak spesifik per aksi**
19. **Tidak ada retry mechanism** untuk WA/email gagal
20. **Navbar minimal di program page tidak sticky** di scroll
21. **Tidak ada confirmation dialog** sebelum daftar program berbayar
22. **Link Zoom/grup WA tidak di-mask** di admin panel
23. **Dead code**: `result` state di RegisterForm tidak pernah di-update

---

## 🟢 MINOR (Perbaikan saat ada waktu)

1. Typo "Lulusi" di admin panel (seharusnya "Lulus")
2. Regex HTML detection untuk sanitasi rapuh
3. Font loading tanpa fallback
4. Tidak ada skeleton loading di member dashboard
5. Tidak ada animasi transisi antar halaman
6. Focus trap di modal Google tidak ada
7. Tidak ada toast notification system
8. Gambar hero tanpa alt text deskriptif
9. Tanda tangan sertifikat tidak bisa di-customize
10. Tidak ada sitemap.xml
11. Meta description terlalu panjang untuk beberapa halaman program
12. Tidak ada canonical URL

---

## 📊 PRIORITAS PERBAIKAN

| Priority | Issue | File | Dampak |
|----------|-------|------|--------|
| **P0** | C1, C2 | `/daftar/page.tsx` | User input ulang data setelah Google auth |
| **P0** | C3 | `RegisterForm.tsx` | User daftar gratis → redirect login loop |
| **P0** | C4 | `otp.ts` + `actions.ts` | User baru tidak bisa verifikasi OTP |
| **P0** | C5 | `webhooks/xendit/route.ts` | Pembayaran salah invoice |
| **P0** | C6 | `lms/page.tsx` | User EXPIRED akses LMS gratis |
| **P0** | C8, C9 | LMS flow | Sertifikat tidak terbit otomatis |
| **P1** | C7 | `member/page.tsx` | User stuck setelah payment expired |
| **P1** | C11 | Register + API | Regex WA tidak sinkron |
| **P1** | M1-M4 | Payment flow | Race condition, cron, UX |
| **P2** | C12, M5-M23 | Various | UX polish, error handling |

---

## 💡 MASALAH UTAMA YANG DILAPORKAN: Google double-email

**Akar masalah ada di 3 tempat:**

1. **`src/app/daftar/page.tsx:20-51`** — Data Google (email, name) tidak dipertahankan saat user dialihkan ke form registrasi
2. **`src/components/RegisterForm.tsx:90-95`** — `handleGoogleSelect` membuang credential token Google
3. **`src/components/RegisterForm.tsx:70-74`** — Auto-login gagal diam-diam di production dengan Google mode

**FIX:** 
- Di `/daftar/page.tsx`: simpan `googleName` dan `googleEmail` di state, pre-fill form fields
- Di RegisterForm: terima credential dan kirim ke API untuk verifikasi
- Di RegisterForm: fallback auto-login tidak perlu redirect /member, cukup set cookie manual
- Hapus atau validasi "Gunakan akun Google lainnya" di modal
