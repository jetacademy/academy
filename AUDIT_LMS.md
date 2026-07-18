# Audit Alur LMS, Member Dashboard, Sertifikat & Post-Test

## Ringkasan: 2 🔴 Critical · 10 🟡 Medium · 3 🟢 Minor · 5 💡 Saran

---

## 📁 1. MEMBER DASHBOARD (`src/app/member/page.tsx`)

### 🟡 MEDIUM: Link "Klaim Sertifikat" mengirim `email` query param yang tidak dipakai
**Baris 198-199:**
```tsx
<Link href={`/sertifikat?slug=${prog.slug}&email=${reg.email}`}>
```
Parameter `email` dilempar ke `/sertifikat` sebagai query string, namun **tidak pernah dibaca** oleh `CheckoutForm` — form hanya meminta input WhatsApp. Parameter ini useless dan bisa menimbulkan kebingungan (user kira email sudah terisi otomatis).

**💡 Saran:** Hapus `&email=${reg.email}` dari URL, atau gunakan untuk pre-fill form di CheckoutForm.

### 🟡 MEDIUM: Status badge konflik untuk program berbayar + sudah bayar
**Baris 136-142:**
```tsx
if (reg.status === "PAID") {
  statusBadge = <span className="badge g">Lunas</span>;
} else if (reg.status === "PASSED") {
  statusBadge = <span className="badge g">Lulus & Sertifikat Terbit</span>;
} else if (pay && pay.status === "PENDING") {
  statusBadge = <span className="badge y">Menunggu Pembayaran</span>;
}
```
Jika `reg.status === "REGISTERED"` dan `pay.status === "PAID"` (inkonsistensi data), badge tetap "Terdaftar" meskipun sudah bayar. Ini edge case recovery yang baik, tapi tidak ada logging untuk deteksi data inconsistency.

### 🟢 MINOR: Nama variabel `isSuperadmin` misleading
**Baris 64:** Variabel bernama `isSuperadmin` tapi hanya cek `isAdmin()`. Jika fungsi `isAdmin()` bisa return true untuk role non-superadmin, banner hijau "Mode Admin Aktif" muncul untuk admin biasa.

---

## 📁 2. LMS FLOW (`src/app/member/lms/[registrationId]/page.tsx`)

### 🔴 CRITICAL: Tidak ada auto-terbit sertifikat — user WAJIB klik manual
**Baris 182-189 & 216-222:**
Setelah user menyelesaikan semua materi dan kuis, sistem **tidak otomatis menerbitkan sertifikat**. User harus melihat dan mengklik tombol "Klaim e-Sertifikat" yang muncul di banner atau di layar "Selamat". Jika user:
- Tidak scroll ke bawah sampai melihat tombol
- Menutup halaman setelah melihat "Selamat"
- Tidak menyadari tombol claim

...mereka **tidak akan pernah mendapatkan sertifikat** meskipun semua syarat terpenuhi.

**💡 Saran:** Setelah `checkCertEligibility` return true, panggil `issueCertificate` secara otomatis, lalu redirect user langsung ke halaman sertifikat.

### 🟡 MEDIUM: `hasPaid` di LMS page bisa menghalangi klaim untuk program gratis berbayar-sertifikat
**Baris 124:**
```ts
const hasPaid = reg.status !== "REGISTERED" || (program.price === 0 && program.certPrice === 0);
```
Logika ini **sebenarnya benar** untuk semua kasus, tapi namanya misleading. Untuk program webinar gratis (price=0, certPrice=49000) dengan status REGISTERED: `hasPaid = false`. Ini benar karena user belum bayar sertifikat, tapi developer yang membaca kode bisa salah paham.

### 🟡 MEDIUM: Eligibility banner muncul bersamaan dengan tombol claim di "all done" screen
**Baris 182-189:**
```tsx
{canClaim && !isAllDone && (... banner ...)}
```
Banner claim hanya muncul jika `!isAllDone`. Tapi di layar "all done" (line 216), tombol claim muncul lagi. **Tidak masalah** secara fungsional karena keduanya mengarah ke `ClaimCertButton`, tapi desain ini berarti user hanya punya 2 kesempatan melihat tombol: di banner (sebelum selesai) dan di layar akhir. Jika user melewatkan keduanya, tidak ada cara lain untuk klaim selain kembali ke dashboard.

### 🟡 MEDIUM: "Tandai Selesai & Lanjutkan" tidak punya loading state
**Baris 341-345:**
```tsx
<form action={handleMarkComplete}>
  <button type="submit" className="btn btn-purple btn-lg">
    {isCompleted ? "Lanjut Materi Berikutnya →" : "Tandai Selesai & Lanjutkan →"}
  </button>
</form>
```
Karena ini server action (bukan client fetch), tidak ada indikator loading. User bisa klik berkali-kali sebelum redirect terjadi, menyebabkan multiple completion upserts (idempoten sih, tapi lambat).

**💡 Saran:** Gunakan `useFormStatus` atau `useTransition` untuk disabled state.

### 🟢 MINOR: `currentLesson.content` regex HTML detection tidak sempurna
**Baris 319:**
```ts
/<[a-z][\s\S]*>/i.test(currentLesson.content)
```
Regex ini mendeteksi HTML dengan tag huruf kecil. Jika konten menggunakan tag huruf besar (`<DIV>`), terdeteksi sebagai plain text dan di-render dengan `white-space: pre-wrap` alih-alih HTML. Juga, string seperti `x > 1` bisa false positive.

**💡 Saran:** Gunakan deteksi: apakah konten diawali dengan `<` dan diakhiri dengan `>`, atau simpan flag `isHtml` di database.

---

## 📁 3. SERVER ACTIONS (`src/app/member/actions.ts`)

### 🟡 MEDIUM: `claimLessonsCertificate` tidak cek certificate sudah ada sebelum panggil eligibility
**Baris 291-308:**
```ts
const check = await checkCertEligibility(registrationId, reg.program);
if (!check.eligible) { ... }
const cert = await issueCertificate(registrationId);
```
`issueCertificate` idempotent (baris 19-21 cek cert yang sudah ada), jadi tidak crash. Tapi panggilan `issueCertificate` tetap mengeksekusi transaksi yang tidak perlu — membuat temp certificate, update PASSED, update number, lalu kirim WA+email notifikasi lagi. Ini berarti **setiap klik claim kedua mengirim ulang notifikasi WA dan email**.

### 🟡 MEDIUM: `submitLessonQuiz` memungkinkan retry meskipun `maxTestAttempts` di-reset di kode lain
**Baris 252-262:**
Batas percobaan dicek hanya berdasarkan `testAttempt` count. Jika admin reset attempt dari database, counter tidak konsisten dengan history. Ini minor tapi perlu dicatat.

### 🟡 MEDIUM: `completeLesson` untuk QUIZ type hanya cek passed attempt — tidak cek `alreadyPassed` flag dari frontend
**Baris 207-212:** Jika user somehow memanggil `completeLesson` langsung untuk lesson QUIZ (via API atau form manipulation), dicek apakah ada passed attempt. Aman.

---

## 📁 4. QUIZ COMPONENT (`src/components/LessonQuiz.tsx`)

### 🟡 MEDIUM: Tidak ada timeout/batasan waktu per kuis
**Baris 29-31:**
```ts
const [answers, setAnswers] = useState<Record<string, string>>({});
const [submitting, setSubmitting] = useState(false);
```
Kuis tidak punya batas waktu pengerjaan. User bisa membuka tab, kembali besok, dan tetap bisa submit. Untuk program berbayar dengan nilai kelulusan, ini bisa disalahgunakan.

### 🟡 MEDIUM: Tidak ada penanda jawaban benar/salah setelah submit
**Baris 70-98:** Setelah submit, user hanya melihat score numerik. Tidak ada indikator soal mana yang benar/salah. Ini mengurangi nilai edukatif kuis.

**💡 Saran:** Tambahkan opsi untuk menampilkan kunci jawaban setelah submit (dengan flag `showAnswers` di level program).

### 🟢 MINOR: `passingScore` tidak di-validate — bisa lebih besar dari 100
Tidak ada validasi bahwa `passingScore <= 100`. Jika passingScore diisi 150, kuis tidak akan pernah lulus.

---

## 📁 5. SERTIFIKAT (`src/lib/certificates.ts` & `src/app/sertifikat/[number]/page.tsx`)

### 🔴 CRITICAL: `issueCertificate` tidak cek apakah program punya LMS — bisa terbit tanpa materi selesai
**Baris 70-95 `checkCertEligibility`:**
```ts
const totalLessons = await prisma.lesson.count({ where: { module: { programId: program.id } } });
if (totalLessons === 0) return { eligible: true };
```
Jika program **tidak punya LMS lesson sama sekali** (mis. webinar murni), eligibility langsung true. Ini benar untuk webinar, tapi jika program seharusnya punya LMS tapi data lesson corrupt/belum diisi, sertifikat bisa terbit padahal materi belum siap.

### 🟡 MEDIUM: Nomor sertifikat menggunakan auto-increment global — bisa diprediksi
**prisma/schema.prisma baris 198:**
```prisma
serial Int @unique @default(autoincrement())
```
Nomor serial auto-increment bersifat sequential (`JSA-2026-0001`, `JSA-2026-0002`, ...). Jika total sertifikat relatif sedikit, orang bisa menebak nomor sertifikat orang lain dan mengakses halaman verifikasi publik.

**💡 Saran:** Gunakan hash string random (mis. `nanoid(8)`) sebagai nomor sertifikat, atau tambahkan UUID di dalam nomor.

### 🟡 MEDIUM: Halaman sertifikat tidak punya session check — siapa pun bisa akses
**`src/app/sertifikat/[number]/page.tsx`:** Tidak ada `getMemberSession()`. Semua URL sertifikat publik — siapa pun yang punya link bisa melihatnya. Ini BY DESIGN untuk verifikasi, tapi _linked sertifikat di WhatsApp/email bisa di-forward ke publik_.

### 🟡 MEDIUM: QR Code di-generate setiap request — no cache
**Baris 43-47:**
```ts
const qrDataUrl = await QRCode.toDataURL(verifyUrl, { ... });
```
Meskipun halaman menggunakan ISR (`revalidate = 86400`), setiap user baru yang pertama kali mengakses sertifikat memicu regenerasi QR code. Untuk sertifikat populer, ini CPU overhead.

### 🟡 MEDIUM: Kirim WA/email notifikasi berulang setiap kali claim
**Baris 36-43:** `issueCertificate` mengirim notifikasi via WA dan email setiap kali dipanggil. Jika user refresh halaman dan `claimLessonsCertificate` dipanggil lagi (karena cert sudah ada di DB, fungsi return existing), panggilan kedua tetap memicu notifikasi.

Wait — sebenarnya `issueCertificate` idempotent dan return early jika cert sudah ada (baris 19-21). Jadi notifikasi hanya sekali. Tapi `claimLessonsCertificate` akan tetap memanggil `checkCertEligibility` yang melakukan 2-3 query count. Minor overhead.

### 🟢 MINOR: Typo di pesan error
**`src/lib/certificates.ts` baris 88:**
```
"Lulusi semua tes dulu"
```
Seharusnya: **"Lulusi" → "Lulus"** (atau "Luluskan").

---

## 📁 6. MEMBER AUTH & OTP (`src/lib/member-auth.ts`, `src/lib/otp.ts`)

### 🟡 MEDIUM: OTP bisa dikirim ke nomor WA yang berbeda dari yang diharapkan
**`src/lib/otp.ts` baris 19-23 & 51-52:**
```ts
const exists = await prisma.registration.findFirst({
  where: { OR: [{ email: identifier }, { whatsapp: identifier }] },
});
// ...
const waNumber = exists.whatsapp;
```
Jika user login dengan **email** yang terdaftar di **2 nomor WA berbeda** (Registrasi A: email X, WA 0811; Registrasi B: email X, WA 0812), `findFirst` memilih acak (tergantung database). OTP bisa terkirim ke WA yang salah.

### 🟡 MEDIUM: Session tidak punya refresh/rolling expiry
**`src/lib/member-auth.ts` baris 37:**
```ts
maxAge: 60 * 60 * 24 * 30, // 30 hari
```
Cookie session memiliki expiry fixed 30 hari dari pembuatan. Tidak ada rolling refresh — jika user aktif menggunakan app di hari ke-29, session masih berlaku. Tapi jika user login lalu tidak kembali selama 31 hari, session expired dan harus OTP lagi.

### 🟡 MEDIUM: In-memory rate limit tidak survive restart
**`src/lib/rate-limit.ts`:** Store adalah `Map<string, Entry>()` di memory. Server restart → semua rate limit counter reset. Untuk deployment single-instance ini minor, tapi untuk multi-instance (load balancer) ini tidak berfungsi.

---

## 📁 7. POST-TEST (`src/app/post-test/[registrationId]/page.tsx`)

### 🟡 MEDIUM: Post-test terpisah sudah deprecated — kode mati yang membingungkan
**Baris 7-10:**
```ts
export default async function PostTestPage({ params }) {
  const { registrationId } = await params;
  redirect(`/member/lms/${registrationId}`);
}
```
Post-test page hanya redirect ke LMS. Tidak ada error handling — jika `registrationId` tidak valid, tetap redirect (LMS page akan redirect lagi ke `/member`). Double redirect ini lambat.

**💡 Saran:** Hapus route ini jika tidak ada link eksternal yang masih mengarah ke sini, atau tambahkan `notFound()` untuk invalid ID.

---

## 📁 8. EDGE CASES YANG DIUJI

### ✅ User daftar di 2 program berbeda
- `loginByIdentifier` (actions.ts baris 13-18): Mencari semua registrasi dengan email/WA yang cocok. Semua program tampil di dashboard. ✅ Bekerja.
- Tapi session menyimpan identifier tunggal → untuk mengecek kepemilikan registration, actions.ts baris 184 cek `reg.email !== sessionVal && reg.whatsapp !== sessionVal`. Jika user login dengan WA dan registrasi B menggunakan email berbeda, akses ditolak.

### 🟡 MEDIUM: User daftar program gratis lalu upgrade ke berbayar
- Flow: Registrasi webinar (status=REGISTERED) → Bayar sertifikat (status=PAID) → Selesai materi (status=PASSED). ✅ Bekerja.
- Tapi di dashboard (page.tsx baris 184-206), setelah status=REGISTERED untuk program gratis, tombol "Klaim Sertifikat" langsung muncul dengan harga certPrice. Jika user sudah PAID, tombol berubah jadi "Lanjut Belajar & Tes"/ClaimCertButton. Transisi ini benar.

### 🟡 MEDIUM: User kehilangan akses setelah session expire
- Tidak ada session refresh. Setelah 30 hari, user akan redirect ke `/member/login` saat mencoba akses dashboard atau LMS.
- Data progress (completions) tetap aman di database karena disimpan per `registrationId`.
- Risiko: jika user sedang mengerjakan kuis dan session expire, submit akan gagal dengan "Sesi tidak valid. Silakan login ulang." Jawaban yang sudah diisi di form hilang.

---

## RINGKASAN PRIORITAS PERBAIKAN

| Prioritas | Issue | File | Dampak |
|-----------|-------|------|--------|
| 🔴 | No auto-terbit sertifikat setelah selesai | lms/page.tsx | User tidak dapat sertifikat |
| 🔴 | Nomor sertifikat bisa diprediksi | schema.prisma | Privasi verifikasi publik |
| 🟡 | Link claim sertifikat kirim email useless | member/page.tsx | UX membingungkan |
| 🟡 | OTP bisa ke WA yang salah | otp.ts | Gagal login |
| 🟡 | Notifikasi WA/email terkirim duplikat | actions.ts | Spam user |
| 🟡 | Tidak ada loading state tombol selesai | lms/page.tsx | UX buruk |
| 🟡 | Quiz tanpa batas waktu | LessonQuiz.tsx | Potensi abuse |
| 🟡 | Kuis tidak tampilkan jawaban benar | LessonQuiz.tsx | Tidak edukatif |
| 🟡 | Session tidak rolling refresh | member-auth.ts | Logout paksa |
| 🟡 | QR code regen setiap request | sertifikat/[number]/page.tsx | CPU overhead |
| 🟢 | Typo "Lulusi" | certificates.ts | Minor |
| 🟢 | Regex HTML detection rapuh | lms/page.tsx | Render error |
| 🟢 | post-test route deprecated | post-test/page.tsx | Kode mati |

---

## 💡 SARAN ARSITEKTUR

1. **Auto-claim workflow**: Di `submitLessonQuiz` atau `completeLesson`, setelah menambahkan completion, cek apakah semua syarat sudah terpenuhi. Jika ya, panggil `issueCertificate()` otomatis dan return `{ certUrl }` ke client → redirect ke halaman sertifikat.

2. **Session refresh**: Setiap kali user mengakses dashboard/LMS, refresh cookie `maxAge` agar session tidak expire selama aktif.

3. **Nomor sertifikat random**: Gunakan `nanoid(12)` alih-alih auto-increment untuk nomor sertifikat yang tidak bisa ditebak.

4. **Pre-fill CheckoutForm**: Jika user datang dari dashboard dengan query params, isi otomatis form WhatsApp dan program.

5. **Server-side quiz timer**: Simpan `startedAt` di `testAttempt` dan reject submission jika melebihi durasi yang ditentukan.
