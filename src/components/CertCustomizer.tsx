/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { uploadFileAction, saveCertTemplate } from "@/app/webadmin/actions";
import Icon from "@/components/Icon";
import CertificateSheet, { ELEMENT_LABELS, FONT_FAMILY_OPTIONS } from "@/components/CertificateSheet";
import type { CertConfig } from "@/lib/types";

type ProgramData = {
  id: string;
  slug: string;
  title: string;
  mentorName: string;
  materi: any; // array string
  certBgUrl: string | null;
  certConfig: any; // JSON
};

const DEFAULT_ACCENT_COLOR = "#232176";

const DEFAULT_POSITIONS = {
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

export default function CertCustomizer({ program }: { program: ProgramData }) {
  const materiList = Array.isArray(program.materi) ? (program.materi as string[]) : [];
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Parse initial config
  const initialConfig = program.certConfig || {};
  const [bgUrl, setBgUrl] = useState(program.certBgUrl || "");

  const [title, setTitle] = useState(initialConfig.title || "SERTIFIKAT");
  const [subtitle, setSubtitle] = useState(initialConfig.subtitle || "KETERANGAN SELESAI TOPIK PELATIHAN");
  const [numberFormat, setNumberFormat] = useState(initialConfig.numberFormat || "NOMOR : 2500/JSA-GP/[serial]/[month]/[year]");
  const [description, setDescription] = useState(
    initialConfig.description ||
      "Sebagai peserta dalam pelatihan nasional yang diadakan oleh PT Jetschool Academy Indonesia dengan tema: \"{title}\" yang dilaksanakan pada {date}."
  );
  const [placeDate, setPlaceDate] = useState(initialConfig.placeDate || "Bekasi, [date]");
  const [accentColor, setAccentColor] = useState(initialConfig.accentColor || DEFAULT_ACCENT_COLOR);

  // Tanda tangan — hanya Direktur (satu tanda tangan resmi, sesuai kebijakan terbaru)
  const [sign2Name, setSign2Name] = useState(initialConfig.sign2Name || "Najib");
  const [sign2Role, setSign2Role] = useState(initialConfig.sign2Role || "Direktur PT Jetschool Academy Indonesia");
  const [sign2Img, setSig2Img] = useState(initialConfig.sign2Img || "");
  const [stampImg, setStampImg] = useState(initialConfig.stampImg || "");

  // Positions state
  const [positions, setPositions] = useState(() => {
    return initialConfig.positions || DEFAULT_POSITIONS;
  });

  const [activeDrag, setActiveDrag] = useState<string | null>(null);

  // JP weights table
  const initialMateriJp = Array.isArray(initialConfig.materiJp) ? initialConfig.materiJp : [];
  const [materiJp, setMateriJp] = useState<{ materi: string; teori: number; tugas: number }[]>(() => {
    if (initialMateriJp.length > 0 && initialMateriJp.every((r: any) => typeof r?.materi === "string")) {
      return initialMateriJp.map((r: any) => ({
        materi: r.materi,
        teori: Number(r.teori) || 0,
        tugas: Number(r.tugas) || 0,
      }));
    }
    return materiList.map((m, idx) => {
      const match = initialMateriJp[idx];
      return {
        materi: m,
        teori: match?.teori != null ? Number(match.teori) : 5,
        tugas: match?.tugas != null ? Number(match.tugas) : 3,
      };
    });
  });

  function addJpRow() {
    setMateriJp((rows) => [...rows, { materi: "", teori: 2, tugas: 1 }]);
  }
  function removeJpRow(index: number) {
    setMateriJp((rows) => rows.filter((_, i) => i !== index));
  }
  function handleJpMateriChange(index: number, val: string) {
    setMateriJp((rows) => rows.map((r, i) => (i === index ? { ...r, materi: val } : r)));
  }

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculate total JP
  const totalJp = materiJp.reduce((acc, curr) => acc + curr.teori + curr.tugas, 0);

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, target: "bg" | "sig2" | "stamp") {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("target", target === "bg" ? "certificate" : "signature");

    try {
      const res = await uploadFileAction(fd);
      if (res.error || !res.url) {
        alert("Gagal mengunggah berkas: " + (res.error ?? "kesalahan tak dikenal."));
        return;
      }
      const url = res.url;
      if (target === "bg") setBgUrl(url);
      if (target === "sig2") setSig2Img(url);
      if (target === "stamp") setStampImg(url);
    } catch {
      alert("Gagal mengunggah berkas: koneksi atau server bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Update JP weight for a specific item
  function handleJpChange(index: number, field: "teori" | "tugas", val: number) {
    const updated = [...materiJp];
    updated[index][field] = val;
    setMateriJp(updated);
  }

  // Save to DB
  async function handleSave() {
    setSaving(true);
    const config = {
      title,
      subtitle,
      numberFormat,
      description,
      placeDate,
      accentColor,
      sign2Name,
      sign2Role,
      sign2Img,
      stampImg,
      materiJp,
      positions,
    };

    try {
      await saveCertTemplate(program.id, bgUrl || null, config);
      alert("Template sertifikat berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Drag handlers
  const handleDragStart = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveDrag(key);

    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = positions[key] || DEFAULT_POSITIONS[key as keyof typeof DEFAULT_POSITIONS];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const pctDeltaX = (deltaX / rect.width) * 100;
      const pctDeltaY = (deltaY / rect.height) * 100;

      const newX = Math.round(Math.max(0, Math.min(100, initialPos.x + pctDeltaX)));
      const newY = Math.round(Math.max(0, Math.min(100, initialPos.y + pctDeltaY)));

      setPositions((prev: any) => ({
        ...prev,
        [key]: { ...prev[key], x: newX, y: newY }
      }));
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Helper to change position via sliders
  const updatePosition = (key: string, axis: "x" | "y", val: number) => {
    setPositions((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [axis]: val
      }
    }));
  };

  // Helper to change font scale / rotation / z-index of an element
  const updateStyle = (key: string, field: "fontScale" | "rotation" | "zIndex", val: number | undefined) => {
    setPositions((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], [field]: val }
    }));
  };

  // Helper to change font family of an element ("" = pakai bawaan)
  const updateFontFamily = (key: string, val: string) => {
    setPositions((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], fontFamily: val }
    }));
  };

  // Resolve template variables for preview
  const previewDesc = description
    .replace(/{title}/g, program.title)
    .replace(/{name}/g, "Syntia Bella, S.Pd.")
    .replace(/{date}/g, "02 Agustus 2026")
    .replace(/{institution}/g, "SMP Negeri 234 Yogyakarta");

  const previewNum = numberFormat
    .replace(/\[serial\]/g, "0042")
    .replace(/\[month\]/g, "VIII")
    .replace(/\[year\]/g, "2026");

  const previewPlaceDate = placeDate.replace(/\[date\]/g, "02 Agustus 2026");

  // Preview cetak/PDF: simpan draft saat ini ke sessionStorage lalu buka tab pratinjau
  function handlePreviewPdf() {
    const config = {
      title, subtitle, numberFormat, description, placeDate, accentColor,
      sign2Name, sign2Role, sign2Img, stampImg, materiJp, positions,
    };
    sessionStorage.setItem(`certDraft:${program.id}`, JSON.stringify({ bgUrl, config }));
    window.open(`/webadmin/program/${program.id}/cert/preview`, "_blank");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "2rem", alignItems: "start", marginTop: "1.5rem" }}>
      {/* LEFT COLUMN: EDIT FORM & COORDINATE ADJUSTERS */}
      <div className="reg-card" style={{ padding: "1.8rem", maxWidth: "none", margin: 0 }}>
        <h3 style={{ marginBottom: "1.5rem" }}>Pengaturan Elemen Sertifikat</h3>

        {/* 1. Background Design */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)" }}>
            <Icon name="image" size={18} />
            Desain Background
          </h4>
          <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", margin: ".3rem 0 .8rem" }}>
            Upload desain template sertifikat kosong (A4 Portrait disarankan). Kosongkan untuk pakai desain bawaan Jetschool Academy di bawah.
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, "bg")}
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-sm btn-purple"
              disabled={loading}
              onClick={() => bgInputRef.current?.click()}
            >
              {loading ? "Mengunggah..." : "Pilih File Gambar"}
            </button>
            {bgUrl && (
              <button className="btn btn-sm btn-danger" onClick={() => setBgUrl("")}>
                Hapus
              </button>
            )}
          </div>
          {bgUrl && (
            <div style={{ marginTop: ".8rem", fontSize: ".8rem", wordBreak: "break-all", opacity: 0.75 }}>
              URL: <code>{bgUrl}</code>
            </div>
          )}

          <div className="field" style={{ marginTop: "1rem" }}>
            <label>Warna Aksen (judul, badge nomor, garis bingkai)</label>
            <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: "3rem", height: "2.2rem", padding: "2px", cursor: "pointer" }}
              />
              <input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#232176"
                style={{ maxWidth: "10rem" }}
              />
            </div>
          </div>
        </div>

        {/* 2. Main Texts */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: "1rem" }}>
            <Icon name="file-text" size={18} />
            Teks &amp; Deskripsi
          </h4>
          <div className="field">
            <label>Judul Sertifikat</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SERTIFIKAT" />
          </div>
          <div className="field">
            <label>Sub-Judul</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="KETERANGAN SELESAI TOPIK PELATIHAN" />
          </div>
          <div className="field">
            <label>Format Nomor Sertifikat</label>
            <input value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} placeholder="NOMOR : [serial]/JSA-GP/[month]/[year]" />
            <span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>
              Gunakan: <code>[serial]</code>, <code>[month]</code>, <code>[year]</code> untuk auto-increment.
            </span>
          </div>
          <div className="field">
            <label>Template Deskripsi Kelulusan</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sebagai peserta dalam pelatihan nasional..."
            />
            <span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>
              Gunakan placeholder: <code>{"{title}"}</code>, <code>{"{name}"}</code>, <code>{"{institution}"}</code>, <code>{"{date}"}</code>.
            </span>
          </div>
          <div className="field">
            <label>Tempat &amp; Tanggal Terbit</label>
            <input value={placeDate} onChange={(e) => setPlaceDate(e.target.value)} placeholder="Bekasi, [date]" />
            <span style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}>
              Gunakan <code>[date]</code> untuk tanggal batch (jadwal pelatihan) peserta secara otomatis. Ganti nama kota sesuai lokasi program.
            </span>
          </div>
        </div>

        {/* 3. Coordinate Sliders Accordion */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: "0.5rem" }}>
            <Icon name="settings" size={18} />
            Posisi Koordinat Elemen (%)
          </h4>
          <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
            Geser slider atau drag langsung kotak pada pratinjau sertifikat di sebelah kanan.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", background: "rgba(0,0,0,0.02)", padding: "1rem", borderRadius: "8px" }}>
            {Object.keys(DEFAULT_POSITIONS).map((k) => {
              const pos = positions[k] || DEFAULT_POSITIONS[k as keyof typeof DEFAULT_POSITIONS];
              const fontScale = pos.fontScale ?? 1;
              const rotation = pos.rotation ?? 0;
              const zIndex = pos.zIndex;
              const fontFamily = pos.fontFamily ?? "";
              return (
                <div key={k} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span>{ELEMENT_LABELS[k as keyof typeof ELEMENT_LABELS]}</span>
                    <span style={{ color: "var(--purple)" }}>X: {pos.x}%, Y: {pos.y}%</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>Horisontal (X)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pos.x}
                        onChange={(e) => updatePosition(k, "x", Number(e.target.value))}
                        style={{ height: "4px" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>Vertikal (Y)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pos.y}
                        onChange={(e) => updatePosition(k, "y", Number(e.target.value))}
                        style={{ height: "4px" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", flexShrink: 0 }}>Ukuran Font ({Math.round(fontScale * 100)}%)</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={fontScale}
                        onChange={(e) => updateStyle(k, "fontScale", Number(e.target.value))}
                        style={{ height: "4px" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", flexShrink: 0 }}>Rotasi ({rotation}&deg;)</span>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        value={rotation}
                        onChange={(e) => updateStyle(k, "rotation", Number(e.target.value))}
                        style={{ height: "4px" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", flexShrink: 0 }}>Font</span>
                      <select
                        value={fontFamily}
                        onChange={(e) => updateFontFamily(k, e.target.value)}
                        style={{ fontSize: "0.75rem", padding: ".25rem .4rem" }}
                      >
                        {FONT_FAMILY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", flexShrink: 0 }}>Lapisan (Z-Index)</span>
                      <input
                        type="number"
                        value={zIndex ?? ""}
                        placeholder="otomatis"
                        onChange={(e) => updateStyle(k, "zIndex", e.target.value === "" ? undefined : Number(e.target.value))}
                        style={{ width: "5rem", padding: ".25rem .4rem", fontSize: "0.75rem" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Syllabus JP */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: ".5rem" }}>
            <Icon name="list" size={18} />
            Bobot Jam Pelajaran (JP)
          </h4>
          <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
            Baris materi bisa ditambah, diubah, atau dihapus bebas — tidak terikat daftar materi program.
            Total saat ini: <b>{totalJp} JP</b>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {materiJp.map((m, idx) => (
              <div key={idx} style={{ background: "rgba(0,0,0,0.02)", padding: ".8rem", borderRadius: "var(--r-sm)", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", gap: ".6rem", alignItems: "center", marginBottom: ".5rem" }}>
                  <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--ink-soft)", flexShrink: 0 }}>{idx + 1}.</span>
                  <input
                    value={m.materi}
                    onChange={(e) => handleJpMateriChange(idx, e.target.value)}
                    placeholder="Nama materi pelatihan…"
                    style={{ flex: 1, padding: ".45rem .7rem", fontSize: ".85rem", fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeJpRow(idx)}
                    title="Hapus baris ini"
                    style={{ flexShrink: 0 }}
                  >
                    Hapus
                  </button>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".2rem" }}>Teori (JP)</label>
                    <input
                      type="number"
                      value={m.teori}
                      onChange={(e) => handleJpChange(idx, "teori", Math.max(0, Number(e.target.value)))}
                      style={{ padding: ".4rem" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".2rem" }}>Tugas (JP)</label>
                    <input
                      type="number"
                      value={m.tugas}
                      onChange={(e) => handleJpChange(idx, "tugas", Math.max(0, Number(e.target.value)))}
                      style={{ padding: ".4rem" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-sm" onClick={addJpRow} style={{ alignSelf: "flex-start" }}>
              + Tambah Baris Materi
            </button>
          </div>
        </div>

        {/* 5. Signature — Direktur saja (satu tanda tangan resmi) */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: "1rem" }}>
            <Icon name="users" size={18} />
            Tanda Tangan &amp; Stempel
          </h4>

          <div style={{ background: "rgba(108, 92, 231, 0.02)", padding: "1rem", borderRadius: "var(--r-sm)", border: "1px solid rgba(108, 92, 231, 0.15)" }}>
            <div className="field">
              <label>Nama Lengkap</label>
              <input value={sign2Name} onChange={(e) => setSign2Name(e.target.value)} placeholder="Najib" />
            </div>
            <div className="field">
              <label>Jabatan / Peran</label>
              <input value={sign2Role} onChange={(e) => setSign2Role(e.target.value)} placeholder="Direktur PT Jetschool Academy Indonesia" />
            </div>
            <div className="field">
              <label>File Tanda Tangan (PNG Transparan)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "sig2")} />
              {sign2Img && <div style={{ fontSize: ".75rem", opacity: 0.7, marginTop: ".2rem" }}>Uploaded: {sign2Img}</div>}
            </div>
            <div className="field">
              <label>File Stempel Resmi (PNG Transparan)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "stamp")} />
              {stampImg && <div style={{ fontSize: ".75rem", opacity: 0.7, marginTop: ".2rem" }}>Uploaded: {stampImg}</div>}
            </div>
          </div>
        </div>

        {/* Save & Preview Buttons */}
        <button
          type="button"
          onClick={handlePreviewPdf}
          className="btn btn-block"
          style={{ fontWeight: 700, marginBottom: ".7rem" }}
        >
          Preview Sertifikat (Uji Coba) &amp; Cetak/PDF
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-purple btn-block btn-lg"
          style={{ fontWeight: 700 }}
          disabled={saving || loading}
        >
          {saving ? "Menyimpan Perubahan..." : "Simpan Template Sertifikat"}
        </button>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW */}
      <div style={{ position: "sticky", top: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".8rem" }}>
          <div>
            <h4 style={{ margin: 0 }}>Pratinjau Live (A4 Portrait)</h4>
            <small style={{ color: "var(--ink-soft)" }}>Drag langsung kotak di bawah untuk memindahkan posisinya</small>
          </div>
          <span style={{ fontSize: ".8rem", color: "var(--purple)", fontWeight: 700 }}>✓ Sinkron Instan</span>
        </div>

        <div
          className="cert-preview-wrapper"
          style={{ width: "100%", position: "relative" }}
        >
          <CertificateSheet
            certBgUrl={bgUrl}
            certConfig={{ positions } as unknown as CertConfig}
            accentColor={accentColor}
            title={title}
            subtitle={subtitle}
            numFormatted={previewNum}
            recipientName="Syntia Bella, S.Pd."
            recipientInstitution="SMP Negeri 234 Yogyakarta"
            descResolved={previewDesc}
            materiJp={materiJp}
            totalJp={totalJp}
            placeDateResolved={previewPlaceDate}
            qrIdLabel="JSA-0042"
            s2Name={sign2Name}
            s2Role={sign2Role}
            s2Img={sign2Img || undefined}
            stampImg={stampImg || undefined}
            editable
            activeDragKey={activeDrag}
            onElementMouseDown={handleDragStart}
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <Link href={`/webadmin/program/${program.id}`} className="btn btn-sm btn-block" style={{ textAlign: "center" }}>
            Kembali ke Edit Program
          </Link>
        </div>
      </div>
    </div>
  );
}
