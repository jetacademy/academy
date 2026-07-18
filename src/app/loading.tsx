export default function RootLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #F5F4F6)",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem 1rem",
      }}
    >
      <div className="container" style={{ maxWidth: "1120px", margin: "0 auto", width: "94%" }}>
        {/* Hero skeleton */}
        <div
          style={{
            background: "var(--white)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow)",
            padding: "clamp(2rem, 4vw, 3rem) clamp(1.6rem, 4vw, 3rem)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(2rem, 4vw, 3.2rem)",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div className="skel" style={{ width: "12rem", height: "1.6rem", borderRadius: "999px", background: "var(--chip)" }} />
            <div className="skel" style={{ width: "90%", height: "2.6rem", borderRadius: "var(--r-sm)", background: "var(--chip)" }} />
            <div className="skel" style={{ width: "70%", height: "2.6rem", borderRadius: "var(--r-sm)", background: "var(--chip)", animationDelay: ".2s" }} />
            <div className="skel" style={{ width: "85%", height: "0.9rem", borderRadius: "var(--r-sm)", background: "var(--chip)", animationDelay: ".4s" }} />
            <div className="skel" style={{ width: "60%", height: "0.9rem", borderRadius: "var(--r-sm)", background: "var(--chip)", animationDelay: ".6s" }} />
            <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.6rem" }}>
              <div className="skel" style={{ width: "9rem", height: "3rem", borderRadius: "999px", background: "var(--chip)" }} />
              <div className="skel" style={{ width: "9rem", height: "3rem", borderRadius: "999px", background: "var(--chip)", animationDelay: ".2s" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="skel" style={{ width: "min(78%, 380px)", aspectRatio: "1", borderRadius: "50%", background: "var(--chip)" }} />
          </div>
        </div>

        {/* Program grid section */}
        <div style={{ marginTop: "2rem" }}>
          <div className="skel" style={{ width: "14rem", height: "1.4rem", borderRadius: "var(--r-sm)", background: "var(--ink-faint)", marginBottom: "1.4rem", animationDelay: ".3s" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.2rem" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel" style={{
                background: "var(--white)",
                borderRadius: "var(--r-lg)",
                padding: "1.4rem",
                boxShadow: "var(--shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
                animationDelay: `${(i * 0.15).toFixed(1)}s`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="skel" style={{ width: "4.5rem", height: "1.4rem", borderRadius: "999px", background: "var(--chip)" }} />
                  <div className="skel" style={{ width: "2.2rem", height: "2.2rem", borderRadius: "50%", background: "var(--chip)" }} />
                </div>
                <div className="skel" style={{ width: "90%", height: "1.1rem", borderRadius: "var(--r-sm)", background: "var(--chip)" }} />
                <div className="skel" style={{ width: "70%", height: "0.75rem", borderRadius: "var(--r-sm)", background: "var(--chip)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

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
