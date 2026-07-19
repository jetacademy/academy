import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Cek header X-API-Key + rate limit untuk endpoint /api/v1/*.
 * Dipakai bersama oleh endpoint baca (limit longgar) & tulis (limit lebih ketat).
 */
export async function authorizeApiRequest(
  req: Request,
  opts: { rateLimitKey: string; max: number; windowMs?: number }
): Promise<{ ok: true; apiKey: string } | { ok: false; response: NextResponse }> {
  const apiKey = req.headers.get("x-api-key");
  const authorized = await verifyApiKey(apiKey);
  if (!authorized || !apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key tidak valid atau tidak disertakan. Kirim header X-API-Key." },
        { status: 401 }
      ),
    };
  }

  const limit = checkRateLimit(`${opts.rateLimitKey}:${apiKey}`, opts.max, opts.windowMs);
  if (!limit.ok) {
    return { ok: false, response: NextResponse.json({ error: limit.error }, { status: limit.status }) };
  }

  return { ok: true, apiKey };
}
