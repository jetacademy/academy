import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveQuestion, deleteQuestion } from "../../../../actions";

function QuestionFields({ q }: {
  q?: { id: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correct: string; order: number };
}) {
  return (
    <>
      <div className="field full">
        <label>Pertanyaan</label>
        <input name="text" defaultValue={q?.text} placeholder="Tulis pertanyaan..." required />
      </div>
      <div className="field"><label>Pilihan A</label><input name="optionA" defaultValue={q?.optionA} required /></div>
      <div className="field"><label>Pilihan B</label><input name="optionB" defaultValue={q?.optionB} required /></div>
      <div className="field"><label>Pilihan C</label><input name="optionC" defaultValue={q?.optionC} required /></div>
      <div className="field"><label>Pilihan D</label><input name="optionD" defaultValue={q?.optionD} required /></div>
      <div className="field">
        <label>Jawaban Benar</label>
        <select name="correct" defaultValue={q?.correct ?? "A"}>
          <option value="A">A</option><option value="B">B</option>
          <option value="C">C</option><option value="D">D</option>
        </select>
      </div>
      <div className="field">
        <label>Urutan</label>
        <input name="order" inputMode="numeric" defaultValue={q?.order ?? 0} />
      </div>
    </>
  );
}

export default async function AdminSoal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!program) notFound();

  return (
    <>
      <div className="adm-head">
        <h1>Soal Post-Test: {program.title}</h1>
        <Link href={`/webadmin/program/${program.id}`} className="btn btn-sm">← Kembali ke Program</Link>
      </div>
      <p className="adm-note" style={{ marginBottom: "1.6rem" }}>
        Skor lulus program ini: <b>{program.passingScore}</b>. Kunci jawaban tidak pernah dikirim ke browser peserta.
      </p>

      {program.questions.map((q, i) => (
        <div key={q.id} style={{ marginBottom: "1.4rem" }}>
          <div className="adm-head" style={{ marginBottom: ".6rem" }}>
            <h2 style={{ fontSize: "1rem" }}>Soal {i + 1}</h2>
            <form action={deleteQuestion}>
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="programId" value={program.id} />
              <button type="submit" className="btn btn-sm btn-danger">Hapus Soal</button>
            </form>
          </div>
          <form className="adm-form" action={saveQuestion}>
            <input type="hidden" name="id" value={q.id} />
            <input type="hidden" name="programId" value={program.id} />
            <QuestionFields q={q} />
            <div className="full"><button type="submit" className="btn btn-sm btn-ink">Simpan Soal {i + 1}</button></div>
          </form>
        </div>
      ))}

      <div className="adm-head" style={{ marginTop: "2.4rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>+ Tambah Soal Baru</h2>
      </div>
      <form className="adm-form" action={saveQuestion}>
        <input type="hidden" name="programId" value={program.id} />
        <QuestionFields />
        <div className="full"><button type="submit" className="btn btn-yellow">Tambah Soal</button></div>
      </form>
    </>
  );
}
