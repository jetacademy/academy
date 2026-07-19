"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  type ContentBlock,
  type BlockType,
  BLOCK_TYPES,
  BLOCK_TYPE_META,
  createEmptyBlock,
  buildLegacyBlocks,
  parseMarkdownToBlocks,
} from "@/lib/content-blocks";
import { isValidVideoUrl } from "@/lib/video";
import { saveProgramContentBlocks } from "@/app/webadmin/actions";
import ProgramContentBlocks from "@/components/ProgramContentBlocks";
import RichTextEditor from "@/components/RichTextEditor";
import BlockImageField from "@/components/BlockImageField";

type LegacyProgram = {
  description: string;
  materi: string[];
  deliverables: { label: string; value: number }[];
  mentorName: string;
  mentorBio: string;
  guarantee: string | null;
};

export default function ContentBlockEditor({
  programId,
  programSlug,
  initialBlocks,
  legacyProgram,
}: {
  programId: string;
  programSlug: string;
  initialBlocks: ContentBlock[];
  legacyProgram: LegacyProgram;
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const [markdownDraft, setMarkdownDraft] = useState("");

  function setBlocksDirty(next: ContentBlock[]) {
    setBlocks(next);
    setDirty(true);
    setSavedOk(false);
  }

  function addBlock(type: BlockType) {
    setBlocksDirty([...blocks, createEmptyBlock(type)]);
  }

  function updateBlock(id: string, patch: Record<string, unknown>) {
    setBlocksDirty(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)));
  }

  function removeBlock(id: string) {
    setBlocksDirty(blocks.filter((b) => b.id !== id));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocksDirty(next);
  }

  function reorderByDrag(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBlocksDirty(next);
  }

  function loadLegacy() {
    if (blocks.length > 0 && !confirm("Ini akan menambahkan blok dari data lama (deskripsi, materi, dll) ke akhir daftar. Lanjutkan?")) {
      return;
    }
    setBlocksDirty([...blocks, ...buildLegacyBlocks(legacyProgram)]);
  }

  function importMarkdown() {
    const parsed = parseMarkdownToBlocks(markdownDraft);
    if (!parsed.length) return;
    setBlocksDirty([...blocks, ...parsed]);
    setMarkdownDraft("");
    setShowMarkdownImport(false);
  }

  function handleSave() {
    setSaveError(null);
    startSaving(async () => {
      const res = await saveProgramContentBlocks(programId, blocks);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setDirty(false);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2500);
      }
    });
  }

  return (
    <div className="cbe-wrap">
      <div className={mobileView === "edit" ? "cbe-editor" : "cbe-editor cbe-hide-mobile"}>
        <div className="cbe-toolbar">
          <span className="adm-note" style={{ marginBottom: ".5rem", display: "block" }}>Tambah blok baru:</span>
          <div className="cbe-add-grid">
            {BLOCK_TYPES.map((type) => (
              <button key={type} type="button" className="cbe-add-btn" onClick={() => addBlock(type)} title={BLOCK_TYPE_META[type].hint}>
                <span>{BLOCK_TYPE_META[type].icon}</span>
                {BLOCK_TYPE_META[type].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ marginTop: ".8rem" }}
            onClick={() => setShowMarkdownImport((v) => !v)}
          >
            {showMarkdownImport ? "Batal Import Markdown" : "✍️ Import dari Markdown"}
          </button>
          {showMarkdownImport && (
            <div style={{ marginTop: ".7rem" }}>
              <textarea
                value={markdownDraft}
                onChange={(e) => setMarkdownDraft(e.target.value)}
                placeholder={"## Kenapa Ikut Program Ini?\n\nParagraf **penjelasan** singkat.\n\n- Poin satu\n- Poin dua\n\n> Kelasnya sangat membantu\n> — Nama Peserta"}
                rows={8}
                style={{ fontFamily: "monospace", fontSize: ".82rem" }}
              />
              <span className="adm-note">
                Tulis seperti markdown biasa: # judul, paragraf, ![keterangan](url gambar/video), - daftar poin, - Label | 150000 utk value stack, {"> kutipan"}.
              </span>
              <button type="button" className="btn btn-sm btn-purple" style={{ marginTop: ".6rem" }} onClick={importMarkdown} disabled={!markdownDraft.trim()}>
                Tambahkan Blok dari Teks Ini
              </button>
            </div>
          )}
        </div>

        <div className="cbe-list">
          {blocks.length === 0 && (
            <div className="cbe-empty">
              Belum ada blok. Halaman publik akan tetap tampil dengan layout lama (deskripsi/materi/mentor bawaan)
              sampai Anda menambah dan menyimpan blok di sini.
              <br /><br />
              <button type="button" className="btn btn-sm btn-purple" onClick={loadLegacy}>
                ↺ Mulai dari data lama (deskripsi, materi, dll)
              </button>
            </div>
          )}

          {blocks.map((block, index) => (
            <BlockEditorCard
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              dragging={dragIndex === index}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onRemove={() => removeBlock(block.id)}
              onMove={(dir) => moveBlock(index, dir)}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDropOn={() => {
                if (dragIndex !== null) reorderByDrag(dragIndex, index);
                setDragIndex(null);
              }}
            />
          ))}

          {blocks.length > 0 && (
            <button type="button" className="btn btn-sm" onClick={loadLegacy} style={{ width: "fit-content" }}>
              ↺ Tambahkan juga blok dari data lama
            </button>
          )}
        </div>
      </div>

      <div className={mobileView === "preview" ? "cbe-preview" : "cbe-preview cbe-hide-mobile"}>
        <div className="cbe-preview-label">Pratinjau Langsung</div>
        <div className="cbe-preview-frame">
          {blocks.length > 0 ? (
            <ProgramContentBlocks blocks={blocks} />
          ) : (
            <p className="adm-note">Belum ada blok untuk dipratinjau.</p>
          )}
        </div>
      </div>

      <div className="cbe-mobile-toggle">
        <button type="button" className={mobileView === "edit" ? "on" : ""} onClick={() => setMobileView("edit")}>✏️ Edit</button>
        <button type="button" className={mobileView === "preview" ? "on" : ""} onClick={() => setMobileView("preview")}>👁️ Pratinjau</button>
      </div>

      <div className="cbe-savebar">
        {saveError && <span className="cbe-save-msg error">{saveError}</span>}
        {savedOk && <span className="cbe-save-msg ok">✓ Tersimpan</span>}
        <Link href={`/program/${programSlug}`} target="_blank" className="btn btn-sm">Lihat Halaman Publik ↗</Link>
        <button type="button" className="btn btn-purple" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}

function BlockEditorCard({
  block,
  index,
  total,
  dragging,
  onUpdate,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
  onDropOn,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  dragging: boolean;
  onUpdate: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = BLOCK_TYPE_META[block.type];

  return (
    <div
      className={dragging ? "cbe-card dragging" : "cbe-card"}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn();
      }}
    >
      <div className="cbe-card-head">
        <span className="cbe-drag-handle" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} title="Seret untuk urutkan">⠿</span>
        <span className="cbe-card-type">{meta.icon} {meta.label}</span>
        <div className="cbe-card-actions">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} title="Naik">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} title="Turun">↓</button>
          {!confirmingDelete ? (
            <button type="button" className="danger" onClick={() => setConfirmingDelete(true)} title="Hapus">✕</button>
          ) : (
            <span className="cbe-confirm-del">
              <button type="button" className="danger" onClick={onRemove}>Ya, hapus</button>
              <button type="button" onClick={() => setConfirmingDelete(false)}>Batal</button>
            </span>
          )}
        </div>
      </div>
      <div className="cbe-card-body">
        <BlockFields block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function BlockFields({ block, onUpdate }: { block: ContentBlock; onUpdate: (patch: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <input value={block.text} onChange={(e) => onUpdate({ text: e.target.value })} placeholder="Judul bagian, mis. Yang Anda Pelajari" />
      );

    case "text":
      return <RichTextEditor defaultValue={block.html} onChange={(html) => onUpdate({ html })} minHeight="8rem" />;

    case "image":
      return (
        <>
          <BlockImageField value={block.url} onChange={(url) => onUpdate({ url })} />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Keterangan gambar (opsional)"
            style={{ marginTop: ".6rem" }}
          />
        </>
      );

    case "video":
      return (
        <>
          <input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value.trim() })}
            placeholder="Tempel link YouTube, Vimeo, atau embed Bunny Stream"
          />
          {block.url && !isValidVideoUrl(block.url) && (
            <span className="cbe-field-warn">Link belum dikenali — gunakan URL YouTube, Vimeo, atau embed Bunny.</span>
          )}
          <input
            value={block.caption ?? ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Keterangan video (opsional)"
            style={{ marginTop: ".6rem" }}
          />
        </>
      );

    case "list":
      return (
        <>
          <input
            value={block.title ?? ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Judul daftar (opsional)"
          />
          <ListItemsField items={block.items} onChange={(items) => onUpdate({ items })} />
        </>
      );

    case "stack":
      return (
        <>
          <input
            value={block.title ?? ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Judul value stack (opsional)"
          />
          <StackItemsField items={block.items} onChange={(items) => onUpdate({ items })} />
        </>
      );

    case "quote":
      return (
        <>
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Isi kutipan, bio mentor, atau teks jaminan…"
            rows={3}
          />
          <input
            value={block.author ?? ""}
            onChange={(e) => onUpdate({ author: e.target.value })}
            placeholder="Nama/sumber kutipan (opsional)"
            style={{ marginTop: ".6rem" }}
          />
        </>
      );

    default:
      return null;
  }
}

function ListItemsField({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="cbe-rows" style={{ marginTop: ".6rem" }}>
      {items.map((item, i) => (
        <div className="cbe-row" key={i}>
          <input value={item} onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))} placeholder="Tulis satu poin…" />
          <button type="button" className="cbe-row-del" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" style={{ width: "fit-content" }} onClick={() => onChange([...items, ""])}>+ Tambah poin</button>
    </div>
  );
}

function StackItemsField({
  items,
  onChange,
}: {
  items: { label: string; value: number }[];
  onChange: (items: { label: string; value: number }[]) => void;
}) {
  return (
    <div className="cbe-rows" style={{ marginTop: ".6rem" }}>
      {items.map((item, i) => (
        <div className="cbe-row cbe-row-stack" key={i}>
          <input
            value={item.label}
            onChange={(e) => onChange(items.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)))}
            placeholder="Label, mis. Rekaman selamanya"
          />
          <input
            type="number"
            value={item.value || ""}
            onChange={(e) => onChange(items.map((v, j) => (j === i ? { ...v, value: Number(e.target.value) || 0 } : v)))}
            placeholder="Nilai (Rp)"
          />
          <button type="button" className="cbe-row-del" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" style={{ width: "fit-content" }} onClick={() => onChange([...items, { label: "", value: 0 }])}>
        + Tambah item
      </button>
    </div>
  );
}
