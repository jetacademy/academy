"use client";

import { useEffect, useRef } from "react";

interface PurchaseTrackerProps {
  registrations: {
    payment: { id: string; status: string; amount: number } | null;
    program: { title: string };
  }[];
}

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export default function PurchaseTracker({ registrations }: PurchaseTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const justPaid = registrations.find(
      (r) => r.payment?.status === "PAID"
    );
    if (justPaid && window.fbq) {
      // eventID harus SAMA dengan CAPI server-side (payment.id) → Meta dedup otomatis,
      // jadi Purchase tidak dihitung dobel (Pixel browser + CAPI server)
      window.fbq(
        "track",
        "Purchase",
        {
          value: justPaid.payment!.amount,
          currency: "IDR",
          content_name: justPaid.program.title,
        },
        { eventID: justPaid.payment!.id }
      );
      fired.current = true;
    }
  }, [registrations]);

  return null;
}
