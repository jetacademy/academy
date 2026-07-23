"use client";

import { useState } from "react";

type DayPoint = { date: string; label: string; amount: number };

function rupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

/** Tampilkan label sumbu-x hanya utk sebagian titik supaya tidak tabrakan saat rentang panjang. */
function shouldShowLabel(index: number, total: number): boolean {
  if (total <= 14) return true;
  const step = total <= 31 ? 3 : 7;
  return index % step === 0 || index === total - 1;
}

export default function DailyRevenueChart({ data }: { data: DayPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.amount));
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const peakIndex = data.reduce((best, d, i) => (d.amount > data[best].amount ? i : best), 0);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span className="muted" style={{ fontSize: "0.78rem" }}>Total periode ini</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{rupiah(total)}</div>
        </div>
        <div style={{ minHeight: "1.4rem", textAlign: "right" }}>
          {hovered && (
            <>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{hovered.label}</div>
              <div style={{ fontWeight: 700 }}>{rupiah(hovered.amount)}</div>
            </>
          )}
        </div>
      </div>

      <div
        role="img"
        aria-label={`Grafik pendapatan harian, total ${rupiah(total)} dalam ${data.length} hari`}
        style={{
          display: "flex", alignItems: "flex-end", gap: "3px", height: "9rem",
          borderBottom: "1px solid var(--line)", padding: "0 2px",
        }}
      >
        {data.map((d, i) => {
          const heightPct = Math.max(2, Math.round((d.amount / max) * 100));
          const isHovered = hoverIndex === i;
          return (
            <div
              key={d.date}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              title={`${d.label}: ${rupiah(d.amount)}`}
              style={{
                flex: 1, minWidth: "2px", height: `${heightPct}%`,
                background: isHovered ? "var(--orange)" : "var(--purple)",
                opacity: d.amount === 0 ? 0.15 : 1,
                borderRadius: "3px 3px 0 0",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.1s ease",
              }}
            >
              {i === peakIndex && d.amount > 0 && (
                <span style={{
                  position: "absolute", top: "-1.3rem", left: "50%", transform: "translateX(-50%)",
                  fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", whiteSpace: "nowrap",
                }}>
                  {rupiah(d.amount)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "3px", padding: "0 2px", marginTop: "0.3rem" }}>
        {data.map((d, i) => (
          <div key={d.date} style={{ flex: 1, minWidth: "2px", textAlign: "center" }}>
            {shouldShowLabel(i, data.length) && (
              <span style={{ fontSize: "0.65rem", color: "var(--ink-faint)" }}>{d.label}</span>
            )}
          </div>
        ))}
      </div>

      <details style={{ marginTop: "1.2rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "var(--purple)" }}>
          Lihat sebagai tabel
        </summary>
        <div className="tbl-wrap" style={{ marginTop: "0.6rem" }}>
          <table className="tbl">
            <thead><tr><th>Tanggal</th><th>Pendapatan</th></tr></thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td data-label="Tanggal">{d.label}</td>
                  <td data-label="Pendapatan">{rupiah(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
