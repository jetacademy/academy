"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  type: string;
  duration: string | null;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Section = {
  title: string | null;
  modules: Module[];
};

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Video",
  TEXT: "Teks",
  PDF: "PDF",
  QUIZ: "Kuis",
};

const TYPE_ICON: Record<string, string> = {
  VIDEO: "▶",
  TEXT: "📝",
  PDF: "📄",
  QUIZ: "🧠",
};

interface LmsSidebarProps {
  sections: Section[];
  currentLessonId: string;
  completedLessonIds: string[];
  registrationId: string;
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
  isAllDone: boolean;
  /** If true, rendered as mobile drawer (controlled by isOpen) */
  drawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LmsSidebar({
  sections,
  currentLessonId,
  completedLessonIds,
  registrationId,
  completedCount,
  totalLessons,
  progressPercent,
  isAllDone,
  drawer = false,
  isOpen = false,
  onClose,
}: LmsSidebarProps) {
  const completedSet = new Set(completedLessonIds);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (!drawer) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, drawer]);

  // Pre-compute module numbers before render
  let modNum = 0;
  const moduleNumbers = new Map<string, number>();
  sections.forEach((section) => {
    section.modules.forEach((mod) => {
      modNum += 1;
      moduleNumbers.set(mod.id, modNum);
    });
  });

  const sidebarContent = (
    <>
      {/* Progress mini bar */}
      <div className="lms-progress-mini">
        <div className="lms-progress-mini-bar">
          <div
            className="lms-progress-mini-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="lms-progress-mini-label">
          {completedCount}/{totalLessons}
        </span>
      </div>

      {/* Curriculum list */}
      <div style={{ display: "grid", gap: "1.2rem" }}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} style={{ display: "grid", gap: "0.8rem" }}>
            {section.title && (
              <div
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  color: "var(--purple)",
                  paddingBottom: ".3rem",
                  borderBottom: "2px solid rgba(108, 92, 231, 0.15)",
                }}
              >
                {section.title}
              </div>
            )}

            {section.modules.map((mod) => {
              const currentModNum = moduleNumbers.get(mod.id) ?? 0;
              return (
                <div
                  key={mod.id}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    padding: "1rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,.03)",
                  }}
                >
                  {/* Module header */}
                  <div
                    style={{
                      marginBottom: "0.75rem",
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        color: "var(--purple)",
                        background: "rgba(108, 92, 231, 0.08)",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        marginBottom: "0.3rem",
                      }}
                    >
                      Modul {currentModNum}
                    </span>
                    <div
                      style={{
                        fontSize: "0.83rem",
                        fontWeight: 800,
                        color: "var(--ink-main)",
                        lineHeight: 1.35,
                      }}
                    >
                      {mod.title}
                    </div>
                  </div>

                  {/* Lessons */}
                  {mod.lessons.length === 0 ? (
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--ink-faint)",
                        fontStyle: "italic",
                        textAlign: "center",
                        padding: "0.4rem 0",
                      }}
                    >
                      Belum ada materi
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      {mod.lessons.map((les) => {
                        const active = les.id === currentLessonId && !isAllDone;
                        const done = completedSet.has(les.id);

                        return (
                          <Link
                            key={les.id}
                            href={`/member/lms/${registrationId}?lessonId=${les.id}`}
                            onClick={onClose}
                            className={`lms-lesson-item${active ? " active" : done ? " done" : ""}`}
                          >
                            {/* Status indicator */}
                            {done ? (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "1.15rem",
                                  height: "1.15rem",
                                  background: "#2ecc71",
                                  border: "2px solid #2ecc71",
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  color: "white",
                                  fontSize: "0.6rem",
                                  fontWeight: "bold",
                                  marginTop: "0.15rem",
                                }}
                              >
                                ✓
                              </span>
                            ) : active ? (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "1.15rem",
                                  height: "1.15rem",
                                  border: "2px solid var(--purple)",
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  background: "rgba(108,92,231,.1)",
                                  marginTop: "0.15rem",
                                }}
                              >
                                <span
                                  style={{
                                    width: "0.42rem",
                                    height: "0.42rem",
                                    background: "var(--purple)",
                                    borderRadius: "50%",
                                  }}
                                />
                              </span>
                            ) : (
                              <span
                                style={{
                                  width: "1.15rem",
                                  height: "1.15rem",
                                  border: "2px solid #ccc",
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  marginTop: "0.15rem",
                                  display: "flex",
                                }}
                              />
                            )}

                            {/* Lesson info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: active ? 800 : done ? 600 : 500,
                                  color: active
                                    ? "var(--purple)"
                                    : done
                                    ? "var(--ink-soft)"
                                    : "var(--ink-main)",
                                  lineHeight: 1.35,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical" as const,
                                }}
                              >
                                {les.title}
                              </div>
                              <span
                                style={{
                                  fontSize: "0.67rem",
                                  color: "var(--ink-faint)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  marginTop: "0.15rem",
                                }}
                              >
                                <span>{TYPE_ICON[les.type] ?? "📌"}</span>
                                {TYPE_LABEL[les.type] ?? les.type}
                                {les.duration && ` • ${les.duration}`}
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
    </>
  );

  if (drawer) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`lms-sidebar-overlay${isOpen ? " open" : ""}`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          ref={drawerRef}
          className={`lms-sidebar-drawer${isOpen ? " open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Kurikulum Kelas"
        >
          <div className="lms-drawer-header">
            <h3>Kurikulum Kelas</h3>
            <button
              className="lms-drawer-close"
              onClick={onClose}
              aria-label="Tutup menu"
              type="button"
            >
              ✕
            </button>
          </div>
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="lms-sidebar-pane">
      <div style={{ marginBottom: "1.2rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 0.2rem 0" }}>
          Kurikulum Kelas
        </h3>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          {completedCount} dari {totalLessons} materi selesai
        </span>
      </div>
      {sidebarContent}
    </div>
  );
}
