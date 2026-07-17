import type { Deliverable } from "@/lib/fallback";
import { rupiah } from "@/lib/format";

/** Value stacking: daftar yang didapat + harga coret, ditutup blok harga ungu. */
export default function ValueStack({ deliverables, price, priceOld, ctaHref, ctaLabel, isFree }: {
  deliverables: Deliverable[];
  price: number;
  priceOld: number | null;
  ctaHref?: string;
  ctaLabel?: string;
  isFree?: boolean;
}) {
  return (
    <div className="stack">
      {deliverables.map((d, i) => (
        <div className="stack-row" key={i}>
          <span>{d.label}</span>
          {isFree || d.value === 0
            ? <span className="val incl">✓</span>
            : <span className="val">{rupiah(d.value)}</span>}
        </div>
      ))}
      <div className="price-block">
        <div>
          <div className="label">Hari ini cukup</div>
          <div className="now">
            {!isFree && priceOld ? <small>{rupiah(priceOld)}</small> : null}
            {isFree ? "GRATIS" : rupiah(price)}
          </div>
        </div>
        {ctaHref && <a href={ctaHref} className="btn btn-lime">{ctaLabel ?? "Ambil Sekarang"}</a>}
      </div>
    </div>
  );
}
