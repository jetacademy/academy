import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleForm from "@/components/ArticleForm";

export default async function AdminArtikelEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const { e } = await searchParams;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <>
      <div className="adm-head"><h1>Edit Artikel</h1></div>
      {e === "lengkapi" && <div className="adm-alert err">Judul dan ringkasan wajib diisi.</div>}
      {e === "konten" && <div className="adm-alert err">Isi artikel wajib diisi.</div>}
      {e === "slug" && <div className="adm-alert err">Slug tersebut sudah dipakai artikel lain.</div>}
      <ArticleForm article={article} />
    </>
  );
}
