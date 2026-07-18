"use client";

import { useEffect } from "react";

/** Mengaktifkan animasi .reveal saat elemen masuk layar.
 *  - useEffect dengan [] agar observer tidak re-run setiap render.
 *  - MutationObserver untuk menangkap elemen .reveal baru saat
 *    soft navigation (Next.js client-side routing).
 *  - requestAnimationFrame untuk menunda hingga setelah hydration.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
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

      document.querySelectorAll(".reveal").forEach(observe);

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
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
