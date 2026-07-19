"use client";

import { useEffect, useState } from "react";

/**
 * Mengaktifkan animasi .reveal saat elemen masuk layar.
 *
 * Urutan aman agar tidak menyebabkan hydration mismatch:
 *   1. useState/useEffect mounted guard -> pastikan seluruh halaman selesai di-hydrate.
 *   2. Jalankan setup IntersectionObserver secara aman setelah browser idle / selesai hidrasi.
 */
function ScrollRevealActive() {
  useEffect(() => {
    let io: IntersectionObserver | undefined;
    let mo: MutationObserver | undefined;
    let timerId: ReturnType<typeof setTimeout>;

    const initObservers = () => {
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

      // Amati elemen yang sudah ada di DOM
      document.querySelectorAll(".reveal").forEach(observe);

      // Mengamati elemen baru yang ditambahkan dinamis (misal navigasi client-side)
      mo = new MutationObserver((mutations) => {
        // Defer pemrosesan ke macro-task berikutnya untuk memastikan
        // React selesai melakukan hidrasi pada node DOM baru.
        setTimeout(() => {
          mutations.forEach((m) => {
            m.addedNodes.forEach((node) => {
              if (!(node instanceof Element)) return;
              if (!document.body.contains(node)) return;
              if (node.classList.contains("reveal")) observe(node);
              node.querySelectorAll(".reveal").forEach(observe);
            });
          });
        }, 0);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    };

    // Tunggu sampai browser idle/selesai hidrasi sebelum mengamati DOM
    if (typeof window !== "undefined") {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          initObservers();
        }, { timeout: 1000 });
      } else {
        timerId = setTimeout(initObservers, 200);
      }
    }

    return () => {
      if (timerId) clearTimeout(timerId);
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
