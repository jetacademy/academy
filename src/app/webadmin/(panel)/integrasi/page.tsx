import { ensureApiKey } from "../../actions";
import ApiIntegrationClient from "@/components/ApiIntegrationClient";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "https://academy.jetschool.id";

export default async function IntegrasiPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const apiKey = await ensureApiKey();
  const apiUrl = `${SITE_URL}/api/v1/programs`;

  return (
    <>
      <div className="adm-head">
        <h1>Integrasi API</h1>
      </div>

      {ok === "1" && <div className="adm-alert ok">API key baru berhasil dibuat.</div>}

      <p className="adm-note" style={{ marginBottom: "1.2rem" }}>
        Endpoint ini menyajikan katalog lengkap program aktif (deskripsi, harga, jadwal, batch) dalam format JSON
        untuk dikonsumsi sistem luar seperti Hermes agent marketing. Selain baca, tersedia juga endpoint tulis
        untuk membuat/mengubah artikel, program, dan batch — misalnya lewat Hermes/agent AI. Setiap permintaan
        wajib menyertakan header <code> X-API-Key</code>.
      </p>

      <ApiIntegrationClient apiUrl={apiUrl} apiKey={apiKey} siteUrl={SITE_URL} />
    </>
  );
}
