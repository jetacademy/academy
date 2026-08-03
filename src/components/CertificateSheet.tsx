"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { CertConfig, CertMateriJp } from "@/lib/types";

/** Kalikan sebuah nilai font-size (clamp() atau satuan tetap) dengan faktor skala. */
function fs(value: string, scale: number): string {
  if (scale === 1) return value;
  return `calc(${value} * ${scale})`;
}

export type CertificateSheetProps = {
  certBgUrl?: string | null;
  certConfig?: CertConfig;
  accentColor: string;
  title: string;
  subtitle: string;
  numFormatted: string;
  recipientName: string;
  recipientInstitution?: string;
  descResolved: string;
  materiJp: CertMateriJp[];
  totalJp: number;
  placeDateResolved: string;
  qrDataUrl?: string;
  qrIdLabel: string;
  s2Name: string;
  s2Role: string;
  s2Img?: string;
  stampImg?: string;
};

/** Bracket sudut dekoratif ala sertifikat modern-minimalis — hanya tampil kalau admin belum upload background sendiri. */
const CORNER_STYLES: CSSProperties[] = [
  { top: "6%", left: "6%", borderWidth: "3px 0 0 3px" },
  { top: "6%", right: "6%", borderWidth: "3px 3px 0 0" },
  { bottom: "6%", left: "6%", borderWidth: "0 0 3px 3px" },
  { bottom: "6%", right: "6%", borderWidth: "0 3px 3px 0" },
];

export default function CertificateSheet({
  certBgUrl,
  certConfig,
  accentColor,
  title,
  subtitle,
  numFormatted,
  recipientName,
  recipientInstitution,
  descResolved,
  materiJp,
  totalJp,
  placeDateResolved,
  qrDataUrl,
  qrIdLabel,
  s2Name,
  s2Role,
  s2Img,
  stampImg,
}: CertificateSheetProps) {
  const logoUrl = certConfig?.logoUrl;

  // Tabel JP menciut otomatis kalau baris materinya banyak, supaya layout tetap muat di tinggi
  // lembar A4 yang tetap tanpa perlu admin mengatur posisi manual.
  const tableRowCount = materiJp.length + 2;
  const tableAutoScale = tableRowCount > 6 ? Math.max(0.55, 6 / tableRowCount) : 1;
  const tablePad = (basePadV: number, basePadH: number) =>
    `${(basePadV * tableAutoScale).toFixed(2)}rem ${(basePadH * tableAutoScale).toFixed(2)}rem`;

  return (
    <div
      className="cert-a4"
      style={{
        width: "100%",
        aspectRatio: "1 / 1.414",
        background: certBgUrl ? `url(${certBgUrl}) no-repeat center center / cover` : "var(--white)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--shadow-lg)",
        border: certBgUrl ? "none" : "1px solid #e8e8ec",
        position: "relative",
        color: "#1B1710",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
        // Semua font-size di komponen ini pakai satuan cqw (container query width), BUKAN vw —
        // supaya skala teks mengikuti lebar sertifikat ini sendiri, konsisten baik dirender di
        // kolom sempit editor admin, tab preview, maupun halaman publik lebar penuh.
        containerType: "inline-size",
      }}
    >
      {!certBgUrl &&
        CORNER_STYLES.map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "clamp(22px, 6.5cqw, 38px)",
              height: "clamp(22px, 6.5cqw, 38px)",
              borderColor: accentColor,
              borderStyle: "solid",
              pointerEvents: "none",
              ...pos,
            }}
          />
        ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9% 11%",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        {/* Grup atas: logo, judul, sub-judul, badge nomor */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          {/* 1. Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
            <div style={{ position: "relative", width: "clamp(34px, 6.5cqw, 50px)", height: "clamp(34px, 6.5cqw, 50px)" }}>
              <Image src={logoUrl || "/iconjetschool academy.png"} alt="Logo" fill style={{ objectFit: "contain" }} />
            </div>
            {!logoUrl && (
              <div style={{ fontSize: "clamp(.58rem, 1.4cqw, .7rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: "#555" }}>
                Jetschool <span style={{ color: accentColor }}>Academy</span>
              </div>
            )}
          </div>

          {/* 2. Title & Subtitle */}
          <div style={{ marginTop: "clamp(.9rem, 3.6cqw, 1.6rem)" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.55rem, 4.4cqw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#1B1710",
              }}
            >
              {title}
            </h2>
            <div
              style={{
                margin: "clamp(.45rem, 1.4cqw, .7rem) auto 0",
                width: "clamp(44px, 8cqw, 72px)",
                height: "3px",
                background: accentColor,
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                marginTop: "clamp(.55rem, 1.5cqw, .8rem)",
                fontSize: "clamp(.55rem, 1.4cqw, .7rem)",
                letterSpacing: ".14em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#777",
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* 3. Certificate number */}
          <div
            style={{
              marginTop: "clamp(.7rem, 2.2cqw, 1.1rem)",
              fontSize: "clamp(.48rem, 1.2cqw, .6rem)",
              fontWeight: 700,
              letterSpacing: ".05em",
              color: accentColor,
              border: `1px solid ${accentColor}`,
              borderRadius: "999px",
              padding: ".28rem 1rem",
            }}
          >
            {numFormatted}
          </div>
        </div>

        {/* Grup tengah: penerima, deskripsi, tabel JP */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", flexShrink: 0 }}>
          {/* 4. Recipient */}
          <div style={{ width: "88%" }}>
            <div style={{ fontSize: "clamp(.6rem, 1.5cqw, .75rem)", color: "#888" }}>Diberikan kepada :</div>
            <div
              style={{
                marginTop: ".35rem",
                fontSize: "clamp(1.15rem, 3.6cqw, 1.8rem)",
                fontWeight: 800,
                color: "#1B1710",
                lineHeight: 1.2,
              }}
            >
              {recipientName}
            </div>
            <div
              style={{
                margin: ".4rem auto 0",
                width: "clamp(56px, 11cqw, 100px)",
                height: "2px",
                background: accentColor,
              }}
            />
            {recipientInstitution && (
              <div style={{ marginTop: ".45rem", fontSize: "clamp(.7rem, 1.8cqw, .88rem)", fontWeight: 600, color: "#555" }}>
                {recipientInstitution}
              </div>
            )}
          </div>

          {/* 5. Description */}
          <p
            style={{
              marginTop: "clamp(.8rem, 2.6cqw, 1.4rem)",
              width: "82%",
              fontSize: "clamp(.6rem, 1.5cqw, .75rem)",
              color: "#555",
              lineHeight: 1.7,
            }}
          >
            {descResolved}
          </p>

          {/* 6. Syllabus table */}
          <div style={{ marginTop: "clamp(.7rem, 2.2cqw, 1.2rem)", width: "88%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: fs("clamp(.48rem, 1.25cqw, .64rem)", tableAutoScale) }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: `2px solid ${accentColor}`, padding: tablePad(0.3, 0.25), textAlign: "center", width: "8%", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "#444" }}>No</th>
                  <th style={{ borderBottom: `2px solid ${accentColor}`, padding: tablePad(0.3, 0.25), textAlign: "left", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "#444" }}>Materi Pelatihan</th>
                  <th style={{ borderBottom: `2px solid ${accentColor}`, padding: tablePad(0.3, 0.25), textAlign: "center", width: "15%", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "#444" }}>Teori</th>
                  <th style={{ borderBottom: `2px solid ${accentColor}`, padding: tablePad(0.3, 0.25), textAlign: "center", width: "15%", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "#444" }}>Tugas</th>
                  <th style={{ borderBottom: `2px solid ${accentColor}`, padding: tablePad(0.3, 0.25), textAlign: "center", width: "15%", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "#444" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {materiJp.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.24, 0.25), textAlign: "center", color: "#666" }}>{idx + 1}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.24, 0.25), textAlign: "left", fontWeight: 600 }}>{m.materi || "(Materi kosong)"}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.24, 0.25), textAlign: "center", color: "#666" }}>{m.teori} JP</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.24, 0.25), textAlign: "center", color: "#666" }}>{m.tugas} JP</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.24, 0.25), textAlign: "center", fontWeight: 700 }}>{m.teori + m.tugas} JP</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ padding: tablePad(0.32, 0.25), fontWeight: 800, textAlign: "right" }}>Jumlah Total JP</td>
                  <td colSpan={3} style={{ padding: tablePad(0.32, 0.25), fontWeight: 900, textAlign: "center", color: accentColor, fontSize: fs("clamp(.54rem, 1.4cqw, .7rem)", tableAutoScale) }}>
                    {totalJp} JP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Grup bawah: tempat/tanggal, QR & tanda tangan */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", flexShrink: 0 }}>
          {/* 7. Place & date */}
          <div style={{ fontSize: "clamp(.58rem, 1.5cqw, .72rem)", fontWeight: 600, color: "#666" }}>
            {placeDateResolved}
          </div>

          {/* 8. QR + Signature */}
          <div
            style={{
              marginTop: "clamp(.5rem, 1.8cqw, .9rem)",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: "clamp(1.4rem, 4.6cqw, 2.8rem)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "22%" }}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Verification QR" style={{ width: "54px", height: "54px", border: "1px solid #eee", background: "#fff" }} />
              ) : (
                <div style={{ width: "54px", height: "54px", background: "#f5f5f5", border: "1px solid #ddd", display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: ".5rem", fontWeight: 800, color: "#999" }}>QR</span>
                </div>
              )}
              <span style={{ fontSize: "clamp(.4rem, 1.05cqw, .5rem)", marginTop: ".3rem", color: "#888", fontWeight: 700 }}>
                ID: {qrIdLabel}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "42%", position: "relative" }}>
              {stampImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stampImg}
                  alt="Official Stamp"
                  style={{
                    position: "absolute",
                    height: "58px",
                    width: "58px",
                    objectFit: "contain",
                    left: "50%",
                    top: "-20px",
                    transform: "translateX(-50%)",
                    opacity: 0.85,
                    pointerEvents: "none",
                  }}
                />
              )}
              <div style={{ height: "40px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                {s2Img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s2Img} alt="Tanda tangan" style={{ maxHeight: "40px", objectFit: "contain" }} />
                )}
              </div>
              <div style={{ width: "100%", borderTop: "1px solid #ccc", marginTop: ".2rem", paddingTop: ".3rem" }}>
                <b style={{ fontSize: "clamp(.6rem, 1.5cqw, .75rem)", color: "#1B1710" }}>{s2Name}</b>
                <div style={{ color: "#777", fontSize: "clamp(.46rem, 1.15cqw, .58rem)", marginTop: ".1rem" }}>{s2Role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
