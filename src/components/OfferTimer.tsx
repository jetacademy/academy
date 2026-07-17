"use client";

import { useEffect, useState } from "react";

/**
 * Bilah hitung mundur menuju tenggat yang NYATA (jadwal mulai sesi).
 * Tidak ada urgensi buatan — angka ini adalah waktu sungguhan.
 */
export default function OfferTimer({ target, note }: {
  target: string; // ISO date jadwal mulai
  note: string;
}) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const ms = left ?? 0;
  const days = Math.floor(ms / 864e5);

  return (
    <div className="offer-bar" suppressHydrationWarning>
      <span className="note">{note}</span>
      <div className="offer-digits">
        {days > 0 && <div className="d"><b>{days}</b><span>Hari</span></div>}
        <div className="d"><b>{pad(Math.floor(ms / 36e5) % 24)}</b><span>Jam</span></div>
        <div className="d"><b>{pad(Math.floor(ms / 6e4) % 60)}</b><span>Menit</span></div>
        <div className="d"><b>{pad(Math.floor(ms / 1e3) % 60)}</b><span>Detik</span></div>
      </div>
    </div>
  );
}
