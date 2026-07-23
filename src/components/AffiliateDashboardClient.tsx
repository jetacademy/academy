"use client";

import { useState } from "react";
import { updateMyAffiliateCode, updateMyPayoutInfo, requestWithdrawal } from "@/app/member/affiliate-actions";

type PayoutChannel = { code: string; label: string; group: "Bank" | "E-Wallet" };

type WithdrawalItem = {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  channelCode: string;
  accountNumber: string;
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Menunggu Diproses",
  PROCESSING: "Sedang Diproses",
  COMPLETED: "Selesai",
  REJECTED: "Ditolak",
  FAILED: "Gagal",
};

function rupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function AffiliateDashboardClient({
  code,
  commissionLabel,
  discountLabel,
  balance,
  clickCount,
  minWithdrawal,
  payoutChannels,
  currentPayout,
  withdrawals,
  referralUrl,
}: {
  code: string;
  commissionLabel: string;
  discountLabel: string;
  balance: { withdrawableNow: number; pendingTotal: number; totalWithdrawn: number; totalEarned: number };
  clickCount: number;
  minWithdrawal: number;
  payoutChannels: PayoutChannel[];
  currentPayout: { bankName: string | null; bankAccountNumber: string | null; bankAccountName: string | null; ewalletChannel: string | null; ewalletNumber: string | null };
  withdrawals: WithdrawalItem[];
  referralUrl: string;
}) {
  const [codeVal, setCodeVal] = useState(code);
  const [codeMsg, setCodeMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [codePending, setCodePending] = useState(false);

  const [copied, setCopied] = useState(false);

  const defaultChannel = currentPayout.ewalletChannel || currentPayout.bankName || payoutChannels[0]?.code || "";
  const defaultAccountNumber = currentPayout.ewalletNumber || currentPayout.bankAccountNumber || "";
  const defaultAccountHolder = currentPayout.bankAccountName || "";

  const [payoutChannel, setPayoutChannel] = useState(defaultChannel);
  const [payoutNumber, setPayoutNumber] = useState(defaultAccountNumber);
  const [payoutHolder, setPayoutHolder] = useState(defaultAccountHolder);
  const [payoutMsg, setPayoutMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [payoutPending, setPayoutPending] = useState(false);

  const [amountVal, setAmountVal] = useState("");
  const [wdMsg, setWdMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [wdPending, setWdPending] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // abaikan — browser lama tanpa Clipboard API
    }
  }

  async function handleSaveCode(e: React.FormEvent) {
    e.preventDefault();
    setCodePending(true);
    setCodeMsg(null);
    const fd = new FormData();
    fd.set("code", codeVal);
    const res = await updateMyAffiliateCode(fd);
    setCodePending(false);
    setCodeMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: "Kode berhasil diperbarui." });
  }

  async function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    setPayoutPending(true);
    setPayoutMsg(null);
    const fd = new FormData();
    const isEwallet = payoutChannels.find((c) => c.code === payoutChannel)?.group === "E-Wallet";
    if (isEwallet) {
      fd.set("ewalletChannel", payoutChannel);
      fd.set("ewalletNumber", payoutNumber);
      fd.set("bankAccountName", payoutHolder);
    } else {
      fd.set("bankName", payoutChannel);
      fd.set("bankAccountNumber", payoutNumber);
      fd.set("bankAccountName", payoutHolder);
    }
    const res = await updateMyPayoutInfo(fd);
    setPayoutPending(false);
    setPayoutMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: "Info pencairan tersimpan." });
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWdPending(true);
    setWdMsg(null);
    const fd = new FormData();
    fd.set("amount", amountVal);
    fd.set("channelCode", payoutChannel);
    fd.set("accountNumber", payoutNumber);
    fd.set("accountHolderName", payoutHolder);
    const res = await requestWithdrawal(fd);
    setWdPending(false);
    if (res.error) {
      setWdMsg({ ok: false, text: res.error });
    } else {
      setWdMsg({ ok: true, text: "Pengajuan penarikan terkirim — menunggu diproses admin." });
      setAmountVal("");
      window.location.reload();
    }
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Ringkasan saldo */}
      <div className="member-header-card reveal in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "1rem" }}>
        <div>
          <span className="kicker">Bisa Ditarik</span>
          <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{rupiah(balance.withdrawableNow)}</div>
        </div>
        <div>
          <span className="kicker">Masa Tahan</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{rupiah(balance.pendingTotal)}</div>
        </div>
        <div>
          <span className="kicker">Sudah Dicairkan</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{rupiah(balance.totalWithdrawn)}</div>
        </div>
        <div>
          <span className="kicker">Klik Link Referral</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{clickCount}</div>
        </div>
      </div>

      {/* Link referral */}
      <div className="member-program-card reveal in" style={{ display: "block" }}>
        <h3 style={{ marginTop: 0 }}>Link &amp; Kode Referral Anda</h3>
        <p className="sub">Komisi Anda: <strong>{commissionLabel}</strong> per transaksi. Pembeli yang pakai link/kode ini dapat potongan: <strong>{discountLabel}</strong>.</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", margin: "0.8rem 0" }}>
          <code style={{ background: "var(--chip)", padding: "0.5rem 0.8rem", borderRadius: "8px", fontSize: "0.85rem", wordBreak: "break-all" }}>{referralUrl}</code>
          <button type="button" className="btn btn-sm btn-purple" onClick={handleCopy}>{copied ? "Tersalin!" : "Salin Link"}</button>
        </div>

        <form onSubmit={handleSaveCode} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end", marginTop: "1rem" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Ganti Kode Referral</label>
            <input
              value={codeVal}
              onChange={(e) => setCodeVal(e.target.value.toUpperCase())}
              style={{ textTransform: "uppercase", fontFamily: "monospace" }}
            />
          </div>
          <button type="submit" className="btn btn-sm" disabled={codePending}>{codePending ? "Menyimpan..." : "Simpan Kode"}</button>
        </form>
        {codeMsg && <p className={codeMsg.ok ? "form-success" : "form-error"} style={{ marginTop: "0.5rem" }}>{codeMsg.text}</p>}
      </div>

      {/* Info pencairan + penarikan */}
      <div className="member-program-card reveal in" style={{ display: "block" }}>
        <h3 style={{ marginTop: 0 }}>Tujuan Pencairan</h3>
        <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", marginBottom: "1rem" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Bank / E-Wallet</label>
            <select value={payoutChannel} onChange={(e) => setPayoutChannel(e.target.value)}>
              <optgroup label="Bank">
                {payoutChannels.filter((c) => c.group === "Bank").map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </optgroup>
              <optgroup label="E-Wallet">
                {payoutChannels.filter((c) => c.group === "E-Wallet").map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Nomor Rekening / HP</label>
            <input value={payoutNumber} onChange={(e) => setPayoutNumber(e.target.value)} placeholder="cth: 1234567890" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Nama Pemilik</label>
            <input value={payoutHolder} onChange={(e) => setPayoutHolder(e.target.value)} placeholder="Sesuai buku rekening/akun" />
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-line" disabled={payoutPending} onClick={handleSavePayout}>
          {payoutPending ? "Menyimpan..." : "Simpan Tujuan Pencairan"}
        </button>
        {payoutMsg && <p className={payoutMsg.ok ? "form-success" : "form-error"} style={{ marginTop: "0.5rem" }}>{payoutMsg.text}</p>}

        <hr style={{ margin: "1.4rem 0", border: 0, borderTop: "1px solid var(--line)" }} />

        <h3 style={{ marginTop: 0 }}>Ajukan Penarikan</h3>
        <p className="sub">Minimal penarikan: {rupiah(minWithdrawal)}. Pastikan tujuan pencairan di atas sudah benar sebelum mengajukan.</p>
        <form onSubmit={handleWithdraw} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Jumlah (Rp)</label>
            <input
              value={amountVal}
              onChange={(e) => setAmountVal(e.target.value)}
              inputMode="numeric"
              placeholder={String(balance.withdrawableNow)}
            />
          </div>
          <button type="submit" className="btn btn-sm btn-purple" disabled={wdPending || balance.withdrawableNow < minWithdrawal}>
            {wdPending ? "Mengirim..." : "Ajukan Penarikan"}
          </button>
        </form>
        {balance.withdrawableNow < minWithdrawal && (
          <p className="sub" style={{ marginTop: "0.5rem" }}>Saldo yang bisa ditarik belum mencapai minimal penarikan.</p>
        )}
        {wdMsg && <p className={wdMsg.ok ? "form-success" : "form-error"} style={{ marginTop: "0.5rem" }}>{wdMsg.text}</p>}
      </div>

      {/* Histori penarikan */}
      <div className="member-program-card reveal in" style={{ display: "block" }}>
        <h3 style={{ marginTop: 0 }}>Histori Penarikan</h3>
        {withdrawals.length === 0 ? (
          <p className="sub">Belum ada pengajuan penarikan.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {withdrawals.map((w) => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--line)", fontSize: "0.85rem" }}>
                <span>{new Date(w.requestedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <span style={{ fontWeight: 700 }}>{rupiah(w.amount)}</span>
                <span>{STATUS_LABEL[w.status] ?? w.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
