import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah, formatHari, formatJam } from "@/lib/format";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";
import { toggleProgram, deleteProgram } from "../../actions";

export default async function AdminProgramList() {
  const programs = await prisma.program.findMany({
    orderBy: { scheduleAt: "asc" },
    include: { _count: { select: { registrations: true, questions: true } } },
  });

  return (
    <>
      <div className="adm-head">
        <h1>Program</h1>
        <Link href="/webadmin/program/new" className="btn btn-yellow btn-sm">+ Program Baru</Link>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Program</th><th>Tipe</th><th>Jadwal</th><th>Harga</th><th>Pendaftar</th><th>Soal</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/webadmin/program/${p.id}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                  <div className="muted">/program/{p.slug}</div>
                </td>
                <td><span className={`badge${p.price === 0 ? " y" : ""}`}>{TYPE_LABEL[p.type as ProgramType]}</span></td>
                <td className="muted">{formatHari(p.scheduleAt)}, {formatJam(p.scheduleAt)}</td>
                <td>{p.price === 0 ? `Gratis · Sert. ${rupiah(p.certPrice)}` : rupiah(p.price)}</td>
                <td>{p._count.registrations}</td>
                <td><Link href={`/webadmin/program/${p.id}/soal`} className="btn btn-sm">{p._count.questions} soal</Link></td>
                <td>{p.isActive ? <span className="badge g">Aktif</span> : <span className="badge dim">Nonaktif</span>}</td>
                <td>
                  <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                    <Link href={`/webadmin/program/${p.id}`} className="btn btn-sm">Edit</Link>
                    <form action={toggleProgram}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="btn btn-sm">{p.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                    </form>
                    <form action={deleteProgram}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="btn btn-sm btn-danger">Hapus</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {programs.length === 0 && <tr><td colSpan={8} className="muted">Belum ada program.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="adm-note" style={{ marginTop: ".8rem" }}>
        Program yang sudah punya pendaftar tidak dihapus permanen — tombol Hapus akan menonaktifkannya.
      </p>
    </>
  );
}
