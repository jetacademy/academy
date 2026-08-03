"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { CertConfig, CertElementStyle, CertMateriJp, CertPositions } from "@/lib/types";

/** Default posisi & urutan tumpuk (z-index) tiap elemen — dipertahankan identik dengan desain lama
 *  supaya sertifikat yang certConfig-nya belum punya fontScale/rotation/zIndex tetap tampil sama persis. */
const DEFAULT_POSITIONS: CertPositions = {
  logo: { x: 50, y: 11 },
  title: { x: 50, y: 20 },
  subtitle: { x: 50, y: 26 },
  number: { x: 50, y: 31 },
  recipient: { x: 50, y: 40 },
  description: { x: 50, y: 51 },
  table: { x: 50, y: 64 },
  placeDate: { x: 50, y: 77 },
  signatures: { x: 50, y: 84 },
};

const DEFAULT_Z: Record<keyof CertPositions, number> = {
  logo: 1,
  title: 2,
  subtitle: 3,
  number: 4,
  recipient: 5,
  description: 6,
  table: 7,
  placeDate: 8,
  signatures: 9,
};

const DEFAULT_FONT_FAMILY: Record<keyof CertPositions, string> = {
  logo: "sans-serif",
  title: "sans-serif",
  subtitle: "sans-serif",
  number: "sans-serif",
  recipient: "Georgia, serif",
  description: "Georgia, serif",
  table: "sans-serif",
  placeDate: "sans-serif",
  signatures: "sans-serif",
};

export const ELEMENT_LABELS: Record<keyof CertPositions, string> = {
  logo: "Logo Kiri & Teks Header",
  title: "Judul Utama (Sertifikat)",
  subtitle: "Sub-Judul Tipe",
  number: "Nomor Sertifikat",
  recipient: "Nama & Instansi Penerima",
  description: "Paragraf Deskripsi Kelulusan",
  table: "Tabel Jam Pelajaran (JP)",
  placeDate: "Tempat, Tanggal Terbit",
  signatures: "Tanda Tangan, Stempel & QR Code",
};

export const FONT_FAMILY_OPTIONS = [
  { value: "", label: "Bawaan" },
  { value: "Georgia, serif", label: "Georgia (serif)" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Courier New', monospace", label: "Courier New" },
];

function resolveStyle(config: CertConfig | undefined, key: keyof CertPositions): Required<Omit<CertElementStyle, "fontFamily">> & { fontFamily: string } {
  const s = config?.positions?.[key] ?? DEFAULT_POSITIONS[key];
  return {
    x: s.x,
    y: s.y,
    fontScale: s.fontScale ?? 1,
    rotation: s.rotation ?? 0,
    zIndex: s.zIndex ?? DEFAULT_Z[key],
    fontFamily: s.fontFamily || DEFAULT_FONT_FAMILY[key],
  };
}

/** Kalikan sebuah nilai font-size (clamp() atau satuan tetap) dengan skala elemen. */
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
  /** true = mode editor admin (border putus-putus + drag handle), false/undefined = tampilan bersih siswa */
  editable?: boolean;
  activeDragKey?: string | null;
  onElementMouseDown?: (key: keyof CertPositions, e: React.MouseEvent) => void;
};

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
  editable = false,
  activeDragKey = null,
  onElementMouseDown,
}: CertificateSheetProps) {
  function wrapperStyle(key: keyof CertPositions, extra?: CSSProperties): CSSProperties {
    const s = resolveStyle(certConfig, key);
    const active = activeDragKey === key;
    return {
      position: "absolute",
      left: `${s.x}%`,
      top: `${s.y}%`,
      transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
      zIndex: s.zIndex,
      fontFamily: s.fontFamily,
      ...(editable
        ? {
            cursor: "move",
            padding: "0.2rem 0.5rem",
            border: active ? `2px solid ${accentColor}` : "1px dashed rgba(108, 92, 231, 0.4)",
            borderRadius: "4px",
            background: active ? "rgba(108, 92, 231, 0.05)" : "transparent",
            userSelect: "none",
          }
        : {}),
      ...extra,
    };
  }

  function handleDown(key: keyof CertPositions) {
    if (!editable || !onElementMouseDown) return undefined;
    return (e: React.MouseEvent) => onElementMouseDown(key, e);
  }

  const scale = (key: keyof CertPositions) => resolveStyle(certConfig, key).fontScale;

  // Tabel JP menciut otomatis kalau baris materinya banyak, supaya tidak menabrak elemen
  // di atas/bawahnya (deskripsi, tempat/tanggal, tanda tangan) — di atas 6 baris (header+total
  // termasuk) baru mulai menciut, jadi sertifikat dengan sedikit materi tetap tampil sama seperti
  // sebelumnya. Admin masih bisa menimpa lewat slider "Ukuran Font" per elemen kalau perlu.
  const tableRowCount = materiJp.length + 2;
  const tableAutoScale = tableRowCount > 6 ? Math.max(0.55, 6 / tableRowCount) : 1;
  const tableScale = scale("table") * tableAutoScale;
  const tablePad = (basePadV: number, basePadH: number) => `${(basePadV * tableAutoScale).toFixed(2)}rem ${(basePadH * tableAutoScale).toFixed(2)}rem`;

  return (
    <div
      className="cert-a4"
      style={{
        width: "100%",
        aspectRatio: "1 / 1.414",
        background: certBgUrl ? `url(${certBgUrl}) no-repeat center center / cover` : "var(--white)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--shadow-lg)",
        border: certBgUrl ? "none" : "1px solid var(--line)",
        position: "relative",
        padding: "0",
        color: "#1B1710",
        fontFamily: "Georgia, serif",
        boxSizing: "border-box",
        overflow: "hidden",
        // Semua font-size di komponen ini pakai satuan cqw (container query width), BUKAN vw —
        // supaya skala teks mengikuti lebar sertifikat ini sendiri, konsisten baik dirender di
        // kolom sempit editor admin, tab preview, maupun halaman publik lebar penuh.
        containerType: "inline-size",
      }}
    >
      {/* Bingkai & watermark bawaan Jetschool Academy — dipakai kalau admin belum upload background sendiri */}
      {!certBgUrl && (
        <>
          <div
            style={{
              position: "absolute",
              inset: "14px",
              border: `3px solid ${accentColor}`,
              borderRadius: "6px",
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "20px",
              border: `1px solid ${accentColor}`,
              opacity: 0.5,
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 0.05, pointerEvents: "none", zIndex: 0 }}>
            <div style={{ position: "relative", width: "42%", aspectRatio: "1 / 1" }}>
              <Image src="/iconjetschool academy.png" alt="" fill style={{ objectFit: "contain" }} />
            </div>
          </div>
        </>
      )}

      {/* 1. Logo Header */}
      <div
        style={wrapperStyle("logo", { display: "flex", flexDirection: "column", alignItems: "center", gap: ".2rem" })}
        onMouseDown={handleDown("logo")}
      >
        <div style={{ position: "relative", width: "48px", height: "48px" }}>
          <Image src={certConfig?.logoUrl || "/iconjetschool academy.png"} alt="Logo" fill style={{ objectFit: "contain" }} />
        </div>
        {!certConfig?.logoUrl && (
          <div style={{ fontSize: fs(".75rem", scale("logo")), fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            Jetschool <span style={{ color: accentColor }}>Academy</span>
          </div>
        )}
      </div>

      {/* 2. Title */}
      <h2
        style={wrapperStyle("title", {
          width: "90%",
          fontSize: fs("clamp(1.6rem, 4cqw, 2.5rem)", scale("title")),
          margin: 0,
          fontWeight: 900,
          letterSpacing: ".25em",
          textTransform: "uppercase",
          color: accentColor,
          textAlign: "center",
        })}
        onMouseDown={handleDown("title")}
      >
        {title}
      </h2>

      {/* 3. Subtitle */}
      <div
        style={wrapperStyle("subtitle", {
          width: "80%",
          fontSize: fs("clamp(.55rem, 1.5cqw, .75rem)", scale("subtitle")),
          letterSpacing: ".1em",
          textTransform: "uppercase",
          fontWeight: 700,
          borderBottom: "2px solid #1B1710",
          paddingBottom: ".4rem",
          textAlign: "center",
        })}
        onMouseDown={handleDown("subtitle")}
      >
        {subtitle}
      </div>

      {/* 4. Certificate Number Badge */}
      <div
        style={wrapperStyle("number", {
          background: accentColor,
          color: "var(--white)",
          padding: ".35rem 2rem",
          borderRadius: "20px",
          fontSize: fs("clamp(.55rem, 1.5cqw, .7rem)", scale("number")),
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(108, 92, 231, 0.2)",
        })}
        onMouseDown={handleDown("number")}
      >
        {numFormatted}
      </div>

      {/* 5. Recipient */}
      <div
        style={wrapperStyle("recipient", { width: "80%", display: "flex", flexDirection: "column", alignItems: "center" })}
        onMouseDown={handleDown("recipient")}
      >
        <div style={{ fontSize: fs("clamp(.65rem, 1.8cqw, .8rem)", scale("recipient")), color: "#555", fontStyle: "italic" }}>
          Diberikan kepada :
        </div>
        <div
          style={{
            fontSize: fs("clamp(1.2rem, 3.5cqw, 1.8rem)", scale("recipient")),
            fontWeight: 800,
            color: accentColor,
            borderBottom: `1px dashed ${accentColor}`,
            paddingBottom: ".2rem",
            margin: ".5rem 0 .2rem",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {recipientName}
        </div>
        {recipientInstitution && (
          <div style={{ fontSize: fs("clamp(.75rem, 2cqw, 1rem)", scale("recipient")), fontWeight: 700, color: "#333", textAlign: "center" }}>
            {recipientInstitution}
          </div>
        )}
      </div>

      {/* 6. Description */}
      <p
        style={wrapperStyle("description", {
          width: "84%",
          fontSize: fs("clamp(.62rem, 1.6cqw, .78rem)", scale("description")),
          color: "#333",
          textAlign: "center",
          lineHeight: 1.6,
          margin: 0,
        })}
        onMouseDown={handleDown("description")}
      >
        {descResolved}
      </p>

      {/* 7. Syllabus Table */}
      <div style={wrapperStyle("table", { width: "86%" })} onMouseDown={handleDown("table")}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: fs("clamp(.55rem, 1.5cqw, .7rem)", tableScale) }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.03)" }}>
              <th style={{ borderBottom: "1.5px solid #ccc", padding: tablePad(0.3, 0.3), textAlign: "center", width: "8%" }}>No</th>
              <th style={{ borderBottom: "1.5px solid #ccc", padding: tablePad(0.3, 0.3), textAlign: "left" }}>Materi Pelatihan</th>
              <th style={{ borderBottom: "1.5px solid #ccc", padding: tablePad(0.3, 0.3), textAlign: "center", width: "15%" }}>Teori</th>
              <th style={{ borderBottom: "1.5px solid #ccc", padding: tablePad(0.3, 0.3), textAlign: "center", width: "15%" }}>Tugas</th>
              <th style={{ borderBottom: "1.5px solid #ccc", padding: tablePad(0.3, 0.3), textAlign: "center", width: "15%" }}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {materiJp.map((m, idx) => (
              <tr key={idx}>
                <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.25, 0.3), textAlign: "center" }}>{idx + 1}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.25, 0.3), textAlign: "left", fontWeight: 600 }}>{m.materi || "(Materi kosong)"}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.25, 0.3), textAlign: "center" }}>{m.teori} JP</td>
                <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.25, 0.3), textAlign: "center" }}>{m.tugas} JP</td>
                <td style={{ borderBottom: "1px solid #eee", padding: tablePad(0.25, 0.3), textAlign: "center", fontWeight: 700 }}>{m.teori + m.tugas} JP</td>
              </tr>
            ))}
            <tr style={{ background: "rgba(0,0,0,0.015)" }}>
              <td colSpan={2} style={{ padding: tablePad(0.3, 0.3), fontWeight: 800, textAlign: "right" }}>Jumlah Total JP</td>
              <td colSpan={3} style={{ padding: tablePad(0.3, 0.3), fontWeight: 900, textAlign: "center", color: accentColor, fontSize: fs("clamp(.62rem, 1.8cqw, .8rem)", tableScale) }}>
                {totalJp} JP
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 8. Place & Date */}
      <div
        style={wrapperStyle("placeDate", { fontSize: fs("clamp(.62rem, 1.8cqw, .75rem)", scale("placeDate")), fontWeight: 700, color: "#444" })}
        onMouseDown={handleDown("placeDate")}
      >
        {placeDateResolved}
      </div>

      {/* 9. Signatures, Stamp & QR */}
      <div style={wrapperStyle("signatures", { width: "70%", display: "flex", flexDirection: "column", alignItems: "center" })} onMouseDown={handleDown("signatures")}>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "3rem",
            fontSize: fs("clamp(.55rem, 1.5cqw, .7rem)", scale("signatures")),
            position: "relative",
          }}
        >
          {/* QR Verifikasi */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "26%" }}>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Verification QR" style={{ width: "64px", height: "64px", border: "1px solid #eee", background: "#fff" }} />
            ) : (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span style={{ fontSize: ".55rem", fontWeight: 800, color: "#777" }}>QR</span>
              </div>
            )}
            <span style={{ fontSize: fs("clamp(.42rem, 1.2cqw, .55rem)", scale("signatures")), marginTop: ".3rem", color: "#666", fontWeight: 700 }}>
              ID: {qrIdLabel}
            </span>
          </div>

          {/* Tanda Tangan Direktur + Stempel */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "40%", position: "relative" }}>
            {stampImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stampImg}
                alt="Official Stamp"
                style={{
                  position: "absolute",
                  height: "64px",
                  width: "64px",
                  objectFit: "contain",
                  left: "50%",
                  top: "-25px",
                  transform: "translateX(-50%)",
                  opacity: 0.85,
                  pointerEvents: "none",
                  zIndex: 3,
                }}
              />
            )}
            <div style={{ height: "45px", position: "relative", marginBottom: ".3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s2Img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s2Img} alt="Tanda tangan Direktur" style={{ maxHeight: "45px", objectFit: "contain" }} />
              ) : (
                <div style={{ height: "45px" }} />
              )}
            </div>
            <b style={{ textDecoration: "underline", color: "#1B1710" }}>{s2Name}</b>
            <span style={{ color: "#555", fontSize: fs("clamp(.48rem, 1.3cqw, .62rem)", scale("signatures")), marginTop: ".1rem" }}>{s2Role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
