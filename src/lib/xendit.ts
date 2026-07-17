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
