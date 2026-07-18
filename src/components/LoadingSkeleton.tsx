/* ============================================================
   LoadingSkeleton — Pulse-animated placeholders
   Matches bento design system (--purple, --orange, --bg, --r-lg)
   ============================================================ */

/** Pulse animation keyframe style (injected once via CSS-in-JS fallback) */
const pulseKeyframes = `
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.skel { animation: skeleton-pulse 1.5s ease-in-out infinite; }
.skel-del-1 { animation-delay: .2s; }
.skel-del-2 { animation-delay: .4s; }
.skel-del-3 { animation-delay: .6s; }
`;

function injectSkeletonStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("skel-styles")) return;
  const style = document.createElement("style");
  style.id = "skel-styles";
  style.textContent = pulseKeyframes;
  document.head.appendChild(style);
}

/* ---------- Reusable skeleton atoms ---------- */

function SkelBlock({
  width,
  height,
  radius,
  delay,
  style,
}: {
  width?: string;
  height?: string;
  radius?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skel ${delay ? `skel-del-${delay}` : ""}`}
      style={{
        width: width ?? "100%",
        height: height ?? "1rem",
        borderRadius: radius ?? "var(--r-sm)",
        background: "var(--chip)",
        ...style,
      }}
    />
  );
}

function SkelCircle({ size, delay }: { size?: string; delay?: number }) {
  return (
    <div
      className={`skel ${delay ? `skel-del-${delay}` : ""}`}
      style={{
        width: size ?? "2.5rem",
        height: size ?? "2.5rem",
        borderRadius: "50%",
        background: "var(--chip)",
        flexShrink: 0,
      }}
    />
  );
}

/* ---------- Public skeleton components ---------- */

/** A single bento-card-shaped skeleton placeholder */
export function CardSkeleton({
  height,
  variant = "default",
}: {
  height?: string;
  variant?: "default" | "purple" | "orange";
}) {
  const bgMap = {
    default: "var(--white)",
    purple: "var(--purple-soft)",
    orange: "var(--orange-soft)",
  };
  return (
    <div
      className="skel"
      style={{
        background: bgMap[variant],
        borderRadius: "var(--r-lg)",
        padding: "clamp(1.4rem, 3.5vw, 2.4rem)",
        boxShadow: variant === "default" ? "var(--shadow)" : "none",
        height: height ?? "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <SkelBlock width="40%" height="0.75rem" radius="999px" delay={1} />
      <SkelBlock width="85%" height="1.5rem" delay={2} />
      <SkelBlock width="65%" height="0.85rem" delay={3} />
      <SkelBlock width="50%" height="0.85rem" delay={1} />
      <div style={{ marginTop: "auto", display: "flex", gap: "0.6rem" }}>
        <SkelBlock width="6rem" height="2.6rem" radius="999px" delay={2} />
        <SkelBlock width="6rem" height="2.6rem" radius="999px" delay={3} />
      </div>
    </div>
  );
}

/** A list/table skeleton with multiple rows */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="skel"
      style={{
        background: "var(--white)",
        borderRadius: "var(--r-lg)",
        padding: "clamp(1.4rem, 3.5vw, 2.4rem)",
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", gap: "1rem", paddingBottom: "0.8rem", borderBottom: "1px solid var(--line)" }}>
        <SkelBlock width="30%" height="0.8rem" delay={1} />
        <SkelBlock width="20%" height="0.8rem" delay={2} />
        <SkelBlock width="25%" height="0.8rem" delay={3} />
        <SkelBlock width="15%" height="0.8rem" delay={1} />
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <SkelBlock width="30%" height="0.75rem" delay={((i % 3) + 1) as 1 | 2 | 3} />
          <SkelBlock width="20%" height="0.75rem" delay={((i + 1) % 3 + 1) as 1 | 2 | 3} />
          <SkelBlock width="25%" height="0.75rem" delay={((i + 2) % 3 + 1) as 1 | 2 | 3} />
          <SkelBlock width="15%" height="1.6rem" radius="999px" delay={((i + 3) % 3 + 1) as 1 | 2 | 3} />
        </div>
      ))}
    </div>
  );
}

/** Grid of program card skeletons (homepage) */
export function ProgramGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.2rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skel"
          style={{
            background: "var(--white)",
            borderRadius: "var(--r-lg)",
            padding: "1.4rem",
            boxShadow: "var(--shadow)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <SkelBlock width="4.5rem" height="1.4rem" radius="999px" delay={1} />
            <SkelCircle size="2.2rem" delay={2} />
          </div>
          <SkelBlock width="90%" height="1.1rem" delay={3} />
          <SkelBlock width="70%" height="0.75rem" delay={1} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
            <SkelBlock width="5rem" height="1.2rem" delay={2} />
            <SkelCircle size="2.2rem" delay={3} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** LMS sidebar loading skeleton */
export function LmsSidebarSkeleton() {
  const modules = [1, 2, 3];
  const lessonsPerMod = [2, 3, 2];
  return (
    <div
      className="skel"
      style={{
        background: "var(--white)",
        borderRadius: "var(--r-lg)",
        padding: "1.4rem",
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        gap: "1.4rem",
      }}
    >
      <div>
        <SkelBlock width="60%" height="1rem" delay={1} />
        <SkelBlock width="40%" height="0.75rem" delay={2} style={{ marginTop: "0.3rem" }} />
      </div>
      {modules.map((mod, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <SkelBlock width="30%" height="0.65rem" radius="999px" delay={((i % 3) + 1) as 1 | 2 | 3} />
          <SkelBlock width="75%" height="0.85rem" delay={((i + 1) % 3 + 1) as 1 | 2 | 3} />
          {Array.from({ length: lessonsPerMod[i] }).map((_, j) => (
            <div key={j} style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginLeft: "0.8rem" }}>
              <div
                className={`skel skel-del-${((i + j) % 3) + 1}`}
                style={{
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  background: "var(--chip)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <SkelBlock width="85%" height="0.7rem" delay={((i + j) % 3 + 1) as 1 | 2 | 3} />
                <SkelBlock width="50%" height="0.6rem" delay={((i + j + 1) % 3 + 1) as 1 | 2 | 3} style={{ marginTop: "0.2rem" }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Certificate page skeleton */
export function CertSkeleton() {
  return (
    <div
      className="skel"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
        padding: "2rem",
      }}
    >
      {/* Certificate preview */}
      <div
        style={{
          width: "min(100%, 42rem)",
          aspectRatio: "1.414",
          background: "var(--white)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.2rem",
        }}
      >
        <SkelCircle size="3rem" delay={1} />
        <SkelBlock width="50%" height="1.8rem" delay={2} />
        <SkelBlock width="70%" height="1rem" delay={3} />
        <SkelBlock width="55%" height="0.85rem" delay={1} />
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.8rem" }}>
          <SkelBlock width="8rem" height="2.4rem" radius="999px" delay={2} />
          <SkelBlock width="8rem" height="2.4rem" radius="999px" delay={3} />
        </div>
      </div>
      {/* Verification info */}
      <div
        style={{
          width: "min(100%, 32rem)",
          background: "var(--white)",
          borderRadius: "var(--r-lg)",
          padding: "1.4rem",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
        }}
      >
        <SkelBlock width="40%" height="0.85rem" delay={1} />
        <SkelBlock width="60%" height="0.75rem" delay={2} />
        <SkelBlock width="35%" height="0.75rem" delay={3} />
      </div>
    </div>
  );
}

/** Hero skeleton for the homepage */
export function HeroSkeleton() {
  return (
    <div
      className="skel"
      style={{
        background: "var(--white)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow)",
        padding: "clamp(2rem, 4vw, 3rem) clamp(1.6rem, 4vw, 3rem)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(2rem, 4vw, 3.2rem)",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {/* Kicker */}
        <SkelBlock width="12rem" height="1.6rem" radius="999px" delay={1} />
        {/* Title */}
        <SkelBlock width="90%" height="2.6rem" delay={2} />
        <SkelBlock width="70%" height="2.6rem" delay={3} />
        {/* Lead */}
        <SkelBlock width="85%" height="0.9rem" delay={1} />
        <SkelBlock width="60%" height="0.9rem" delay={2} />
        {/* CTA buttons */}
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.6rem" }}>
          <SkelBlock width="9rem" height="3rem" radius="999px" delay={3} />
          <SkelBlock width="9rem" height="3rem" radius="999px" delay={1} />
        </div>
        {/* Stats pills */}
        <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.6rem" }}>
          <SkelBlock width="7rem" height="2.2rem" delay={2} />
          <div style={{ width: "1px", height: "2rem", background: "var(--line)" }} />
          <SkelBlock width="7rem" height="2.2rem" delay={3} />
          <div style={{ width: "1px", height: "2rem", background: "var(--line)" }} />
          <SkelBlock width="7rem" height="2.2rem" delay={1} />
        </div>
      </div>
      {/* Right column — visual */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
        }}
      >
        <div
          style={{
            width: "min(78%, 380px)",
            aspectRatio: "1",
            borderRadius: "50%",
            background: "var(--chip)",
          }}
        />
      </div>
    </div>
  );
}

/** Member dashboard skeleton */
export function MemberDashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Admin banner skeleton (conditional, just a sliver) */}
      <div
        className="skel"
        style={{
          background: "var(--purple-soft)",
          borderRadius: "var(--r-md)",
          padding: "1rem 1.4rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <SkelBlock width="12rem" height="0.85rem" delay={1} />
          <SkelBlock width="16rem" height="0.7rem" delay={2} />
        </div>
        <SkelBlock width="8rem" height="2rem" radius="999px" delay={3} />
      </div>

      {/* Header card */}
      <div
        className="skel"
        style={{
          background: "var(--white)",
          borderRadius: "var(--r-lg)",
          padding: "1.6rem",
          boxShadow: "var(--shadow)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <SkelBlock width="6rem" height="0.75rem" radius="999px" delay={1} />
          <SkelBlock width="14rem" height="1.5rem" delay={2} />
          <SkelBlock width="20rem" height="0.75rem" delay={3} />
        </div>
        <SkelBlock width="6rem" height="2.2rem" radius="999px" delay={1} />
      </div>

      {/* Section title */}
      <SkelBlock width="12rem" height="1.1rem" delay={2} />

      {/* Program cards */}
      {[1, 2].map((i) => (
        <div
          key={i}
          className="skel"
          style={{
            background: "var(--white)",
            borderRadius: "var(--r-lg)",
            padding: "1.4rem",
            boxShadow: "var(--shadow)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1.2rem",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <SkelBlock width="4.5rem" height="1.4rem" radius="999px" delay={1} />
              <SkelBlock width="5rem" height="1.4rem" radius="999px" delay={2} />
            </div>
            <SkelBlock width="70%" height="1.1rem" delay={3} />
            <SkelBlock width="50%" height="0.75rem" delay={1} />
            <div style={{ display: "flex", gap: "1.2rem" }}>
              <SkelBlock width="8rem" height="0.7rem" delay={2} />
              <SkelBlock width="6rem" height="0.7rem" delay={3} />
              <SkelBlock width="5rem" height="0.7rem" delay={1} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "10rem" }}>
            <SkelBlock width="100%" height="2.4rem" radius="999px" delay={2} />
            <SkelBlock width="80%" height="0.65rem" delay={3} style={{ alignSelf: "center" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Admin dashboard skeleton */
export function AdminDashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkelBlock width="12rem" height="1.8rem" delay={1} />
        <SkelBlock width="9rem" height="2.4rem" radius="999px" delay={2} />
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "1rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skel"
            style={{
              background: "var(--white)",
              borderRadius: "var(--r-md)",
              padding: "1.2rem",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <SkelBlock width="60%" height="1.6rem" delay={((i % 3) + 1) as 1 | 2 | 3} />
            <SkelBlock width="40%" height="0.7rem" delay={((i + 1) % 3 + 1) as 1 | 2 | 3} />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkelBlock width="10rem" height="1.1rem" delay={1} />
      <ListSkeleton rows={5} />
    </div>
  );
}

/**
 * Inject skeleton styles into the document head.
 * Safe to call multiple times (idempotent).
 */
export function initSkeletonStyles() {
  injectSkeletonStyles();
}
