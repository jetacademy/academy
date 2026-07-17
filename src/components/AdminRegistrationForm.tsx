import { saveRegistration } from "@/app/webadmin/actions";

type ProgramOption = {
  id: string;
  title: string;
};

type RegistrationRow = {
  id: string;
  programId: string;
  name: string;
  whatsapp: string;
  email: string;
  status: string;
};

export default function AdminRegistrationForm({
  registration,
  programs,
}: {
  registration?: RegistrationRow;
  programs: ProgramOption[];
}) {
  return (
    <form className="adm-form" action={saveRegistration}>
      {registration && <input type="hidden" name="id" value={registration.id} />}

      <div className="field">
        <label>Pilih Program</label>
        <select name="programId" defaultValue={registration?.programId ?? ""} required>
          <option value="" disabled>-- Pilih Program --</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Nama Lengkap (tercetak di sertifikat)</label>
        <input
          name="name"
          defaultValue={registration?.name}
          placeholder="contoh: Budi Santoso, S.Pd."
          required
        />
      </div>

      <div className="field">
        <label>Nomor WhatsApp Aktif</label>
        <input
          name="whatsapp"
          type="tel"
          defaultValue={registration?.whatsapp}
          placeholder="contoh: 081234567890"
          required
        />
      </div>

      <div className="field">
        <label>Email</label>
        <input
          name="email"
          type="email"
          defaultValue={registration?.email}
          placeholder="contoh: budi@gmail.com"
          required
        />
      </div>

      <div className="field">
        <label>Status</label>
        <select name="status" defaultValue={registration?.status ?? "REGISTERED"}>
          <option value="REGISTERED">Terdaftar</option>
          <option value="PAID">Lunas</option>
          <option value="PASSED">Lulus (Berhak Sertifikat)</option>
        </select>
      </div>

      <div className="full" style={{ display: "flex", gap: "1rem", marginTop: ".5rem" }}>
        <button type="submit" className="btn btn-ink">
          {registration ? "Simpan Perubahan" : "Daftar Manual"}
        </button>
      </div>
    </form>
  );
}
