import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveLmsModule, deleteLmsModule, saveLmsLesson, deleteLmsLesson } from "../../../../actions";

interface LocalLesson {
  id: string;
  moduleId: string;
  title: string;
  type: string;
  videoUrl: string | null;
  content: string | null;
  duration: string;
  order: number;
}

interface LocalLmsModule {
  id: string;
  programId: string;
  title: string;
  order: number;
  lessons: LocalLesson[];
}

interface ProgramWithModules {
  id: string;
  title: string;
  modules: LocalLmsModule[];
}

export default async function AdminLms({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const queryOptions = {
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  };

  const program = (await (prisma.program.findUnique as unknown as (args: unknown) => Promise<unknown>)(queryOptions)) as unknown as ProgramWithModules;

  if (!program) notFound();

  return (
    <>
      <div className="adm-head" style={{ marginBottom: "2rem" }}>
        <div>
          <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 800, color: "var(--purple)", letterSpacing: "0.05em" }}>JetSchool Academy LMS</span>
          <h1 style={{ marginTop: "0.3rem" }}>Kurikulum & Materi: {program.title}</h1>
        </div>
        <Link href={`/webadmin/program/${program.id}`} className="btn btn-sm">← Kembali ke Program</Link>
      </div>

      <p className="adm-note" style={{ marginBottom: "2rem" }}>
        Kelola modul dan lesson (video/text) untuk pembelajaran mandiri (self-paced learning) siswa.
      </p>

      {/* Daftar Modul */}
      <div style={{ display: "grid", gap: "2.5rem" }}>
        {program.modules.map((mod, modIdx) => (
          <div
            key={mod.id}
            style={{
              background: "var(--white)",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow)",
              border: "1px solid var(--border)",
              overflow: "hidden"
            }}
          >
            {/* Header Modul */}
            <div
              style={{
                background: "var(--ink-softest)",
                padding: "1.2rem 1.8rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem"
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
                  Modul {modIdx + 1}: {mod.title}
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  ID: {mod.id} • {mod.lessons.length} Materi
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {/* Form Update Modul */}
                <form action={saveLmsModule} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="hidden" name="id" value={mod.id} />
                  <input type="hidden" name="programId" value={program.id} />
                  <input
                    name="title"
                    defaultValue={mod.title}
                    placeholder="Nama Modul"
                    required
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", width: "15rem" }}
                  />
                  <input
                    name="order"
                    type="number"
                    defaultValue={mod.order}
                    placeholder="Urutan"
                    required
                    style={{ padding: "0.4rem 0.5rem", fontSize: "0.85rem", width: "4rem" }}
                  />
                  <button type="submit" className="btn btn-sm btn-ink">Simpan</button>
                </form>

                {/* Form Hapus Modul */}
                <form action={deleteLmsModule}>
                  <input type="hidden" name="id" value={mod.id} />
                  <input type="hidden" name="programId" value={program.id} />
                  <button type="submit" className="btn btn-sm btn-danger">Hapus</button>
                </form>
              </div>
            </div>

            {/* Daftar Lesson */}
            <div style={{ padding: "1.8rem" }}>
              <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", marginBottom: "1rem" }}>
                Daftar Materi Pembelajaran (Lessons)
              </h4>

              {mod.lessons.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", border: "2px dashed var(--border)", borderRadius: "var(--r-sm)", color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                  Belum ada materi di modul ini. Silakan tambah di form bawah.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                  {mod.lessons.map((les, lesIdx) => (
                    <div
                      key={les.id}
                      style={{
                        padding: "1.2rem",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-sm)",
                        background: "#fafafa"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <h5 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                          Materi {lesIdx + 1}: {les.title} <span style={{ fontSize: "0.75rem", color: "var(--purple)", fontWeight: 500 }}>({les.type})</span>
                        </h5>
                        <form action={deleteLmsLesson}>
                          <input type="hidden" name="id" value={les.id} />
                          <input type="hidden" name="programId" value={program.id} />
                          <button type="submit" className="btn btn-xs btn-danger">Hapus Materi</button>
                        </form>
                      </div>

                      {/* Form Edit Lesson */}
                      <form action={saveLmsLesson} className="adm-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", display: "grid" }}>
                        <input type="hidden" name="id" value={les.id} />
                        <input type="hidden" name="programId" value={program.id} />
                        <input type="hidden" name="moduleId" value={mod.id} />

                        <div className="field" style={{ gridColumn: "span 2" }}>
                          <label>Judul Materi</label>
                          <input name="title" defaultValue={les.title} required />
                        </div>

                        <div className="field">
                          <label>Tipe Konten</label>
                          <select name="type" defaultValue={les.type}>
                            <option value="VIDEO">Video</option>
                            <option value="TEXT">Teks / Artikel</option>
                          </select>
                        </div>

                        <div className="field">
                          <label>Durasi Estimasi</label>
                          <input name="duration" defaultValue={les.duration} placeholder="Misal: 15 menit" required />
                        </div>

                        <div className="field" style={{ gridColumn: "span 2" }}>
                          <label>URL Video (Jika tipe Video)</label>
                          <input name="videoUrl" defaultValue={les.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=..." />
                        </div>

                        <div className="field">
                          <label>Urutan Tampil</label>
                          <input name="order" type="number" defaultValue={les.order} required />
                        </div>

                        <div className="field full" style={{ gridColumn: "span 3" }}>
                          <label>Isi Konten Teks (Mendukung HTML & deskripsi)</label>
                          <textarea name="content" defaultValue={les.content ?? ""} rows={4} placeholder="Tulis artikel atau deskripsi tambahan materi di sini..." />
                        </div>

                        <div className="full" style={{ gridColumn: "span 3", textAlign: "right" }}>
                          <button type="submit" className="btn btn-sm btn-ink">Simpan Materi {lesIdx + 1}</button>
                        </div>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Tambah Lesson Baru */}
              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "1.5rem" }}>
                <h5 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", color: "var(--purple)" }}>
                  + Tambah Materi Baru ke Modul ini
                </h5>
                <form action={saveLmsLesson} className="adm-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", display: "grid" }}>
                  <input type="hidden" name="programId" value={program.id} />
                  <input type="hidden" name="moduleId" value={mod.id} />

                  <div className="field" style={{ gridColumn: "span 2" }}>
                    <label>Judul Materi Baru</label>
                    <input name="title" placeholder="Nama materi..." required />
                  </div>

                  <div className="field">
                    <label>Tipe Konten</label>
                    <select name="type" defaultValue="VIDEO">
                      <option value="VIDEO">Video</option>
                      <option value="TEXT">Teks / Artikel</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Durasi Estimasi</label>
                    <input name="duration" placeholder="Misal: 10 menit" defaultValue="10 menit" required />
                  </div>

                  <div className="field" style={{ gridColumn: "span 2" }}>
                    <label>URL Video (Jika tipe Video)</label>
                    <input name="videoUrl" placeholder="https://www.youtube.com/watch?v=..." />
                  </div>

                  <div className="field">
                    <label>Urutan Tampil</label>
                    <input name="order" type="number" defaultValue={mod.lessons.length + 1} required />
                  </div>

                  <div className="field full" style={{ gridColumn: "span 3" }}>
                    <label>Isi Konten Teks (Mendukung HTML & deskripsi)</label>
                    <textarea name="content" rows={3} placeholder="Tulis artikel atau deskripsi tambahan materi di sini..." />
                  </div>

                  <div className="full" style={{ gridColumn: "span 3", textAlign: "right" }}>
                    <button type="submit" className="btn btn-purple btn-sm">Tambah Materi Baru</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tambah Modul Baru */}
      <div
        style={{
          marginTop: "3rem",
          background: "var(--white)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow)",
          border: "1px dashed var(--purple)",
          padding: "2rem"
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--purple)", marginBottom: "1.2rem" }}>
          + Tambah Modul Kurikulum Baru
        </h3>
        <form action={saveLmsModule} className="adm-form" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <input type="hidden" name="programId" value={program.id} />
          
          <div className="field" style={{ flex: "2", minWidth: "250px", marginBottom: 0 }}>
            <label>Nama Modul Baru</label>
            <input name="title" placeholder="Misal: Modul 2: Advanced Techniques" required />
          </div>

          <div className="field" style={{ flex: "0.5", minWidth: "100px", marginBottom: 0 }}>
            <label>Urutan Tampil</label>
            <input name="order" type="number" defaultValue={program.modules.length + 1} required />
          </div>

          <button type="submit" className="btn btn-purple" style={{ height: "42px", padding: "0 1.5rem" }}>
            Tambah Modul
          </button>
        </form>
      </div>
    </>
  );
}
