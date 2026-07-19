# 📋 AUDIT ALUR PENDAFTARAN PROGRAM — Jetschool Academy
**Tanggal:** 20 Juli 2026
**Source:** Analisis source code lengkap (39 file) + validasi existing audit
**Status:** Melengkapi AUDIT_FULL.md dengan fokus alur pendaftaran

---

## 🔴 CRITICAL (Harus diperbaiki SEKARANG)

### C1. RegisterForm WAJIB kirim Google credential ke server tapi server TIDAK verifikasi
**File:** `src/app/api/register/route.ts` (seluruh file)
**Masalah:** RegisterForm kirim `credential` (Google ID token) ke `/api/register` via body (line 65-67 RegisterForm.tsx). Namun di `/api/register/route.ts`, **tidak ada satu baris pun yang membaca atau memverifikasi token tersebut**. Server percaya 100% pada email dari client.
- Bandingkan dengan `memberLoginWithGoogle` di `actions.ts` (line 156-244) yang VERIFIKASI token ke server Google (`https://oauth2.googleapis.com/tokeninfo?id_token=...`).
- **Dampak:** Siapa pun bisa melakukan POST ke `/api/register` dengan email palsu. Tidak ada keamanan Google auth di jalur registrasi program.

### C2. Upsert registration timpa email user lain — unique constraint hanya `[whatsapp, programId]`
**File:** `src/app/api/register/route.ts:105-110`
```ts
const reg = await prisma.registration.upsert({
  where: { whatsapp_programId: { whatsapp, programId: program.id } },
  update: { name, email, institution, userId: user.id, ...(batchId ? { batchId } : {}) },
});
```
**Masalah:** Jika user A (WA 081, email a@x) daftar duluan, lalu user B dengan **WA yang SAMA** (081) tapi **email berbeda** (b@x) mendaftar program yang sama:
- WHERE clause hanya match `whatsapp + programId`
- Email user A di-*update* menjadi `b@x` — data korup!
- **Akar masalah:** Tidak ada validasi bahwa email dan whatsapp konsisten milik orang yang sama.

### C3. `existingReg` — OR condition bisa kena false positive antar-user berbeda
**File:** `src/app/api/register/route.ts:61-70`
```ts
const existingReg = await prisma.registration.findFirst({
  where: {
    programId: program.id,
    OR: [{ whatsapp }, { email }]
  },
});
```
**Masalah:** Misal User A (WA=0811, email=a@x) dan User B (WA=0822, email=a@x) — dua orang berbeda dengan email sama. User A daftar duluan di program P. User B coba daftar:
- `findFirst` ketemu reg User A (karena email a@x match)
- `isPaidOrFree` cek: program gratis → dianggap "sudah terdaftar"
- User B **ditolak** dengan pesan "Email ini sudah terdaftar"
Padahal dua orang berbeda.

### C4. `memberLogin` di RegisterForm silent fail total di production (validasi audit sebelumnya)
**File:** `src/components/RegisterForm.tsx:82-86`
```ts
try { await memberLogin(emailVal.trim()); } catch (err) { console.error("Gagal auto-login:", err); }
```
**Masalah:** `memberLogin()` (actions.ts:143-145) menolak semua request jika `NEXT_PUBLIC_GOOGLE_CLIENT_ID` terisi & `NODE_ENV === "production"`. Tapi RegisterForm **tidak cek return value**. Error di-catch doang. Akibat:
- User berhasil daftar → session gagal dibuat → redirect ke `/member` → tidak ada session → redirect `/member/login`
- **Flow broken total untuk program gratis.** User stuck harus login OTP manual setelah daftar.

### C5. Tidak ada validasi batch capacity — `seatsLeft` tidak pernah dicek
**File:** `src/app/api/register/route.ts:52-58`
**Masalah:** Batch punya field `seatsLeft`, tapi registrasi tidak pernah memvalidasi apakah masih ada kursi. Satu batch bisa diisi 1000+ peserta meskipun `seatsLeft=10`.

### C6. RegisterForm tidak punya pattern validation WhatsApp — inkonsisten dengan /daftar
**File:** `src/components/RegisterForm.tsx:346`
```tsx
<input id="fWa" name="whatsapp" type="tel" ... required />
```
**Masalah:** TIDAK ada `pattern` attribute. Bandingkan dengan `src/app/daftar/page.tsx:258`:
```tsx
<input ... pattern="^08[0-9]{8,13}$" required />
```
Input format WA apa pun lolos dari client RegisterForm — user bisa masukkan "abc" atau "123" dan baru ditolak server. UX buruk.

### C7. `existingReg` di `/api/register` pakai `findFirst` bukan `findUnique` — ambiguous
**File:** `src/app/api/register/route.ts:61-70`
**Masalah:** Karena `OR: [{ whatsapp }, { email }]`, ada potensi return yang berbeda setiap query jika ada multiple match. Database tidak menjamin urutan.

---

## 🟡 MEDIUM

### M1. Email bisa berubah diam-diam tanpa notifikasi
**File:** `src/app/api/register/route.ts:105-110`
**Akar masalah sama dengan C2.** Saat upsert, email bisa berubah. Tidak ada audit log atau notifikasi ke user bahwa data mereka berubah.

### M2. Error message bocorkan informasi internal
**File:** `src/app/api/register/route.ts:49`
```
"Program tidak ditemukan. (Sudah jalankan `npm run db:seed`?)"
```
Pesan ini mengandung instruksi teknis yang tidak seharusnya tampil ke publik.

### M3. Dua jalur registrasi berbeda — tidak ada sinkronisasi
- **Jalur 1:** `/daftar` → `registerUser` server action → create User → OTP → login
- **Jalur 2:** `/program/[slug]` → RegisterForm → POST `/api/register` → register langsung ke program
- User bisa punya akun (via /daftar) lalu daftar program (via /program/[slug]) — dua flow berbeda.
- Tapi `/api/register` juga create User sendiri (line 93-102). Kalau user sudah ada akun, sistem cari User. OK.
- Kalau user daftar via `/api/register` duluan (belum punya akun di `/daftar`), User dibuat otomatis — OK juga.
- **Risiko:** Kalau ada error di satu flow, yang lain tetap jalan. Tapi test coverage tidak menjangkau skenario interaksi kedua flow.

### M4. Halaman `/daftar` "done" tidak tampilkan nama user
**File:** `src/app/daftar/page.tsx:143`
```
Selamat datang, {userEmail}
```
Hanya menampilkan email. User baru tidak tahu bahwa nama mereka sudah terdaftar. Seharusnya tampilkan nama juga.

### M5. Tidak ada confirmation dialog sebelum daftar program berbayar (validasi audit sebelumnya)
**File:** `src/components/RegisterForm.tsx`
User bisa klik "Konfirmasi & Bayar — Rp 225.000" tanpa konfirmasi ulang. Risiko: salah klik atau double submit.

### M6. Tidak ada loading state di "Tandai Selesai" LMS (validasi audit sebelumnya)
**File:** `src/app/member/actions.ts:263-305` — `completeLesson` dipanggil tanpa indikator loading di client.

### M7. `completeLesson` + `submitLessonQuiz` sudah ada auto-cert claim — tapi LMS page tidak manfaatkan
**File:** `src/app/member/actions.ts:295-301`
```ts
if (eligibility.eligible) {
  const cert = await issueCertificate(registrationId);
  return { ok: true, certUrl: cert.url };
}
```
Server action sudah auto-terbitkan sertifikat! Tapi LMS page (`lms/[registrationId]/page.tsx`) mungkin tidak redirect ke halaman sertifikat. Perlu dicek.

### M8. `checkout` dan `initiateCertificateCheckout` duplikasi logika
**File:** `src/app/api/checkout/route.ts` vs `src/app/member/actions.ts:478-561`
Keduanya melakukan hal yang sama: buat invoice Xendit untuk certPrice. Bedanya satu di REST API, satu di server action. Perubahan fitur harus di-dua-tempat.

### M9. Admin `saveRegistration` tidak validasi unique constraint `[whatsapp, programId]`
**File:** `src/app/webadmin/actions.ts:589-649`
Admin bisa membuat duplikasi pendaftaran (whatsapp + programId sama) karena `prisma.registration.create` akan throw `P2002`. Ada error handling `isUniqueError` (line 640), tapi redirect ke halaman tanpa pesan yang jelas.

### M10. `memberLogin` block semua login non-Google di production — termasuk auto-login setelah daftar
**File:** `src/app/member/actions.ts:143-145`
```ts
if (googleConfigured && process.env.NODE_ENV === "production") {
  return { error: "Silakan masuk menggunakan tombol Google resmi." };
}
```
Ini memblokir auto-login di RegisterForm (yang panggil `memberLogin`). Solusi: auto-login seharusnya bypass pengecekan ini (mis. dengan parameter `{ skipGoogleCheck: true }`).

### M11. `registration.completionCriteria` field `ALL_QUIZZES` — jika tidak ada kuis, fallback ke ALL_LESSONS
**File:** `src/lib/certificates.ts:146-158`
Ini OK secara fungsional, tapi bisa membingungkan admin yang set `ALL_QUIZZES` dan program tidak punya kuis — sistem diam-diam pake ALL_LESSONS tanpa notifikasi.

### M12. Tidak ada caching/ISR untuk halaman sertifikat — load lambat
**File:** `src/app/sertifikat/[number]/page.tsx` — setiap request generate QR code baru (sudah di audit asli, konfirmasi).

---

## 🟢 MINOR

### G1. Typo di error message certificates.ts:88 — "Lulusi" → "Lulus" (validasi audit sebelumnya)

### G2. `result` state di RegisterForm tidak pernah di-update (dead code)
**File:** `src/components/RegisterForm.tsx:38`
```ts
const [result] = useState<{ name: string } & Result | null>(null);
```
State `result` di-destructure tanpa setter — tidak pernah diisi. Blok `if (state === "done" && result)` tidak akan pernah ter-render. UX: setelah sukses, form tidak berubah jadi layar "sukses" — tetap tampilan form.

### G3. Di `/daftar/page.tsx`, `userEmail` di-set dari form tapi tidak di-validate
**File:** `src/app/daftar/page.tsx:104`
```ts
setUserEmail(String(form.get("email") ?? "").trim());
```
Ini setelah `registerUser` sukses. Tapi `registerUser` sudah validasi email. OK untuk production, tapi ada jeda waktu antara setUserEmail dan render step OTP — jika ada race condition, email yang ditampilkan bisa kosong.

### G4. Tidak ada `not-found.tsx` untuk route `/program/[slug]` (validasi audit sebelumnya)
**File:** `src/app/program/[slug]/page.tsx` — kalau notFound(), Next.js pakai 404 default.

### G5. `NEXT_PUBLIC_BASE_URL` digunakan sebagai `successRedirectUrl` di Xendit invoice — tanpa validasi
**File:** `src/app/api/register/route.ts:183`
```ts
successRedirectUrl: `${baseUrl}/program/${program.slug}?status=sukses`,
```
Ini redirect ke halaman program setelah bayar, bukan ke dashboard. User harus scroll lagi cari tombol "Lanjut Belajar". UX kurang optimal.

### G6. IP rate limit untuk `/api/register` pakai header `x-forwarded-for` — rentan spoofing
**File:** `src/app/api/register/route.ts:20`
```ts
const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
```
Jika server di belakang proxy yang tidak dikonfigurasi dengan benar, `x-forwarded-for` bisa di-spoof attacker.

---

## 🆕 TEMUAN DARI SIMULASI 3 AGENT (20 Juli 2026)

### N1. 🔴 `handleRegister` & `handleVerifyOtp` tanpa try/catch — loading forever jika server error
**File:** `src/app/daftar/page.tsx:91-108,111-126`
**Masalah:** `handleGoogleSelect` punya try/catch/finally yang proper (line 25-58), tapi `handleRegister` dan `handleVerifyOtp` **tidak ada try/catch**. Jika server action throw:
- `loading` state stuck true selamanya — button disabled
- User frozen tanpa pesan error, harus refresh browser

### N2. 🔴 Auto-login redundant + rate limit trigger (validasi C4 lebih dalam)
**File:** `src/app/api/register/route.ts:113` + `src/components/RegisterForm.tsx:82-86`
**Temuan ekstra:** API route sudah panggil `createMemberSession(email)` di line 113 — session SUDAH valid. Lalu RegisterForm panggil `memberLogin(emailVal)` LAGI (line 83) yang:
- Akan return error dengan Google aktif di production
- Walaupun error di-catch, panggilan HTTP ekstra trigger rate limit IP
- **Session tetap berfungsi** karena API route sudah buat duluan — tapi ini duplikasi sia-sia

### N3. 🟡 Validasi OTP terlalu longgar — 4-5 digit lolos client
**File:** `src/app/daftar/page.tsx:113`
```ts
if (!otpCode.trim() || otpCode.trim().length < 4)
```
OTP adalah 6 digit. Tapi 4-5 digit lolos client dan PASTI gagal di server. User: "Kode saya benar tapi ditolak."

### N4. 🟡 Teks "Kirim OTP via Email" misleading
**File:** `src/app/daftar/page.tsx:272,308-318`
Channel default OTP = WhatsApp. Tapi label resend selalu "Kirim OTP via Email". User bingung OTP dikirim lewat mana.

### N5. 🟡 Form `/daftar` tidak punya field Instansi
**File:** `src/app/daftar/page.tsx:242-265`
Bandingkan dengan RegisterForm (ada field Instansi). Inkonsisten — user daftar lewat `/daftar` tidak bisa input instansi.

### N6. 🟡 Admin `saveRegistration` — tidak ada pre-check duplikasi
**File:** `src/app/webadmin/actions.ts:589-649`
`saveRegistration` panggil `prisma.registration.create()` langsung tanpa `findFirst` cek duplikasi dulu. Hanya mengandalkan error P2002 dari database. Jika ada error non-P2002, sistem fallback throw.

---

## 📊 RINGKASAN BARU (tidak overlap dengan audit sebelumnya)

| ID | Severity | Isu | File |
|----|----------|-----|------|
| C1 | 🔴 | Google credential tidak diverifikasi di `/api/register` | `api/register/route.ts` |
| C2 | 🔴 | Upsert timpa email user lain (unique constraint salah) | `api/register/route.ts:105-110` |
| C3 | 🔴 | `existingReg` OR false positive antar user | `api/register/route.ts:61-70` |
| C4 | 🔴 | Auto-login di RegisterForm broken (konfirmasi audit) | `RegisterForm.tsx:82-86` |
| C5 | 🔴 | Batch `seatsLeft` tidak divalidasi | `api/register/route.ts:52-58` |
| C6 | 🟡 | RegisterForm tidak punya pattern WA | `RegisterForm.tsx:346` |
| C7 | 🟡 | `findFirst` ambiguous untuk `existingReg` | `api/register/route.ts:61-70` |
| M1 | 🟡 | Email bisa berubah tanpa notifikasi | `api/register/route.ts` |
| M2 | 🟡 | Error message bocor info internal | `api/register/route.ts:49` |
| M3 | 🟡 | Dua jalur registrasi tidak sinkron | `/daftar` vs `/api/register` |
| M4 | 🟡 | Halaman done tidak tampilkan nama | `daftar/page.tsx:143` |
| M5 | 🟡 | Tidak ada confirm dialog untuk bayar | `RegisterForm.tsx` |
| M8 | 🟡 | Duplikasi logika checkout | `checkout/route.ts` vs `actions.ts` |
| M9 | 🟡 | Admin bisa buat duplikasi pendaftar | `webadmin/actions.ts:589-649` |
| M10 | 🟡 | `memberLogin` block auto-login di production | `actions.ts:143-145` |
| M12 | 🟡 | QR code digenerate setiap request | `sertifikat/[number]/page.tsx` |
| G2 | 🟢 | `result` state dead code di RegisterForm | `RegisterForm.tsx:38` |
| G5 | 🟢 | Redirect ke halaman program setelah bayar, bukan dashboard | `api/register/route.ts:183` |
| G6 | 🟢 | Rate limit IP rentan spoofing | `api/register/route.ts:20` |

---

## 🎯 PRIORITAS PERBAIKAN REKOMENDASI

### P0 (Hari ini)
1. **C1** — Verifikasi Google credential di `/api/register` seperti `memberLoginWithGoogle`
2. **C2+C3** — Ganti logika `existingReg`: validasi bahwa email AND whatsapp match, atau pakai compound key
3. **C4** — Auto-login setelah daftar harus bypass Google check, atau langsung set cookie manual
4. **C5** — Validasi `seatsLeft` sebelum registrasi

### P1 (Minggu ini)
5. **C6** — Tambah `pattern` WhatsApp di RegisterForm
6. **M2** — Hapus pesan internal dari error response
7. **M10** — Refactor `memberLogin` untuk dukung auto-login
8. **M8** — Unifikasi checkout logic (satu source of truth)

### P2 (Bulat)
9. **G2** — Fix `result` state di RegisterForm (atau hapus dead code)
10. **G5** — Ubah `successRedirectUrl` ke `/member`
11. **G6** — Konfigurasi trusted proxy untuk rate limit
12. **M4** — Tampilkan nama di halaman done
