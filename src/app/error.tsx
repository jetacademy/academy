"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #F5F4F6)",
        padding: "2rem 1rem",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
      }}
    >
      <div
        style={{
          background: "var(--white, #FFFFFF)",
          borderRadius: "var(--r-lg, 28px)",
          boxShadow: "0 10px 40px rgba(25, 25, 25, .08)",
          padding: "clamp(2rem, 5vw, 3.5rem)",
          maxWidth: "32rem",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "50%",
            background: "var(--purple-soft, #EAEAF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: "2rem",
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 0.5rem",
            color: "var(--ink, #17161A)",
          }}
        >
          Terjadi Kesalahan
        </h2>

        <p
          style={{
            color: "var(--ink-soft, #56545C)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau
          hubungi tim support jika masalah berlanjut.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--ink-faint, #9C99A3)",
              marginBottom: "1rem",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        {isDev && (
          <div
            style={{
              background: "var(--chip, #F7F6F8)",
              borderRadius: "var(--r-md, 18px)",
              padding: "1rem",
              marginBottom: "1.5rem",
              textAlign: "left",
              fontSize: "0.82rem",
              color: "var(--red, #E5484D)",
              fontFamily: "monospace",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.name}: {error.message}
            {error.stack && (
              <details style={{ marginTop: "0.5rem", color: "var(--ink-soft)" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  Stack trace
                </summary>
                <pre style={{ marginTop: "0.5rem", fontSize: "0.75rem", lineHeight: 1.5 }}>
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.8rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.95rem",
              padding: "0.9em 2em",
              borderRadius: "999px",
              background: "var(--purple, #232176)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(35,33,118,.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Coba Lagi
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.95rem",
              padding: "0.9em 2em",
              borderRadius: "999px",
              background: "transparent",
              color: "var(--ink, #17161A)",
              border: "2px solid var(--ink, #17161A)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(25,25,25,.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    </div>
  );
}
