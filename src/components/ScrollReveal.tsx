"use client";

import { useEffect, useState } from "react";

/**
 * Mengaktifkan animasi .reveal saat elemen masuk layar.
 *
 * Urutan aman agar tidak menyebabkan hydration mismatch:
 *   1. useState/useEffect mounted guard -> pastikan seluruh halaman selesai di-hydrate.
 *   2. render subcomponent -> jalankan setup IntersectionObserver secara aman.
 */
function ScrollRevealActive() {
  useEffect(() => {
    let io: IntersectionObserver | undefined;
    let mo: MutationObserver | undefined;
    let rafId: ReturnType<typeof requestAnimationFrame>;
    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(() => {
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
    }, 50);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      io?.disconnect();
      mo?.disconnect();
    };
  }, []);

  return null;
}

export default function ScrollReveal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <ScrollRevealActive />;
}
