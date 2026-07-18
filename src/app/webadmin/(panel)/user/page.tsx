import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveUser, deleteUser } from "../../actions";

export const dynamic = "force-dynamic";

interface UserItem {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  createdAt: Date;
}

export default async function AdminUserList({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; e?: string; ok?: string; deleted?: string; role?: string }>;
}) {
  const { id, e, ok, deleted, role: roleFilter } = await searchParams;

  // Query conditions
  const whereClause: { role?: string } = {};
  if (roleFilter && ["ADMIN", "TEACHER", "STUDENT"].includes(roleFilter)) {
    whereClause.role = roleFilter;
  }

  // Fetch all users matching filters
  const users = await prisma.user.findMany({
    where: whereClause as any,
    orderBy: { createdAt: "desc" },
  }) as UserItem[];

  // If editing, fetch the specific user
  const editUser = id
    ? await prisma.user.findUnique({ where: { id } })
    : null;

  return (
    <>
      <div className="adm-head">
        <h1>Manajemen User</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/webadmin/user" className={`btn btn-sm ${!roleFilter ? "btn-purple" : ""}`}>
            Semua
          </Link>
          <Link href="/webadmin/user?role=ADMIN" className={`btn btn-sm ${roleFilter === "ADMIN" ? "btn-purple" : ""}`}>
            Admin
          </Link>
          <Link href="/webadmin/user?role=TEACHER" className={`btn btn-sm ${roleFilter === "TEACHER" ? "btn-purple" : ""}`}>
            Pengajar
          </Link>
          <Link href="/webadmin/user?role=STUDENT" className={`btn btn-sm ${roleFilter === "STUDENT" ? "btn-purple" : ""}`}>
            Peserta
          </Link>
        </div>
      </div>

      {ok === "1" && <div className="adm-alert ok">User berhasil disimpan.</div>}
      {deleted === "1" && <div className="adm-alert ok">User berhasil dihapus.</div>}
      {e === "duplikat" && (
        <div className="adm-alert err">Email atau nomor WhatsApp sudah digunakan oleh user lain.</div>
      )}
      {e === "lengkapi" && <div className="adm-alert err">Nama dan email wajib diisi.</div>}
      {e === "password-wajib" && <div className="adm-alert err">Password wajib diisi untuk Admin/Pengajar baru.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "1.5rem" }}>
        {/* Kolom Kiri: Tabel User */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Role</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: UserItem) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td className="muted">{u.whatsapp || "-"}</td>
                  <td>
                    {u.role === "ADMIN" && <span className="badge r">Admin</span>}
                    {u.role === "TEACHER" && <span className="badge y">Pengajar</span>}
                    {u.role === "STUDENT" && <span className="badge dim">Peserta</span>}
                  </td>
                  <td className="muted" style={{ fontSize: "0.78rem" }}>
                    {new Date(u.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: ".4rem" }}>
                      <Link href={`/webadmin/user?id=${u.id}${roleFilter ? `&role=${roleFilter}` : ""}`} className="btn btn-sm">
                        Edit
                      </Link>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="btn btn-sm btn-danger">
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                    Belum ada user terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kolom Kanan: Form Tambah/Edit */}
        <div>
          <form action={saveUser} className="adm-form" style={{ gridTemplateColumns: "1fr", padding: "1.4rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>
              {editUser ? "Edit User" : "Tambah User Baru"}
            </h3>

            {editUser && <input type="hidden" name="id" value={editUser.id} />}

            <div className="field">
              <label>Nama Lengkap</label>
              <input
                name="name"
                defaultValue={editUser?.name ?? ""}
                placeholder="Nama Lengkap"
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                defaultValue={editUser?.email ?? ""}
                placeholder="nama@email.com"
                required
              />
            </div>

            <div className="field">
              <label>Nomor WhatsApp (opsional)</label>
              <input
                name="whatsapp"
                defaultValue={editUser?.whatsapp ?? ""}
                placeholder="cth: 08123456789"
              />
            </div>

            <div className="field">
              <label>Role / Akses</label>
              <select name="role" defaultValue={editUser?.role ?? "STUDENT"} required style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                <option value="STUDENT">Peserta (Student)</option>
                <option value="TEACHER">Pengajar (Teacher)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="field">
              <label>Password {editUser && "(opsional, isi hanya jika ingin ganti)"}</label>
              <input
                name="password"
                type="password"
                placeholder={editUser ? "•••••••• (kosongkan jika tidak diganti)" : "••••••••"}
                required={!editUser}
              />
              {!editUser && (
                <span className="adm-note">
                  Password digunakan untuk login ke panel. Khusus untuk Peserta (Student), mereka bisa login menggunakan akun Google.
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              {editUser && (
                <Link href="/webadmin/user" className="btn btn-line btn-sm">
                  Batal
                </Link>
              )}
              <button type="submit" className="btn btn-purple btn-sm">
                {editUser ? "Simpan Perubahan" : "Tambah User"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="adm-note" style={{ marginTop: "1.2rem" }}>
        Catatan: User dengan role Administrator dan Pengajar dapat masuk ke panel admin menggunakan email &amp; password yang Anda tentukan di sini.
      </p>
    </>
  );
}
