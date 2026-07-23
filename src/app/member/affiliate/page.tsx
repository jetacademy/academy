import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import { getAffiliateBalance, getAffiliateSettings } from "@/lib/affiliate";
import { PAYOUT_CHANNELS } from "@/lib/xendit";
import { respondToAffiliateInvite } from "../affiliate-actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AffiliateDashboardClient from "@/components/AffiliateDashboardClient";

export const dynamic = "force-dynamic";

function rupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function MemberAffiliatePage() {
  const sessionVal = await getMemberSession();
  if (!sessionVal) redirect("/member/login");

  const user = await prisma.user.findFirst({ where: { OR: [{ email: sessionVal }, { whatsapp: sessionVal }] } });
  if (!user) redirect("/member");

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return (
    <>
      <Navbar minimal ctaHref="/member" ctaLabel="Dashboard Member" />
      <section className="section" style={{ minHeight: "85vh", background: "var(--bg-panel)", paddingTop: "2.5rem" }}>
        <div className="container" style={{ maxWidth: "50rem", margin: "0 auto" }}>
          <span className="kicker">Program Affiliate</span>
          <h1 style={{ fontSize: "1.8rem", margin: "0.3rem 0 1.4rem" }}>Dashboard Affiliate</h1>

          {!affiliate && (
            <div className="reg-card" style={{ textAlign: "center" }}>
              <h3>Anda belum menjadi affiliate</h3>
              <p className="sub" style={{ margin: "0.6rem 0 1.4rem" }}>
                Affiliate hanya dibuka lewat undangan tim Jetschool Academy. Jika Anda alumni yang aktif mempromosikan dan tertarik bergabung, hubungi kami lewat tiket dukungan.
              </p>
              <Link href="/member/affiliate/tiket" className="btn btn-purple btn-lg btn-block">Hubungi Kami / Buat Tiket</Link>
            </div>
          )}

          {affiliate?.status === "PENDING" && (
            <div className="reg-card" style={{ textAlign: "center" }}>
              <h3>Anda Diundang Menjadi Affiliate! 🤝</h3>
              <p className="sub" style={{ margin: "0.6rem 0 1.4rem" }}>
                Terima undangan untuk mulai mempromosikan program Jetschool Academy dan mendapatkan komisi setiap ada pendaftaran lewat link Anda.
              </p>
              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
                <form action={respondToAffiliateInvite}>
                  <input type="hidden" name="decision" value="accept" />
                  <button type="submit" className="btn btn-purple btn-lg">Terima Undangan</button>
                </form>
                <form action={respondToAffiliateInvite}>
                  <input type="hidden" name="decision" value="decline" />
                  <button type="submit" className="btn btn-line btn-lg">Tolak</button>
                </form>
              </div>
            </div>
          )}

          {affiliate?.status === "SUSPENDED" && (
            <div className="reg-card" style={{ textAlign: "center" }}>
              <h3>Akun Affiliate Anda Sedang Dinonaktifkan</h3>
              <p className="sub" style={{ margin: "0.6rem 0 1.4rem" }}>
                Link referral Anda untuk sementara tidak aktif. Hubungi kami lewat tiket dukungan jika ada pertanyaan.
              </p>
              <Link href="/member/affiliate/tiket" className="btn btn-purple btn-lg btn-block">Buat Tiket</Link>
            </div>
          )}

          {affiliate?.status === "REJECTED" && (
            <div className="reg-card" style={{ textAlign: "center" }}>
              <h3>Anda Sudah Menolak Undangan Affiliate</h3>
              <p className="sub" style={{ margin: "0.6rem 0 1.4rem" }}>
                Jika berubah pikiran, hubungi tim kami lewat tiket dukungan untuk diundang ulang.
              </p>
              <Link href="/member/affiliate/tiket" className="btn btn-line btn-lg btn-block">Buat Tiket</Link>
            </div>
          )}

          {affiliate?.status === "ACTIVE" && (
            <ActiveDashboard affiliateId={affiliate.id} code={affiliate.code} commissionType={affiliate.commissionType} commissionValue={affiliate.commissionValue} discountType={affiliate.discountType} discountValue={affiliate.discountValue} clickCount={affiliate.clickCount} bankName={affiliate.bankName} bankAccountNumber={affiliate.bankAccountNumber} bankAccountName={affiliate.bankAccountName} ewalletChannel={affiliate.ewalletChannel} ewalletNumber={affiliate.ewalletNumber} baseUrl={baseUrl} />
          )}

          {affiliate?.status === "ACTIVE" && (
            <div style={{ textAlign: "center", marginTop: "1.4rem" }}>
              <Link href="/member/affiliate/tiket" className="btn btn-line btn-sm">Butuh bantuan? Buat Tiket Dukungan</Link>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

async function ActiveDashboard({
  affiliateId,
  code,
  commissionType,
  commissionValue,
  discountType,
  discountValue,
  clickCount,
  bankName,
  bankAccountNumber,
  bankAccountName,
  ewalletChannel,
  ewalletNumber,
  baseUrl,
}: {
  affiliateId: string;
  code: string;
  commissionType: "PERCENT" | "FIXED";
  commissionValue: number;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  clickCount: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  ewalletChannel: string | null;
  ewalletNumber: string | null;
  baseUrl: string;
}) {
  const [balance, settings, withdrawals] = await Promise.all([
    getAffiliateBalance(affiliateId),
    getAffiliateSettings(),
    prisma.affiliateWithdrawal.findMany({
      where: { affiliateId },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
  ]);

  const commissionLabel = commissionType === "PERCENT" ? `${commissionValue}%` : rupiah(commissionValue);
  const discountLabel = discountValue === 0 ? "Tanpa potongan" : discountType === "PERCENT" ? `${discountValue}%` : rupiah(discountValue);

  return (
    <AffiliateDashboardClient
      code={code}
      commissionLabel={commissionLabel}
      discountLabel={discountLabel}
      balance={balance}
      clickCount={clickCount}
      minWithdrawal={settings.minWithdrawal}
      payoutChannels={PAYOUT_CHANNELS}
      currentPayout={{ bankName, bankAccountNumber, bankAccountName, ewalletChannel, ewalletNumber }}
      withdrawals={withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount,
        status: w.status,
        requestedAt: w.requestedAt.toISOString(),
        channelCode: w.channelCode,
        accountNumber: w.accountNumber,
      }))}
      referralUrl={`${baseUrl}/?ref=${code}`}
    />
  );
}
