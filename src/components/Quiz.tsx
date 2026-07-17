"use client";

import { useState } from "react";

export type QuizQuestion = {
  id: string;
  text: string;
  options: { key: "A" | "B" | "C" | "D"; label: string }[];
};

/** Post-test pilihan ganda. Jawaban benar hanya ada di server. */
export default function Quiz({ registrationId, questions }: {
  registrationId: string;
  questions: QuizQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ passed: boolean; score: number; certUrl?: string } | null>(null);

  const allAnswered = questions.every((q) => answers[q.id]);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/post-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengirim jawaban.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="reg-card" style={{ textAlign: "center" }}>
        <h3>{result.passed ? "Selamat, Anda dinyatakan lulus." : "Belum lulus."}</h3>
        <p className="sub" style={{ margin: ".6rem 0 1.4rem" }}>
          Skor Anda: <b>{result.score}</b>.{" "}
          {result.passed
            ? "e-Sertifikat Anda telah terbit dan tautannya juga dikirim melalui WhatsApp."
            : "Silakan pelajari kembali materi, kemudian ulangi evaluasi ini."}
        </p>
        {result.passed && result.certUrl && (
          <a className="btn btn-purple btn-lg btn-block" href={result.certUrl}>
            Lihat & Unduh Sertifikat
          </a>
        )}
        {!result.passed && (
          <button className="btn btn-line btn-lg btn-block" onClick={() => { setResult(null); setAnswers({}); }}>
            Ulangi Evaluasi
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {questions.map((q, i) => (
        <div key={q.id} className="quiz-q">
          <h3>{i + 1}. {q.text}</h3>
          {q.options.map((opt) => (
            <label key={opt.key} className={`quiz-opt${answers[q.id] === opt.key ? " selected" : ""}`}>
              <input
                type="radio"
                name={q.id}
                value={opt.key}
                checked={answers[q.id] === opt.key}
                onChange={() => setAnswers({ ...answers, [q.id]: opt.key })}
              />
              <span><b>{opt.key}.</b> {opt.label}</span>
            </label>
          ))}
        </div>
      ))}

      {error && <div className="form-error">{error}</div>}

      <button
        className="btn btn-purple btn-lg btn-block"
        disabled={!allAnswered || loading}
        onClick={submit}
        style={{ opacity: allAnswered ? undefined : 0.5 }}
      >
        {loading ? "Memeriksa jawaban..." : allAnswered ? "Kumpulkan Jawaban" : `Terjawab ${Object.keys(answers).length} dari ${questions.length} soal`}
      </button>
    </div>
  );
}
