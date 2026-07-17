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

  // Materi JP weights
  const initialMateriJp = Array.isArray(initialConfig.materiJp) ? initialConfig.materiJp : [];
  const [materiJp, setMateriJp] = useState<{ materi: string; teori: number; tugas: number }[]>(
    materiList.map((m, idx) => {
      const match = initialMateriJp[idx];
      return {
        materi: m,
        teori: match?.teori != null ? Number(match.teori) : 5,
        tugas: match?.tugas != null ? Number(match.tugas) : 3,
      };
    })
  );

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
      const url = await uploadFileAction(fd);
      if (target === "bg") setBgUrl(url);
      if (target === "sig1") setSig1Img(url);
      if (target === "sig2") setSig2Img(url);
      if (target === "stamp") setStampImg(url);
    } catch (err: any) {
      alert("Gagal mengunggah berkas: " + err.message);
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

  // Resolve template variables for the live preview
  const previewDesc = description
    .replace(/{title}/g, program.title)
    .replace(/{name}/g, "Syntia Bella, S.Pd.")
    .replace(/{date}/g, "02 Agustus 2026")
    .replace(/{institution}/g, "SMP Negeri 234 Yogyakarta");

  const previewNum = numberFormat
    .replace(/\[serial\]/g, "0042")
    .replace(/\[month\]/g, "VIII")
    .replace(/\[year\]/g, "2026");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "2rem", alignItems: "start", marginTop: "1.5rem" }}>
      {/* LEFT COLUMN: EDIT FORM */}
      <div className="reg-card" style={{ padding: "1.8rem" }}>
        <h3 style={{ marginBottom: "1.5rem" }}>Pengaturan Elemen Sertifikat</h3>

        {/* 1. Background Design */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)" }}>
            <Icon name="image" size={18} />
            Desain Background
          </h4>
          <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", margin: ".3rem 0 .8rem" }}>
            Upload desain template sertifikat kosong (Portrait A4 disarankan).
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
            <div style={{ marginTop: ".8rem", fontSize: ".8rem", wordBreak: "break-all", opacity: .75 }}>
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

        {/* 3. Syllabus JP */}
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--purple)", marginBottom: ".5rem" }}>
            <Icon name="list" size={18} />
            Bobot Jam Pelajaran (JP)
          </h4>
          <p style={{ fontSize: ".8rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
            Atur bobot Teori &amp; Tugas untuk tiap materi. Total saat ini: <b>{totalJp} JP</b>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {materiJp.map((m, idx) => (
              <div key={idx} style={{ background: "rgba(0,0,0,0.02)", padding: ".8rem", borderRadius: "var(--r-sm)", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: ".85rem", fontWeight: 700, marginBottom: ".5rem", wordBreak: "break-word" }}>
                  {idx + 1}. {m.materi}
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
          </div>
        </div>

        {/* 4. Signatures */}
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
              {sign1Img && <div style={{ fontSize: ".75rem", opacity: .7, marginTop: ".2rem" }}>Uploaded: {sign1Img}</div>}
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
              {sign2Img && <div style={{ fontSize: ".75rem", opacity: .7, marginTop: ".2rem" }}>Uploaded: {sign2Img}</div>}
            </div>
            <div className="field">
              <label>File Stempel Resmi (PNG Transparan)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "stamp")} />
              {stampImg && <div style={{ fontSize: ".75rem", opacity: .7, marginTop: ".2rem" }}>Uploaded: {stampImg}</div>}
            </div>
          </div>
        </div>

        {/* 5. Additional Settings */}
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

      {/* RIGHT COLUMN: LIVE PREVIEW */}
      <div style={{ position: "sticky", top: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".8rem" }}>
          <h4 style={{ margin: 0 }}>Pratinjau Live (A4 Portrait)</h4>
          <span style={{ fontSize: ".8rem", color: "var(--purple)", fontWeight: 700 }}>✓ Sinkron Instan</span>
        </div>

        {/* CERTIFICATE CONTAINER */}
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
            padding: "2rem 2.5rem 1.5rem",
            color: "#1B1710",
            fontFamily: "Georgia, serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box",
            overflow: "hidden"
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

          {/* Logo Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".2rem", marginTop: ".8rem" }}>
            <Image src="/iconjetschool academy.png" alt="Logo" width={36} height={36} style={{ objectFit: "contain" }} />
            <div style={{ fontSize: ".65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "sans-serif" }}>
              Jetschool <span style={{ color: "var(--purple)" }}>Academy</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <h1 style={{ fontSize: "2rem", margin: "1rem 0 .2rem", fontWeight: 900, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--purple)", fontFamily: "sans-serif", textAlign: "center" }}>
            {title}
          </h1>
          <div style={{ fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, fontFamily: "sans-serif", borderBottom: "1.5px solid #1B1710", paddingBottom: ".3rem", width: "80%", textAlign: "center" }}>
            {subtitle}
          </div>

          {/* Cert Number Badge */}
          <div style={{ background: "var(--purple)", color: "var(--white)", padding: ".3rem 1.5rem", borderRadius: "20px", fontSize: ".6rem", fontWeight: 700, margin: ".8rem 0", fontFamily: "sans-serif" }}>
            {previewNum}
          </div>

          <div style={{ fontSize: ".68rem", color: "#666", fontStyle: "italic", margin: ".2rem 0" }}>Diberikan kepada :</div>

          {/* Name & Instansi */}
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--purple)", textDecoration: "underline", margin: ".2rem 0", textAlign: "center", lineHeight: 1.2 }}>
            Syntia Bella, S.Pd.
          </div>
          <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#444", marginBottom: ".8rem", textAlign: "center" }}>
            SMP Negeri 234 Yogyakarta
          </div>

          {/* Description Paragraph */}
          <p style={{ fontSize: ".62rem", color: "#333", textAlign: "center", lineHeight: 1.5, margin: "0 1rem .8rem", fontFamily: "Georgia, serif" }}>
            {previewDesc}
          </p>

          {/* Syllabus Table */}
          <div style={{ width: "100%", margin: ".4rem 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".58rem", fontFamily: "sans-serif" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".4rem", textAlign: "center", width: "8%" }}>No</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".4rem", textAlign: "left" }}>Materi</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".4rem", textAlign: "center", width: "14%" }}>Teori</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".4rem", textAlign: "center", width: "14%" }}>Tugas</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: ".4rem", textAlign: "center", width: "14%" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {materiJp.slice(0, 5).map((m, i) => (
                  <tr key={i}>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".35rem .2rem", textAlign: "center" }}>{i + 1}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".35rem .2rem", textAlign: "left", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{m.materi}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".35rem .2rem", textAlign: "center" }}>{m.teori} JP</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".35rem .2rem", textAlign: "center" }}>{m.tugas} JP</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: ".35rem .2rem", textAlign: "center", fontWeight: 700 }}>{m.teori + m.tugas} JP</td>
                  </tr>
                ))}
                {materiJp.length > 5 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", fontSize: ".5rem", color: "var(--ink-soft)", padding: ".2rem" }}>
                      (+ {materiJp.length - 5} materi lainnya tidak ditampilkan di pratinjau ringkas)
                    </td>
                  </tr>
                )}
                <tr style={{ background: "rgba(0,0,0,0.01)" }}>
                  <td colSpan={2} style={{ padding: ".4rem", fontWeight: 800, textAlign: "right" }}>Jumlah Total</td>
                  <td colSpan={3} style={{ padding: ".4rem", fontWeight: 900, textAlign: "center", color: "var(--purple)", fontSize: ".62rem" }}>
                    {totalJp} JP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer PlaceDate */}
          <div style={{ fontSize: ".6rem", fontWeight: 700, margin: ".4rem 0", color: "#555", fontFamily: "sans-serif" }}>
            Pangandaran, 02 Agustus 2026
          </div>

          {/* Signatures & Stamp Area */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
              paddingTop: ".4rem",
              position: "relative",
              fontFamily: "sans-serif",
              fontSize: ".55rem"
            }}
          >
            {/* Signature 1 (Mentor) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "35%" }}>
              <div style={{ height: "30px", position: "relative", marginBottom: ".2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sign1Img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sign1Img} alt="Signature 1" style={{ maxHeight: "30px", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: ".5rem", color: "#999", fontStyle: "italic" }}>(ttd narasumber)</span>
                )}
              </div>
              <b style={{ textDecoration: "underline", color: "#222" }}>{sign1Name}</b>
              <span style={{ color: "#666", fontSize: ".5rem" }}>{sign1Role}</span>
            </div>

            {/* Verification QR (Middle) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "20%" }}>
              <div style={{ width: "32px", height: "32px", background: "#f5f5f5", border: "1px solid #ddd", display: "grid", placeItems: "center" }}>
                <span style={{ fontSize: ".4rem", fontWeight: 800, color: "#777" }}>QR</span>
              </div>
              <span style={{ fontSize: ".38rem", marginTop: ".1rem", color: "#888" }}>ID: JSA-0042</span>
            </div>

            {/* Signature 2 (Direktur Najib) + Stamp Wrapper */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "35%", position: "relative" }}>
              {/* Stamp (Floating over signature) */}
              {stampImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stampImg}
                  alt="Stamp"
                  style={{
                    position: "absolute",
                    height: "38px",
                    width: "38px",
                    objectFit: "contain",
                    left: "20px",
                    top: "-15px",
                    opacity: 0.85,
                    pointerEvents: "none"
                  }}
                />
              )}

              <div style={{ height: "30px", position: "relative", marginBottom: ".2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sign2Img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sign2Img} alt="Signature 2" style={{ maxHeight: "30px", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: ".5rem", color: "#999", fontStyle: "italic" }}>(ttd direktur)</span>
                )}
              </div>
              <b style={{ textDecoration: "underline", color: "#222" }}>{sign2Name}</b>
              <span style={{ color: "#666", fontSize: ".5rem" }}>{sign2Role}</span>
            </div>
          </div>

          {/* PMM Badge & Partner Logos */}
          {showPmmBadge && (
            <div
              style={{
                width: "100%",
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                borderRadius: "4px",
                padding: ".25rem .5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".4rem",
                marginTop: ".8rem",
                boxSizing: "border-box"
              }}
            >
              <span style={{ color: "#10B981", fontWeight: 800, fontSize: ".5rem", fontFamily: "sans-serif" }}>✓</span>
              <span style={{ color: "#065F46", fontWeight: 700, fontSize: ".48rem", fontFamily: "sans-serif" }}>
                Registered on Komunitas Platform Merdeka Mengajar (PMM)
              </span>
            </div>
          )}
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
