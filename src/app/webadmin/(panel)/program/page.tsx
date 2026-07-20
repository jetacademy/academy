import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah, formatHari, formatJam } from "@/lib/format";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";
import { toggleProgram, deleteProgram, toggleCertClaim } from "../../actions";
import ConfirmButton from "@/components/ConfirmButton";
import { Prisma } from "@prisma/client";

export default async function AdminProgramList() {
  const programs = await prisma.program.findMany({
    orderBy: { scheduleAt: "asc" },
    include: { _count: { select: { registrations: true, questions: true } } },
  });

  // Ambil certClaimOpen via raw SQL agar tidak bergantung pada cache Prisma client
  const certClaimMap = new Map<string, boolean>();
  if (programs.length > 0) {
    try {
      type RawRow = { id: string; certClaimOpen: number };
      const ids = programs.map((p) => p.id);
      const rows = await prisma.$queryRaw<RawRow[]>(
        Prisma.sql`SELECT id, certClaimOpen FROM \`program\` WHERE id IN (${Prisma.join(ids)})`
      );
      for (const row of rows) {
        certClaimMap.set(row.id, row.certClaimOpen === 1);
      }
    } catch {
      // silent fallback
    }
  }

  return (
    <>
      <div className="adm-head">
        <h1>Program</h1>
        <Link href="/webadmin/program/new" className="btn btn-yellow btn-sm">+ Program Baru</Link>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Program</th>
              <th>Tipe</th>
              <th>Jadwal</th>
              <th>Harga</th>
              <th>Pendaftar</th>
              <th>Soal</th>
              <th>Status</th>
              <th>Sertifikat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => {
              const isCertOpen = certClaimMap.get(p.id) ?? false;
              return (
                <tr key={p.id}>
                  <td data-label="Program">
                    <Link href={`/webadmin/program/${p.id}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                    <div className="muted">/program/{p.slug}</div>
                  </td>
                  <td data-label="Tipe"><span className={`badge${p.price === 0 ? " y" : ""}`}>{TYPE_LABEL[p.type as ProgramType]}</span></td>
                  <td data-label="Jadwal" className="muted">{formatHari(p.scheduleAt)}, {formatJam(p.scheduleAt)}</td>
                  <td data-label="Harga">{p.price === 0 ? `Gratis · Sert. ${rupiah(p.certPrice)}` : rupiah(p.price)}</td>
                  <td data-label="Pendaftar">{p._count.registrations}</td>
                  <td data-label="Soal"><Link href={`/webadmin/program/${p.id}/soal`} className="btn btn-sm">{p._count.questions} soal</Link></td>
                  <td data-label="Status">{p.isActive ? <span className="badge g">Aktif</span> : <span className="badge dim">Nonaktif</span>}</td>

                  {/* ── Kolom Klaim Sertifikat (hanya untuk webinar gratis) ── */}
                  <td data-label="Sertifikat">
                    {p.price === 0 ? (
                      <form action={toggleCertClaim} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="btn btn-sm"
                          style={{
                            background: isCertOpen ? "#16a34a" : undefined,
                            color: isCertOpen ? "#fff" : undefined,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                          title={isCertOpen ? "Klik untuk menutup klaim sertifikat" : "Klik untuk membuka klaim sertifikat"}
                        >
                          {isCertOpen ? "🔓 Terbuka" : "🔒 Terkunci"}
                        </button>
                      </form>
                    ) : (
                      <span className="muted" style={{ fontSize: ".8rem" }}>—</span>
                    )}
                  </td>

                  <td data-label="Aksi">
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <Link href={`/webadmin/program/${p.id}`} className="btn btn-sm">Edit</Link>
                      <form action={toggleProgram}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="btn btn-sm">{p.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                      </form>
                      <form action={deleteProgram}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton className="btn btn-sm btn-danger" message={`Apakah Anda yakin ingin menghapus program "${p.title}"? Jika program ini sudah memiliki pendaftar, statusnya hanya akan diubah menjadi Nonaktif.`}>
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {programs.length === 0 && <tr><td colSpan={9} className="muted">Belum ada program.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="adm-note" style={{ marginTop: ".8rem" }}>
        Program yang sudah punya pendaftar tidak dihapus permanen — tombol Hapus akan menonaktifkannya.
        <br />
        Kolom <strong>Sertifikat</strong>: klik 🔒/🔓 untuk buka atau tutup akses klaim sertifikat peserta webinar.
      </p>
    </>
  );
}
