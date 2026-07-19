import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminSertifikat({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page ?? "1") || 1;
  const limit = 50;
  const skip = (currentPage - 1) * limit;

  const [certs, totalCount] = await Promise.all([
    prisma.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      skip,
      take: limit,
      include: { registration: { include: { program: true } } },
    }),
    prisma.certificate.count(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="adm-head">
        <h1>Sertifikat Terbit <span style={{ color: "var(--ink-faint)", fontSize: "1rem" }}>({totalCount} total)</span></h1>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Nomor</th><th>Nama</th><th>Program</th><th>Terbit</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td data-label="Nomor" style={{ fontWeight: 600 }}>{c.number}</td>
                <td data-label="Nama">{c.registration.name}</td>
                <td data-label="Program" className="muted">{c.registration.program.title}</td>
                <td data-label="Terbit" className="muted">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(c.issuedAt)}</td>
                <td data-label="Aksi"><a href={`/sertifikat/${c.number}`} target="_blank" className="btn btn-sm">Lihat ↗</a></td>
              </tr>
            ))}
            {certs.length === 0 && <tr><td colSpan={5} className="muted">Belum ada sertifikat terbit.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: ".8rem", alignItems: "center", marginTop: "1.4rem", justifyContent: "center" }}>
          {currentPage > 1 && (
            <Link
              href={`/webadmin/sertifikat?page=${currentPage - 1}`}
              className="btn btn-sm"
            >
              ← Sebelum
            </Link>
          )}
          <span style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--ink-soft)" }}>
            Halaman {currentPage} dari {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/webadmin/sertifikat?page=${currentPage + 1}`}
              className="btn btn-sm"
            >
              Sesudah →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
