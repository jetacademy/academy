# Arsitektur LMS Multi-Batch

## Masalah
ZHC berjalan setiap pekan → ratusan batch. Tiap batch punya rekaman, materi, slide sendiri.
Batch 1 cuma lihat konten batch 1.

## Solusi: batchId di LmsModule

### Perubahan Database (SQL langsung)
```sql
ALTER TABLE lmsmodule ADD COLUMN batchId VARCHAR(191) DEFAULT NULL;
ALTER TABLE lmsmodule ADD INDEX idx_lmsmodule_batch (batchId);
```

batchId = NULL → module berlaku untuk SEMUA batch (materi umum)
batchId = '...' → module khusus batch tertentu

### Alur
1. Admin buat module → pilih target batch (atau "Semua Batch")
2. Peserta buka LMS → filter module WHERE batchId IS NULL OR batchId = myBatch
3. Rekaman per batch disimpan di programbatch.recordingLink (udah ada)

### Perubahan Kode
1. LmsModule query di member/lms — tambah filter batchId
2. Webadmin form module — tambah dropdown batch
3. Dashboard member — pass batchId ke LMS
4. CRUD actions — support batchId

---

## Action Plan Lengkap

### Tahap 1: Database Migration

| # | Task | Detail | File | Estimasi |
|---|------|--------|------|----------|
| 1.1 | Buat migration file | Tambah kolom `batchId` VARCHAR(191) nullable + index | `prisma/migrations/` (auto-generate) | 15 menit |
| 1.2 | Update Prisma schema | Tambah field `batchId String?` di model `LmsModule` | `prisma/schema.prisma` | 5 menit |
| 1.3 | Update type definitions | Tambah `batchId?: string` di tipe LmsModule (Zod/TS) | `types/lms.ts` atau setara | 5 menit |
| 1.4 | Jalanin migration | `npx prisma migrate dev --name add_batch_id` | terminal | 5 menit |

**Estimasi Tahap 1: ~30 menit**

### Tahap 2: CRUD Backend — Support batchId

| # | Task | Detail | File | Estimasi |
|---|------|--------|------|----------|
| 2.1 | API create module | Accept `batchId` di body request, simpan ke DB | `app/api/lms/module/route.ts` (atau action/server) | 15 menit |
| 2.2 | API update module | Accept & update `batchId` | `app/api/lms/module/[id]/route.ts` | 10 menit |
| 2.3 | API list modules | Tambah parameter query `batchId` untuk filter opsional | `app/api/lms/module/route.ts` | 10 menit |
| 2.4 | API get module | Return `batchId` di response | `app/api/lms/module/[id]/route.ts` | 5 menit |

**Estimasi Tahap 2: ~40 menit**

### Tahap 3: Webadmin Form — Dropdown Batch

| # | Task | Detail | File | Estimasi |
|---|------|--------|------|----------|
| 3.1 | Fetch daftar batch untuk dropdown | Query `programbatch` untuk opsi dropdown | Server action / API call di form | 15 menit |
| 3.2 | Tambah dropdown di form module | `<select>` dengan opsi "Semua Batch" (nilai null) + daftar batch | `app/webadmin/lms/module/form.tsx` (atau lokasi form) | 20 menit |
| 3.3 | Validasi form | batchId opsional; jika diisi harus valid batch ID | Zod schema / validasi server | 10 menit |
| 3.4 | Update module edit page | Tampilkan nilai batchId saat ini + bisa diganti | `app/webadmin/lms/module/[id]/edit.tsx` | 15 menit |

**Estimasi Tahap 3: ~60 menit**

### Tahap 4: Member Dashboard — Filter by Batch

| # | Task | Detail | File | Estimasi |
|---|------|--------|------|----------|
| 4.1 | Dapatkan batchId user | Parse batchId dari user session / program batch enrollment | Server action / middleware | 10 menit |
| 4.2 | Query module dengan filter | `WHERE batchId IS NULL OR batchId = :userBatch` | `app/member/lms/actions.ts` atau query service | 15 menit |
| 4.3 | Pass batchId ke komponen | Prop atau context untuk komponen LMS member | `app/member/lms/page.tsx` | 10 menit |
| 4.4 | Tampilkan label batch di card module | Badge kecil "(Batch X)" di card module khusus batch | `app/member/lms/components/module-card.tsx` | 10 menit |

**Estimasi Tahap 4: ~45 menit**

### Tahap 5: Testing & Deployment

| # | Task | Detail | Estimasi |
|---|------|--------|----------|
| 5.1 | Test admin create module pilih batch | Verifikasi tersimpan dengan batchId benar | 15 menit |
| 5.2 | Test admin create module tanpa batch | Verifikasi batchId = NULL (berlaku semua batch) | 10 menit |
| 5.3 | Test member batch A lihat modul | Pastikan cuma lihat module batch A + module NULL | 15 menit |
| 5.4 | Test member batch B lihat modul | Pastikan cuma lihat module batch B + module NULL | 10 menit |
| 5.5 | Test update module ganti batch | Pastikan update berfungsi | 10 menit |
| 5.6 | Deploy migration ke staging/prod | `npx prisma migrate deploy` | 10 menit |

**Estimasi Tahap 5: ~70 menit**

---

## Total Estimasi

| Tahap | Estimasi |
|-------|----------|
| 1. Database Migration | 30 menit |
| 2. CRUD Backend | 40 menit |
| 3. Webadmin Form | 60 menit |
| 4. Member Dashboard | 45 menit |
| 5. Testing & Deployment | 70 menit |
| **Total** | **~4 jam kerja** |

## Catatan Penting

1. **batchId = NULL** sengaja dipakai sebagai penanda "Semua Batch" — ini memudahkan query filter `IS NULL` tanpa perlu magic string
2. **Index** penting karena query filter batchId akan sering dipakai di member dashboard
3. **Rekaman per batch** sudah ditangani oleh `programbatch.recordingLink` — tidak perlu perubahan
4. **Migration backward-compatible**: kolom baru nullable, semua module existing otomatis jadi "Semua Batch"
5. **Jika user punya multiple batch**: perlu klarifikasi lanjutan — tampilkan module dari semua batch enroll atau pilih salah satu
