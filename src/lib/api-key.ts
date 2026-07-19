import { prisma } from "@/lib/prisma";

/** Verifikasi header X-API-Key terhadap tabel ApiKey. Mencatat lastUsedAt (best-effort). */
export async function verifyApiKey(rawKey: string | null): Promise<boolean> {
  if (!rawKey) return false;
  const found = await prisma.apiKey.findUnique({ where: { key: rawKey } });
  if (!found || !found.isActive) return false;

  prisma.apiKey
    .update({ where: { id: found.id }, data: { lastUsedAt: new Date() } })
    .catch((err) => console.error("[api-key] Gagal update lastUsedAt:", err));

  return true;
}
