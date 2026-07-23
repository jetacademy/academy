import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { PAYOUT_CHANNELS } from "@/lib/xendit";
import { rejectWithdrawal, markWithdrawalCompletedManually } from "../../../affiliate-actions";
import ProcessPayoutButton from "@/components/ProcessPayoutButton";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "badge y",
  PROCESSING: "badge y",
  COMPLETED: "badge g",
  REJECTED: "badge r",
  FAILED: "badge r",
};
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Menunggu Diproses",
  PROCESSING: "Diproses Xendit",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak",
  FAILED: "Gagal",
};

function channelLabel(code: string): string {
  return PAYOUT_CHANNELS.find((c) => c.code === code)?.label ?? code;
}

export default async function AdminAffiliateWithdrawals({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  const withdrawals = await prisma.affiliateWithdrawal.findMany({
    include: { affiliate: { include: { user: true } } },
    orderBy: { requestedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <div className="adm-head">
        <h1>Penarikan Komisi Affiliate</h1>
      </div>

      {ok === "ditolak" && <div className="adm-alert ok">Pengajuan penarikan ditolak.</div>}
      {ok === "selesai" && <div className="adm-alert ok">Penarikan ditandai selesai.</div>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Diajukan</th>
              <th>Affiliate</th>
              <th>Jumlah</th>
              <th>Tujuan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td data-label="Diajukan" className="muted" style={{ fontSize: "0.78rem" }}>
                  {new Date(w.requestedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td data-label="Affiliate">
                  <div style={{ fontWeight: 700 }}>{w.affiliate.user.name}</div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>{w.affiliate.code}</div>
                </td>
                <td data-label="Jumlah" style={{ fontWeight: 700 }}>{rupiah(w.amount)}</td>
                <td data-label="Tujuan" className="muted">
                  {channelLabel(w.channelCode)} — {w.accountNumber}
                  <div style={{ fontSize: "0.72rem" }}>a.n. {w.accountHolderName}</div>
                </td>
                <td data-label="Status">
                  <span className={STATUS_BADGE[w.status]}>{STATUS_LABEL[w.status]}</span>
                  {w.status === "FAILED" && w.failureReason && (
                    <div className="muted" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>{w.failureReason}</div>
                  )}
                </td>
                <td data-label="Aksi">
                  {w.status === "REQUESTED" && (
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <ProcessPayoutButton
                        withdrawalId={w.id}
                        amountLabel={rupiah(w.amount)}
                        destinationLabel={`${channelLabel(w.channelCode)} ${w.accountNumber} a.n. ${w.accountHolderName}`}
                      />
                      <form action={rejectWithdrawal}>
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="reason" value="Ditolak admin setelah peninjauan." />
                        <ConfirmButton className="btn btn-sm btn-danger" message={`Tolak pengajuan penarikan ${rupiah(w.amount)} dari ${w.affiliate.user.name}? Dana tidak jadi keluar dan saldo affiliate kembali utuh.`}>
                          Tolak
                        </ConfirmButton>
                      </form>
                    </div>
                  )}
                  {w.status === "PROCESSING" && (
                    <form action={markWithdrawalCompletedManually}>
                      <input type="hidden" name="id" value={w.id} />
                      <ConfirmButton className="btn btn-sm btn-line" message="Tandai selesai secara manual? Gunakan ini HANYA jika Anda sudah memastikan dana benar-benar terkirim (mis. sudah dicek di dashboard Xendit) dan webhook belum masuk.">
                        Tandai Selesai Manual
                      </ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                  Belum ada pengajuan penarikan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="adm-note" style={{ marginTop: "1.2rem" }}>
        &ldquo;Proses via Xendit&rdquo; mentransfer dana sungguhan ke rekening/e-wallet affiliate — pastikan jumlah dan tujuan sudah benar sebelum konfirmasi.
        Jika akun Xendit belum punya izin Payout API, tombol ini akan menampilkan pesan gagal dari Xendit — hubungi Xendit untuk mengaktifkannya.
      </p>
    </>
  );
}
