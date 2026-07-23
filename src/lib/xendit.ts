// ============================================================
// Xendit Invoice API — pembayaran paket sertifikat
// Docs: https://developers.xendit.co/api-reference/#create-invoice
// ============================================================

type XenditInvoice = {
  id: string;
  invoice_url: string;
  status: string;
};

/** Kunci dianggap belum diisi jika kosong atau masih nilai placeholder dari .env.example */
export function isXenditConfigured(): boolean {
  const key = process.env.XENDIT_SECRET_KEY ?? "";
  return key.length > 0 && !/x{5,}/i.test(key);
}

export async function createInvoice(params: {
  externalId: string; // kita isi dengan registrationId
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
}): Promise<XenditInvoice> {
  const secret = process.env.XENDIT_SECRET_KEY;
  if (!secret) throw new Error("XENDIT_SECRET_KEY belum diisi di .env");

  const res = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(secret + ":").toString("base64"),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      currency: "IDR",
      success_redirect_url: params.successRedirectUrl,
      invoice_duration: 86400, // invoice berlaku 24 jam
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Xendit error ${res.status}: ${body}`);
  }
  return res.json();
}

/** Verifikasi webhook: header x-callback-token harus sama dengan token di dashboard */
export function isValidCallback(token: string | null): boolean {
  return !!process.env.XENDIT_CALLBACK_TOKEN && token === process.env.XENDIT_CALLBACK_TOKEN;
}

// ============================================================
// Xendit Payouts API — pencairan komisi affiliate ke rekening bank / e-wallet
// Docs: https://developers.xendit.co/api-reference/#payouts
// PERHATIAN: fungsi ini mentransfer UANG SUNGGUHAN. Hanya dipanggil dari
// aksi admin yang sudah melalui konfirmasi eksplisit (lihat webadmin/affiliate).
// ============================================================

/** Daftar channel Payout yang didukung untuk penarikan komisi (bank & e-wallet populer Indonesia). */
export const PAYOUT_CHANNELS: { code: string; label: string; group: "Bank" | "E-Wallet" }[] = [
  { code: "ID_BCA", label: "BCA", group: "Bank" },
  { code: "ID_BNI", label: "BNI", group: "Bank" },
  { code: "ID_BRI", label: "BRI", group: "Bank" },
  { code: "ID_MANDIRI", label: "Mandiri", group: "Bank" },
  { code: "ID_CIMB", label: "CIMB Niaga", group: "Bank" },
  { code: "ID_PERMATA", label: "Permata", group: "Bank" },
  { code: "ID_BSI", label: "BSI", group: "Bank" },
  { code: "ID_BTN", label: "BTN", group: "Bank" },
  { code: "ID_OVO", label: "OVO", group: "E-Wallet" },
  { code: "ID_DANA", label: "DANA", group: "E-Wallet" },
  { code: "ID_LINKAJA", label: "LinkAja", group: "E-Wallet" },
  { code: "ID_SHOPEEPAY", label: "ShopeePay", group: "E-Wallet" },
  { code: "ID_GOPAY", label: "GoPay", group: "E-Wallet" },
];

type XenditPayout = {
  id: string;
  reference_id: string;
  status: string; // ACCEPTED | LOCKED | SUCCEEDED | FAILED | ...
};

/**
 * Buat Payout (pencairan dana keluar) — dipanggil admin sekali klik setelah meninjau
 * pengajuan penarikan affiliate. Idempotency-key dipakai referenceId itu sendiri, jadi
 * klik ganda yang tidak sengaja pada referenceId yang sama TIDAK memicu transfer dobel.
 */
export async function createPayout(params: {
  referenceId: string; // kita isi dengan AffiliateWithdrawal.id — kunci idempotensi
  amount: number;
  channelCode: string;
  accountNumber: string;
  accountHolderName: string;
  description: string;
}): Promise<XenditPayout> {
  const secret = process.env.XENDIT_SECRET_KEY;
  if (!secret) throw new Error("XENDIT_SECRET_KEY belum diisi di .env");

  const res = await fetch("https://api.xendit.co/v2/payouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(secret + ":").toString("base64"),
      "Idempotency-key": params.referenceId,
    },
    body: JSON.stringify({
      reference_id: params.referenceId,
      channel_code: params.channelCode,
      channel_properties: {
        account_holder_name: params.accountHolderName,
        account_number: params.accountNumber,
      },
      amount: params.amount,
      currency: "IDR",
      description: params.description,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Xendit Payout error ${res.status}: ${body}`);
  }
  return res.json();
}

/** Cek status Payout terkini langsung ke Xendit (dipakai admin sebagai fallback jika webhook belum masuk). */
export async function getPayoutStatus(payoutId: string): Promise<XenditPayout> {
  const secret = process.env.XENDIT_SECRET_KEY;
  if (!secret) throw new Error("XENDIT_SECRET_KEY belum diisi di .env");

  const res = await fetch(`https://api.xendit.co/v2/payouts/${encodeURIComponent(payoutId)}`, {
    headers: { Authorization: "Basic " + Buffer.from(secret + ":").toString("base64") },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Xendit Payout error ${res.status}: ${body}`);
  }
  return res.json();
}
