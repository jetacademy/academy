import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteArticle } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminArtikelList({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; deleted?: string }>;
}) {
  const { ok, deleted } = await searchParams;

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="adm-head">
        <h1>Artikel</h1>
        <Link href="/webadmin/artikel/new" className="btn btn-yellow btn-sm">+ Artikel Baru</Link>
      </div>

      {ok === "1" && <div className="adm-alert ok">Artikel berhasil disimpan.</div>}
      {deleted === "1" && <div className="adm-alert ok">Artikel dihapus.</div>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Judul</th><th>Penulis</th><th>Status</th><th>Diperbarui</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td data-label="Judul">
                  <Link href={`/webadmin/artikel/${a.id}`} style={{ fontWeight: 600 }}>{a.title}</Link>
                  <div className="muted">/artikel/{a.slug}</div>
                </td>
                <td data-label="Penulis" className="muted">{a.authorName}</td>
                <td data-label="Status">
                  {a.isPublished ? <span className="badge g">Terbit</span> : <span className="badge dim">Draf</span>}
                </td>
                <td data-label="Diperbarui" className="muted">
                  {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(a.updatedAt)}
                </td>
                <td data-label="Aksi">
                  <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                    <Link href={`/webadmin/artikel/${a.id}`} className="btn btn-sm">Edit</Link>
                    {a.isPublished && (
                      <a href={`/artikel/${a.slug}`} target="_blank" className="btn btn-sm">Lihat ↗</a>
                    )}
                    <form action={deleteArticle}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn btn-sm btn-danger">Hapus</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && <tr><td colSpan={5} className="muted">Belum ada artikel.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
