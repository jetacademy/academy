"use client";

import { useState } from "react";

export type FaqEntry = { q: string; a: string };

export default function Faq({ items }: { items: FaqEntry[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="faq">
      {items.map((item, i) => (
        <div key={i} className={`faq-item${openIdx === i ? " open" : ""}`}>
          <button className="faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            {item.q} <span className="chev">+</span>
          </button>
          <div className="faq-a">
            <div><div>{item.a}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}
