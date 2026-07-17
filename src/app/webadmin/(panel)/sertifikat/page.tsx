import { prisma } from "@/lib/prisma";

export default async function AdminSertifikat() {
  const certs = await prisma.certificate.findMany({
    orderBy: { issuedAt: "desc" },
    take: 200,
    include: { registration: { include: { program: true } } },
  });

  return (
    <>
      <div className="adm-head">
        <h1>Sertifikat Terbit <span style={{ color: "var(--ink-faint)", fontSize: "1rem" }}>({certs.length})</span></h1>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Nomor</th><th>Nama</th><th>Program</th><th>Terbit</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.number}</td>
                <td>{c.registration.name}</td>
                <td className="muted">{c.registration.program.title}</td>
                <td className="muted">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(c.issuedAt)}</td>
                <td><a href={`/sertifikat/${c.number}`} target="_blank" className="btn btn-sm">Lihat ↗</a></td>
              </tr>
            ))}
            {certs.length === 0 && <tr><td colSpan={5} className="muted">Belum ada sertifikat terbit.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
