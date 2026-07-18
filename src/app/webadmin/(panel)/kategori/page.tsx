import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveCategory, deleteCategory } from "../../actions";

export const dynamic = "force-dynamic";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  _count: {
    programs: number;
  };
}

export default async function AdminCategoryList({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; e?: string; ok?: string; deleted?: string }>;
}) {
  const { id, e, ok, deleted } = await searchParams;

  // Fetch all categories with program counts
  const categories = await (prisma as any).category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { programs: true } } },
  }) as CategoryWithCount[];

  // If editing, fetch the specific category
  const editCategory = id
    ? await (prisma as any).category.findUnique({ where: { id } })
    : null;

  return (
    <>
      <div className="adm-head">
        <h1>Kategori Program</h1>
      </div>

      {ok === "1" && <div className="adm-alert ok">Kategori berhasil disimpan.</div>}
      {deleted === "1" && <div className="adm-alert ok">Kategori berhasil dihapus.</div>}
      {e === "slug" && (
        <div className="adm-alert err">Slug sudah digunakan oleh kategori lain. Gunakan slug yang berbeda.</div>
      )}
      {e === "lengkapi" && <div className="adm-alert err">Nama kategori wajib diisi.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "1.5rem" }}>
        {/* Kolom Kiri: Tabel Kategori */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nama Kategori</th>
                <th>Slug</th>
                <th>Unggulan</th>
                <th>Jumlah Program</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: CategoryWithCount) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="muted">/{c.slug}</td>
                  <td>
                    {c.isFeatured ? (
                      <span className="badge y">Unggulan</span>
                    ) : (
                      <span className="badge dim">Biasa</span>
                    )}
                  </td>
                  <td>{c._count.programs} program</td>
                  <td>
                    <div style={{ display: "flex", gap: ".4rem" }}>
                      <Link href={`/webadmin/kategori?id=${c.id}`} className="btn btn-sm">
                        Edit
                      </Link>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="btn btn-sm btn-danger">
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                    Belum ada kategori.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kolom Kanan: Form Tambah/Edit */}
        <div>
          <form action={saveCategory} className="adm-form" style={{ gridTemplateColumns: "1fr", padding: "1.4rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>
              {editCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h3>

            {editCategory && <input type="hidden" name="id" value={editCategory.id} />}

            <div className="field">
              <label>Nama Kategori</label>
              <input
                name="name"
                defaultValue={editCategory?.name ?? ""}
                placeholder="cth: Teknologi & AI"
                required
              />
            </div>

            <div className="field">
              <label>Slug URL (opsional)</label>
              <input
                name="slug"
                defaultValue={editCategory?.slug ?? ""}
                placeholder="cth: teknologi-ai"
              />
              <span className="adm-note">
                Biarkan kosong untuk otomatis membuat slug dari nama. Hanya huruf kecil, angka, dan tanda hubung.
              </span>
            </div>

            <div className="field" style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: "0.5rem 0 1rem" }}>
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={editCategory?.isFeatured ?? false}
                style={{ width: "auto" }}
                id="fFeatured"
              />
              <label htmlFor="fFeatured" style={{ margin: 0, cursor: "pointer" }}>
                Jadikan Kategori Unggulan
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              {editCategory && (
                <Link href="/webadmin/kategori" className="btn btn-line btn-sm">
                  Batal
                </Link>
              )}
              <button type="submit" className="btn btn-purple btn-sm">
                {editCategory ? "Simpan Perubahan" : "Tambah Kategori"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="adm-note" style={{ marginTop: "1.2rem" }}>
        Catatan: Menghapus kategori tidak akan menghapus program di dalamnya. Program-program tersebut akan otomatis dikembalikan ke status &ldquo;Tanpa Kategori&rdquo;.
      </p>
    </>
  );
}
