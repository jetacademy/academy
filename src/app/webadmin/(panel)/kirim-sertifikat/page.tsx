import { prisma } from "@/lib/prisma";
import Link from "next/link";
import KirimCertClient from "./KirimCertClient";

export const dynamic = "force-dynamic";

export default async function AdminKirimSertifikat({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [programs, recentCerts] = await Promise.all([
    prisma.program.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        certBgUrl: true,
        certConfig: true,
      },
    }),
    prisma.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      take: 50,
      include: {
        registration: { include: { program: { select: { title: true } } } },
      },
    }),
  ]);

  return (
    <>
      <div className="adm-head">
        <h1>Kirim Sertifikat</h1>
      </div>

      {params.ok === "1" && (
        <div className="adm-alert ok">
          ✅ Selesai: <b>{params.imported ?? "0"}</b> sertifikat terbit,{" "}
          <b>{params.skipped ?? "0"}</b> sudah ada, <b>{params.failed ?? "0"}</b> gagal.
          {params.via && <> Sertifikat terkirim via <b>{params.via === "wa" ? "WhatsApp" : "Email"}</b>.</>}
        </div>
      )}
      {params.e && (
        <div className="adm-alert err">
          Gagal:{" "}
          {params.e === "invalid" && "Data tidak valid. Pastikan kolom terisi benar."}
          {params.e === "empty" && "Tidak ada peserta di Excel."}
          {params.e === "program" && "Program tidak ditemukan."}
          {params.e === "hold" && "Penerbitan sertifikat sedang di-hold. Aktifkan dulu di menu Sertifikat."}
          {params.e === "notfound" && "Sertifikat tidak ditemukan."}
          {params.e === "wafail" && "Gagal kirim WA. Cek konfigurasi Evolution API / nomor tujuan."}
          {params.e === "sendfail" && "Gagal mengirim. Cek log server."}
        </div>
      )}

      <KirimCertClient programs={programs} recentCerts={recentCerts} />
    </>
  );
}
