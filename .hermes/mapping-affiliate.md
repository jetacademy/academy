# Mapping File & Fungsi Affiliate — Jetschool Academy

## 🔍 Ringkasan

- **Total file terkait affiliate**: 29 file
- **Kata kunci dicari**: affiliate, referral, komisi, commission, reff, afiliasi
- **6 file inti**: `affiliate.ts`, `affiliate-actions.ts` (×2), `AffiliateDashboardClient.tsx`, `ProcessPayoutButton.tsx`, `proxy.ts`
- **12 halaman route**: member (3), admin web (7), API (2)
- **3 library pendukung**: xendit.ts, email.ts, wa.ts

---

## 📁 A. Library Inti

### 1. `src/lib/affiliate.ts` (276 baris) — **Jantung logika affiliate**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AFFILIATE_REF_COOKIE` | 8 | Nama cookie atribusi: `jsa_aff_ref` |
| `getAffiliateRefCookie()` | 12 | Baca cookie atribusi aman |
| `getAffiliateSettings()` | 25 | Ambil/init pengaturan global (singleton) |
| `baseCodeFromName(name)` | 34 | Generate kode dari nama (alfanumerik, 10 char) |
| `generateUniqueAffiliateCode(name)` | 40 | Buat kode unik + fallback random |
| `normalizeCustomCode(raw)` | 53 | Validasi kode custom user input |
| `findActiveAffiliateByCode(code)` | 58 | Cari affiliate AKTIF berdasarkan kode |
| `resolveAffiliateForCheckout(manual, cookie)` | 71 | Tentukan affiliate untuk transaksi (prioritas: manual → cookie) |
| `applyAffiliateDiscount(affiliate, baseAmount)` | 95 | Hitung potongan harga customer dari diskon affiliate |
| `calcCommission(type, value, saleAmount)` | 107 | Hitung nominal komisi |
| `recordAffiliateConversion(paymentId)` | 117 | Catat komisi setelah payment PAID (idempoten) |
| `voidAffiliateConversion(paymentId, reason)` | 152 | Batalkan komisi karena refund |
| `promoteDueConversions(affiliateId)` | 169 | Naikkan PENDING → AVAILABLE (lazy, bukan cron) |
| `getAffiliateBalance(affiliateId)` | 186 | Hitung saldo langsung dari ledger |
| `settleWithdrawalConversions(affiliateId, amount)` | 226 | Tandai komisi AVAILABLE → WITHDRAWN (FIFO) |
| `notifyWithdrawalResult(withdrawalId, status, reason)` | 248 | Kirim notifikasi WA+Email hasil penarikan |

### 2. `src/lib/xendit.ts` (143 baris) — **Pembayaran & Pencairan**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `isXenditConfigured()` | 13 | Cek apakah Xendit API key sudah diisi |
| `createInvoice(...)` | 18 | Buat invoice pembayaran Xendit |
| `isValidCallback(token)` | 53 | Verifikasi webhook token |
| `PAYOUT_CHANNELS` | 65 | Daftar channel payout (13 bank/e-wallet Indonesia) |
| `createPayout(...)` | 92 | BUAT PAYOUT SUNGGUHAN — transfer uang nyata (idempoten key) |
| `getPayoutStatus(payoutId)` | 131 | Cek status payout ke Xendit (fallback webhook) |

### 3. `src/lib/email.ts` — **Template email affiliate**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `getAffiliateInviteEmailHtml(name, url)` | ~262 | Email undangan join affiliate |
| `getAffiliateWithdrawalEmailHtml(params)` | ~283 | Email notifikasi hasil penarikan (sukses/ditolak) |

### 4. `src/lib/wa.ts` — **Template WhatsApp affiliate**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `msgAffiliateInvite(name, dashboardUrl)` | ~120 | WA undangan join affiliate |
| `msgAffiliateWithdrawalCompleted(name, amount, url)` | ~134 | WA penarikan berhasil |
| `msgAffiliateWithdrawalRejected(name, amount, reason, url)` | ~148 | WA penarikan ditolak |

---

## 📁 B. Route Pages & Server Actions

### 5. `src/app/webadmin/affiliate-actions.ts` (275 baris) — **Admin server actions**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `inviteAffiliate(formData)` | 23 | Kirim undangan ke user (WA+Email) |
| `toggleAffiliateSuspend(formData)` | 71 | Nonaktifkan/aktifkan affiliate |
| `updateAffiliateRates(formData)` | 84 | Ubah rate komisi & diskon per affiliate |
| `adminSetAffiliateCode(formData)` | 106 | Ganti kode referral dari sisi admin |
| `saveAffiliateSettings(formData)` | 124 | Simpan pengaturan global program affiliate |
| `processWithdrawalPayout(withdrawalId)` | 150 | Proses pencairan via Xendit (uang nyata) |
| `rejectWithdrawal(formData)` | 196 | Tolak pengajuan penarikan |
| `markWithdrawalCompletedManually(formData)` | 218 | Tandai selesai manual (fallback webhook) |
| `replyTicket(formData)` | 237 | Balas tiket dukungan affiliate |
| `setTicketStatus(formData)` | 269 | Ubah status tiket |

### 6. `src/app/webadmin/(panel)/affiliate/page.tsx` (166 baris) — **Daftar affiliate admin**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AdminAffiliateList()` | 21 | List semua affiliate + total komisi + invitasi |

### 7. `src/app/webadmin/(panel)/affiliate/[id]/page.tsx` (173 baris) — **Detail affiliate admin**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AdminAffiliateDetail()` | 23 | Ringkasan komisi, histori konversi, form rate, ganti kode |

### 8. `src/app/webadmin/(panel)/affiliate/penarikan/page.tsx` (129 baris) — **Penarikan admin**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AdminAffiliateWithdrawals()` | 29 | List penarikan, tombol proses via Xendit + tolak |

### 9. `src/app/webadmin/(panel)/affiliate/pengaturan/page.tsx` (74 baris) — **Pengaturan**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AdminAffiliateSettings()` | 6 | Form pengaturan global (komisi default, hold days, cookie, syarat) |

### 10. `src/app/webadmin/(panel)/affiliate/tiket/page.tsx` (99 baris) — **Tiket admin**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AdminTicketList()` | 26 | List tiket dukungan dengan filter status |

### 11. `src/app/webadmin/(panel)/affiliate/tiket/[id]/page.tsx` (98 baris) — **Detail tiket**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AdminTicketDetail()` | 15 | Detail tiket + form balas |

### 12. `src/app/member/affiliate-actions.ts` (170 baris) — **Member server actions**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `getMyAffiliate()` | 11 | Ambil data affiliate milik member login |
| `respondToAffiliateInvite(formData)` | 28 | Terima/tolak undangan affiliate |
| `updateMyAffiliateCode(formData)` | 45 | Ganti kode referral sendiri |
| `updateMyPayoutInfo(formData)` | 63 | Simpan info rekening/e-wallet |
| `requestWithdrawal(formData)` | 83 | Ajukan penarikan komisi |
| `createTicket(formData)` | 124 | Buat tiket dukungan baru |
| `replyTicketAsUser(formData)` | 154 | Balas tiket dari sisi member |

### 13. `src/app/member/affiliate/page.tsx` (173 baris) — **Dashboard affiliate member**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `MemberAffiliatePage()` | 24 | Halaman utama — menampilkan status + ActiveDashboard |
| `ActiveDashboard(...)` | 107 | Server component: saldo, histori, referal URL, program |

### 14. `src/app/member/affiliate/tiket/page.tsx` (67 baris) — **Tiket member**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `MemberTicketListPage()` | 18 | List tiket milik member |

### 15. `src/app/member/affiliate/tiket/[id]/page.tsx` (66 baris) — **Detail tiket member**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `MemberTicketDetailPage()` | 17 | Detail tiket + form balas |

---

## 📁 C. Components (Client-Side)

### 16. `src/components/AffiliateDashboardClient.tsx` (294 baris) — **Dashboard affiliate (client)**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `AffiliateDashboardClient(...)` | 32 | Ringkasan saldo, link referral, share program, info pencairan, form ajukan penarikan, histori |

### 17. `src/components/ProcessPayoutButton.tsx` (129 baris) — **Tombol payout admin**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `ProcessPayoutButton(...)` | 12 | Modal 2-step konfirmasi → panggil `processWithdrawalPayout` |

### 18. `src/components/TicketCreateForm.tsx` — **Form buat tiket**
| Fungsi | Baris | Tujuan |
|---|---|---|
| `TicketCreateForm` | — | Form buat tiket (kategori komisi/penarikan/akun/teknis) |

### 19. `src/components/TicketReplyForm.tsx` — **Form balas tiket** | Fungsi | Baris | Tujuan |
|---|---|---|---|
| `TicketReplyForm` | — | Form kirim pesan balasan tiket |

### 20. `src/components/CheckoutForm.tsx` — **Form checkout (kolom voucher)**
| Fungsi | Baris | Tujuan |
|---|---|---|
| — | 72-75 | Kolom input kode voucher (bisa diisi kode affiliate) + hint referral link |

### 21. `src/components/RegisterForm.tsx` — **Form registrasi**
| Fungsi | Baris | Tujuan |
|---|---|---|
| — | 209-213 | Kolom input kode voucher (bisa diisi kode affiliate) + hint referral link |

---

## 📁 D. API Routes & Backend

### 22. `src/app/api/register/route.ts` (417 baris) — **API registrasi**
| Baris | Tujuan |
|---|---|
| 10 (import) | Impor fungsi affiliate: `resolveAffiliateForCheckout`, `applyAffiliateDiscount`, `recordAffiliateConversion`, `getAffiliateRefCookie` |
| 176-191 | Resolve affiliate → hitung diskon → simpan affiliateId di payment → catat konversi jika PAID langsung |

### 23. `src/app/api/checkout/route.ts` (156 baris) — **API checkout sertifikat**
| Baris | Tujuan |
|---|---|
| 7 (import) | Impor fungsi affiliate: `resolveAffiliateForCheckout`, `applyAffiliateDiscount`, `recordAffiliateConversion`, `getAffiliateRefCookie` |
| 82-117 | Sama seperti register: resolve affiliate, diskon, catat konversi |

### 24. `src/app/api/webhooks/xendit/route.ts` (174 baris) — **Webhook Xendit**
| Baris | Tujuan |
|---|---|
| 7 (import) | Impor: `recordAffiliateConversion`, `settleWithdrawalConversions`, `notifyWithdrawalResult` |
| 29-61 | **Payout callback**: webhook payout → complete/fail → settle conversions + notifikasi |
| 105 | **Invoice callback**: panggil `recordAffiliateConversion(payment.id)` saat PAID |

---

## 📁 E. Proxy / Middleware

### 25. `src/proxy.ts` (104 baris) — **Atribusi affiliate via cookie**
| Baris | Tujuan |
|---|---|
| 8-12 | Atribusi `?ref=KODE` → validasi → simpan cookie httpOnly di response pertama |
| 56-93 | Proses: baca `ref` param → cek affiliate → set cookie `jsa_aff_ref` + increment `clickCount` |

---

## 📁 F. Halaman Pendukung & Lainnya

### 26. `src/app/webadmin/actions.ts` (baris 11-13, 982-989) — **Aksi admin umum**
| Baris | Tujuan |
|---|---|
| 13 (import) | Import `recordAffiliateConversion`, `voidAffiliateConversion` |
| 982-989 | `voidAffiliateConversion` dipanggil saat refund payment — batalkan komisi |

### 27. `src/app/member/actions.ts` (baris 13) — **Aksi member umum**
| Baris | Tujuan |
|---|---|
| 13 (import) | Import: `findActiveAffiliateByCode`, `applyAffiliateDiscount`, `recordAffiliateConversion`, `getAffiliateRefCookie` |
| (digunakan di `initiateCertificateCheckout`) | Sama seperti register/checkout untuk checkout dari LMS |

### 28. `src/app/member/page.tsx` (baris 114-131) — **Dashboard member**
| Baris | Tujuan |
|---|---|
| 114-131 | Kartu undangan affiliate + dashboard affiliate di halaman utama member |

### 29. `src/app/member/login/page.tsx` — **Login member** | Baris | Tujuan |
|---|---|---|
| (ada link ke affiliate) | Link ke dashboard affiliate setelah login |

---

## 📁 G. Prisma Models Terkait

Berdasarkan pola database dari kode:
- **`Affiliate`** — User affiliate (code, status, commissionType/Value, discountType/Value, bank/ewallet info, clickCount)
- **`AffiliateConversion`** — Catatan komisi per transaksi (affiliateId, paymentId, commissionAmount, status: PENDING/AVAILABLE/WITHDRAWN/VOIDED)
- **`AffiliateWithdrawal`** — Pengajuan penarikan (affiliateId, amount, channelCode, status: REQUESTED/PROCESSING/COMPLETED/REJECTED/FAILED)
- **`AffiliateSettings`** — Pengaturan global (default rates, holdDays, cookieDays, minWithdrawal, termsText)
- **`Ticket`** — Tiket dukungan (affiliateId nullable, name, email, whatsapp, subject, category, status)
- **`TicketMessage`** — Pesan dalam tiket (senderRole: USER/ADMIN)

---

## 📊 Statistik

| Kategori | Jumlah File |
|---|---|
| Library inti (affiliate.ts, xendit.ts) | 2 |
| Template notifikasi (email.ts, wa.ts) | 2 (partial) |
| Server action files | 2 (admin + member) |
| Admin route pages | 7 |
| Member route pages | 3 |
| API routes | 3 |
| Components | 6 |
| Proxy/middleware | 1 |
| Halaman pendukung | 3 (partial) |
| **Total** | **29 file** |
