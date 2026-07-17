"use client";

import { useEffect, useState } from "react";

export default function Countdown({ target }: { target: string | Date }) {
  const [diff, setDiff] = useState<number | null>(null); // null = belum hydrate

  useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => setDiff(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const d = diff ?? 0;

  return (
    <div className="countdown" suppressHydrationWarning>
      <div className="cd-box"><b>{Math.floor(d / 864e5)}</b><span>Hari</span></div>
      <div className="cd-box"><b>{pad(Math.floor(d / 36e5) % 24)}</b><span>Jam</span></div>
      <div className="cd-box"><b>{pad(Math.floor(d / 6e4) % 60)}</b><span>Menit</span></div>
      <div className="cd-box"><b>{pad(Math.floor(d / 1e3) % 60)}</b><span>Detik</span></div>
    </div>
  );
}
