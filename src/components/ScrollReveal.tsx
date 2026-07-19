"use client";

import { useEffect } from "react";

/**
 * Mengaktifkan animasi .reveal saat elemen masuk layar.
 *
 * Urutan aman agar tidak menyebabkan hydration mismatch:
 *   1. useEffect → dijamin jalan SETELAH React selesai hydrate.
 *   2. setTimeout(0) → lepas ke task queue berikutnya (bukan microtask).
 *   3. requestAnimationFrame → tunggu 1 paint cycle browser selesai.
 *   Barulah IntersectionObserver di-setup, sehingga callback `in`
 *   tidak pernah menyentuh DOM saat React masih aktif reconcile.
 */
export default function ScrollReveal() {
  useEffect(() => {
    let io: IntersectionObserver | undefined;
    let mo: MutationObserver | undefined;
    let rafId: ReturnType<typeof requestAnimationFrame>;
    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(() => {
      // requestAnimationFrame: pastikan satu paint cycle sudah lewat
      rafId = requestAnimationFrame(() => {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("in");
                io?.unobserve(e.target);
              }
            });
          },
          { threshold: 0.12 }
        );

        const observe = (el: Element) => {
          if (!el.classList.contains("in")) io!.observe(el);
        };

        document.querySelectorAll(".reveal").forEach(observe);

        mo = new MutationObserver((mutations) => {
          mutations.forEach((m) => {
            m.addedNodes.forEach((node) => {
              if (!(node instanceof Element)) return;
              if (node.classList.contains("reveal")) observe(node);
              node.querySelectorAll(".reveal").forEach(observe);
            });
          });
        });
        mo.observe(document.body, { childList: true, subtree: true });
      });
    }, 0); // 0ms = task queue berikutnya, setelah React commit selesai

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      io?.disconnect();
      mo?.disconnect();
    };
  }, []);

  return null;
}
