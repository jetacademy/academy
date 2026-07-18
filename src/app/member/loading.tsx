import { MemberDashboardSkeleton } from "@/components/LoadingSkeleton";

export default function MemberLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #F5F4F6)",
      }}
    >
      {/* Minimal nav skeleton */}
      <div
        className="skel"
        style={{
          height: "74px",
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          padding: "0 clamp(1rem, 3vw, 2rem)",
        }}
      >
        <div style={{ maxWidth: "1120px", width: "94%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
            <div className="skel" style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--purple)" }} />
            <div className="skel" style={{ width: "8rem", height: "1rem", borderRadius: "var(--r-sm)", background: "var(--ink-faint)" }} />
          </div>
          <div className="skel" style={{ width: "6rem", height: "2.2rem", borderRadius: "999px", background: "var(--ink)" }} />
        </div>
      </div>

      <section className="section" style={{ minHeight: "85vh", paddingTop: "2.5rem" }}>
        <div className="container" style={{ maxWidth: "1120px", width: "94%", margin: "0 auto" }}>
          <MemberDashboardSkeleton />
        </div>
      </section>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .skel { animation: skeleton-pulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
