# LAPORAN AUDIT: Alur Pendaftaran Program via /program/[slug]

**Project:** academy (Next.js 16 + React 19 + Prisma + MySQL)
**Tanggal:** 20 Juli 2026
**Auditor:** Hermes Agent

---

## 1️⃣ ALUR LENGKAP (Step-by-Step)

### Step 1-2: Buka /program/[slug] → Lihat RegisterForm
- `src/app/program/[slug]/page.tsx` (server component): membaca session cookie via `getMemberSession()`, lalu:
  - Mencari `user` + `lastReg` (last registration) dari DB
  - Menggabungkan data → `memberProfile` prop untuk RegisterForm
  - Render `RegisterForm` dengan props: `programSlug`, `programTitle`, `jadwal`, `price`, `priceLabel`, `memberProfile`, `batches`

### Step 3-5: Klik "Daftar Cepat dengan Google" → GoogleAuthModal → Pilih akun
- **RegisterForm line 400-408**: Button `onClick={() => setGoogleOpen(true)}`
- **GoogleAuthModal** (276 baris):
  - Jika `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ada → render tombol Google GSI asli (line 150-178)
  - Jika tidak ada → render mock accounts (dev mode, line 179-243): Budi Santoso, Arif Pratama, Nadia Rahma
  - Real Google: `onSelect(payload.email, payload.name, response.credential)` — credential = Google ID token JWT
  - Mock: `onSelect(acc.email, acc.name)` — **TIDAK mengirim credential** (undefined)
- **RegisterForm handleGoogleSelect** (line 112-119):
  - `setNameVal(name)`, `setEmailVal(email)`, `setCredentialVal(credential)`, `setGoogleSelected(true)`
  - State beralih dari CASE 2 (Guest) → CASE 1 (Google terhubung)

### Step 6-7: User isi WhatsApp + Instansi → Klik "Konfirmasi & Daftar"
- RegisterForm menampilkan **State 2** (Onboarding Mode, line 272-371):
  - Menampilkan status "Terhubung: {email}" dengan tombol "Ganti Akun"
  - Field Nama hanya muncul jika user klik "Edit Data Profil" (`isEditing`)
  - Field WhatsApp + Instansi wajib diisi
  - Tombol submit: "Konfirmasi & Daftar" (free) atau "Konfirmasi & Bayar — RpXXX" (paid)
- **Atau State 1** (Profile Lengkap, line 180-271): 1-click registration jika semua data sudah terisi

### Step 8: Submit ke POST /api/register
- `onSubmit` (line 54-110) → `fetch("/api/register", { method: "POST", body: JSON.stringify({name, whatsapp, email, institution, programSlug, credential, batchId}) })`
- 🔴 **BEDA KRUSIAL**: RegisterForm via `/program/[slug]` pakai `fetch` ke API Route. Halaman `/daftar` pakai **Server Action** (`registerUser`). Keduanya punya implikasi keamanan berbeda.

### Step 9: Response handler
- **Program GRATIS** (price=0): API kirim WA sambutan + email → return `{ok, free:true, waGroupLink}`
- **Program BERBAYAR** (price>0): API buat invoice Xendit → return `{ok, invoiceUrl}`
- RegisterForm:
  - Jika `json.invoiceUrl` → redirect ke halaman bayar Xendit
  - Jika tidak (gratis) → cek session `/member?check=1` → redirect ke `/member` atau `/member/login?registered=1`

---

## 2️⃣ TEMUAN KRITIKAL

### 🔴 T1: Auto-login SILENT FAIL di Production (HIGH)

**Lokasi:** `RegisterForm.tsx` line 82-86 + `member/actions.ts` line 143-145

**RegisterForm:**
```typescript
try {
  await memberLogin(emailVal.trim());  // <-- panggil server action
} catch (err) {
  console.error("Gagal auto-login:", err); // <-- hanya catch throw, bukan return {error}
}
```

**memberLogin (server action):**
```typescript
const googleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
if (googleConfigured && process.env.NODE_ENV === "production") {
  return { error: "Silakan masuk menggunakan tombol Google resmi." };
}
```

**Masalah:**
- `memberLogin` mengembalikan `{ error: "..." }` — **TIDAK throw error**
- `try/catch` di RegisterForm **TIDAK MENANGKAP** return value
- Return value dari `memberLogin` **tidak dicek** — result diabaikan
- Di production dengan Google terkonfigurasi → auto-login selalu gagal tanpa feedback

**Namun:** Auto-login **sebenarnya SUDAH berhasil** karena API route (line 113) memanggil `createMemberSession(email)` LANGSUNG sebelum return. Jadi cookie session sudah diset oleh API. Panggilan `memberLogin` di RegisterForm hanyalah **redundan dan berbahaya**.

### 🔴 T2: Google Credential TIDAK Diverifikasi Server (CRITICAL)

**Lokasi:** `api/register/route.ts` line 26

```typescript
let body: { name?: string; whatsapp?: string; email?: string; programSlug?: string; institution?: string; batchId?: string };
```

**Tidak ada field `credential`** dalam destructuring body. RegisterForm mengirim `credential` (Google ID token) di body tapi:

1. Route handler **tidak membaca** `body.credential` — tidak ada kode yang mengaksesnya
2. Route handler **tidak memverifikasi** token ke Google API apapun
3. Siapa pun bisa POST ke `/api/register` dengan `name` dan `email` palsu

**Bandingkan dengan** `/daftar` page yang menggunakan `memberLoginWithGoogle(credential)` — fungsi itu memverifikasi token ke `https://oauth2.googleapis.com/tokeninfo` (line 161-164 actions.ts).

**Dampak:** Endpoint `/api/register` bisa disalahgunakan untuk mendaftarkan email palsu ke program apapun.

### 🔴 T3: Upsert by WhatsApp Dapat TIMPA Email User Lain (HIGH)

**Lokasi:** `api/register/route.ts` line 105-110 + Prisma schema line 142

```typescript
const reg = await prisma.registration.upsert({
  where: { whatsapp_programId: { whatsapp, programId: program.id } },
  create: { name, whatsapp, email, institution, programId: program.id, userId: user.id, batchId },
  update: { name, email, institution, userId: user.id, ...(batchId ? { batchId } : {}) },
});
```

**Unique key:** `@@unique([whatsapp, programId])`

**Skenario 1 — Timpa email (exploitable):**
1. User A (WA=62812xxx, email=a@gmail.com) daftar → **REGISTERED** (belum bayar)
2. User B (WA=62812xxx, email=b@gmail.com) daftar ulang dengan WA SAMA
3. `existingReg` check: `isPaidOrFree = false` (price>0, not PAID) → LOLOS
4. Upsert by `whatsapp_programId` → **UPDATE** record → `email` diganti jadi `b@gmail.com`
5. ✅ User A kehilangan akses ke akunnya. User B menguasai pendaftaran.

**Skenario 2 — Duplikasi registrasi dengan email sama:**
1. User A (WA=62812, email=a@gmail.com) daftar → REGISTERED
2. User B (WA=62834, email=a@gmail.com) daftar dengan WA berbeda tapi email sama
3. `existingReg` check: menemukan record User A (email match), tapi `isPaidOrFree=false` → LOLOS
4. Upsert key `62834_programId` BEDA dengan `62812_programId` → **CREATE** record BARU
5. ✅ Dua registrasi dengan email yang sama untuk program yang sama → data integrity issue

### 🔴 T4: existingReg Check False Positive (MEDIUM)

**Lokasi:** `api/register/route.ts` line 61-81

```typescript
const existingReg = await prisma.registration.findFirst({
  where: { programId: program.id, OR: [{ whatsapp }, { email }] },
  include: { payment: true }
});

if (existingReg) {
  const isPaidOrFree = program.price === 0 || existingReg.status === "PAID" || ...;
  if (isPaidOrFree) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

**Masalah:** `findFirst` dengan `OR: [{whatsapp}, {email}]` bisa false positive antar user berbeda:
- User A (WA=X, email=a@x.com) sudah PAID untuk program
- User B (WA=Y, email=a@x.com) coba daftar — **terblokir** dengan "Email sudah terdaftar"
- Padahal User B punya WA berbeda dan belum pernah daftar

### 🔴 T5: Duplikasi Session Creation (MEDIUM)

**Lokasi:** API route line 113 + RegisterForm line 83

**Dua titik membuat session:**
1. `createMemberSession(email)` di API route (line 113) ✅ — selalu dieksekusi
2. `memberLogin(emailVal.trim())` di RegisterForm (line 83) ❌ — redundan, silent fail di production

**Dampak:** API sudah handle session creation. Panggilan kedua duplikatif dan bisa gagal tanpa konsekuensi karena session sudah ada. Namun `memberLogin` juga melakukan rate limiting (line 135-136) yang bisa memblokir IP jika terlalu sering register.

---

## 3️⃣ TEMUAN LAINNYA

### 🟡 M1: Credential Dikirim Tapi Tidak Digunakan (LOW)
RegisterForm line 66: `data.credential = credentialVal` — nilai credential dari Google dikirim tapi tidak pernah diakses di server. Sisa dari refactoring atau pengembangan yang belum selesai.

### 🟡 M2: Tidak Ada CSRF Protection (MEDIUM)
Endpoint `/api/register` adalah POST API murni tanpa CSRF token. Siapa pun bisa memicu registrasi dari situs eksternal jika user memiliki session aktif (walaupun session tidak diperlukan untuk register).

### 🟡 M3: Rate Limiting by IP Saja (LOW)
Rate limit dihitung per IP (10 request/60 detik). Di belakang NAT atau kantor dengan IP bersama, ini bisa memblokir banyak user legitimate.

### 🟡 M4: Error Message Leaks Implementation Detail (LOW)
Line 49: `return NextResponse.json({ error: "Program tidak ditemukan. (Sudah jalankan `npm run db:seed`?)" }, { status: 404 })` — pesan error bocor informasi tentang stack teknis ke client.

### 🟡 M5: Session Check via HTML Fetch (LOW)
RegisterForm line 97: `fetch("/member?check=1")` — mem-fetch HTML page untuk cek session. Bekerja tapi tidak idiomatis. Lebih baik API endpoint khusus.

---

## 4️⃣ VERIFIKASI PERTANYAAN

| Pertanyaan | Jawaban | Detail |
|---|---|---|
| **Apakah auto-login setelah daftar berhasil?** | ✅ **YA** (tapi karena API, bukan RegisterForm) | API route line 113 panggil `createMemberSession(email)` langsung sebelum return. Panggilan `memberLogin` di RegisterForm redundan dan silent fail di production. |
| **Apakah Google credential diverifikasi server?** | ❌ **TIDAK** | `/api/register` route tidak membaca/memverifikasi `credential`. Siapa pun bisa POST data palsu. Bandingkan dengan `/daftar` yang verifikasi via `memberLoginWithGoogle`. |
| **Apakah ada error handling untuk duplikasi?** | ⚠️ **Sebagian** | Ada check `existingReg` (line 61-81) untuk duplikasi WhatsApp/Email per program. Tapi ada false positive (beda user, email sama) dan false negative (skip ke upsert kalau status REGISTERED). |
| **Apakah upsert bisa timpa email?** | 🔴 **YA** | Upsert by `whatsapp_programId` → update set `email` dari body request. User dengan WhatsApp sama bisa timpa email user lain. Lihat **T3** di atas. |

---

## 5️⃣ REKOMENDASI PRIORITAS

### P0 — Segera Diperbaiki
1. **Verifikasi Google credential di /api/register**: Baca `body.credential`, verifikasi ke Google API seperti `memberLoginWithGoogle` lakukan
2. **Hapus panggilan `memberLogin` redundan** dari RegisterForm (line 82-86) — session sudah dibuat oleh API route
3. **Tambah validasi email uniqueness** di upsert: sebelum update, pastikan email belum dipakai registration lain untuk program yang sama (kecuali milik sendiri)

### P1 — Minggu Ini
4. **Perbaiki false positive existingReg**: Gunakan `AND` logic atau validasi terpisah untuk WhatsApp vs Email
5. **Tambah ukuran body limit** untuk POST /api/register

### P2 — Bulan Ini
6. **Tambahkan CSRF token** untuk API endpoints
7. **Refactor error messages** — jangan bocorkan detail teknis

---

## 6️⃣ FILE YANG DIBACA

| File | Baris | Peran |
|---|---|---|
| `src/components/RegisterForm.tsx` | 431 | Form utama, fetch ke /api/register, auto-login call |
| `src/components/GoogleAuthModal.tsx` | 276 | Modal pemilih akun Google (real + mock) |
| `src/app/api/register/route.ts` | 206 | API endpoint registrasi — upsert, session, WA, Xendit |
| `src/app/member/actions.ts` | 561 | Server actions: memberLogin, memberLoginWithGoogle |
| `src/lib/member-auth.ts` | 57 | createMemberSession, getMemberSession (HMAC cookie) |
| `src/lib/wa.ts` | 128 | Normalisasi WA + template pesan |
| `src/lib/xendit.ts` | 55 | createInvoice, isXenditConfigured |
| `src/lib/rate-limit.ts` | 66 | In-memory rate limiter |
| `src/lib/fallback.ts` | 178 | Fallback data program (demo mode) |
| `src/lib/programs.ts` | 102 | getProgramBySlug, getPrograms |
| `prisma/schema.prisma` | 370 | Schema: @@unique([whatsapp, programId]) |
| `src/middleware.ts` | 48 | Middleware: proteksi /member, /webadmin |
| `src/app/program/[slug]/page.tsx` | 642 | Halaman program — render RegisterForm |
| `src/app/daftar/page.tsx` | 338 | Halaman daftar akun — pakai server action |
