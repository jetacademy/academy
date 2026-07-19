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
  buildDefaultTemplate,
  parseMarkdownToBlocks,
  isBlockEmpty,
} from "@/lib/content-blocks";
import { isValidVideoUrl } from "@/lib/video";
import { saveProgramContentBlocks } from "@/app/webadmin/actions";
import { ContentBlockView } from "@/components/ProgramContentBlocks";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const [markdownDraft, setMarkdownDraft] = useState("");

  function setBlocksDirty(next: ContentBlock[]) {
    setBlocks(next);
    setDirty(true);
    setSavedOk(false);
  }

  function insertBlock(type: BlockType, index: number) {
    const block = createEmptyBlock(type);
    const next = [...blocks];
    next.splice(index, 0, block);
    setBlocksDirty(next);
    setEditingId(block.id);
    setInsertAt(null);
  }

  function updateBlock(id: string, patch: Record<string, unknown>) {
    setBlocksDirty(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)));
  }

  function removeBlock(id: string) {
    setBlocksDirty(blocks.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocksDirty(next);
  }

  function loadLegacy() {
    if (blocks.length > 0 && !confirm("Ini akan menambahkan blok dari data lama (deskripsi, materi, dll) ke akhir daftar. Lanjutkan?")) {
      return;
    }
    setBlocksDirty([...blocks, ...buildLegacyBlocks(legacyProgram)]);
  }

  function loadTemplate() {
    if (blocks.length > 0 && !confirm("Ini akan menambahkan blok template (judul, teks, daftar, value stack, gambar, kutipan) ke akhir daftar. Lanjutkan?")) {
      return;
    }
    setBlocksDirty([...blocks, ...buildDefaultTemplate()]);
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
    <div className="ibk-page">
      <div className="ibk-topbar">
        <button type="button" className="btn btn-sm btn-purple" onClick={loadTemplate}>🎨 Muat Template</button>
        <button type="button" className="btn btn-sm" onClick={() => setShowMarkdownImport((v) => !v)}>
          {showMarkdownImport ? "Batal Import Markdown" : "✍️ Import dari Markdown"}
        </button>
        {blocks.length > 0 && (
          <button type="button" className="btn btn-sm" onClick={loadLegacy}>↺ Tambahkan blok dari data lama</button>
        )}
      </div>

      {showMarkdownImport && (
        <div className="ibk-markdown-panel">
          <textarea
            value={markdownDraft}
            onChange={(e) => setMarkdownDraft(e.target.value)}
            placeholder={"## Kenapa Ikut Program Ini?\n\nParagraf **penjelasan** singkat.\n\n- Poin satu\n- Poin dua\n\n> Kelasnya sangat membantu\n> — Nama Peserta"}
            rows={7}
            style={{ fontFamily: "monospace", fontSize: ".82rem" }}
          />
          <span className="adm-note">
            # judul · paragraf teks · ![keterangan](url gambar/video) · - daftar poin · - Label | 150000 value stack · {"> kutipan"}.
          </span>
          <button type="button" className="btn btn-sm btn-purple" style={{ marginTop: ".5rem" }} onClick={importMarkdown} disabled={!markdownDraft.trim()}>
            Tambahkan Blok dari Teks Ini
          </button>
        </div>
      )}

      <div className="ibk-canvas">
        <InsertZone
          open={insertAt === 0}
          onToggle={() => setInsertAt(insertAt === 0 ? null : 0)}
          onPick={(type) => insertBlock(type, 0)}
        />

        {blocks.length === 0 && (
          <div className="ibk-empty">
            <p>Halaman ini belum punya konten kustom. Klik tombol + di atas untuk mulai menambah blok satu-satu,</p>
            <div style={{ display: "flex", gap: ".5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-sm btn-purple" onClick={loadTemplate}>
                🎨 mulai dari template
              </button>
              <button type="button" className="btn btn-sm" onClick={loadLegacy}>
                ↺ atau dari data lama (deskripsi, materi, dll)
              </button>
            </div>
          </div>
        )}

        {blocks.map((block, index) => (
          <div key={block.id}>
            <InlineBlockCard
              block={block}
              editing={editingId === block.id}
              onEdit={() => setEditingId(block.id)}
              onDoneEdit={() => setEditingId(null)}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onRemove={() => removeBlock(block.id)}
              onMoveUp={() => moveBlock(index, -1)}
              onMoveDown={() => moveBlock(index, 1)}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
            />
            <InsertZone
              open={insertAt === index + 1}
              onToggle={() => setInsertAt(insertAt === index + 1 ? null : index + 1)}
              onPick={(type) => insertBlock(type, index + 1)}
            />
          </div>
        ))}
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

function InsertZone({ open, onToggle, onPick }: { open: boolean; onToggle: () => void; onPick: (type: BlockType) => void }) {
  return (
    <div className={open ? "ibk-insert open" : "ibk-insert"}>
      <span className="ibk-insert-line" />
      <button type="button" className="ibk-insert-btn" onClick={onToggle} title="Tambah blok di sini">+</button>
      <span className="ibk-insert-line" />
      {open && (
        <div className="ibk-insert-menu">
          {BLOCK_TYPES.map((type) => (
            <button key={type} type="button" className="ibk-insert-menu-btn" onClick={() => onPick(type)} title={BLOCK_TYPE_META[type].hint}>
              <span>{BLOCK_TYPE_META[type].icon}</span>
              {BLOCK_TYPE_META[type].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineBlockCard({
  block,
  editing,
  onEdit,
  onDoneEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: ContentBlock;
  editing: boolean;
  onEdit: () => void;
  onDoneEdit: () => void;
  onUpdate: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = BLOCK_TYPE_META[block.type];
  const empty = isBlockEmpty(block);

  return (
    <div className={editing ? "ibk-block editing" : "ibk-block"}>
      {!editing && (
        <div className="ibk-toolbar">
          <span className="ibk-toolbar-label">{meta.icon} {meta.label}</span>
          <div className="ibk-toolbar-actions">
            <button type="button" onClick={onMoveUp} disabled={isFirst} title="Naik">↑</button>
            <button type="button" onClick={onMoveDown} disabled={isLast} title="Turun">↓</button>
            <button type="button" onClick={onEdit} title="Edit">✏️</button>
            {!confirmingDelete ? (
              <button type="button" className="danger" onClick={() => setConfirmingDelete(true)} title="Hapus">✕</button>
            ) : (
              <span className="ibk-confirm">
                <button type="button" className="danger" onClick={onRemove}>Ya, hapus</button>
                <button type="button" onClick={() => setConfirmingDelete(false)}>Batal</button>
              </span>
            )}
          </div>
        </div>
      )}

      {editing ? (
        <div className="ibk-edit-panel">
          <BlockFields block={block} onUpdate={onUpdate} />
          <button type="button" className="btn btn-sm btn-purple" style={{ marginTop: ".8rem" }} onClick={onDoneEdit}>
            Selesai Edit
          </button>
        </div>
      ) : (
        <div className="ibk-render" onClick={onEdit}>
          <ContentBlockView block={block} noReveal />
          {empty && <div className="ibk-empty-hint">Klik untuk isi blok {meta.label.toLowerCase()} ini</div>}
        </div>
      )}
    </div>
  );
}

function BlockFields({ block, onUpdate }: { block: ContentBlock; onUpdate: (patch: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <input value={block.text} onChange={(e) => onUpdate({ text: e.target.value })} placeholder="Judul bagian, mis. Yang Anda Pelajari" autoFocus />
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
            autoFocus
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
            autoFocus
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
            autoFocus
          />
          <StackItemsField items={block.items} onChange={(items) => onUpdate({ items })} />
        </>
      );

    case "split":
      return (
        <div className="ibk-split-fields">
          <div>
            <label className="adm-note" style={{ display: "block", marginBottom: ".3rem" }}>Kolom Kiri (value stack)</label>
            <input value={block.leftTitle} onChange={(e) => onUpdate({ leftTitle: e.target.value })} placeholder="Judul kiri" autoFocus />
            <StackItemsField items={block.leftItems} onChange={(items) => onUpdate({ leftItems: items })} />
          </div>
          <div>
            <label className="adm-note" style={{ display: "block", marginBottom: ".3rem" }}>Kolom Kanan (daftar poin)</label>
            <input value={block.rightTitle} onChange={(e) => onUpdate({ rightTitle: e.target.value })} placeholder="Judul kanan" />
            <ListItemsField items={block.rightItems} onChange={(items) => onUpdate({ rightItems: items })} />
          </div>
        </div>
      );

    case "quote":
      return (
        <>
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Isi kutipan, bio mentor, atau teks jaminan…"
            rows={3}
            autoFocus
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
