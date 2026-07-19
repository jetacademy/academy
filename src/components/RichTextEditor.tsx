/* eslint-disable react-hooks/refs */
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Editor rich text ringan (tanpa dependensi) untuk konten materi.
 * Menyimpan HTML ke <input hidden name=...> agar terkirim lewat form server action.
 * Sanitasi final dilakukan di server sebelum disimpan.
 */
export default function RichTextEditor({
  name,
  defaultValue,
  placeholder,
  minHeight = "12rem",
  onChange,
}: {
  name?: string;
  defaultValue?: string | null;
  placeholder?: string;
  minHeight?: string;
  /** Dipanggil tiap konten berubah — dipakai editor yang butuh live preview (bukan submit via form). */
  onChange?: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue ?? "");

  // isi awal hanya sekali (uncontrolled contentEditable)
  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    if (editorRef.current) {
      const next = editorRef.current.innerHTML;
      setHtml(next);
      onChange?.(next);
    }
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function addLink() {
    const url = prompt("Alamat tautan (https://…):");
    if (url) exec("createLink", url);
  }

  const tools: { label: string; title: string; onClick: () => void; style?: React.CSSProperties }[] = [
    { label: "B", title: "Tebal", onClick: () => exec("bold"), style: { fontWeight: 800 } },
    { label: "I", title: "Miring", onClick: () => exec("italic"), style: { fontStyle: "italic" } },
    { label: "U", title: "Garis bawah", onClick: () => exec("underline"), style: { textDecoration: "underline" } },
    { label: "H2", title: "Judul bagian", onClick: () => exec("formatBlock", "<h2>") },
    { label: "H3", title: "Sub-judul", onClick: () => exec("formatBlock", "<h3>") },
    { label: "¶", title: "Paragraf biasa", onClick: () => exec("formatBlock", "<p>") },
    { label: "• Daftar", title: "Daftar poin", onClick: () => exec("insertUnorderedList") },
    { label: "1. Daftar", title: "Daftar bernomor", onClick: () => exec("insertOrderedList") },
    { label: "Tautan", title: "Sisipkan tautan", onClick: addLink },
    { label: "Bersihkan", title: "Hapus format", onClick: () => exec("removeFormat") },
  ];

  return (
    <div className="rte">
      {name && <input type="hidden" name={name} value={html} />}
      <div className="rte-toolbar">
        {tools.map((t) => (
          <button key={t.label} type="button" title={t.title} style={t.style} onMouseDown={(e) => e.preventDefault()} onClick={t.onClick}>
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="rte-area rt-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? "Tulis konten di sini…"}
        style={{ minHeight }}
        onInput={sync}
        onBlur={sync}
      />
    </div>
  );
}
