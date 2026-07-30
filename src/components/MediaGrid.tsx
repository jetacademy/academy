type MediaItem = {
  id: string;
  filename: string;
  url: string;
  type: string;
  mime: string | null;
  size: number | null;
  createdAt: Date;
};

export default function MediaGrid({
  media,
  selectable,
  onSelect,
}: {
  media: MediaItem[];
  selectable?: boolean;
  onSelect?: (url: string) => void;
}) {
  if (media.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
        Belum ada media. Upload file PDF atau gambar untuk mulai.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.8rem" }}>
      {media.map((item) => (
        <div
          key={item.id}
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md, 8px)",
            overflow: "hidden",
            cursor: selectable ? "pointer" : "default",
            transition: "box-shadow .15s",
          }}
          onClick={() => selectable && onSelect?.(item.url)}
        >
          {/* Preview */}
          <div
            style={{
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--chip)",
              fontSize: "2rem",
              color: "var(--ink-soft)",
            }}
          >
            {item.type === "PDF" ? "📄" : item.type === "IMAGE" ? "🖼️" : "🎬"}
          </div>

          {/* Info */}
          <div style={{ padding: "0.4rem 0.6rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.filename}
            </div>
            {item.size && (
              <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>
                {(item.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>

          {/* Selectable overlay */}
          {selectable && (
            <div
              style={{
                padding: "0.3rem 0.6rem",
                borderTop: "1px solid var(--border)",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--purple)",
                textAlign: "center",
              }}
            >
              Pilih
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
