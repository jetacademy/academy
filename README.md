# ✦ Jetschool Academy — Mesin Uang Pelatihan

Website funnel lengkap dengan 4 tipe program, pembayaran Xendit, WhatsApp otomatis (Evolution API), post-test, e-sertifikat ber-QR, dan panel admin.

Stack: **Next.js 16 (App Router) + Prisma 6 + MySQL**. Desain: bento card (ungu · oranye · lime, Plus Jakarta Sans) — teks minim, satu CTA diulang, fokus closing.

---

## ⚡ Menjalankan

```bash
npm install          # sekali saja
npx prisma db push   # buat tabel di MySQL (WAMP harus nyala)
npm run db:seed      # isi 4 program contoh + soal post-test
npm run dev          # buka http://localhost:3000
```

## 🧭 Tipe Program & Alurnya

| Tipe | Harga | Alur peserta |
|---|---|---|
| **Webinar** | Gratis | Daftar → WA (Zoom + grup) → *upsell*: bayar sertifikat → post-test → sertifikat |
| **Kelas Online (LMS)** | Berbayar | Daftar → bayar Xendit → WA (LMS + grup) → post-test → sertifikat |
| **Workshop** | Berbayar | Daftar → bayar → WA (Zoom + grup) → post-test → sertifikat |
| **Bootcamp** | Berbayar | Sama seperti workshop, multi-sesi + LMS |

Halaman `/program/[slug]` otomatis menyesuaikan tipe: headline hasil-akhir, **timer urgency 2 jam**, **value stack** dengan harga coret, **garansi**, testimoni, dan satu CTA — sesuai psikologi halaman tripwire.

## 🗺️ Halaman Publik

| URL | Fungsi |
|---|---|
| `/` | Beranda — daftar semua program per tipe |
| `/program/[slug]` | **Halaman tujuan iklan Meta** — navigasi hanya logo + 1 tombol |
| `/sertifikat` | Klaim sertifikat webinar gratis (bayar → post-test) |
| `/post-test/[id]` | Post-test (terkunci sampai lunas) |
| `/sertifikat/[nomor]` | e-Sertifikat + **QR verifikasi** publik |

## 🔐 Panel Admin — `/webadmin`

Password default: `jetschool123` — ganti lewat `ADMIN_PASSWORD` di `.env` (**wajib sebelum go-live**).

- **Dashboard** — total pendaftar, pendapatan lunas, sertifikat terbit, rekap per program, pendaftar terbaru.
- **Program** — tambah/edit semua isi halaman jualan (tagline, materi, value stack, harga, garansi, link Zoom/grup/LMS), aktif/nonaktifkan, hapus.
- **Soal** — kelola soal post-test per program (kunci jawaban tidak pernah terkirim ke browser peserta).
- **Pendaftar** — cari & filter, **Tandai Lunas** manual (untuk transfer langsung — otomatis kirim WA akses), hapus.
- **Sertifikat** — daftar semua sertifikat terbit + link.

## 🔧 Konfigurasi Production (file `.env`)

1. `ADMIN_PASSWORD` — password panel admin.
2. **Xendit**: `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN`; set webhook Invoice ke `https://domainkamu.com/api/webhooks/xendit`.
3. **Evolution API**: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`.
4. `NEXT_PUBLIC_BASE_URL` = domain kamu; `NEXT_PUBLIC_WA_ADMIN` = nomor admin `628xxx`.
5. **Meta Pixel** — pasang script pixel di `src/app/layout.tsx`; event `Lead` & `InitiateCheckout` sudah otomatis terkirim dari form.

> 💡 **Mode DEV**: selama kunci Xendit belum diisi (atau masih placeholder), pembayaran otomatis dianggap lunas supaya alur bisa dites lokal. Di production tanpa kunci, pembelian ditolak — aman dari sertifikat gratis.

## 📄 Sertifikat

- Nomor otomatis `JSA-<tahun>-<urut>` + **QR code** menuju halaman verifikasi.
- Terbit otomatis saat lulus post-test, link dikirim via WA.
- Garansi bawaan: uang kembali jika tidak terbit 1×24 jam (teks bisa diedit per program di admin).

## 🧪 Sudah Diverifikasi End-to-End

- ✅ Daftar webinar gratis → WA sambutan (dilewati rapi saat Evolution belum dikonfigurasi)
- ✅ Beli bootcamp (dev mode) → status LUNAS → WA akses (grup + LMS + post-test)
- ✅ Post-test skor 100 → sertifikat `JSA-2026-XXXX` terbit + halaman QR
- ✅ `/webadmin` tanpa login → dilempar ke login; dengan sesi → dashboard lengkap
- ✅ Production tanpa kunci Xendit → pembelian ditolak 503 (pengaman aktif)
