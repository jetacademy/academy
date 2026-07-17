import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Quiz, { type QuizQuestion } from "@/components/Quiz";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Post-Test — Jetschool Academy" };

export default async function PostTestPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await params;

  let reg = null;
  try {
    reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        program: { include: { questions: { orderBy: { order: "asc" } } } },
        certificate: true,
      },
    });
  } catch {
    return <Blocked title="Database belum terhubung" msg="Hubungi admin untuk menyelesaikan pengaturan sistem." />;
  }

  if (!reg) {
    return <Blocked title="Tautan tidak valid" msg="Data pendaftaran tidak ditemukan. Silakan periksa kembali tautan yang dikirim melalui WhatsApp Anda." />;
  }

  // sudah lulus → langsung arahkan ke sertifikat
  if (reg.certificate) {
    return (
      <Blocked
        title="Anda telah dinyatakan lulus."
        msg="e-Sertifikat Anda sudah terbit dan siap diunduh."
        action={<Link href={`/sertifikat/${reg.certificate.number}`} className="btn btn-purple btn-lg">Lihat Sertifikat</Link>}
      />
    );
  }

  // belum mulai -> tidak boleh post-test
  const isStarted = new Date() >= new Date(reg.program.scheduleAt);
  if (!isStarted) {
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(reg.program.scheduleAt);
    return (
      <Blocked
        title="Evaluasi belum dibuka."
        msg={`Post-Test untuk program ini baru dapat dikerjakan setelah acara dimulai pada tanggal ${formattedDate} WIB.`}
        action={<Link href="/member" className="btn btn-purple btn-lg">Kembali ke Dashboard</Link>}
      />
    );
  }

  // belum bayar → tidak boleh post-test
  if (reg.status === "REGISTERED") {
    return (
      <Blocked
        title="Selesaikan pembayaran terlebih dahulu."
        msg="Evaluasi dapat dikerjakan setelah pembayaran paket sertifikat terkonfirmasi."
        action={<Link href="/sertifikat" className="btn btn-purple btn-lg">Bayar Paket Sertifikat</Link>}
      />
    );
  }

  // jawaban benar TIDAK ikut dikirim ke browser
  const questions: QuizQuestion[] = reg.program.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: [
      { key: "A" as const, label: q.optionA },
      { key: "B" as const, label: q.optionB },
      { key: "C" as const, label: q.optionC },
      { key: "D" as const, label: q.optionD },
    ],
  }));

  return (
    <>
      <Navbar minimal ctaHref="/" ctaLabel="Beranda" />
      <section className="section" style={{ minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "46rem" }}>
          <div className="section-head" style={{ marginBottom: "2rem" }}>
            <span className="kicker">Langkah Terakhir</span>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>Post-Test: {reg.program.title}</h1>
            <p className="lead" style={{ margin: ".8rem auto 0" }}>
              Halo <b>{reg.name}</b>. Silakan jawab {questions.length} soal berikut.
              Skor minimal kelulusan: <b>{reg.program.passingScore}</b>. Setelah lulus, e-sertifikat Anda terbit secara otomatis.
            </p>
          </div>
          {questions.length > 0
            ? <Quiz registrationId={reg.id} questions={questions} />
            : <div className="reg-card" style={{ textAlign: "center" }}><p>Soal belum tersedia. Silakan hubungi admin.</p></div>}
        </div>
      </section>
      <Footer />
    </>
  );
}

function Blocked({ title, msg, action }: { title: string; msg: string; action?: React.ReactNode }) {
  return (
    <>
      <Navbar minimal ctaHref="/" ctaLabel="Beranda" />
      <section className="section" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div className="reg-card" style={{ textAlign: "center" }}>
          <h3>{title}</h3>
          <p className="sub" style={{ margin: ".6rem 0 1.2rem" }}>{msg}</p>
          {action}
        </div>
      </section>
      <Footer />
    </>
  );
}
