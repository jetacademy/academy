import ArticleForm from "@/components/ArticleForm";

export default async function AdminArtikelNew({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  return (
    <>
      <div className="adm-head"><h1>Artikel Baru</h1></div>
      {e === "lengkapi" && <div className="adm-alert err">Judul dan ringkasan wajib diisi.</div>}
      {e === "konten" && <div className="adm-alert err">Isi artikel wajib diisi.</div>}
      {e === "slug" && <div className="adm-alert err">Slug tersebut sudah dipakai artikel lain.</div>}
      <ArticleForm />
    </>
  );
}
