import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";
import CheckoutForm from "@/components/CheckoutForm";
import { getPrograms } from "@/lib/programs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambil Sertifikat — Jetschool Academy",
  description: "Klaim e-sertifikat resmi Anda: selesaikan pembayaran dan evaluasi singkat, sertifikat terbit otomatis.",
};

export default async function SertifikatPage() {
  const { programs } = await getPrograms();
  // halaman ini untuk klaim sertifikat webinar gratis (tripwire).
  // program berbayar sudah otomatis dapat link post-test setelah bayar.
  const claimable = programs.filter((p) => p.price === 0);
  const list = claimable.length > 0 ? claimable : programs;

  return (
    <>
      <Navbar minimal ctaHref="/#program" ctaLabel="Lihat Program" />

      <section className="section" style={{ minHeight: "72vh" }}>
        <div className="container">
          <div className="section-head center" style={{ marginBottom: "2.2rem" }}>
            <span className="kicker center">Khusus Peserta</span>
            <h1 style={{ fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)" }}>Klaim e-Sertifikat <span className="acc-p">Resmi</span> Anda</h1>
            <p className="lead" style={{ margin: ".9rem auto 0" }}>
              Selesaikan pembayaran dan evaluasi singkat — e-sertifikat terverifikasi terbit otomatis atas nama Anda.
            </p>
          </div>
          <CheckoutForm programs={list.map((p) => ({ slug: p.slug, title: p.title, certPrice: p.certPrice }))} />
        </div>
      </section>

      <Footer />
      <WaFloat text="Halo admin, saya mau tanya soal pengambilan sertifikat" />
    </>
  );
}
