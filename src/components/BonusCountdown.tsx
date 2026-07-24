"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface Props {
  /** ISO timestamp: kapan bonus/sertifikat direncanakan tersedia (event end = scheduleAt + 3h) */
  eventEndIso: string;
  /** server-computed: apakah event sudah lewat? */
  eventEnded: boolean;
}

/** Digit dengan flip animation */
function Digit({ value }: { value: string }) {
  const prevRef = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 300);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={`cdc-digit${flip ? " cdc-flip" : ""}`}>{value}</span>
  );
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="cdc-box">
      <div className="cdc-digit-wrap">
        <Digit value={value[0]} />
        <Digit value={value[1]} />
      </div>
      <span className="cdc-label">{label}</span>
    </div>
  );
}

export default function BonusCountdown({ eventEndIso, eventEnded }: Props) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  const [isDone, setIsDone] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},  // no subscription
    () => true,      // client snapshot
    () => false,     // server snapshot (SSR)
  );

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, new Date(eventEndIso).getTime() - Date.now());
      if (diff === 0 && !isDone) setIsDone(true);
      setTime({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventEndIso]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (!mounted) {
    // SSR placeholder — sama tinggi supaya tidak layout shift
    return <div className="cdc-placeholder" aria-hidden />;
  }

  // ── Bonus sudah di-unlock admin ──────────────────────────────────
  // (Komponen ini hanya dirender saat belum terbuka, jadi kasus ini
  //  sebagai safety net jika prop berubah sebelum re-render.)

  // ── Event sudah selesai, tunggu admin ───────────────────────────
  if (eventEnded || isDone) {
    return (
      <div className="cdc-waiting">
        <div className="cdc-waiting-glow" aria-hidden />
        <div className="cdc-waiting-icon">🎁</div>
        <p className="cdc-waiting-title">Bonus Peserta Sedang Disiapkan</p>
        <p className="cdc-waiting-desc">
          Acara telah selesai. Admin sedang menyiapkan akses eksklusif Anda — video rekaman, modul PDF, post-test, dan e-Sertifikat.
        </p>
        <div className="cdc-pulse-row">
          <span className="cdc-pulse-dot" />
          <span className="cdc-pulse-text">Pantau terus dashboard ini</span>
        </div>
      </div>
    );
  }

  // ── Countdown ke akhir acara ────────────────────────────────────
  return (
    <div className="cdc-wrap">
      {/* Dekorasi latar */}
      <div className="cdc-bg-ring cdc-bg-ring-1" aria-hidden />
      <div className="cdc-bg-ring cdc-bg-ring-2" aria-hidden />

      {/* Header */}
      <div className="cdc-lock-icon" aria-hidden>🔒</div>
      <p className="cdc-heading">Bonus &amp; Sertifikat Dibuka Setelah Acara Selesai</p>
      <p className="cdc-subtext">
        Video rekaman &nbsp;·&nbsp; Modul PDF &nbsp;·&nbsp; Post-test &nbsp;·&nbsp; e-Sertifikat
      </p>

      {/* Timer */}
      <div className="cdc-timer-row">
        <TimeBox value={pad(time.h)} label="JAM" />
        <span className="cdc-sep" aria-hidden>:</span>
        <TimeBox value={pad(time.m)} label="MENIT" />
        <span className="cdc-sep" aria-hidden>:</span>
        <TimeBox value={pad(time.s)} label="DETIK" />
      </div>

      <p className="cdc-footer-hint">⏳ Hitung mundur hingga akhir sesi live</p>
    </div>
  );
}
