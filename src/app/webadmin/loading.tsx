import { AdminDashboardSkeleton } from "@/components/LoadingSkeleton";

export default function WebadminLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #F5F4F6)" }}>
      {/* Admin top nav skeleton */}
      <header
        className="skel"
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            width: "94%",
            margin: "0 auto",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
            <div
              className="skel"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--purple)",
              }}
            />
            <div
              className="skel"
              style={{
                width: "8rem",
                height: "1rem",
                borderRadius: "var(--r-sm)",
                background: "var(--ink-faint)",
              }}
            />
          </div>
          {/* Tabs skeleton */}
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skel"
                style={{
                  width: "4rem",
                  height: "0.85rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                  animationDelay: `${(i * 0.1).toFixed(1)}s`,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.7rem" }}>
            <div
              className="skel"
              style={{
                width: "7rem",
                height: "2.2rem",
                borderRadius: "999px",
                background: "var(--ink)",
              }}
            />
            <div
              className="skel"
              style={{
                width: "5rem",
                height: "2.2rem",
                borderRadius: "999px",
                background: "var(--red, #E5484D)",
              }}
            />
          </div>
        </div>
      </header>

      <main
        className="container adm-main"
        style={{
          maxWidth: "1120px",
          width: "94%",
          margin: "0 auto",
          paddingTop: "2rem",
        }}
      >
        <AdminDashboardSkeleton />
      </main>

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
