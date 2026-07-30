"use client";

import { useState } from "react";
import Link from "next/link";
import LmsHeader from "./LmsHeader";
import LmsSidebar from "./LmsSidebar";
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

interface LmsViewContainerProps {
  programTitle: string;
  currentLessonTitle?: string;
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  registrationId: string;
  sidebarSections: Section[];
  currentLessonId: string;
  completedLessonIdsArr: string[];
  isAllDone: boolean;
  currentIndex: number;
  allLessonsCount: number;
  children: React.ReactNode;
}

export default function LmsViewContainer({
  programTitle,
  currentLessonTitle,
  completedCount,
  totalLessons,
  progressPercent,
  prevLesson,
  nextLesson,
  registrationId,
  sidebarSections,
  currentLessonId,
  completedLessonIdsArr,
  isAllDone,
  children,
}: LmsViewContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="lms-scope" style={{ background: "var(--bg-panel)", minHeight: "90vh" }}>
      {/* Header Interaktif Desktop & Mobile */}
      <LmsHeader
        programTitle={programTitle}
        currentLessonTitle={currentLessonTitle}
        completedCount={completedCount}
        totalLessons={totalLessons}
        progressPercent={progressPercent}
        prevLessonId={prevLesson?.id ?? null}
        nextLessonId={nextLesson?.id ?? null}
        registrationId={registrationId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarSections={sidebarSections}
        currentLessonId={currentLessonId}
        completedLessonIdsArr={completedLessonIdsArr}
        isAllDone={isAllDone}
      />

      {/* Main Split-Pane Layout */}
      <div className={`lms-split${!sidebarOpen ? " sidebar-collapsed" : ""}`}>
        {/* Pane Konten Materi */}
        <div className="lms-content-pane">
          {children}

          {/* Desktop & Tablet Inline Navigation Footer Bar */}
          {!isAllDone && (
            <div className="lms-desktop-nav-bar">
              {/* Materi Sebelumnya */}
              {prevLesson ? (
                <Link
                  href={`/member/lms/${registrationId}?lessonId=${prevLesson.id}`}
                  className="lms-desk-nav-btn prev"
                >
                  <span className="lms-desk-nav-arrow">←</span>
                  <div className="lms-desk-nav-info">
                    <span className="lms-desk-nav-sub">Materi Sebelumnya</span>
                    <span className="lms-desk-nav-title">{prevLesson.title}</span>
                  </div>
                </Link>
              ) : (
                <div className="lms-desk-nav-btn prev disabled">
                  <span className="lms-desk-nav-arrow">←</span>
                  <div className="lms-desk-nav-info">
                    <span className="lms-desk-nav-sub">Materi Pertama</span>
                  </div>
                </div>
              )}

              {/* Materi Berikutnya */}
              {nextLesson ? (
                <Link
                  href={`/member/lms/${registrationId}?lessonId=${nextLesson.id}`}
                  className="lms-desk-nav-btn next"
                >
                  <div className="lms-desk-nav-info" style={{ textAlign: "right" }}>
                    <span className="lms-desk-nav-sub">Materi Berikutnya</span>
                    <span className="lms-desk-nav-title">{nextLesson.title}</span>
                  </div>
                  <span className="lms-desk-nav-arrow">→</span>
                </Link>
              ) : (
                <div className="lms-desk-nav-btn next disabled">
                  <div className="lms-desk-nav-info" style={{ textAlign: "right" }}>
                    <span className="lms-desk-nav-sub">Materi Terakhir</span>
                  </div>
                  <span className="lms-desk-nav-arrow">→</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Desktop (Daftar Kurikulum) */}
        <LmsSidebar
          sections={sidebarSections}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIdsArr}
          registrationId={registrationId}
          completedCount={completedCount}
          totalLessons={totalLessons}
          progressPercent={progressPercent}
          isAllDone={isAllDone}
        />
      </div>

      {/* Mobile Sticky Bottom Nav (56px) */}
      <div className="lms-bottom-nav">
        {prevLesson ? (
          <Link
            href={`/member/lms/${registrationId}?lessonId=${prevLesson.id}`}
            className="lms-bottom-nav-btn"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 5 7 10 13 15" />
            </svg>
            Sebelumnya
          </Link>
        ) : (
          <span className="lms-bottom-nav-btn disabled">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 5 7 10 13 15" />
            </svg>
            Sebelumnya
          </span>
        )}

        <LmsMobileNav
          sections={sidebarSections}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIdsArr}
          registrationId={registrationId}
          completedCount={completedCount}
          totalLessons={totalLessons}
          progressPercent={progressPercent}
          isAllDone={isAllDone}
          bottomBar
        />

        {nextLesson ? (
          <Link
            href={`/member/lms/${registrationId}?lessonId=${nextLesson.id}`}
            className="lms-bottom-nav-btn"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 5 13 10 7 15" />
            </svg>
            Berikutnya
          </Link>
        ) : (
          <span className="lms-bottom-nav-btn disabled">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 5 13 10 7 15" />
            </svg>
            Berikutnya
          </span>
        )}
      </div>
    </div>
  );
}
