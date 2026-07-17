import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import { memberLogout } from "./actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { rupiah, formatJadwal } from "@/lib/format";
import { Registration, Program, Payment, Certificate } from "@prisma/client";

interface LocalLmsModule {
  id: string;
  programId: string;
  title: string;
  order: number;
}

type RegistrationWithDetails = Registration & {
  program: Program & {
    modules?: LocalLmsModule[];
  };
  payment: Payment | null;
  certificate: Certificate | null;
};

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const sessionVal = await getMemberSession();
  if (!sessionVal) {
    redirect("/member/login");
  }

  // Ambil data pendaftaran milik user ini (berdasarkan email atau whatsapp)
  const queryOptions = {
    where: {
      OR: [
        { email: sessionVal },
        { whatsapp: sessionVal },
      ],
    },
    include: {
      program: {
        include: {
          modules: {
            take: 1
          }
        }
      },
      payment: true,
      certificate: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  };

  const registrations = (await (prisma.registration.findMany as unknown as (args: unknown) => Promise<unknown>)(queryOptions)) as unknown as RegistrationWithDetails[];

  const memberName = registrations[0]?.name ?? "Superadmin";
  const isSuperadmin = sessionVal.toLowerCase() === "jetschool.id@gmail.com";

  return (
    <>
      <Navbar minimal ctaHref="/#program" ctaLabel="Cari Pelatihan Baru" />

      <section className="section" style={{ minHeight: "85vh", background: "var(--bg-panel)", paddingTop: "2.5rem" }}>
        <div className="container">
          {/* Superadmin Quick Access Banner */}
          {isSuperadmin && (
            <div className="reveal in" style={{
              background: "linear-gradient(135deg, var(--purple) 0%, #a29bfe 100%)",
              color: "#fff",
              padding: "1.5rem 2rem",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow)",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: "#fff" }}>⚡ Mode Superadmin Aktif</h3>
                <p style={{ margin: ".2rem 0 0 0", fontSize: ".85rem", opacity: 0.9 }}>
                  Anda masuk menggunakan email superadmin <b>jetschool.id@gmail.com</b>. Anda memiliki akses penuh ke panel pengelolaan.
                </p>
              </div>
              <Link href="/webadmin" className="btn btn-sm" style={{ background: "#fff", color: "var(--purple)", fontWeight: 700 }}>
                Masuk Panel Admin ↗
              </Link>
            </div>
          )}

          {/* Header Dashboard */}
          <div className="reveal in" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.2rem",
            marginBottom: "2.5rem",
            background: "var(--white)",
            padding: "1.5rem 2rem",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow)"
          }}>
            <div>
              <span className="kicker" style={{ marginBottom: "0.2rem" }}>Selamat Datang</span>
              <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Halo, <span className="acc-p">{memberName}</span> 👋</h1>
              {registrations[0] && (registrations[0] as any).institution && (
                <div style={{ fontSize: "0.85rem", color: "var(--purple)", marginTop: "0.2rem", fontWeight: 600 }}>
                  🏫 {(registrations[0] as any).institution}
                </div>
              )}
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0.4rem 0 0" }}>
                Gunakan dashboard ini untuk mengakses semua benefit, materi, dan sertifikat pelatihan Anda.
              </p>
            </div>
            <div>
              <form action={memberLogout}>
                <button type="submit" className="btn btn-line btn-sm">Keluar Akun</button>
              </form>
            </div>
          </div>

          <h2 style={{ fontSize: "1.3rem", marginBottom: "1.2rem", fontWeight: 800 }}>Program Pelatihan Saya</h2>

          {registrations.length === 0 ? (
            <div className="reveal in" style={{
              background: "var(--white)",
              padding: "3.5rem 2rem",
              textAlign: "center",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow)",
              maxWidth: "36rem",
              margin: "0 auto"
            }}>
              <span style={{ fontSize: "3rem" }}>🎓</span>
              <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Belum Ada Program</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", marginBottom: "1.8rem" }}>
                Anda belum terdaftar pada program pelatihan apa pun saat ini.
              </p>
              <Link href="/#program" className="btn btn-purple btn-lg">Cari Pelatihan Sekarang</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1.5rem" }}>
              {registrations.map((reg) => {
                const prog = reg.program;
                const pay = reg.payment;
                const cert = reg.certificate;

                // Tentukan warna badge status
                let statusBadge = <span className="badge">Terdaftar</span>;
                if (reg.status === "PAID") {
                  statusBadge = <span className="badge g">Lunas</span>;
                } else if (reg.status === "PASSED") {
                  statusBadge = <span className="badge g">Lulus & Sertifikat Terbit</span>;
                } else if (pay && pay.status === "PENDING") {
                  statusBadge = <span className="badge y">Menunggu Pembayaran</span>;
                }

                return (
                  <div key={reg.id} className="reveal in" style={{
                    background: "var(--white)",
                    borderRadius: "var(--r-md)",
                    boxShadow: "var(--shadow)",
                    padding: "1.8rem",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "1.5rem",
                    alignItems: "center"
                  }}>
                    {/* Sisi Kiri: Detail Program & Status */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
                        <span className={`type-tag ${
                          prog.type === "WEBINAR" ? "type-webinar" :
                          prog.type === "KELAS" ? "type-kelas" :
                          prog.type === "WORKSHOP" ? "type-workshop" : "type-bootcamp"
                        }`} style={{ letterSpacing: "0.05em", padding: "0.3em 0.8em" }}>
                          {prog.type}
                        </span>
                        {statusBadge}
                      </div>

                      <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", fontWeight: 800 }}>{prog.title}</h3>
                      <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", margin: "0 0 1rem 0" }}>{prog.tagline}</p>

                      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                        <div>📅 <strong>Jadwal:</strong> {formatJadwal(prog.scheduleAt)}</div>
                        <div>👤 <strong>Mentor:</strong> {prog.mentorName}</div>
                        <div>⏱️ <strong>Durasi:</strong> {prog.durationLabel}</div>
                      </div>
                    </div>

                    {/* Sisi Kanan: Tombol Aksi Kontekstual */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "12rem" }}>
                      {/* Kasus 1: Belum lunas pada program berbayar */}
                      {reg.status === "REGISTERED" && prog.price > 0 && pay && (
                        <>
                          <a href={pay.invoiceUrl ?? "/sertifikat"} target="_blank" rel="noopener noreferrer" className="btn btn-purple btn-block" style={{ textAlign: "center" }}>
                            Bayar Sekarang ({rupiah(pay.amount)})
                          </a>
                          <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", textAlign: "center", display: "block" }}>
                            Gunakan link di atas untuk membayar lewat Xendit.
                          </span>
                        </>
                      )}

                      {/* Kasus 2: Webinar gratis tetapi belum klaim sertifikat (sertifikat berbayar) */}
                      {reg.status === "REGISTERED" && prog.price === 0 && (
                        <>
                          {/* Tombol ke post-test atau grup webinar gratis */}
                          {prog.waGroupLink && (
                            <a href={prog.waGroupLink} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-block" style={{ textAlign: "center" }}>
                              Gabung Grup WA Pelatihan
                            </a>
                          )}
                          {prog.zoomLink && (
                            <a href={prog.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn-ink btn-block" style={{ textAlign: "center" }}>
                              Masuk Link Zoom Live
                            </a>
                          )}
                          {new Date() >= new Date(prog.scheduleAt) ? (
                            <Link href={`/sertifikat?slug=${prog.slug}&email=${reg.email}`} className="btn btn-purple btn-block" style={{ textAlign: "center" }}>
                              Klaim Sertifikat ({rupiah(prog.certPrice)})
                            </Link>
                          ) : (
                            <button className="btn btn-block" disabled style={{ background: "var(--border)", color: "var(--ink-faint)", cursor: "not-allowed", textAlign: "center" }}>
                              Klaim Sertifikat (Belum Dimulai)
                            </button>
                          )}
                        </>
                      )}

                      {/* Kasus 3: Sudah lunas (PAID), boleh ikuti post-test */}
                      {reg.status === "PAID" && (
                        <>
                          {prog.zoomLink && (
                            <a href={prog.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-block" style={{ textAlign: "center" }}>
                              Masuk Link Zoom Live
                            </a>
                          )}
                          {prog.modules && prog.modules.length > 0 ? (
                            <Link href={`/member/lms/${reg.id}`} className="btn btn-ink btn-block" style={{ textAlign: "center" }}>
                              Akses LMS Interaktif
                            </Link>
                          ) : prog.lmsLink ? (
                            <a href={prog.lmsLink} target="_blank" rel="noopener noreferrer" className="btn btn-ink btn-block" style={{ textAlign: "center" }}>
                              Akses Materi LMS
                            </a>
                          ) : null}
                          {new Date() >= new Date(prog.scheduleAt) ? (
                            <Link href={`/post-test/${reg.id}`} className="btn btn-purple btn-block" style={{ textAlign: "center" }}>
                              Mulai Kerjakan Post-Test
                            </Link>
                          ) : (
                            <button className="btn btn-block" disabled style={{ background: "var(--border)", color: "var(--ink-faint)", cursor: "not-allowed", textAlign: "center" }}>
                              Post-Test (Belum Dimulai)
                            </button>
                          )}
                        </>
                      )}

                      {/* Kasus 4: Sudah lulus post-test (PASSED), tampilkan sertifikat */}
                      {reg.status === "PASSED" && cert && (
                        <>
                          <Link href={`/sertifikat/${cert.number}`} target="_blank" className="btn btn-purple btn-block" style={{ textAlign: "center" }}>
                            Unduh e-Sertifikat
                          </Link>
                          {prog.modules && prog.modules.length > 0 ? (
                            <Link href={`/member/lms/${reg.id}`} className="btn btn-line btn-block" style={{ textAlign: "center" }}>
                              Akses LMS Interaktif
                            </Link>
                          ) : prog.lmsLink ? (
                            <a href={prog.lmsLink} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-block" style={{ textAlign: "center" }}>
                              Akses Rekaman LMS
                            </a>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
