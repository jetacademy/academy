"use client";

import { useState } from "react";
import LmsSidebar from "./LmsSidebar";

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

interface LmsMobileNavProps {
  sections: Section[];
  currentLessonId: string;
  completedLessonIds: string[];
  registrationId: string;
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
  isAllDone: boolean;
  /** Jika true, render sebagai tombol bottom-bar (gaya tengah) bukan toggle header */
  bottomBar?: boolean;
}

export default function LmsMobileNav({
  bottomBar = false,
  ...props
}: LmsMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      {bottomBar ? (
        /* Versi bottom bar: tampilan tengah yang lebih besar */
        <button
          type="button"
          className="lms-bottom-nav-center"
          onClick={() => setOpen(true)}
          aria-label="Buka daftar materi"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="13" y2="10" />
            <line x1="3" y1="15" x2="10" y2="15" />
          </svg>
          Materi
        </button>
      ) : (
        /* Versi header: tombol kecil "Materi" — hanya tampil di mobile via CSS */
        <button
          type="button"
          className="lms-mob-nav-toggle"
          onClick={() => setOpen(true)}
          aria-label="Buka kurikulum kelas"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="17" y2="12" />
            <line x1="3" y1="18" x2="13" y2="18" />
          </svg>
          Materi
        </button>
      )}

      {/* Drawer (mobile only) */}
      <LmsSidebar
        {...props}
        drawer
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
