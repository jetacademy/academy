import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import CertCustomizer from "@/components/CertCustomizer";
import ConfirmButton from "@/components/ConfirmButton";
import { toggleCertPublish } from "@/app/webadmin/actions";

export default async function AdminProgramCertPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; issued?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { ok, issued } = await searchParams;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  const published = program.certPublished;

  return (
    <>
      <h2 style={{ fontSize: "1.15rem", margin: "0 0 1rem" }}>Kustomisasi Sertifikat</h2>

      {ok === "published" && (
        <div className="adm-alert ok">
          Sertifikat program ini dipublikasikan ke peserta.
          {issued && Number(issued) > 0
            ? ` ${issued} peserta yang sudah memenuhi syarat langsung diterbitkan sertifikatnya.`
            : " Belum ada peserta yang memenuhi syarat saat ini — sertifikat akan otomatis terbit begitu mereka menyelesaikan LMS."}
        </div>
      )}
      {ok === "unpublished" && (
        <div className="adm-alert warn">
          Rilis sertifikat program ini dibatalkan. Sertifikat baru tidak akan terbit ke peserta sampai dipublikasikan lagi — sertifikat yang sudah terbit sebelumnya tidak terpengaruh.
        </div>
      )}

      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem",
          background: published ? "var(--white)" : "#FFF8E1",
          border: `1px solid ${published ? "var(--line)" : "#F0C000"}`,
          borderRadius: "var(--r-md)", padding: "1rem 1.2rem", marginBottom: "1.5rem",
        }}
      >
        <div>
          <strong>Status Rilis: {published ? "Dipublikasikan ke Peserta" : "Draf / Belum Dipublikasikan"}</strong>
          <p className="muted" style={{ margin: ".3rem 0 0", fontSize: "0.82rem", maxWidth: "38rem" }}>
            {published
              ? "Peserta yang menyelesaikan LMS akan otomatis mendapat sertifikat dengan desain ini. Ubah desain lagi kapan pun — perubahan langsung berlaku untuk sertifikat baru."
              : "Sertifikat program ini TIDAK akan terbit ke peserta walau mereka sudah 100% menyelesaikan LMS. Uji dulu desainnya di pratinjau sebelah kanan, lalu publikasikan kalau sudah sesuai."}
          </p>
        </div>
        <form action={toggleCertPublish}>
          <input type="hidden" name="id" value={program.id} />
          <ConfirmButton
            className={`btn btn-sm ${published ? "btn-danger" : "btn-purple"}`}
            message={
              published
                ? "Batalkan publikasi sertifikat program ini? Sertifikat baru tidak akan terbit ke peserta sampai dipublikasikan lagi. Sertifikat yang sudah terbit sebelumnya tidak akan dihapus."
                : "Publikasikan sertifikat program ini ke peserta? Peserta yang sudah memenuhi syarat kelulusan akan LANGSUNG mendapat sertifikat begitu Anda konfirmasi. Pastikan desain sudah diuji dan benar."
            }
          >
            {published ? "Batalkan Publikasi" : "Publikasikan ke Peserta"}
          </ConfirmButton>
        </form>
      </div>

      <CertCustomizer program={program} />
    </>
  );
}
