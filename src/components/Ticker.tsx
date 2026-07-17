/** Strip teks berjalan — elemen khas di bawah navbar. */
export default function Ticker({ items }: { items: string[] }) {
  // konten diduplikasi agar loop animasi mulus
  const row = items.map((t, i) => <span key={i}>{t}</span>);
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {row}
        {items.map((t, i) => <span key={`b-${i}`}>{t}</span>)}
      </div>
    </div>
  );
}
