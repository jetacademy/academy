import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrintButton from "@/components/PrintButton";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export const metadata = { title: "e-Sertifikat — Jetschool Academy" };

/** Halaman sertifikat sekaligus verifikasi publik: /sertifikat/JSA-2026-0001 */
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/sertifikat/${cert.number}`;
  // QR mengarah ke halaman ini sendiri — memindai = memverifikasi
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 168,
    color: { dark: "#1B1710", light: "#FFFDF8" },
  });

  const issued = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(cert.issuedAt);

  return (
    <>
      <Navbar minimal ctaHref="/#program" ctaLabel="Ikut Kelas Lain" />

      <section className="section" style={{ minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "52rem" }}>
          <div className="section-head center no-print" style={{ marginBottom: "2.2rem" }}>
            <span className="kicker center">✓ Terverifikasi Resmi</span>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>e-Sertifikat</h1>
            <p className="lead" style={{ margin: ".8rem auto 0" }}>
              Tercatat resmi di sistem Jetschool Academy dengan nomor <b>{cert.number}</b>.
            </p>
          </div>

          <div className="cert">
            <div className="cert-kicker">Sertifikat Kelulusan</div>
            <h3>Jetschool Academy</h3>
            <p style={{ fontSize: ".85rem", color: "var(--ink-faint)", marginTop: "1rem" }}>diberikan kepada</p>
            <div className="cert-name">{cert.registration.name}</div>
            <p style={{ fontSize: ".95rem", color: "var(--ink-soft)" }}>
              atas kelulusannya dalam<br />
              <b>{cert.registration.program.title}</b>
            </p>
            <div className="cert-seal">Resmi ✦</div>
            <div className="cert-foot">
              <span>
                No. {cert.number}<br />
                Diterbitkan {issued}<br />
                Verifikasi: pindai QR →
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qr" src={qrDataUrl} alt={`QR verifikasi ${cert.number}`} />
            </div>
          </div>

          <div className="no-print" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.2rem", flexWrap: "wrap" }}>
            <PrintButton />
            <a className="btn" href="/#program">Ikut Kelas Berikutnya</a>
          </div>
          <p className="reg-note no-print" style={{ textAlign: "center", marginTop: "1rem" }}>
            Simpan sebagai PDF: klik &ldquo;Cetak / Simpan PDF&rdquo; lalu pilih &ldquo;Save as PDF&rdquo;.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
