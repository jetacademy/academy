import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  saveLmsGroup,
  deleteLmsGroup,
  moveLmsGroup,
  saveLmsModule,
  deleteLmsModule,
  moveLmsModule,
  deleteLmsLesson,
  moveLmsLesson,
} from "@/app/webadmin/actions";
import ConfirmButton from "@/components/ConfirmButton";

const TYPE_CHIP: Record<string, { cls: string; label: string }> = {
  VIDEO: { cls: "video", label: "Video" },
  TEXT: { cls: "text", label: "Teks" },
  PDF: { cls: "pdf", label: "PDF" },
  QUIZ: { cls: "quiz", label: "Kuis" },
};

type LessonRow = {
  id: string;
  title: string;
  type: string;
  duration: string;
  isPreview: boolean;
  passingScore: number | null;
  _count: { questions: number };
};

type ModuleRow = {
  id: string;
  title: string;
  groupId: string | null;
  lessons: LessonRow[];
};

type GroupOption = { id: string; title: string };

/** Kartu satu modul: rename + pindah kelompok, daftar materi, tambah materi */
function ModuleCard({
  programId,
  mod,
  label,
  isFirst,
  isLast,
  groups,
}: {
  programId: string;
  mod: ModuleRow;
  label: string;
  isFirst: boolean;
  isLast: boolean;
  groups: GroupOption[];
}) {
  return (
    <section className="lms-mod">
      <div className="lms-mod-head">
        <span className="mod-no">{label}</span>

        <form action={saveLmsModule} className="inline-title">
          <input type="hidden" name="id" value={mod.id} />
          <input type="hidden" name="programId" value={programId} />
          <input name="title" defaultValue={mod.title} required title="Klik untuk mengganti nama modul" />
          <select
            name="groupId"
            defaultValue={mod.groupId ?? ""}
            title="Pindahkan ke kelompok lain"
            style={{ padding: ".4em .6em", fontSize: ".76rem", borderRadius: "8px", border: "1px solid var(--chip)", background: "var(--white)", maxWidth: "11rem" }}
          >
            <option value="">Tanpa kelompok</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-sm btn-purple">Simpan</button>
        </form>

        <span style={{ fontSize: ".72rem", color: "var(--ink-faint)", fontWeight: 700 }}>
          {mod.lessons.length} materi
        </span>

        <div style={{ display: "flex", gap: ".35rem" }}>
          <form action={moveLmsModule}>
            <input type="hidden" name="id" value={mod.id} />
            <input type="hidden" name="programId" value={programId} />
            <input type="hidden" name="dir" value="up" />
            <button type="submit" className="icon-btn" disabled={isFirst} title="Geser ke atas">↑</button>
          </form>
          <form action={moveLmsModule}>
            <input type="hidden" name="id" value={mod.id} />
            <input type="hidden" name="programId" value={programId} />
            <input type="hidden" name="dir" value="down" />
            <button type="submit" className="icon-btn" disabled={isLast} title="Geser ke bawah">↓</button>
          </form>
          <form action={deleteLmsModule}>
            <input type="hidden" name="id" value={mod.id} />
            <input type="hidden" name="programId" value={programId} />
            <ConfirmButton
              className="icon-btn danger"
              title="Hapus modul"
              message={`Hapus modul "${mod.title}" beserta ${mod.lessons.length} materinya? Progres belajar peserta pada modul ini ikut terhapus.`}
            >
              Hapus
            </ConfirmButton>
          </form>
        </div>
      </div>

      <div className="lms-lessons">
        {mod.lessons.length === 0 && (
          <p style={{ fontSize: ".8rem", color: "var(--ink-faint)", fontStyle: "italic", padding: ".4rem .7rem", margin: 0 }}>
            Belum ada materi di modul ini.
          </p>
        )}

        {mod.lessons.map((les, lesIdx) => {
          const chip = TYPE_CHIP[les.type] ?? TYPE_CHIP.VIDEO;
          return (
            <div key={les.id} className="q-row" style={{ boxShadow: "none" }}>
              <span className={`type-chip ${chip.cls}`}>{chip.label}</span>
              <Link href={`/webadmin/program/${programId}/lms/lesson/${les.id}`} className="q-text" title="Klik untuk mengedit materi">
                {les.title}
              </Link>
              {les.isPreview && <span className="badge" style={{ fontSize: ".62rem", flexShrink: 0 }}>Preview Gratis</span>}
              {les.type === "QUIZ" && (
                <span className="l-meta" style={{ flexShrink: 0 }}>{les._count.questions} soal</span>
              )}
              <span className="l-meta" style={{ flexShrink: 0 }}>{les.duration}</span>
              <div style={{ display: "flex", gap: ".35rem", flexShrink: 0 }}>
                <form action={moveLmsLesson}>
                  <input type="hidden" name="id" value={les.id} />
                  <input type="hidden" name="programId" value={programId} />
                  <input type="hidden" name="moduleId" value={mod.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" className="icon-btn" disabled={lesIdx === 0} title="Geser ke atas">↑</button>
                </form>
                <form action={moveLmsLesson}>
                  <input type="hidden" name="id" value={les.id} />
                  <input type="hidden" name="programId" value={programId} />
                  <input type="hidden" name="moduleId" value={mod.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" className="icon-btn" disabled={lesIdx === mod.lessons.length - 1} title="Geser ke bawah">↓</button>
                </form>
                <Link href={`/webadmin/program/${programId}/lms/lesson/${les.id}`} className="icon-btn" title="Edit materi" style={{ textDecoration: "none" }}>
                  Edit
                </Link>
                <form action={deleteLmsLesson}>
                  <input type="hidden" name="id" value={les.id} />
                  <input type="hidden" name="programId" value={programId} />
                  <ConfirmButton className="icon-btn danger" title="Hapus materi" message={`Hapus materi "${les.title}"?`}>
                    Hapus
                  </ConfirmButton>
                </form>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: ".6rem" }}>
          <Link
            href={`/webadmin/program/${programId}/lms/lesson/new?module=${mod.id}`}
            className="btn btn-sm"
            style={{ borderStyle: "dashed", boxShadow: "inset 0 0 0 1.5px var(--chip)", background: "transparent", color: "var(--purple)" }}
          >
            + Tambah Materi / Tes
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function AdminLms({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string; ok?: string; deleted?: string }>;
}) {
  const { id } = await params;
  const { e, ok, deleted } = await searchParams;

  const lessonInclude = {
    lessons: {
      orderBy: { order: "asc" as const },
      include: { _count: { select: { questions: true } } },
    },
  };

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: { modules: { orderBy: { order: "asc" }, include: lessonInclude } },
      },
      modules: {
        where: { groupId: null },
        orderBy: { order: "asc" },
        include: lessonInclude,
      },
    },
  });
  if (!program) notFound();

  const groupOptions: GroupOption[] = program.groups.map((g) => ({ id: g.id, title: g.title }));
  const totalModules = program.groups.reduce((a, g) => a + g.modules.length, 0) + program.modules.length;
  const totalLessons =
    program.groups.reduce((a, g) => a + g.modules.reduce((b, m) => b + m.lessons.length, 0), 0) +
    program.modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <>
      {e === "lengkapi" && <div className="adm-alert err">Lengkapi kolom yang wajib diisi.</div>}
      {ok && <div className="adm-alert ok">Perubahan kurikulum tersimpan.</div>}
      {deleted && <div className="adm-alert ok">Materi dihapus.</div>}

      <div style={{ marginBottom: "1.4rem" }}>
        <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Kurikulum</h2>
        <p className="adm-note" style={{ marginTop: ".3rem" }}>
          {program.groups.length} kelompok · {totalModules} modul · {totalLessons} materi.
          Susun kurikulum berjenjang: kelompok modul berisi modul (sub-bab), modul berisi materi.
          Tes/kuis adalah materi biasa — bisa ditaruh di awal, tengah, akhir, atau per sub-bab.
        </p>
      </div>

      {program.groups.length === 0 && program.modules.length === 0 && (
        <div style={{ padding: "2.5rem", textAlign: "center", border: "2px dashed var(--chip)", borderRadius: "var(--r-md)", color: "var(--ink-soft)", marginBottom: "1rem" }}>
          <p style={{ fontWeight: 700, margin: "0 0 .2rem" }}>Kurikulum masih kosong</p>
          <p style={{ fontSize: ".85rem", margin: 0 }}>Mulai dengan membuat kelompok modul atau langsung modul di bawah.</p>
        </div>
      )}

      {/* Kelompok modul */}
      {program.groups.map((group, gIdx) => (
        <section key={group.id} className="lms-group">
          <div className="lms-group-head">
            <span className="group-no">Bagian {gIdx + 1}</span>

            <form action={saveLmsGroup} className="inline-title">
              <input type="hidden" name="id" value={group.id} />
              <input type="hidden" name="programId" value={program.id} />
              <input name="title" defaultValue={group.title} required title="Klik untuk mengganti nama kelompok" />
              <button type="submit" className="btn btn-sm btn-purple">Simpan Nama</button>
            </form>

            <span style={{ fontSize: ".72rem", color: "var(--ink-faint)", fontWeight: 700 }}>
              {group.modules.length} modul
            </span>

            <div style={{ display: "flex", gap: ".35rem" }}>
              <form action={moveLmsGroup}>
                <input type="hidden" name="id" value={group.id} />
                <input type="hidden" name="programId" value={program.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className="icon-btn" disabled={gIdx === 0} title="Geser ke atas">↑</button>
              </form>
              <form action={moveLmsGroup}>
                <input type="hidden" name="id" value={group.id} />
                <input type="hidden" name="programId" value={program.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className="icon-btn" disabled={gIdx === program.groups.length - 1} title="Geser ke bawah">↓</button>
              </form>
              <form action={deleteLmsGroup}>
                <input type="hidden" name="id" value={group.id} />
                <input type="hidden" name="programId" value={program.id} />
                <ConfirmButton
                  className="icon-btn danger"
                  title="Hapus kelompok"
                  message={`Hapus kelompok "${group.title}"? Modul di dalamnya TIDAK ikut terhapus — hanya keluar dari kelompok.`}
                >
                  Hapus
                </ConfirmButton>
              </form>
            </div>
          </div>

          <div className="lms-group-body">
            {group.modules.map((mod, mIdx) => (
              <ModuleCard
                key={mod.id}
                programId={program.id}
                mod={mod}
                label={`${gIdx + 1}.${mIdx + 1}`}
                isFirst={mIdx === 0}
                isLast={mIdx === group.modules.length - 1}
                groups={groupOptions}
              />
            ))}

            {/* Tambah modul ke kelompok ini */}
            <form action={saveLmsModule} style={{ display: "flex", gap: ".7rem", flexWrap: "wrap", marginTop: group.modules.length > 0 ? "1rem" : 0 }}>
              <input type="hidden" name="programId" value={program.id} />
              <input type="hidden" name="groupId" value={group.id} />
              <input
                name="title"
                placeholder={`Nama modul baru di Bagian ${gIdx + 1}…`}
                required
                style={{ flex: 1, minWidth: "14rem", padding: ".6em 1em", border: "1.5px dashed var(--chip)", borderRadius: "10px", background: "var(--white)", fontSize: ".85rem" }}
              />
              <button type="submit" className="btn btn-sm btn-purple">+ Tambah Modul</button>
            </form>
          </div>
        </section>
      ))}

      {/* Modul tanpa kelompok */}
      {program.modules.length > 0 && (
        <div style={{ marginTop: program.groups.length > 0 ? "1.6rem" : 0 }}>
          {program.groups.length > 0 && (
            <h3 style={{ fontSize: ".9rem", color: "var(--ink-soft)", margin: "0 0 .8rem" }}>Modul Tanpa Kelompok</h3>
          )}
          {program.modules.map((mod, mIdx) => (
            <ModuleCard
              key={mod.id}
              programId={program.id}
              mod={mod}
              label={String(mIdx + 1)}
              isFirst={mIdx === 0}
              isLast={mIdx === program.modules.length - 1}
              groups={groupOptions}
            />
          ))}
        </div>
      )}

      {/* Tambah kelompok / modul lepas */}
      <div className="lms-add-mod">
        <div style={{ display: "grid", gap: "1.4rem" }}>
          <div>
            <h3 style={{ fontSize: ".95rem", fontWeight: 800, color: "var(--purple)", margin: "0 0 .6rem" }}>
              + Tambah Kelompok Modul
            </h3>
            <form action={saveLmsGroup} style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
              <input type="hidden" name="programId" value={program.id} />
              <input
                name="title"
                placeholder={`cth: Bagian ${program.groups.length + 1}: Praktik & Studi Kasus`}
                required
                style={{ flex: 1, minWidth: "16rem", padding: ".7em 1em", border: "1px solid var(--chip)", borderRadius: "10px", background: "var(--white)" }}
              />
              <button type="submit" className="btn btn-purple">Tambah Kelompok</button>
            </form>
          </div>
          <div>
            <h3 style={{ fontSize: ".95rem", fontWeight: 800, color: "var(--ink-soft)", margin: "0 0 .6rem" }}>
              + Tambah Modul Tanpa Kelompok
            </h3>
            <form action={saveLmsModule} style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
              <input type="hidden" name="programId" value={program.id} />
              <input type="hidden" name="groupId" value="" />
              <input
                name="title"
                placeholder="cth: Orientasi & Pengantar"
                required
                style={{ flex: 1, minWidth: "16rem", padding: ".7em 1em", border: "1px solid var(--chip)", borderRadius: "10px", background: "var(--white)" }}
              />
              <button type="submit" className="btn">Tambah Modul</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
