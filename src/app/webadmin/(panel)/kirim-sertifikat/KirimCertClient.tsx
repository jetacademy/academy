"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { importOfflineRecipients, sendOfflineCert } from "../../offline-cert-actions";

type ProgramOption = {
  id: string;
  title: string;
  slug: string;
  certBgUrl: string | null;
  certConfig: unknown;
};

type RecentCert = {
  id: string;
  number: string;
  issuedAt: Date;
  sentWaAt: Date | null;
  sentEmailAt: Date | null;
  registration: { name: string; whatsapp: string; email: string; program: { title: string } };
};

type Row = { name: string; whatsapp: string; email: string };

const fmtDate = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(d)
    : null;

export default function KirimCertClient({
  programs,
  recentCerts,
}: {
  programs: ProgramOption[];
  recentCerts: RecentCert[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);

  const selectedProgram = programs.find((p) => p.id === programId);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        const parsed: Row[] = json.map((raw) => {
          const keys = Object.keys(raw);
          const nameKey = keys.find((k) => /nama|name/i.test(k)) ?? keys[0];
          const waKey = keys.find((k) => /wa|whatsapp|phone|no.?hp|telp/i.test(k)) ?? keys[1] ?? "";
          const emailKey = keys.find((k) => /email|e-?mail/i.test(k)) ?? keys[2] ?? "";
          return {
            name: String(raw[nameKey] ?? "").trim(),
            whatsapp: String(waKey ? raw[waKey] ?? "" : "").trim(),
            email: String(emailKey ? raw[emailKey] ?? "" : "").trim(),
          };
        });
        setRows(parsed.filter((r) => r.name));
      } catch (err) {
        alert("Gagal membaca file: " + (err instanceof Error ? err.message : "format tidak dikenal"));
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {/* STEP 1 — Pilih program + upload */}
      <div className="adm-card" style={{ padding: "1.2rem 1.4rem" }}>
        <h2 style={{ margin: "0 0 .8rem", fontSize: "1.1rem" }}>
          1️⃣ Pilih Program &amp; Upload Excel
        </h2>
        <p className="muted" style={{ margin: "0 0 1rem", fontSize: ".85rem" }}>
          Desain sertifikat mengikuti program yang dipilih (atur di menu{" "}
          <Link href="/webadmin/program" style={{ color: "var(--accent)" }}>
            Program → tab Sertifikat
          </Link>
          ). Kolom Excel otomatis dideteksi: <b>Nama</b>, <b>WhatsApp</b>, <b>Email</b>.
        </p>

        <label style={{ display: "block", marginBottom: ".6rem", fontSize: ".85rem", fontWeight: 600 }}>
          Program / Desain Sertifikat
        </label>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="input"
          style={{ maxWidth: 420 }}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.slug})
            </option>
          ))}
        </select>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <button type="button" className="btn" style={{ marginTop: "1rem" }} onClick={() => fileRef.current?.click()}>
          {fileName ? `📄 ${fileName}` : "⬆️ Pilih File Excel (.xlsx / .csv)"}
        </button>

        {rows.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: ".85rem", margin: "0 0 .5rem" }}>
              <b>{rows.length}</b> baris terdeteksi — preview:
            </p>
            <div className="tbl-wrap" style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="tbl" style={{ fontSize: ".8rem" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama</th>
                    <th>WhatsApp</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 30).map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.name}</td>
                      <td>{r.whatsapp || "—"}</td>
                      <td>{r.email || "—"}</td>
                    </tr>
                  ))}
                  {rows.length > 30 && (
                    <tr><td colSpan={4} className="muted">… dan {rows.length - 30} lainnya</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <form
              action={importOfflineRecipients}
              onSubmit={() => setPending(true)}
              style={{ marginTop: "1rem" }}
            >
              <input type="hidden" name="programId" value={programId} />
              <input type="hidden" name="recipients" value={JSON.stringify(rows)} />
              <button className="btn btn-purple" disabled={pending || !selectedProgram}>
                {pending ? "Menerbitkan sertifikat…" : `🚀 Terbitkan ${rows.length} Sertifikat`}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* STEP 2 — Daftar sertifikat + kirim manual */}
      <div className="adm-card" style={{ padding: "1.2rem 1.4rem" }}>
        <h2 style={{ margin: "0 0 .8rem", fontSize: "1.1rem" }}>
          2️⃣ Sertifikat Terbaru — Kirim Manual
        </h2>
        <p className="muted" style={{ margin: "0 0 1rem", fontSize: ".85rem" }}>
          Kirim link + QR via WhatsApp atau email per penerima. Status <b>Terkirim</b> muncul setelah berhasil.
        </p>

        <div className="tbl-wrap">
          <table className="tbl" style={{ fontSize: ".82rem" }}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Program</th>
                <th>Nomor</th>
                <th>Status WA</th>
                <th>Status Email</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recentCerts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.registration.name}</b>
                    <div className="muted" style={{ fontSize: ".75rem" }}>
                      {c.registration.whatsapp} · {c.registration.email}
                    </div>
                  </td>
                  <td className="muted">{c.registration.program.title}</td>
                  <td>
                    <a href={`/sertifikat/${c.number}`} target="_blank" style={{ color: "var(--accent)" }}>
                      {c.number} ↗
                    </a>
                  </td>
                  <td>
                    {c.sentWaAt ? (
                      <span className="adm-alert ok" style={{ padding: ".2rem .6rem", fontSize: ".75rem", display: "inline-block" }}>
                        ✅ {fmtDate(c.sentWaAt)}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {c.sentEmailAt ? (
                      <span className="adm-alert ok" style={{ padding: ".2rem .6rem", fontSize: ".75rem", display: "inline-block" }}>
                        ✅ {fmtDate(c.sentEmailAt)}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <form action={sendOfflineCert}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="via" value="wa" />
                        <input type="hidden" name="back" value="/webadmin/kirim-sertifikat" />
                        <button className="btn btn-sm" style={{ background: "#25D366", borderColor: "#25D366", color: "#fff" }}>
                          Kirim WA
                        </button>
                      </form>
                      <form action={sendOfflineCert}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="via" value="email" />
                        <input type="hidden" name="back" value="/webadmin/kirim-sertifikat" />
                        <button className="btn btn-sm" style={{ background: "#232176", borderColor: "#232176", color: "#fff" }}>
                          Kirim Email
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {recentCerts.length === 0 && (
                <tr><td colSpan={6} className="muted">Belum ada sertifikat. Upload Excel di atas untuk mulai.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
