import Link from "next/link";
import { saveQuestion, deleteQuestion } from "@/app/webadmin/actions";
import ConfirmButton from "@/components/ConfirmButton";

type QuestionData = {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

/**
 * Navigator soal: pil bernomor untuk lompat antar soal satu kuis,
 * plus pil "+" menuju form soal baru. Pil aktif ditandai ungu.
 */
export function QuestionNav({
  programId,
  lessonId,
  questions,
  currentId,
}: {
  programId: string;
  lessonId: string;
  questions: { id: string }[];
  currentId?: string; // undefined = sedang di form soal baru
}) {
  return (
    <nav className="q-nav" aria-label="Navigasi soal">
      {questions.map((q, i) => (
        <Link
          key={q.id}
          href={`/webadmin/program/${programId}/soal/${q.id}`}
          className={q.id === currentId ? "on" : ""}
          title={`Buka soal ${i + 1}`}
        >
          {i + 1}
        </Link>
      ))}
      <Link
        href={`/webadmin/program/${programId}/soal/new?lesson=${lessonId}`}
        className={`plus ${currentId ? "" : "on"}`}
        title="Buat soal baru"
      >
        +
      </Link>
    </nav>
  );
}

/**
 * Editor satu soal dalam halaman fokus (bukan inline di daftar).
 * Pilih jawaban benar lewat radio di samping pilihannya, seperti quiz builder pada umumnya.
 */
export default function QuestionEditor({
  programId,
  lessonId,
  question,
  backHref,
  backLabel,
  showSaveAndNext = false,
}: {
  programId: string;
  lessonId?: string | null;
  question?: QuestionData;
  backHref: string;
  backLabel: string;
  showSaveAndNext?: boolean;
}) {
  const correct = question?.correct ?? "A";
  const optionValue = (key: (typeof OPTION_KEYS)[number]) =>
    question?.[`option${key}` as "optionA" | "optionB" | "optionC" | "optionD"] ?? "";

  return (
    <div style={{ maxWidth: "56rem" }}>
      <form action={saveQuestion}>
        {question && <input type="hidden" name="id" value={question.id} />}
        <input type="hidden" name="programId" value={programId} />
        {lessonId && <input type="hidden" name="lessonId" value={lessonId} />}

        <div className="form-section">
          <header>
            <h3>Pertanyaan</h3>
          </header>
          <div className="fs-body" style={{ gridTemplateColumns: "1fr" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <textarea
                name="text"
                defaultValue={question?.text}
                rows={3}
                placeholder="Tulis pertanyaan di sini…"
                required
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <header>
            <h3>Pilihan Jawaban</h3>
            <p>Isi keempat pilihan, lalu tandai satu yang benar.</p>
          </header>
          <div className="fs-body" style={{ gridTemplateColumns: "1fr", gap: ".7rem" }}>
            {OPTION_KEYS.map((key) => (
              <label key={key} className="opt-row">
                <input type="radio" name="correct" value={key} defaultChecked={correct === key} title="Tandai sebagai jawaban benar" />
                <span className="opt-key">{key}</span>
                <input
                  className="opt-input"
                  name={`option${key}`}
                  defaultValue={optionValue(key)}
                  placeholder={`Pilihan ${key}…`}
                  required
                />
              </label>
            ))}
            <p className="adm-note" style={{ margin: 0 }}>Klik lingkaran di kiri untuk menandai jawaban benar.</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href={backHref} className="btn btn-sm">{backLabel}</Link>
          <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
            {showSaveAndNext && (
              <button type="submit" name="intent" value="next" className="btn btn-line" title="Simpan soal ini lalu langsung buat soal berikutnya">
                Simpan &amp; Tambah Lagi
              </button>
            )}
            <button type="submit" className="btn btn-purple">{question ? "Simpan Perubahan" : "Simpan & Selesai"}</button>
          </div>
        </div>
      </form>

      {question && (
        <form action={deleteQuestion} style={{ marginTop: "2.2rem", paddingTop: "1.2rem", borderTop: "1px dashed var(--chip)", textAlign: "right" }}>
          <input type="hidden" name="id" value={question.id} />
          <input type="hidden" name="programId" value={programId} />
          <ConfirmButton className="btn btn-sm btn-danger" message="Hapus soal ini secara permanen?">Hapus Soal Ini</ConfirmButton>
        </form>
      )}
    </div>
  );
}
