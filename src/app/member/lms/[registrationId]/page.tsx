import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { completeLesson } from "@/app/member/actions";
import { Registration, Program } from "@prisma/client";

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

interface LocalCompletion {
  id: string;
  registrationId: string;
  lessonId: string;
  completedAt: Date;
}

type RegistrationWithLms = Registration & {
  program: Program & {
    modules: LocalLmsModule[];
  };
  completions: LocalCompletion[];
};

export const dynamic = "force-dynamic";

function getEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  const vimeoReg = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoReg);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
}

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
  if (!sessionVal) {
    redirect("/member/login");
  }

  // Ambil pendaftaran peserta beserta kurikulum program
  const queryOptions = {
    where: { id: registrationId },
    include: {
      program: {
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
      },
      completions: true,
    },
  };

  const reg = (await (prisma.registration.findUnique as unknown as (args: unknown) => Promise<unknown>)(queryOptions)) as unknown as RegistrationWithLms;

  if (!reg) {
    redirect("/member");
  }

  // Validasi kepemilikan sesi
  if (reg.email !== sessionVal && reg.whatsapp !== sessionVal) {
    redirect("/member");
  }

  // Proteksi pembayaran jika berbayar
  if (reg.status === "REGISTERED" && reg.program.price > 0) {
    redirect("/member");
  }

  const program = reg.program;
  const modules = program.modules;

  // Flatten lessons untuk kalkulasi progres dan navigasi
  const allLessons = modules.flatMap((m: LocalLmsModule) => m.lessons);
  const totalLessons = allLessons.length;

  if (totalLessons === 0) {
    return (
      <>
        <Navbar minimal ctaHref="/member" ctaLabel="Kembali ke Dashboard" />
        <section className="section" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center", maxWidth: "32rem" }}>
            <span style={{ fontSize: "3rem" }}>📚</span>
            <h3 style={{ marginTop: "1rem" }}>Materi Belum Tersedia</h3>
            <p style={{ color: "var(--ink-soft)" }}>LMS interaktif untuk program ini sedang disiapkan oleh tim mentor.</p>
            <Link href="/member" className="btn btn-purple btn-md" style={{ marginTop: "1.5rem" }}>Kembali ke Dashboard</Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const completedLessonIds = new Set(reg.completions.map((c: LocalCompletion) => c.lessonId));
  const completedCount = reg.completions.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  // Tentukan materi aktif
  let currentLesson = allLessons.find((l: LocalLesson) => l.id === lessonId);
  if (!currentLesson) {
    // Secara default buka materi pertama yang belum diselesaikan
    currentLesson = allLessons.find((l: LocalLesson) => !completedLessonIds.has(l.id)) || allLessons[0];
  }

  const embedUrl = getEmbedUrl(currentLesson.videoUrl);

  // Cari materi selanjutnya
  const currentIndex = allLessons.findIndex((l: LocalLesson) => l.id === currentLesson?.id);
  const nextLesson = currentIndex !== -1 && currentIndex < totalLessons - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = completedLessonIds.has(currentLesson.id);

  // Server Action untuk menandai selesai
  async function handleMarkComplete() {
    "use server";
    if (currentLesson) {
      await completeLesson(registrationId, currentLesson.id);
    }
    if (nextLesson) {
      redirect(`/member/lms/${registrationId}?lessonId=${nextLesson.id}`);
    } else {
      redirect(`/member/lms/${registrationId}?status=selesai`);
    }
  }

  const isAllDone = status === "selesai" || (completedCount === totalLessons && !lessonId);

  return (
    <>
      <Navbar minimal ctaHref="/member" ctaLabel="Dashboard Saya" />

      <div style={{ background: "var(--bg-panel)", minHeight: "90vh" }}>
        {/* Progress Bar & Header */}
        <div style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
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

        {/* Layout Utama split-pane */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 22rem", minHeight: "75vh" }}>
          
          {/* Sisi Kiri: Video & Konten Teks */}
          <div style={{ padding: "2rem", overflowY: "auto" }}>
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
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: 1.6, margin: "1rem 0 2rem" }}>
                  Anda sudah menyelesaikan seluruh modul pembelajaran {program.title}. Silakan kerjakan post-test untuk menguji pemahaman Anda dan mengklaim sertifikat pelatihan resmi Anda.
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <Link href={`/post-test/${registrationId}`} className="btn btn-purple btn-lg">Mulai Post-Test Sekarang</Link>
                  <Link href="/member" className="btn btn-line btn-lg">Kembali ke Dashboard</Link>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: "52rem", margin: "0 auto" }}>
                {/* Embed Video */}
                {currentLesson.type === "VIDEO" && embedUrl && (
                  <div style={{
                    position: "relative",
                    paddingBottom: "56.25%",
                    height: 0,
                    overflow: "hidden",
                    borderRadius: "var(--r-md)",
                    background: "#000",
                    boxShadow: "var(--shadow)",
                    marginBottom: "1.5rem"
                  }}>
                    <iframe
                      src={embedUrl}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: 0
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Info & Konten Materi */}
                <div style={{
                  background: "var(--white)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow)",
                  padding: "2rem",
                  marginBottom: "2rem"
                }}>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.8rem" }}>
                    <span className="badge" style={{ background: "rgba(108, 92, 231, 0.1)", color: "var(--purple)" }}>
                      {currentLesson.type === "VIDEO" ? "🎥 Video Materi" : "📄 Teks Materi"}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>⏱️ Durasi: {currentLesson.duration}</span>
                  </div>

                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>{currentLesson.title}</h2>

                  {currentLesson.content && (
                    <div style={{
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      color: "var(--ink-soft)",
                      whiteSpace: "pre-wrap",
                      marginBottom: "2.5rem"
                    }}>
                      {currentLesson.content}
                    </div>
                  )}

                  {/* Tombol Selesai */}
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                    <form action={handleMarkComplete}>
                      <button type="submit" className="btn btn-purple btn-lg" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {isCompleted ? "Lanjut Materi Berikutnya →" : "Tandai Selesai & Lanjutkan →"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Daftar Kurikulum Modul & Materi */}
          <div style={{
            background: "var(--bg-panel)",
            borderLeft: "1px solid var(--border)",
            overflowY: "auto",
            padding: "2rem 1.5rem"
          }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.3rem 0" }}>Kurikulum Kelas</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                {completedCount} dari {totalLessons} materi selesai
              </span>
            </div>
            
            <div style={{ display: "grid", gap: "1rem" }}>
              {modules.map((mod: LocalLmsModule, modIdx: number) => (
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
                  {/* Judul Modul */}
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
                      Modul {modIdx + 1}
                    </span>
                    <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: 0, color: "var(--ink-main)", lineHeight: 1.4 }}>
                      {mod.title}
                    </h4>
                  </div>

                  {/* Daftar Lesson */}
                  {mod.lessons.length === 0 ? (
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)", fontStyle: "italic", textAlign: "center", padding: "0.5rem 0" }}>
                      Belum ada materi pelajaran
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "0.6rem" }}>
                      {mod.lessons.map((les: LocalLesson) => {
                        const active = les.id === currentLesson?.id && !isAllDone;
                        const done = completedLessonIds.has(les.id);

                        // Custom status indicator circle
                        let indicatorNode = (
                          <span style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "1.2rem",
                            height: "1.2rem",
                            border: "2px solid #ccc",
                            borderRadius: "50%",
                            flexShrink: 0,
                            marginTop: "0.1rem"
                          }} />
                        );

                        if (done) {
                          indicatorNode = (
                            <span style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "1.2rem",
                              height: "1.2rem",
                              background: "#2ecc71",
                              border: "2px solid #2ecc71",
                              borderRadius: "50%",
                              flexShrink: 0,
                              color: "white",
                              fontSize: "0.65rem",
                              fontWeight: "bold",
                              marginTop: "0.1rem"
                            }}>
                              ✓
                          </span>
                          );
                        } else if (active) {
                          indicatorNode = (
                            <span style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "1.2rem",
                              height: "1.2rem",
                              border: "2px solid var(--purple)",
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: "rgba(108, 92, 231, 0.1)",
                              marginTop: "0.1rem"
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
                                {les.type === "VIDEO" ? "🎥 Video" : "📄 Teks"} • {les.duration}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
