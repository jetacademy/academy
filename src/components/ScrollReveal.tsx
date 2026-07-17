"use client";

import { useEffect } from "react";

/** Mengaktifkan animasi .reveal saat elemen masuk layar.
 *  - useEffect dengan [] agar observer tidak re-run setiap render.
 *  - MutationObserver untuk menangkap elemen .reveal baru saat
 *    soft navigation (Next.js client-side routing).
 */
export default function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const observe = (el: Element) => {
      if (!el.classList.contains("in")) io.observe(el);
    };

    // observe semua yang sudah ada di DOM
    document.querySelectorAll(".reveal").forEach(observe);

    // tangkap elemen .reveal baru setelah soft navigation
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.classList.contains("reveal")) observe(node);
          node.querySelectorAll(".reveal").forEach(observe);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []); // [] — hanya jalan sekali saat mount

  return null;
}

