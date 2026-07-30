"use client";

import Link from "next/link";
import LmsMobileNav from "./LmsMobileNav";

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

interface LmsHeaderProps {
  programTitle: string;
  currentLessonTitle?: string;
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
  prevLessonId: string | null;
  nextLessonId: string | null;
  registrationId: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  sidebarSections: Section[];
  currentLessonId: string;
  completedLessonIdsArr: string[];
  isAllDone: boolean;
}

export default function LmsHeader({
  programTitle,
  currentLessonTitle,
  completedCount,
  totalLessons,
  progressPercent,
  prevLessonId,
  nextLessonId,
  registrationId,
  sidebarOpen,
  onToggleSidebar,
  sidebarSections,
  currentLessonId,
  completedLessonIdsArr,
  isAllDone,
}: LmsHeaderProps) {
  return (
    <header className="lms-header">
      {/* Kiri: Back to Dashboard + Judul Kelas & Materi */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
        <Link
          href="/member"
          className="lms-back-btn"
          title="Kembali ke Dashboard Member"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="12 15 7 10 12 5" />
          </svg>
          <span className="lms-back-text">Dashboard</span>
        </Link>

        <div className="lms-header-divider" />

        <div className="lms-header-title">
          <span className="lms-header-label">{programTitle}</span>
          <span className="lms-header-name">
            {currentLessonTitle || "Kurikulum Kelas"}
          </span>
        </div>
      </div>

      {/* Kanan: Navigasi Cepat + Progress + Toggle Sidebar (Desktop) */}
      <div className="lms-header-desktop-actions">
        {/* Tombol Sebelumnya & Berikutnya di Header Desktop */}
        <div className="lms-header-nav-group">
          {prevLessonId ? (
            <Link
              href={`/member/lms/${registrationId}?lessonId=${prevLessonId}`}
              className="lms-hdr-nav-btn"
              title="Materi Sebelumnya"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 5 7 10 13 15" />
              </svg>
              <span>Sblm</span>
            </Link>
          ) : (
            <span className="lms-hdr-nav-btn disabled" title="Materi Pertama">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 5 7 10 13 15" />
              </svg>
              <span>Sblm</span>
            </span>
          )}

          {nextLessonId ? (
            <Link
              href={`/member/lms/${registrationId}?lessonId=${nextLessonId}`}
              className="lms-hdr-nav-btn"
              title="Materi Berikutnya"
            >
              <span>Lanjut</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 5 13 10 7 15" />
              </svg>
            </Link>
          ) : (
            <span className="lms-hdr-nav-btn disabled" title="Materi Terakhir">
              <span>Lanjut</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 5 13 10 7 15" />
              </svg>
            </span>
          )}
        </div>

        {/* Progress Pill Desktop */}
        <div className="lms-header-progress" title={`Progres Anda: ${completedCount} dari ${totalLessons} materi (${progressPercent}%)`}>
          <div className="lms-header-progress-bar">
            <div
              className="lms-header-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="lms-header-progress-pct">
            {completedCount}/{totalLessons} ({progressPercent}%)
          </span>
        </div>

        {/* Toggle Sidebar / Focus Mode Button */}
        <button
          type="button"
          className={`lms-sidebar-toggle-btn${!sidebarOpen ? " active" : ""}`}
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Mode Fokus (Sembunyikan Sidebar Kurikulum)" : "Tampilkan Sidebar Kurikulum"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span>{sidebarOpen ? "Fokus" : "Kurikulum"}</span>
        </button>
      </div>

      {/* Tombol Drawer (Mobile Only) */}
      <LmsMobileNav
        sections={sidebarSections}
        currentLessonId={currentLessonId}
        completedLessonIds={completedLessonIdsArr}
        registrationId={registrationId}
        completedCount={completedCount}
        totalLessons={totalLessons}
        progressPercent={progressPercent}
        isAllDone={isAllDone}
      />
    </header>
  );
}
