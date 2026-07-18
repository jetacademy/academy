"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitLessonQuiz } from "@/app/member/actions";

export type LessonQuizQuestion = {
  id: string;
  text: string;
  options: { key: "A" | "B" | "C" | "D"; label: string }[];
};

/** Kuis interaktif per materi — kunci jawaban dinilai di server. */
export default function LessonQuiz({
  registrationId,
  lessonId,
  questions,
  passingScore,
  alreadyPassed,
  nextHref,
}: {
  registrationId: string;
  lessonId: string;
  questions: LessonQuizQuestion[];
  passingScore: number;
  alreadyPassed: boolean;
  nextHref: string | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const answeredAll = questions.every((q) => answers[q.id]);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitLessonQuiz(registrationId, lessonId, answers);
      if (res.error) {
        setError(res.error);
      } else if (res.ok) {
        setResult({ passed: res.passed!, score: res.score! });
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyPassed && !result) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <span style={{ fontSize: "2.5rem" }}>✅</span>
        <h3 style={{ margin: ".8rem 0 .4rem" }}>Kuis Sudah Lulus</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", marginBottom: "1.4rem" }}>
          Anda sudah menyelesaikan kuis ini. Lanjutkan ke materi berikutnya.
        </p>
        {nextHref && (
          <a href={nextHref} className="btn btn-purple btn-lg">Lanjut Materi Berikutnya →</a>
        )}
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <span style={{ fontSize: "3rem" }}>{result.passed ? "🎉" : "😔"}</span>
        <h3 style={{ margin: ".8rem 0 .4rem" }}>
          {result.passed ? "Selamat, Anda Lulus Kuis Ini!" : "Belum Lulus"}
        </h3>
        <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>
          Skor Anda: <b style={{ fontSize: "1.2rem", color: result.passed ? "#2ecc71" : "var(--red)" }}>{result.score}</b> (minimal lulus: {passingScore})
        </p>
        <div style={{ display: "flex", gap: ".8rem", justifyContent: "center", marginTop: "1.4rem", flexWrap: "wrap" }}>
          {result.passed ? (
            nextHref ? <a href={nextHref} className="btn btn-purple btn-lg">Lanjut Materi Berikutnya →</a> : null
          ) : (
            <button
              type="button"
              className="btn btn-purple btn-lg"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gap: "1.4rem" }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.2rem" }}>
            <p style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: ".8rem" }}>
              {i + 1}. {q.text}
            </p>
            <div style={{ display: "grid", gap: ".5rem" }}>
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".7rem",
                      padding: ".7rem 1rem",
                      borderRadius: "10px",
                      border: selected ? "2px solid var(--purple)" : "1.5px solid var(--border)",
                      background: selected ? "rgba(108, 92, 231, 0.07)" : "var(--white)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: ".88rem",
                      fontWeight: selected ? 700 : 500,
                    }}
                  >
                    <span
                      style={{
                        width: "1.5rem",
                        height: "1.5rem",
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontSize: ".72rem",
                        fontWeight: 800,
                        flexShrink: 0,
                        background: selected ? "var(--purple)" : "var(--chip, #eee)",
                        color: selected ? "#fff" : "var(--ink-soft)",
                      }}
                    >
                      {opt.key}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: "1rem", padding: ".8rem 1.1rem", background: "#FDECEC", color: "var(--red)", borderRadius: "10px", fontSize: ".85rem", fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontSize: ".8rem", color: "var(--ink-faint)", fontWeight: 600 }}>
          {Object.keys(answers).length}/{questions.length} terjawab · skor lulus ≥ {passingScore}
        </span>
        <button
          type="button"
          className="btn btn-purple btn-lg"
          disabled={!answeredAll || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Menilai…" : "Kumpulkan Jawaban"}
        </button>
      </div>
    </div>
  );
}
