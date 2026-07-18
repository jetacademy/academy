"use client";

import { useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Icon from "./Icon";

type Testimonial = {
  name: string;
  role: string;
  avatar: string; // emoji atau URL
  text: string;
  rating: number; // 1-5
};

const testimonials: Testimonial[] = [
  {
    name: "Sarah",
    role: "Guru SD",
    avatar: "👩‍🏫",
    text: "Materinya sangat relevan dengan kebutuhan saya di kelas. Administrasi yang dulu makan waktu berjam-jam sekarang bisa selesai dalam hitungan menit.",
    rating: 5,
  },
  {
    name: "Rudi",
    role: "Fresh Graduate",
    avatar: "👨‍🎓",
    text: "Ikut kelas online AI di Jetschool, langsung praktik dan dapat sertifikat. Sekarang saya lebih pede lamar kerja.",
    rating: 5,
  },
  {
    name: "Maya",
    role: "Karyawan Swasta",
    avatar: "👩‍💼",
    text: "Workshop Excel-nya worth banget. Laporan bulanan yang dulu 2 hari sekarang cukup 1 jam. Employer langsung notice.",
    rating: 5,
  },
];

export default function Testimonials({ limit }: { limit?: number }) {
  const items = limit ? testimonials.slice(0, limit) : testimonials;
  const [open, setOpen] = useState(false);
  const shown = open ? testimonials : items;

  return (
    <section className="section" id="testimoni">
      <div className="container">
        <div className="bento reveal">
          <div className="section-head">
            <h2>Apa kata <span className="acc-o">mereka</span>?</h2>
            <p className="lead" style={{ color: "var(--ink-soft)" }}>
              Peserta yang sudah merasakan manfaat program kami.
            </p>
          </div>
          <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.2rem", marginTop: "1.5rem" }}>
            {shown.map((t, i) => (
              <div
                key={i}
                className="testi-card"
                style={{
                  background: "var(--chip)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.8rem",
                }}
              >
                <div style={{ fontSize: "1.2rem", color: "#f59e0b", letterSpacing: "2px" }}>
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </div>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "var(--ink)", flex: 1 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
                  <span style={{ fontSize: "1.8rem" }}>{t.avatar}</span>
                  <div>
                    <b style={{ fontSize: "0.92rem" }}>{t.name}</b>
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {limit && testimonials.length > limit && !open && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                onClick={() => setOpen(true)}
                className="btn btn-line"
                style={{ cursor: "pointer" }}
              >
                Lihat Semua Testimoni
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
