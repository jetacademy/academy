import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createBatch, toggleBatch, deleteBatch } from "@/app/webadmin/actions";
import { formatJadwal } from "@/lib/format";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AdminBatch({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; e?: string; deleted?: string }>;
}) {
  const { id } = await params;
  const { ok, e, deleted } = await searchParams;

  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  const batches = await prisma.programBatch.findMany({
    where: { programId: id },
    orderBy: { scheduleAt: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  const now = new Date();

  return (
    <>
      {ok === "1" && <div className="adm-alert ok">Batch baru berhasil ditambahkan.</div>}
      {deleted === "1" && <div className="adm-alert ok">Batch dihapus.</div>}
      {e === "lengkapi" && <div className="adm-alert err">Tanggal jadwal wajib diisi.</div>}
      {e === "tanggal" && <div className="adm-alert err">Format tanggal tidak valid.</div>}

      <h2 style={{ fontSize: "1.15rem", margin: "0 0 .3rem" }}>Jadwal &amp; Batch</h2>
      <p className="adm-note" style={{ marginBottom: "1.6rem" }}>
        Untuk program yang berulang (webinar mingguan, kelas bulanan, dst), tambahkan banyak jadwal batch
        di sini — kurikulum, materi, dan harga tetap satu program yang sama. Peserta memilih batch saat
        mendaftar; histori pendaftaran &amp; sertifikat tetap terpisah per batch.
        {batches.length === 0 && " Selama belum ada batch, halaman publik memakai jadwal default program (tab Info Program)."}
      </p>

      <div className="form-section">
        <header>
          <h3>Tambah Batch Baru</h3>
        </header>
        <form action={createBatch} className="fs-body">
          <input type="hidden" name="programId" value={program.id} />
          <div className="field">
            <label>Tanggal &amp; Jam Mulai</label>
            <input type="datetime-local" name="scheduleAt" required />
          </div>
          <div className="field">
            <label>Kuota Kursi (kosongkan jika tak terbatas)</label>
            <input name="seatsLeft" inputMode="numeric" placeholder="mis. 50" />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-purple">Tambah Batch</button>
          </div>
        </form>
      </div>

      <div className="tbl-wrap" style={{ marginTop: "1.2rem" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Jadwal</th>
              <th>Kuota</th>
              <th>Pendaftar</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const past = b.scheduleAt < now;
              return (
                <tr key={b.id}>
                  <td data-label="Jadwal">
                    {formatJadwal(b.scheduleAt)}
                    {past && <div className="muted">Sudah lewat</div>}
                  </td>
                  <td data-label="Kuota">{b.seatsLeft ?? <span className="muted">Tak terbatas</span>}</td>
                  <td data-label="Pendaftar">{b._count.registrations}</td>
                  <td data-label="Status">
                    <span className={`badge ${b.isActive ? "g" : "dim"}`}>{b.isActive ? "Aktif" : "Nonaktif"}</span>
                  </td>
                  <td data-label="Aksi">
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <form action={toggleBatch}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="programId" value={program.id} />
                        <button type="submit" className="btn btn-sm">{b.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                      </form>
                      <form action={deleteBatch}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="programId" value={program.id} />
                        <ConfirmButton className="btn btn-sm btn-danger" message="Apakah Anda yakin ingin menghapus batch jadwal ini?" disabled={b._count.registrations > 0} title={b._count.registrations > 0 ? "Tidak bisa dihapus — sudah ada pendaftar. Nonaktifkan saja." : undefined}>
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {batches.length === 0 && (
              <tr><td colSpan={5} className="muted">Belum ada batch. Program memakai jadwal tunggal di tab Info Program.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
