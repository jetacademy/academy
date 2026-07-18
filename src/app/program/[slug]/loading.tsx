import { CardSkeleton } from "@/components/LoadingSkeleton";

export default function ProgramLoading() {
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
        <div
          style={{
            maxWidth: "1120px",
            width: "94%",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
            <div
              className="skel"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
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
          <div
            className="skel"
            style={{
              width: "7rem",
              height: "2.2rem",
              borderRadius: "999px",
              background: "var(--purple)",
            }}
          />
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="hero">
        <div
          className="container"
          style={{ maxWidth: "1120px", width: "94%", margin: "0 auto" }}
        >
          <div
            className="skel"
            style={{
              background: "var(--white)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow)",
              padding: "clamp(2rem, 4vw, 3rem)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(2rem, 4vw, 3.2rem)",
              alignItems: "center",
              minHeight: "360px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                className="skel"
                style={{
                  width: "6rem",
                  height: "1.4rem",
                  borderRadius: "999px",
                  background: "var(--chip)",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "90%",
                  height: "2.4rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "75%",
                  height: "2.4rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                  animationDelay: ".2s",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "80%",
                  height: "0.85rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                  animationDelay: ".4s",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="skel"
                style={{
                  width: "min(70%, 320px)",
                  aspectRatio: "1.5",
                  borderRadius: "var(--r-md)",
                  background: "var(--chip)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Description & CTA bar skeleton */}
      <section
        className="section-sm"
        style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
      >
        <div
          className="container"
          style={{ maxWidth: "1120px", width: "94%", margin: "0 auto" }}
        >
          <div
            className="skel"
            style={{
              background: "var(--white)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow)",
              padding: "clamp(1.4rem, 3.5vw, 2.4rem)",
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "2rem",
              minHeight: "200px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div
                className="skel"
                style={{
                  width: "8rem",
                  height: "0.9rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "100%",
                  height: "0.75rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "100%",
                  height: "0.75rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "80%",
                  height: "0.75rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
                justifyContent: "center",
              }}
            >
              <div
                className="skel"
                style={{
                  width: "100%",
                  height: "3rem",
                  borderRadius: "999px",
                  background: "var(--purple)",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "60%",
                  height: "0.7rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                  alignSelf: "center",
                }}
              />
              <div
                className="skel"
                style={{
                  width: "80%",
                  height: "0.7rem",
                  borderRadius: "var(--r-sm)",
                  background: "var(--chip)",
                  alignSelf: "center",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Two-column value cards */}
      <section className="section">
        <div
          className="container"
          style={{ maxWidth: "1120px", width: "94%", margin: "0 auto" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: "clamp(1.2rem, 2.5vw, 2rem)",
            }}
          >
            <CardSkeleton />
            <CardSkeleton />
          </div>
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
