import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import { checkCertEligibility } from "@/lib/certificates";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";
import { completeLesson } from "@/app/member/actions";
import LessonQuiz, { type LessonQuizQuestion } from "@/components/LessonQuiz";
import ClaimCertButton from "@/components/ClaimCertButton";
import MemberPayCertButton from "@/components/MemberPayCertButton";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";
import { getEmbedUrl } from "@/lib/video";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Video",
  TEXT: "Teks",
  PDF: "PDF",
  QUIZ: "Kuis",
};

export default async function LmsPage({
  params,
  searchParams,
}: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ lessonId?: string; status?: string }>;
}) {
  const { registrationId } = await params;
  const { lessonId, status } = await searchParams;

  const sessionVal = await getMemberSession();
  if (!sessionVal) redirect("/member/login");

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { program: true, completions: true, certificate: true },
  });

  if (!reg) redirect("/member");

  // Validasi kepemilikan sesi
  if (reg.email !== sessionVal && reg.whatsapp !== sessionVal) redirect("/member");

  // Proteksi pembayaran jika berbayar — user non-bayar hanya bisa lihat preview
  const isPreviewMode = reg.status === "REGISTERED" && reg.program.price > 0;

  const program = reg.program;

  // Kurikulum berjenjang: kelompok → modul → materi (+ modul tanpa kelompok di akhir).
  // Soal kuis diambil TANPA kunci jawaban.
  const lessonInclude = {
    lessons: {
      orderBy: { order: "asc" as const },
      include: {
        questions: {
          orderBy: { order: "asc" as const },
          select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true },
        },
      },
    },
  };
  const [groups, ungrouped] = await Promise.all([
    prisma.lmsGroup.findMany({
      where: { programId: program.id },
      orderBy: { order: "asc" },
      include: { modules: { orderBy: { order: "asc" }, include: lessonInclude } },
    }),
    prisma.lmsModule.findMany({
      where: { programId: program.id, groupId: null },
      orderBy: { order: "asc" },
      include: lessonInclude,
    }),
  ]);

  type ModuleWithLessons = (typeof ungrouped)[number];
  const sections: { title: string | null; modules: ModuleWithLessons[] }[] = [
    ...groups.map((g) => ({ title: g.title, modules: g.modules })),
    ...(ungrouped.length > 0 ? [{ title: groups.length > 0 ? "Lainnya" : null, modules: ungrouped }] : []),
  ];
  const orderedModules = sections.flatMap((s) => s.modules);
  let allLessons = orderedModules.flatMap((m) => m.lessons);
  // Mode preview: user non-bayar hanya lihat lesson dengan isPreview=true
  if (isPreviewMode) {
    allLessons = allLessons.filter((l) => l.isPreview);
  }
  const totalLessons = allLessons.length;

  if (totalLessons === 0) {
    return (
      <>
        <Navbar minimal ctaHref="/member" ctaLabel="Kembali ke Dashboard" />
        <section className="section" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center", maxWidth: "32rem" }}>
            <h3 style={{ marginTop: "1rem" }}>Materi Belum Tersedia</h3>
            <p style={{ color: "var(--ink-soft)" }}>LMS interaktif untuk program ini sedang disiapkan oleh tim mentor.</p>
            <Link href="/member" className="btn btn-purple btn-md" style={{ marginTop: "1.5rem" }}>Kembali ke Dashboard</Link>
          </div>
        </section>
        <Footer />
        <WaFloat />
      </>
    );
  }

  const completedLessonIds = new Set(reg.completions.map((c) => c.lessonId));
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  // Kelayakan sertifikat sesuai kriteria program (hasil tes / penyelesaian materi)
  const hasPaid = (reg.status === "PAID" || reg.status === "PASSED") || (program.price === 0 && program.certPrice === 0);
  const eligibility = reg.certificate ? { eligible: true as const } : await checkCertEligibility(reg.id, program);
  const canClaim = !reg.certificate && hasPaid && eligibility.eligible;

  // Tentukan materi aktif
  let currentLesson = allLessons.find((l) => l.id === lessonId);
  if (!currentLesson) {
    currentLesson = allLessons.find((l) => !completedLessonIds.has(l.id)) || allLessons[0];
  }

  const embedUrl = getEmbedUrl(currentLesson.videoUrl);

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson = currentIndex !== -1 && currentIndex < totalLessons - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = completedLessonIds.has(currentLesson.id);
  const nextHref = nextLesson
    ? `/member/lms/${registrationId}?lessonId=${nextLesson.id}`
    : `/member/lms/${registrationId}?status=selesai`;

  const currentLessonId = currentLesson.id;

  // Server Action untuk menandai selesai (non-kuis)
  async function handleMarkComplete() {
    "use server";
    await completeLesson(registrationId, currentLessonId);
    redirect(nextHref);
  }

  const isAllDone = status === "selesai" || (completedCount === totalLessons && !lessonId);
  const quizPassingScore = currentLesson.passingScore ?? program.passingScore;

  let modNumber = 0; // penomoran modul global lintas kelompok

  return (
    <>
      <Navbar minimal ctaHref="/member" ctaLabel="Dashboard Saya" />

      <div style={{ background: "var(--bg-panel)", minHeight: "90vh" }}>
        {/* Progress Bar & Header */}
        <div className="lms-header">
          <div>
            <span className="kicker" style={{ fontSize: "0.72rem", marginBottom: "0.1rem" }}>LMS Interaktif</span>
            <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 800 }}>{program.title}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", minWidth: "16rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.2rem", fontWeight: 700 }}>
                <span>Progres Belajar</span>
                <span className="acc-p">{progressPercent}% ({completedCount}/{totalLessons})</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#eaeaea", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--purple)", borderRadius: "99px", transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Banner klaim: syarat kelulusan sudah terpenuhi */}
        {canClaim && !isAllDone && (
          <div className="lms-claim-banner">
            <span style={{ fontSize: ".88rem", fontWeight: 700, color: "#1d8a4e" }}>
              Syarat kelulusan Anda sudah terpenuhi — sertifikat siap diklaim.
            </span>
            <ClaimCertButton registrationId={registrationId} />
          </div>
        )}

        {/* Layout Utama split-pane */}
        <div className="lms-split">

          {/* Sisi Kiri: Konten Materi */}
          <div className="lms-content-pane">
            {isAllDone ? (
              <div style={{
                background: "var(--white)",
                borderRadius: "var(--r-md)",
                boxShadow: "var(--shadow)",
                padding: "4rem 2rem",
                textAlign: "center",
                maxWidth: "36rem",
                margin: "2rem auto"
              }}>
                <span style={{ fontSize: "4rem" }}>🏆</span>
                <h2 style={{ marginTop: "1.5rem", fontWeight: 800 }}>Selamat, Anda Telah Menyelesaikan Semua Materi!</h2>

                {reg.certificate ? (
                  <>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, margin: "1rem 0 2rem" }}>
                      Sertifikat Anda sudah terbit. Unduh dan bagikan pencapaian Anda!
                    </p>
                    <Link href={`/sertifikat/${reg.certificate.number}`} className="btn btn-purple btn-lg">Unduh e-Sertifikat</Link>
                  </>
                ) : canClaim ? (
                  <>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, margin: "1rem 0 2rem" }}>
                      Seluruh syarat kelulusan {program.title} sudah terpenuhi. Klaim e-sertifikat resmi Anda sekarang.
                    </p>
                    <ClaimCertButton registrationId={registrationId} />
                  </>
                ) : !hasPaid ? (
                  <>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, margin: "1rem 0 2rem" }}>
                      Selesaikan pembayaran paket sertifikat untuk menerbitkan e-sertifikat resmi Anda.
                    </p>
                    <div style={{ maxWidth: "24rem", margin: "0 auto" }}>
                      <MemberPayCertButton registrationId={registrationId} certPrice={program.certPrice} className="btn btn-purple btn-lg btn-block" />
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, margin: "1rem 0 2rem" }}>
                      {"reason" in eligibility && eligibility.reason
                        ? eligibility.reason
                        : "Masih ada syarat kelulusan yang belum terpenuhi. Periksa kembali materi & tes Anda."}
                    </p>
                    <Link href="/member" className="btn btn-line btn-lg">Kembali ke Dashboard</Link>
                  </>
                )}
              </div>
            ) : (
              <div className="lms-inner-container">
                {/* Embed Video */}
                {currentLesson.type === "VIDEO" && embedUrl && (
                  <LessonVideoPlayer src={embedUrl} title={currentLesson.title} />
                )}

                {/* Embed PDF */}
                {currentLesson.type === "PDF" && currentLesson.fileUrl && (
                  <div style={{
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow)",
                    marginBottom: "1.5rem",
                    background: "var(--white)"
                  }}>
                    <iframe
                      src={currentLesson.fileUrl}
                      style={{ width: "100%", height: "70vh", border: 0, display: "block" }}
                      title={currentLesson.title}
                    />
                    <div style={{ padding: ".7rem 1rem", borderTop: "1px solid var(--border)", textAlign: "right" }}>
                      <a href={currentLesson.fileUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-line">
                        Buka / Unduh PDF
                      </a>
                    </div>
                  </div>
                )}

                {/* Info & Konten Materi */}
                <div className="lms-lesson-card">
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap" }}>
                    <span className="badge" style={{ background: "rgba(108, 92, 231, 0.1)", color: "var(--purple)" }}>
                      {TYPE_LABEL[currentLesson.type] ?? currentLesson.type}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>Durasi: {currentLesson.duration}</span>
                    {isCompleted && <span className="badge g">✓ Selesai</span>}
                  </div>

                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>{currentLesson.title}</h2>

                  {currentLesson.type === "QUIZ" ? (
                    <LessonQuiz
                      registrationId={registrationId}
                      lessonId={currentLesson.id}
                      passingScore={quizPassingScore}
                      alreadyPassed={isCompleted}
                      nextHref={nextHref}
                      questions={currentLesson.questions.map((q): LessonQuizQuestion => ({
                        id: q.id,
                        text: q.text,
                        options: [
                          { key: "A", label: q.optionA },
                          { key: "B", label: q.optionB },
                          { key: "C", label: q.optionC },
                          { key: "D", label: q.optionD },
                        ],
                      }))}
                    />
                  ) : (
                    <>
                      {currentLesson.content && (
                        /<[a-z][\s\S]*>/i.test(currentLesson.content) ? (
                          // konten dari rich text editor — sudah disanitasi di server saat disimpan
                          <div
                            className="rt-content"
                            style={{ fontSize: "0.95rem", color: "var(--ink-soft)", marginBottom: "2.5rem" }}
                            dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                          />
                        ) : (
                          <div style={{
                            fontSize: "0.95rem",
                            lineHeight: 1.7,
                            color: "var(--ink-soft)",
                            whiteSpace: "pre-wrap",
                            marginBottom: "2.5rem"
                          }}>
                            {currentLesson.content}
                          </div>
                        )
                      )}

                      {/* Tombol Selesai */}
                      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                        <form action={handleMarkComplete}>
                          <button type="submit" className="btn btn-purple btn-lg" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {isCompleted ? "Lanjut Materi Berikutnya →" : "Tandai Selesai & Lanjutkan →"}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Kurikulum berjenjang */}
          <div className="lms-sidebar-pane">
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.3rem 0" }}>Kurikulum Kelas</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                {completedCount} dari {totalLessons} materi selesai
              </span>
            </div>

            <div style={{ display: "grid", gap: "1.2rem" }}>
              {sections.map((section, sIdx) => (
                <div key={sIdx} style={{ display: "grid", gap: "0.9rem" }}>
                  {section.title && (
                    <div style={{
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      color: "var(--purple)",
                      paddingBottom: ".3rem",
                      borderBottom: "2px solid rgba(108, 92, 231, 0.15)"
                    }}>
                      {section.title}
                    </div>
                  )}

                  {section.modules.map((mod) => {
                    modNumber += 1;
                    return (
                      <div
                        key={mod.id}
                        style={{
                          background: "var(--white)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          padding: "1.2rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                      >
                        <div style={{ marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.6rem" }}>
                          <span style={{
                            display: "inline-block",
                            fontSize: "0.65rem",
                            textTransform: "uppercase",
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            color: "var(--purple)",
                            background: "rgba(108, 92, 231, 0.08)",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            marginBottom: "0.4rem"
                          }}>
                            Modul {modNumber}
                          </span>
                          <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: 0, color: "var(--ink-main)", lineHeight: 1.4 }}>
                            {mod.title}
                          </h4>
                        </div>

                        {mod.lessons.length === 0 ? (
                          <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)", fontStyle: "italic", textAlign: "center", padding: "0.5rem 0" }}>
                            Belum ada materi pelajaran
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: "0.6rem" }}>
                            {mod.lessons.map((les) => {
                              const active = les.id === currentLesson.id && !isAllDone;
                              const done = completedLessonIds.has(les.id);

                              let indicatorNode = (
                                <span style={{
                                  width: "1.2rem", height: "1.2rem", border: "2px solid #ccc",
                                  borderRadius: "50%", flexShrink: 0, marginTop: "0.1rem", display: "flex"
                                }} />
                              );
                              if (done) {
                                indicatorNode = (
                                  <span style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: "1.2rem", height: "1.2rem", background: "#2ecc71", border: "2px solid #2ecc71",
                                    borderRadius: "50%", flexShrink: 0, color: "white", fontSize: "0.65rem",
                                    fontWeight: "bold", marginTop: "0.1rem"
                                  }}>✓</span>
                                );
                              } else if (active) {
                                indicatorNode = (
                                  <span style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: "1.2rem", height: "1.2rem", border: "2px solid var(--purple)",
                                    borderRadius: "50%", flexShrink: 0, background: "rgba(108, 92, 231, 0.1)", marginTop: "0.1rem"
                                  }}>
                                    <span style={{ width: "0.45rem", height: "0.45rem", background: "var(--purple)", borderRadius: "50%" }} />
                                  </span>
                                );
                              }

                              return (
                                <Link
                                  key={les.id}
                                  href={`/member/lms/${registrationId}?lessonId=${les.id}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.75rem",
                                    padding: "0.6rem 0.8rem",
                                    borderRadius: "var(--r-sm)",
                                    textDecoration: "none",
                                    background: active ? "var(--bg-panel)" : "transparent",
                                    border: active ? "1.5px solid var(--purple)" : "1.5px solid transparent",
                                    boxShadow: active ? "0 2px 8px rgba(108, 92, 231, 0.05)" : "none",
                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                                  }}
                                >
                                  {indicatorNode}
                                  <div style={{ flex: 1 }}>
                                    <div style={{
                                      fontSize: "0.82rem",
                                      fontWeight: active ? 800 : done ? 600 : 500,
                                      color: active ? "var(--purple)" : done ? "var(--ink-soft)" : "var(--ink-main)",
                                      lineHeight: 1.35
                                    }}>
                                      {les.title}
                                    </div>
                                    <span style={{ fontSize: "0.7rem", color: "var(--ink-faint)" }}>
                                      {TYPE_LABEL[les.type] ?? les.type} • {les.duration}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <Footer />
      <WaFloat />
    </>
  );
}
