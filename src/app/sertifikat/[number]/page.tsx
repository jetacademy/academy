import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import type { CertConfig, CertMateriJp } from "@/lib/types";

export const revalidate = 86400; // ISR: re-generate every 24 hours

export const metadata = { title: "e-Sertifikat — Jetschool Academy" };

function toRoman(num: number): string {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return roman[num - 1] || String(num);
}

/** Halaman sertifikat sekaligus verifikasi publik: /sertifikat/[number] */
export default async function CertPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;

  let cert = null;
  try {
    cert = await prisma.certificate.findUnique({
      where: { number: decodeURIComponent(number) },
      include: { registration: { include: { program: true } } },
    });
  } catch {
    notFound();
  }
  if (!cert) notFound();

  const program = cert.registration.program;
  const certConfig: CertConfig = program.certConfig ? (program.certConfig as CertConfig) : {};
  const certBgUrl = program.certBgUrl;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/sertifikat/${cert.number}`;
  
  // QR code pointing to this verification page
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 140,
    color: { dark: "#1B1710", light: "#FFFFFF" },
  });

  const issuedDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(cert.issuedAt);
  const monthRoman = toRoman(cert.issuedAt.getMonth() + 1);
  const yearStr = String(cert.issuedAt.getFullYear());

  // Format cert number — fallback ke cert.number (JSA-YYYY-XXXXXXXX)
  const numFormatted = certConfig.numberFormat
    ? certConfig.numberFormat
        .replace(/\[serial\]/g, cert.number)
        .replace(/\[month\]/g, monthRoman)
        .replace(/\[year\]/g, yearStr)
    : cert.number;

  // Description text
  const descTemplate = certConfig.description || "Sebagai peserta dalam pelatihan nasional yang diadakan oleh PT Jetschool Academy Indonesia dengan tema: \"{title}\" yang dilaksanakan pada {date}.";
  const descResolved = descTemplate
    .replace(/{title}/g, program.title)
    .replace(/{name}/g, cert.registration.name)
    .replace(/{date}/g, new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(program.scheduleAt))
    .replace(/{institution}/g, cert.registration.institution || "");

  // Syllabus / JP breakdown
  const materiList = Array.isArray(program.materi) ? (program.materi as string[]) : [];
  const configMateriJp: CertMateriJp[] = Array.isArray(certConfig.materiJp) ? certConfig.materiJp : [];

  const materiJp: CertMateriJp[] =
    configMateriJp.length > 0 && configMateriJp.every((r) => typeof r?.materi === "string")
      ? configMateriJp.map((r) => ({
          materi: r.materi,
          teori: Number(r.teori) || 0,
          tugas: Number(r.tugas) || 0,
        }))
      : materiList.map((m, idx) => {
          const match = configMateriJp[idx];
          return {
            materi: m,
            teori: match?.teori != null ? Number(match.teori) : 5,
            tugas: match?.tugas != null ? Number(match.tugas) : 3,
          };
        });

  const totalJp = materiJp.reduce((acc, curr) => acc + curr.teori + curr.tugas, 0);

  // Signatures
  const s1Name = certConfig.sign1Name || program.mentorName;
  const s1Role = certConfig.sign1Role || "Narasumber / Tim Ahli";
  const s1Img = certConfig.sign1Img || "";

  const s2Name = certConfig.sign2Name || "Najib";
  const s2Role = certConfig.sign2Role || "Direktur PT Jetschool Academy Indonesia";
  const s2Img = certConfig.sign2Img || "";
  const stImg = certConfig.stampImg || "";

  const showPmm = certConfig.showPmmBadge !== false;

  // Sub-judul default mengikuti jenis sertifikat program
  const KIND_SUBTITLE: Record<string, string> = {
    PARTICIPATION: "KETERANGAN KEIKUTSERTAAN PELATIHAN",
    COMPLETION: "KETERANGAN SELESAI TOPIK PELATIHAN",
    ACHIEVEMENT: "KETERANGAN KELULUSAN PELATIHAN",
  };
  const defaultSubtitle = KIND_SUBTITLE[String(program.certKind)] ?? "KETERANGAN SELESAI TOPIK PELATIHAN";

  // Coordinates positioning from JSON config or default layout
  const positions = certConfig.positions || {
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

  return (
    <>
      <Navbar minimal ctaHref="/program" ctaLabel="Ikut Kelas Lain" />

      <section className="section" style={{ minHeight: "80vh", background: "var(--bg-warm)", padding: "2rem 0 4rem" }}>
        <div className="container cert-premium-container">
          
          <div className="section-head center no-print" style={{ marginBottom: "2rem" }}>
            <span className="kicker center">✓ Terverifikasi Resmi</span>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>e-Sertifikat Resmi</h1>
            <p className="lead" style={{ margin: ".8rem auto 0" }}>
              Tercatat resmi di sistem verifikasi Jetschool Academy dengan nomor <b>{cert.number}</b>.
            </p>
          </div>

          {/* MAIN CERTIFICATE SHEET (A4 Portrait aspect ratio, padding 0 for complete absolute control) */}
          <div className="cert-scroll-wrapper">
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
              overflow: "hidden"
            }}
          >
            {/* Default border frame if no background image is configured */}
            {!certBgUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: "15px",
                  border: "2px solid var(--purple)",
                  pointerEvents: "none",
                  boxSizing: "border-box"
                }}
              />
            )}
            {!certBgUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: "20px",
                  border: "1px dashed var(--line)",
                  pointerEvents: "none",
                  boxSizing: "border-box"
                }}
              />
            )}

            {/* 1. Official Logo Header */}
            <div
              style={{
                position: "absolute",
                left: `${positions.logo.x}%`,
                top: `${positions.logo.y}%`,
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: ".2rem",
                zIndex: 2
              }}
            >
              <Image src="/iconjetschool academy.png" alt="Jetschool Academy" width={48} height={48} style={{ objectFit: "contain" }} />
              <div style={{ fontSize: ".75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", fontFamily: "sans-serif" }}>
                Jetschool <span style={{ color: "var(--purple)" }}>Academy</span>
              </div>
            </div>

            {/* 2. Main Title */}
            <h2
              style={{
                position: "absolute",
                left: `${positions.title.x}%`,
                top: `${positions.title.y}%`,
                transform: "translate(-50%, -50%)",
                width: "90%",
                fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
                margin: "0",
                fontWeight: 900,
                letterSpacing: ".25em",
                textTransform: "uppercase",
                color: "var(--purple)",
                fontFamily: "sans-serif",
                textAlign: "center",
                zIndex: 2
              }}
            >
              {certConfig.title || "SERTIFIKAT"}
            </h2>

            {/* 3. Subtitle */}
            <div
              style={{
                position: "absolute",
                left: `${positions.subtitle.x}%`,
                top: `${positions.subtitle.y}%`,
                transform: "translate(-50%, -50%)",
                width: "80%",
                fontSize: "clamp(.55rem, 1.5vw, .75rem)",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 700,
                fontFamily: "sans-serif",
                borderBottom: "2px solid #1B1710",
                paddingBottom: ".4rem",
                textAlign: "center",
                zIndex: 2
              }}
            >
              {certConfig.subtitle || defaultSubtitle}
            </div>

            {/* 4. Certificate Number Badge */}
            <div
              style={{
                position: "absolute",
                left: `${positions.number.x}%`,
                top: `${positions.number.y}%`,
                transform: "translate(-50%, -50%)",
                background: "var(--purple)",
                color: "var(--white)",
                padding: ".35rem 2rem",
                borderRadius: "20px",
                fontSize: "clamp(.55rem, 1.5vw, .7rem)",
                fontWeight: 700,
                fontFamily: "sans-serif",
                zIndex: 2,
                boxShadow: "0 2px 8px rgba(108, 92, 231, 0.2)"
              }}
            >
              {numFormatted}
            </div>

            {/* 5. Recipient Name & Institution */}
            <div
              style={{
                position: "absolute",
                left: `${positions.recipient.x}%`,
                top: `${positions.recipient.y}%`,
                transform: "translate(-50%, -50%)",
                width: "80%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 2
              }}
            >
              <div style={{ fontSize: "clamp(.65rem, 1.8vw, .8rem)", color: "#555", fontStyle: "italic" }}>
                Diberikan kepada :
              </div>
              <div
                style={{
                  fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
                  fontWeight: 800,
                  color: "var(--purple)",
                  borderBottom: "1px dashed var(--purple)",
                  paddingBottom: ".2rem",
                  margin: ".5rem 0 .2rem",
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontFamily: "Georgia, serif"
                }}
              >
                {cert.registration.name}
              </div>
              {cert.registration.institution && (
                <div
                  style={{
                    fontSize: "clamp(.75rem, 2vw, 1rem)",
                    fontWeight: 700,
                    color: "#333",
                    textAlign: "center"
                  }}
                >
                  {cert.registration.institution}
                </div>
              )}
            </div>

            {/* 6. Description Text */}
            <p
              style={{
                position: "absolute",
                left: `${positions.description.x}%`,
                top: `${positions.description.y}%`,
                transform: "translate(-50%, -50%)",
                width: "84%",
                fontSize: "clamp(.62rem, 1.6vw, .78rem)",
                color: "#333",
                textAlign: "center",
                lineHeight: 1.6,
                margin: "0",
                fontFamily: "Georgia, serif",
                zIndex: 2
              }}
            >
              {descResolved}
            </p>

            {/* 7. Syllabus Table */}
            <div
              style={{
                position: "absolute",
                left: `${positions.table.x}%`,
                top: `${positions.table.y}%`,
                transform: "translate(-50%, -50%)",
                width: "86%",
                zIndex: 2
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(.55rem, 1.5vw, .7rem)", fontFamily: "sans-serif" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    <th style={{ borderBottom: "1.5px solid #ccc", padding: ".5rem .3rem", textAlign: "center", width: "8%" }}>No</th>
                    <th style={{ borderBottom: "1.5px solid #ccc", padding: ".5rem .3rem", textAlign: "left" }}>Materi Pelatihan</th>
                    <th style={{ borderBottom: "1.5px solid #ccc", padding: ".5rem .3rem", textAlign: "center", width: "15%" }}>Teori</th>
                    <th style={{ borderBottom: "1.5px solid #ccc", padding: ".5rem .3rem", textAlign: "center", width: "15%" }}>Tugas</th>
                    <th style={{ borderBottom: "1.5px solid #ccc", padding: ".5rem .3rem", textAlign: "center", width: "15%" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {materiJp.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ borderBottom: "1px solid #eee", padding: ".45rem .3rem", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: ".45rem .3rem", textAlign: "left", fontWeight: 600 }}>{m.materi}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: ".45rem .3rem", textAlign: "center" }}>{m.teori} JP</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: ".45rem .3rem", textAlign: "center" }}>{m.tugas} JP</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: ".45rem .3rem", textAlign: "center", fontWeight: 700 }}>{m.teori + m.tugas} JP</td>
                    </tr>
                  ))}
                  <tr style={{ background: "rgba(0,0,0,0.015)" }}>
                    <td colSpan={2} style={{ padding: ".5rem .3rem", fontWeight: 800, textAlign: "right" }}>Jumlah Total JP</td>
                    <td colSpan={3} style={{ padding: ".5rem .3rem", fontWeight: 900, textAlign: "center", color: "var(--purple)", fontSize: "clamp(.62rem, 1.8vw, .8rem)" }}>
                      {totalJp} JP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 8. Issued Location & Date */}
            <div
              style={{
                position: "absolute",
                left: `${positions.placeDate.x}%`,
                top: `${positions.placeDate.y}%`,
                transform: "translate(-50%, -50%)",
                fontSize: "clamp(.62rem, 1.8vw, .75rem)",
                fontWeight: 700,
                color: "#444",
                fontFamily: "sans-serif",
                zIndex: 2
              }}
            >
              {certConfig.placeDate ? certConfig.placeDate.replace(/\[date\]/g, issuedDate) : `Pangandaran, ${issuedDate}`}
            </div>

            {/* 9. Signatures, Stamp & QR Area */}
            <div
              style={{
                position: "absolute",
                left: `${positions.signatures.x}%`,
                top: `${positions.signatures.y}%`,
                transform: "translate(-50%, -50%)",
                width: "86%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 2
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "sans-serif",
                  fontSize: "clamp(.55rem, 1.5vw, .7rem)",
                  position: "relative"
                }}
              >
                {/* Signature 1 (Narasumber / Mentor) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "35%" }}>
                  <div style={{ height: "45px", position: "relative", marginBottom: ".3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s1Img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s1Img} alt="Signature 1" style={{ maxHeight: "45px", objectFit: "contain" }} />
                    ) : (
                      <div style={{ height: "45px" }} />
                    )}
                  </div>
                  <b style={{ textDecoration: "underline", color: "#1B1710" }}>{s1Name}</b>
                  <span style={{ color: "#555", fontSize: "clamp(.48rem, 1.3vw, .62rem)", marginTop: ".1rem" }}>{s1Role}</span>
                </div>

                {/* QR Verification (Middle) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "22%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Verification QR" style={{ width: "64px", height: "64px", border: "1px solid #eee", background: "#fff" }} />
                  <span style={{ fontSize: "clamp(.42rem, 1.2vw, .55rem)", marginTop: ".3rem", color: "#666", fontWeight: 700 }}>
                    ID: {cert.number}
                  </span>
                </div>

                {/* Signature 2 (Direktur Najib) + Stamp */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "35%", position: "relative" }}>
                  {/* Stamp overlay */}
                  {stImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stImg}
                      alt="Official Stamp"
                      style={{
                        position: "absolute",
                        height: "64px",
                        width: "64px",
                        objectFit: "contain",
                        left: "15px",
                        top: "-25px",
                        opacity: 0.85,
                        pointerEvents: "none",
                        zIndex: 3
                      }}
                    />
                  )}

                  <div style={{ height: "45px", position: "relative", marginBottom: ".3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s2Img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s2Img} alt="Signature 2" style={{ maxHeight: "45px", objectFit: "contain" }} />
                    ) : (
                      <div style={{ height: "45px" }} />
                    )}
                  </div>
                  <b style={{ textDecoration: "underline", color: "#1B1710" }}>{s2Name}</b>
                  <span style={{ color: "#555", fontSize: "clamp(.48rem, 1.3vw, .62rem)", marginTop: ".1rem" }}>{s2Role}</span>
                </div>
              </div>

              {/* PMM / Kemendikbud Komunitas Badge */}
              {showPmm && (
                <div
                  style={{
                    width: "100%",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "6px",
                    padding: ".4rem .8rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: ".5rem",
                    marginTop: "1.2rem",
                    boxSizing: "border-box"
                  }}
                >
                  <span style={{ color: "#10B981", fontWeight: 900, fontSize: ".8rem" }}>✓</span>
                  <span style={{ color: "#065F46", fontWeight: 700, fontSize: "clamp(.5rem, 1.5vw, .68rem)", fontFamily: "sans-serif" }}>
                    Registered on Komunitas Platform Merdeka Mengajar (PMM)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Action Buttons (Hide when printing) */}
          <div className="no-print" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}>
            <PrintButton />
            <Link className="btn" href="/program">Ikut Kelas Berikutnya</Link>
          </div>
          <p className="reg-note no-print" style={{ textAlign: "center", marginTop: "1rem" }}>
            Simpan sebagai PDF: klik &ldquo;Cetak / Simpan PDF&rdquo; lalu pilih tujuan &ldquo;Simpan sebagai PDF&rdquo; (Save as PDF).
          </p>

        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
