import { saveArticle } from "@/app/webadmin/actions";
import ThumbnailUploader from "@/components/ThumbnailUploader";
import RichTextEditor from "@/components/RichTextEditor";

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  authorName: string;
  isPublished: boolean;
};

export default function ArticleForm({ article }: { article?: ArticleRow }) {
  return (
    <form action={saveArticle}>
      {article && <input type="hidden" name="id" value={article.id} />}

      <section className="form-section">
        <header>
          <h3>1. Informasi Dasar</h3>
          <p>Judul, alamat halaman, dan penulis artikel.</p>
        </header>
        <div className="fs-body">
          <div className="field">
            <label>Judul Artikel</label>
            <input name="title" defaultValue={article?.title ?? ""} placeholder="cth: 5 Cara AI Membantu Guru Menyusun RPP" required />
          </div>
          <div className="field">
            <label>Slug URL</label>
            <input name="slug" defaultValue={article?.slug ?? ""} placeholder="Kosongkan = otomatis dari judul" />
            <span className="adm-note">Menjadi alamat halaman: /artikel/<b>slug</b>.</span>
          </div>
          <div className="field">
            <label>Nama Penulis</label>
            <input name="authorName" defaultValue={article?.authorName ?? "Tim Jetschool Academy"} />
          </div>
          <div className="field full" style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <input type="checkbox" name="isPublished" defaultChecked={article?.isPublished ?? false} style={{ width: "auto" }} id="fPublished" />
            <label htmlFor="fPublished" style={{ margin: 0, fontWeight: 700, cursor: "pointer" }}>Publikasikan (tampil di /artikel)</label>
          </div>
        </div>
      </section>

      <section className="form-section">
        <header>
          <h3>2. Konten</h3>
          <p>Ringkasan tampil di kartu daftar artikel & sebagai meta description SEO.</p>
        </header>
        <div className="fs-body" style={{ gridTemplateColumns: "1fr" }}>
          <ThumbnailUploader name="coverImageUrl" defaultValue={article?.coverImageUrl ?? ""} />
          <div className="field">
            <label>Ringkasan</label>
            <textarea name="excerpt" defaultValue={article?.excerpt ?? ""} rows={2} placeholder="Ringkasan singkat 1-2 kalimat…" required />
          </div>
          <div className="field">
            <label>Isi Artikel</label>
            <RichTextEditor name="content" defaultValue={article?.content ?? ""} minHeight="20rem" placeholder="Tulis isi artikel di sini…" />
          </div>
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: ".4rem" }}>
        <button type="submit" className="btn btn-purple">{article ? "Simpan Perubahan" : "Buat Artikel"}</button>
      </div>
    </form>
  );
}
