/**
 * Meta Conversions API (Server-Side Tracking)
 *
 * Mengirim event Purchase langsung dari server ke Meta,
 * tanpa bergantung pada browser user.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const PIXEL_ID = "2178835656022057";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "EAAObNu52dZBsBSEz4vD7ZBkfAGJp4ZCWeuBcBoSArsWaZADOuhzxe6XB2Q2FSSzlMj4oodyKVOpf4eouVN7u4f9mw6gHC0lbLyeGo6pRTOsJiCxJef00vERZCDv6UzkO2xR3fmGLN5HFs0EI2FqrMtLKZAr2a9PeVUn0KujfZCfqsOG9ZCwzytnbrFWE5FjV62cSTgZDZD";
const API_VERSION = "v21.0";
const ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

interface CapiEvent {
  event_name: "Purchase" | "Lead" | "CompleteRegistration";
  event_time: number;
  event_id?: string; // event_id sama dengan Pixel browser → dedup otomatis di Meta
  action_source: "website";
  event_source_url?: string;
  user_data: {
    em?: string[]; // email hashed (SHA256)
    ph?: string[]; // phone hashed (SHA256)
  };
  custom_data?: Record<string, unknown>;
}

import * as crypto from "crypto";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

/** Normalisasi nomor HP ke format internasional (62xxx) untuk CAPI */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("08")) return "62" + digits.slice(1);
  if (digits.startsWith("628")) return digits;
  if (digits.startsWith("+628")) return digits.slice(1);
  return digits;
}

export async function sendCapiEvent(event: CapiEvent): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.warn("[CAPI] META_CAPI_ACCESS_TOKEN belum diset — event tidak dikirim");
    return false;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [event],
        access_token: ACCESS_TOKEN,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] Gagal:", result);
      return false;
    }

    console.log("[CAPI] Sukses:", result);
    return true;
  } catch (err) {
    console.error("[CAPI] Error:", err);
    return false;
  }
}

export function buildPurchaseEvent(
  email: string,
  phone: string,
  amount: number,
  contentName: string,
  eventId: string,
): CapiEvent {
  return {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: {
      em: [sha256(email)],
      ph: [sha256(normalizePhone(phone))],
    },
    custom_data: {
      value: amount,
      currency: "IDR",
      content_name: contentName,
    },
  };
}
