"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { uploadFileAction, saveCertTemplate } from "@/app/webadmin/actions";
import Icon from "@/components/Icon";

type ProgramData = {
  id: string;
  slug: string;
  title: string;
  mentorName: string;
  materi: any; // array string
  certBgUrl: string | null;
  certConfig: any; // JSON
};

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
  
  const [sign1Name, setSign1Name] = useState(initialConfig.sign1Name || program.mentorName);
  const [sign1Role, setSign1Role] = useState(initialConfig.sign1Role || "Narasumber / Tim Ahli");
  const [sign1Img, setSig1Img] = useState(initialConfig.sign1Img || "");

  const [sign2Name, setSign2Name] = useState(initialConfig.sign2Name || "Najib");
  const [sign2Role, setSign2Role] = useState(initialConfig.sign2Role || "Direktur PT Jetschool Academy Indonesia");
  const [sign2Img, setSig2Img] = useState(initialConfig.sign2Img || "");
  const [stampImg, setStampImg] = useState(initialConfig.stampImg || "");

  const [showPmmBadge, setShowPmmBadge] = useState(initialConfig.showPmmBadge !== false);

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
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, target: "bg" | "sig1" | "sig2" | "stamp") {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await uploadFileAction(fd);
      if (res.error || !res.url) {
        alert("Gagal mengunggah berkas: " + (res.error ?? "kesalahan tak dikenal."));
        return;
      }
      const url = res.url;
      if (target === "bg") setBgUrl(url);
      if (target === "sig1") setSig1Img(url);
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
      sign1Name,
      sign1Role,
      sign1Img,
      sign2Name,
      sign2Role,
      sign2Img,
      stampImg,
      showPmmBadge,
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
        [key]: { x: newX, y: newY }
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

  const LABELS: Record<string, string> = {
    logo: "Logo Kiri & Teks Header",
    title: "Judul Utama (Sertifikat)",
    subtitle: "Sub-Judul Tipe",
    number: "Nomor Sertifikat",
    recipient: "Nama & Instansi Penerima",
    description: "Paragraf Deskripsi Kelulusan",
    table: "Tabel Jam Pelajaran (JP)",
    placeDate: "Tempat, Tanggal Terbit",
    signatures: "Area Tanda Tangan, Stempel & QR Code"
  };

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
            Upload desain template sertifikat kosong (A4 Portrait disarankan).
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input
              type="file"
              accept="image/*"
              id="bg-upload"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, "bg")}
              disabled={loading}
            />
            <label htmlFor="bg-upload" className="btn btn-sm btn-purple" style={{ cursor: "pointer" }}>
              {loading ? "Mengunggah..." : "Pilih File Gambar"}
            </label>
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
              return (
                <div key={k} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span>{LABELS[k]}</span>
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

        {/* 5. Signatures */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: "1rem" }}>
            <Icon name="users" size={18} />
            Tanda Tangan &amp; Stempel
          </h4>

          {/* Narasumber */}
          <div style={{ background: "rgba(108, 92, 231, 0.02)", padding: "1rem", borderRadius: "var(--r-sm)", border: "1px solid rgba(108, 92, 231, 0.15)", marginBottom: "1rem" }}>
            <b style={{ fontSize: ".85rem", display: "block", marginBottom: ".6rem" }}>Tanda Tangan 1 (Narasumber)</b>
            <div className="field">
              <label>Nama Lengkap</label>
              <input value={sign1Name} onChange={(e) => setSign1Name(e.target.value)} placeholder="Soeharti, M.Pd." />
            </div>
            <div className="field">
              <label>Jabatan / Peran</label>
              <input value={sign1Role} onChange={(e) => setSign1Role(e.target.value)} placeholder="Tim Ahli Guru Pembelajar Indonesia" />
            </div>
            <div className="field">
              <label>File Tanda Tangan (PNG Transparan)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "sig1")} />
              {sign1Img && <div style={{ fontSize: ".75rem", opacity: 0.7, marginTop: ".2rem" }}>Uploaded: {sign1Img}</div>}
            </div>
          </div>

          {/* Direktur */}
          <div style={{ background: "rgba(108, 92, 231, 0.02)", padding: "1rem", borderRadius: "var(--r-sm)", border: "1px solid rgba(108, 92, 231, 0.15)" }}>
            <b style={{ fontSize: ".85rem", display: "block", marginBottom: ".6rem" }}>Tanda Tangan 2 (Direktur Najib)</b>
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

        {/* 6. Additional Settings */}
        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: "1rem" }}>
            <Icon name="settings" size={18} />
            Opsi Tampilan
          </h4>
          <label style={{ display: "flex", alignItems: "center", gap: ".6rem", cursor: "pointer", fontSize: ".88rem" }}>
            <input
              type="checkbox"
              checked={showPmmBadge}
              onChange={(e) => setShowPmmBadge(e.target.checked)}
              style={{ width: "auto" }}
            />
            Tampilkan Badge Komunitas PMM &amp; Logo Merdeka Mengajar
          </label>
        </div>

        {/* Save Button */}
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

        {/* DRAGGABLE CERTIFICATE WINDOW */}
        <div
          className="cert-preview-wrapper"
          style={{
            width: "100%",
            aspectRatio: "1 / 1.414",
            background: bgUrl ? `url(${bgUrl}) no-repeat center center / cover` : "var(--white)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: bgUrl ? "none" : "1px solid var(--line)",
            position: "relative",
            padding: "0",
            color: "#1B1710",
            fontFamily: "Georgia, serif",
            overflow: "hidden",
            boxSizing: "border-box"
          }}
        >
          {/* Default Decorative Background if no background image is set */}
          {!bgUrl && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "10px solid var(--purple)",
                pointerEvents: "none",
                borderRadius: "var(--r-md)",
                boxSizing: "border-box"
              }}
            />
          )}

          {/* DRAGGABLE 1: Logo Header */}
          <div
            style={{
              position: "absolute",
              left: `${positions.logo.x}%`,
              top: `${positions.logo.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: ".2rem",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "logo" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "logo" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("logo", e)}
          >
            <Image src="/iconjetschool academy.png" alt="Logo" width={32} height={32} style={{ objectFit: "contain" }} />
            <div style={{ fontSize: ".6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "sans-serif" }}>
              Jetschool <span style={{ color: "var(--purple)" }}>Academy</span>
            </div>
          </div>

          {/* DRAGGABLE 2: Title */}
          <div
            style={{
              position: "absolute",
              left: `${positions.title.x}%`,
              top: `${positions.title.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              width: "90%",
              textAlign: "center",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "title" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "title" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("title", e)}
          >
            <h1 style={{ fontSize: "1.8rem", margin: "0", fontWeight: 900, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--purple)", fontFamily: "sans-serif" }}>
              {title}
            </h1>
          </div>

          {/* DRAGGABLE 3: Subtitle */}
          <div
            style={{
              position: "absolute",
              left: `${positions.subtitle.x}%`,
              top: `${positions.subtitle.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              width: "80%",
              textAlign: "center",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "subtitle" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "subtitle" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("subtitle", e)}
          >
            <div style={{ fontSize: ".58rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, fontFamily: "sans-serif", borderBottom: "1.5px solid #1B1710", paddingBottom: ".3rem", width: "100%" }}>
              {subtitle}
            </div>
          </div>

          {/* DRAGGABLE 4: Number */}
          <div
            style={{
              position: "absolute",
              left: `${positions.number.x}%`,
              top: `${positions.number.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              padding: "0.2rem 0.5rem",
              border: activeDrag === "number" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "number" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("number", e)}
          >
            <div style={{ background: "var(--purple)", color: "var(--white)", padding: ".25rem 1.2rem", borderRadius: "20px", fontSize: ".58rem", fontWeight: 700, fontFamily: "sans-serif" }}>
              {previewNum}
            </div>
          </div>

          {/* DRAGGABLE 5: Recipient */}
          <div
            style={{
              position: "absolute",
              left: `${positions.recipient.x}%`,
              top: `${positions.recipient.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              width: "80%",
              textAlign: "center",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "recipient" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "recipient" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("recipient", e)}
          >
            <div style={{ fontSize: ".62rem", color: "#666", fontStyle: "italic", marginBottom: ".1rem" }}>Diberikan kepada :</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--purple)", textDecoration: "underline", lineHeight: 1.2 }}>
              Syntia Bella, S.Pd.
            </div>
            <div style={{ fontSize: ".74rem", fontWeight: 700, color: "#444", marginTop: ".1rem" }}>
              SMP Negeri 234 Yogyakarta
            </div>
          </div>

          {/* DRAGGABLE 6: Description */}
          <div
            style={{
              position: "absolute",
              left: `${positions.description.x}%`,
              top: `${positions.description.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              width: "84%",
              textAlign: "center",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "description" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "description" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("description", e)}
          >
            <p style={{ fontSize: ".58rem", color: "#333", lineHeight: 1.5, margin: "0", fontFamily: "Georgia, serif" }}>
              {previewDesc}
            </p>
          </div>

          {/* DRAGGABLE 7: Table JP */}
          <div
            style={{
              position: "absolute",
              left: `${positions.table.x}%`,
              top: `${positions.table.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              width: "86%",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "table" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "table" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("table", e)}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".52rem", fontFamily: "sans-serif" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".3rem", textAlign: "center", width: "8%" }}>No</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".3rem", textAlign: "left" }}>Materi</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".3rem", textAlign: "center", width: "14%" }}>Teori</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".3rem", textAlign: "center", width: "14%" }}>Tugas</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".3rem", textAlign: "center", width: "14%" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {materiJp.slice(0, 4).map((m, i) => (
                  <tr key={i}>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".25rem .15rem", textAlign: "center" }}>{i + 1}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".25rem .15rem", textAlign: "left", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>{m.materi || "(Materi kosong)"}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".25rem .15rem", textAlign: "center" }}>{m.teori} JP</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".25rem .15rem", textAlign: "center" }}>{m.tugas} JP</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".25rem .15rem", textAlign: "center", fontWeight: 700 }}>{m.teori + m.tugas} JP</td>
                  </tr>
                ))}
                {materiJp.length > 4 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", fontSize: ".45rem", color: "var(--ink-soft)", padding: ".15rem" }}>
                      (+ {materiJp.length - 4} materi lainnya tidak ditampilkan di pratinjau ringkas)
                    </td>
                  </tr>
                )}
                <tr style={{ background: "rgba(0,0,0,0.01)" }}>
                  <td colSpan={2} style={{ padding: ".3rem", fontWeight: 800, textAlign: "right" }}>Jumlah Total</td>
                  <td colSpan={3} style={{ padding: ".3rem", fontWeight: 900, textAlign: "center", color: "var(--purple)", fontSize: ".58rem" }}>
                    {totalJp} JP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DRAGGABLE 8: Place Date */}
          <div
            style={{
              position: "absolute",
              left: `${positions.placeDate.x}%`,
              top: `${positions.placeDate.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              padding: "0.2rem 0.5rem",
              border: activeDrag === "placeDate" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "placeDate" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("placeDate", e)}
          >
            <div style={{ fontSize: ".58rem", fontWeight: 700, color: "#555", fontFamily: "sans-serif" }}>
              Pangandaran, 02 Agustus 2026
            </div>
          </div>

          {/* DRAGGABLE 9: Signatures & Stamp & QR */}
          <div
            style={{
              position: "absolute",
              left: `${positions.signatures.x}%`,
              top: `${positions.signatures.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
              zIndex: 20,
              width: "86%",
              padding: "0.2rem 0.5rem",
              border: activeDrag === "signatures" ? "2px solid var(--purple)" : "1px dashed rgba(108, 92, 231, 0.4)",
              borderRadius: "4px",
              background: activeDrag === "signatures" ? "rgba(108, 92, 231, 0.05)" : "transparent",
              userSelect: "none"
            }}
            onMouseDown={(e) => handleDragStart("signatures", e)}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                fontFamily: "sans-serif",
                fontSize: ".52rem"
              }}
            >
              {/* Narasumber */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "35%" }}>
                <div style={{ height: "26px", position: "relative", marginBottom: ".15rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {sign1Img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sign1Img} alt="Signature 1" style={{ maxHeight: "26px", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: ".45rem", color: "#999", fontStyle: "italic" }}>(ttd)</span>
                  )}
                </div>
                <b style={{ textDecoration: "underline", color: "#222" }}>{sign1Name}</b>
                <span style={{ color: "#666", fontSize: ".45rem" }}>{sign1Role}</span>
              </div>

              {/* QR Code */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "20%" }}>
                <div style={{ width: "28px", height: "28px", background: "#f5f5f5", border: "1px solid #ddd", display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: ".38rem", fontWeight: 800, color: "#777" }}>QR</span>
                </div>
                <span style={{ fontSize: ".32rem", marginTop: ".05rem", color: "#888" }}>ID: JSA-0042</span>
              </div>

              {/* Direktur + Stamp wrapper */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "35%", position: "relative" }}>
                {stampImg && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stampImg}
                    alt="Stamp"
                    style={{
                      position: "absolute",
                      height: "32px",
                      width: "32px",
                      objectFit: "contain",
                      left: "15px",
                      top: "-12px",
                      opacity: 0.85,
                      pointerEvents: "none"
                    }}
                  />
                )}

                <div style={{ height: "26px", position: "relative", marginBottom: ".15rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {sign2Img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sign2Img} alt="Signature 2" style={{ maxHeight: "26px", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: ".45rem", color: "#999", fontStyle: "italic" }}>(ttd)</span>
                  )}
                </div>
                <b style={{ textDecoration: "underline", color: "#222" }}>{sign2Name}</b>
                <span style={{ color: "#666", fontSize: ".45rem" }}>{sign2Role}</span>
              </div>
            </div>

            {/* PMM Badge inside block if checked */}
            {showPmmBadge && (
              <div
                style={{
                  width: "100%",
                  background: "rgba(16, 185, 129, 0.06)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                  borderRadius: "4px",
                  padding: ".2rem .4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".3rem",
                  marginTop: ".6rem",
                  boxSizing: "border-box"
                }}
              >
                <span style={{ color: "#10B981", fontWeight: 800, fontSize: ".45rem", fontFamily: "sans-serif" }}>✓</span>
                <span style={{ color: "#065F46", fontWeight: 700, fontSize: ".42rem", fontFamily: "sans-serif" }}>
                  Registered on Komunitas PMM
                </span>
              </div>
            )}
          </div>
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
