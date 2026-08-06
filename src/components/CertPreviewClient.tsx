"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import CertificateSheet from "@/components/CertificateSheet";
import DownloadCertButton from "@/components/DownloadCertButton";
import type { CertConfig, CertMateriJp } from "@/lib/types";

const noopSubscribe = () => () => {};

/** Baca draft sesi (belum disimpan) untuk program ini. null di server & sebelum hydration selesai. */
function useDraftRaw(programId: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(`certDraft:${programId}`),
    () => null
  );
}

type ProgramData = {
  id: string;
  title: string;
  certKind: string;
  materi: string[];
  certBgUrl: string | null;
  certConfig: unknown;
};

const KIND_SUBTITLE: Record<string, string> = {
  PARTICIPATION: "KETERANGAN KEIKUTSERTAAN PELATIHAN",
  COMPLETION: "KETERANGAN SELESAI TOPIK PELATIHAN",
  ACHIEVEMENT: "KETERANGAN KELULUSAN PELATIHAN",
};

export default function CertPreviewClient({ program }: { program: ProgramData }) {
  const draftRaw = useDraftRaw(program.id);

  let bgUrl = program.certBgUrl || "";
  let config: CertConfig = (program.certConfig as CertConfig) || {};
  let isDraft = false;
  if (draftRaw) {
    try {
      const parsed = JSON.parse(draftRaw);
      bgUrl = parsed.bgUrl || "";
      config = parsed.config || {};
      isDraft = true;
    } catch {
      // draf rusak/tidak valid — pakai template tersimpan terakhir
    }
  }

  const defaultSubtitle = KIND_SUBTITLE[program.certKind] ?? "KETERANGAN SELESAI TOPIK PELATIHAN";

  const previewDesc = (
    config.description ||
    "Sebagai peserta dalam pelatihan nasional yang diadakan oleh PT Jetschool Academy Indonesia dengan tema: \"{title}\" yang dilaksanakan pada {date}."
  )
    .replace(/{title}/g, program.title)
    .replace(/{name}/g, "Syntia Bella, S.Pd.")
    .replace(/{date}/g, "02 Agustus 2026")
    .replace(/{institution}/g, "SMP Negeri 234 Yogyakarta");

  const previewNum = (config.numberFormat || "NOMOR : 2500/JSA-GP/[serial]/[month]/[year]")
    .replace(/\[serial\]/g, "0042")
    .replace(/\[month\]/g, "VIII")
    .replace(/\[year\]/g, "2026");

  const previewPlaceDate = (config.placeDate || "Bekasi, [date]").replace(/\[date\]/g, "02 Agustus 2026");

  const configMateriJp: CertMateriJp[] = Array.isArray(config.materiJp) ? config.materiJp : [];
  const materiJp: CertMateriJp[] =
    configMateriJp.length > 0
      ? configMateriJp.map((r) => ({ materi: r.materi, teori: Number(r.teori) || 0, tugas: Number(r.tugas) || 0 }))
      : program.materi.map((m) => ({ materi: m, teori: 5, tugas: 3 }));
  const totalJp = materiJp.reduce((acc, r) => acc + r.teori + r.tugas, 0);

  return (
    <section style={{ padding: "1rem 0 3rem" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".8rem", marginBottom: "1.2rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Pratinjau Sertifikat (Uji Coba)</h2>
          <p className="muted" style={{ margin: ".3rem 0 0", fontSize: ".82rem" }}>
            {isDraft
              ? "Menampilkan draf yang belum disimpan, dengan data contoh (bukan peserta asli). Klik “Download Sertifikat (PNG)” untuk lihat hasilnya."
              : "Belum ada draf aktif di tab ini — menampilkan template tersimpan terakhir dengan data contoh."}
          </p>
        </div>
        <Link href={`/webadmin/program/${program.id}/cert`} className="btn btn-sm">Kembali ke Editor</Link>
      </div>

      <div className="cert-scroll-wrapper">
        <CertificateSheet
          certBgUrl={bgUrl || undefined}
          certConfig={config}
          accentColor={config.accentColor || "#232176"}
          title={config.title || "SERTIFIKAT"}
          subtitle={config.subtitle || defaultSubtitle}
          numFormatted={previewNum}
          recipientName="Syntia Bella, S.Pd."
          recipientInstitution="SMP Negeri 234 Yogyakarta"
          descResolved={previewDesc}
          materiJp={materiJp}
          totalJp={totalJp}
          placeDateResolved={previewPlaceDate}
          qrIdLabel="JSA-0042"
          s2Name={config.sign2Name || "Najib"}
          s2Role={config.sign2Role || "Direktur PT Jetschool Academy Indonesia"}
          s2Img={config.sign2Img || undefined}
          stampImg={config.stampImg || undefined}
        />
      </div>

      <div className="no-print" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
        <DownloadCertButton fileName={`sertifikat-uji-coba-${program.id}`} />
      </div>
    </section>
  );
}
