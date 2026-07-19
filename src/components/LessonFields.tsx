"use client";

import { useId, useRef, useState } from "react";
import { Upload as TusUpload } from "tus-js-client";
import { uploadFileAction, createBunnyUploadSession, deleteBunnyVideoAction } from "@/app/webadmin/actions";
import RichTextEditor from "@/components/RichTextEditor";

const BUNNY_EMBED_RE = /iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i;

type LessonData = {
  title?: string;
  type?: string;
  videoUrl?: string | null;
  fileUrl?: string | null;
  content?: string | null;
  duration?: string;
  passingScore?: number | null;
  isPreview?: boolean;
};

const TYPES: { value: string; label: string; hint: string }[] = [
  { value: "VIDEO", label: "Video", hint: "Tempel URL YouTube atau Vimeo — otomatis di-embed di halaman belajar." },
  { value: "TEXT", label: "Teks / Artikel", hint: "Tulis materi bacaan dengan format lengkap: judul bagian, tebal, daftar, tautan." },
  { value: "PDF", label: "PDF / Dokumen", hint: "Upload file PDF (maks 20 MB) atau tempel URL PDF eksternal." },
  { value: "QUIZ", label: "Kuis", hint: "Kuis bisa ditempatkan di posisi mana pun dalam modul. Peserta harus lulus agar materi dianggap selesai." },
];

/**
 * Field-field form materi — dirender di dalam <form action={saveLmsLesson}>.
 * Menampilkan dua kartu: Konten Materi (berubah sesuai tipe) dan Pengaturan.
 */
export default function LessonFields({ lesson }: { lesson?: LessonData }) {
  const [type, setType] = useState(lesson?.type ?? "VIDEO");
  const [fileUrl, setFileUrl] = useState(lesson?.fileUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUploadErr, setVideoUploadErr] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isBunnyVideo = BUNNY_EMBED_RE.test(videoUrl);

  async function handleVideoUpload(file: File) {
    setVideoUploadErr(null);
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const session = await createBunnyUploadSession(file.name);
      if ("error" in session) {
        setVideoUploadErr(session.error);
        return;
      }
      const { guid, libraryId, expire, signature, cdnHostname } = session;
      void cdnHostname; // dipakai server-side saat play (HLS); embed player cukup pakai libraryId+guid

      const oldEmbed = videoUrl;

      await new Promise<void>((resolve, reject) => {
        const upload = new TusUpload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expire),
            VideoId: guid,
            LibraryId: libraryId,
          },
          metadata: { filetype: file.type, title: file.name },
          onError: (err) => reject(err),
          onProgress: (sent, total) => setVideoProgress(Math.round((sent / total) * 100)),
          onSuccess: () => resolve(),
        });
        upload.start();
      });

      setVideoUrl(`https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`);

      // Video lama (kalau ada & beda) dihapus dari Bunny — best-effort, tidak blocking
      const oldMatch = oldEmbed.match(BUNNY_EMBED_RE);
      if (oldMatch) deleteBunnyVideoAction(oldMatch[2]).catch(() => {});
    } catch (err) {
      setVideoUploadErr(err instanceof Error ? err.message : "Upload video gagal. Coba lagi.");
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  const activeType = TYPES.find((t) => t.value === type) ?? TYPES[0];

  async function handleUpload(file: File) {
    setUploadErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadFileAction(fd);
      if (res.error || !res.url) {
        setUploadErr(res.error ?? "Upload gagal. Coba lagi.");
      } else {
        setFileUrl(res.url);
      }
    } catch {
      setUploadErr("Upload gagal (koneksi/server). Coba lagi.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="editor-cols">
      <div className="form-section">
        <header>
          <h3>Konten Materi</h3>
          <p>{activeType.hint}</p>
        </header>
        <div className="fs-body" style={{ gridTemplateColumns: "1fr" }}>
          <div className="field">
            <label>Judul Materi</label>
            <input name="title" defaultValue={lesson?.title ?? ""} placeholder="cth: Pengenalan Digital Marketing" required />
          </div>

          <div className="field">
            <label>Tipe Konten</label>
            <div className="seg">
              {TYPES.map((t) => (
                <label key={t.value} className={type === t.value ? "on" : ""}>
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {type === "VIDEO" && (
            <div className="field">
              <label>Video</label>
              <input type="hidden" name="videoUrl" value={videoUrl} />
              <div className="upload-box">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  id={`${uid}-video`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleVideoUpload(f);
                  }}
                />
                <label htmlFor={`${uid}-video`} className="btn btn-sm btn-purple" style={{ cursor: videoUploading ? "wait" : "pointer" }}>
                  {videoUploading ? `Mengunggah… ${videoProgress}%` : "Upload Video (Bunny)"}
                </label>
                {isBunnyVideo && !videoUploading && (
                  <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--purple)" }}>Video Bunny terpasang</span>
                )}
              </div>
              {videoUploadErr && (
                <span style={{ display: "block", marginTop: ".4rem", fontSize: ".78rem", color: "var(--red)", fontWeight: 700 }}>{videoUploadErr}</span>
              )}
              <input
                value={isBunnyVideo ? "" : videoUrl}
                onChange={(e) => setVideoUrl(e.target.value.trim())}
                placeholder={isBunnyVideo ? "Video Bunny sudah terpasang — upload ulang utk mengganti" : "…atau tempel URL YouTube/Vimeo di sini"}
                disabled={isBunnyVideo}
                style={{ marginTop: ".6rem" }}
              />
              <span className="adm-note">Upload langsung diproses Bunny Stream (CDN cepat, tanpa iklan). Atau pakai URL YouTube/Vimeo.</span>
            </div>
          )}

          {type === "PDF" && (
            <div className="field">
              <label>File PDF</label>
              <input type="hidden" name="fileUrl" value={fileUrl} />
              <div className="upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  id={`${uid}-pdf`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <label htmlFor={`${uid}-pdf`} className="btn btn-sm btn-purple" style={{ cursor: "pointer" }}>
                  {uploading ? "Mengunggah…" : "Pilih File PDF"}
                </label>
                {fileUrl && !uploading && (
                  <a href={fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--purple)" }}>
                    Lihat file terpasang
                  </a>
                )}
                {!fileUrl && !uploading && (
                  <span style={{ fontSize: ".78rem", color: "var(--ink-faint)", fontWeight: 600 }}>Belum ada file terpasang</span>
                )}
              </div>
              {uploadErr && (
                <span style={{ display: "block", marginTop: ".4rem", fontSize: ".78rem", color: "var(--red)", fontWeight: 700 }}>{uploadErr}</span>
              )}
              <input
                defaultValue={lesson?.fileUrl ?? ""}
                onChange={(e) => setFileUrl(e.target.value.trim())}
                placeholder="…atau tempel URL PDF eksternal di sini"
                style={{ marginTop: ".6rem" }}
              />
            </div>
          )}

          {type === "TEXT" && (
            <div className="field">
              <label>Isi Materi</label>
              <RichTextEditor
                name="content"
                defaultValue={lesson?.content ?? ""}
                minHeight="16rem"
                placeholder="Tulis materi pembelajaran di sini…"
              />
            </div>
          )}

          {type === "VIDEO" && (
            <div className="field">
              <label>Catatan / Deskripsi Tambahan (opsional)</label>
              <RichTextEditor
                name="content"
                defaultValue={lesson?.content ?? ""}
                minHeight="7rem"
                placeholder="Ringkasan atau catatan pendamping video…"
              />
            </div>
          )}

          {type === "QUIZ" && (
            <p className="adm-note" style={{ margin: 0 }}>
              Soal-soal kuis dikelola di bagian bawah halaman ini setelah materi disimpan.
            </p>
          )}
        </div>
      </div>

      <div className="form-section">
        <header>
          <h3>Pengaturan</h3>
        </header>
        <div className="fs-body" style={{ gridTemplateColumns: "1fr" }}>
          <div className="field">
            <label>Durasi Estimasi</label>
            <input name="duration" defaultValue={lesson?.duration ?? "10 menit"} placeholder="cth: 15 menit" />
          </div>

          {type === "QUIZ" && (
            <div className="field">
              <label>Skor Lulus Kuis</label>
              <input name="passingScore" inputMode="numeric" defaultValue={lesson?.passingScore ?? ""} placeholder="Kosongkan = ikut skor program" />
            </div>
          )}

          <div className="field full" style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: 0 }}>
            <input
              type="checkbox"
              name="isPreview"
              id={`${uid}-preview`}
              defaultChecked={lesson?.isPreview ?? false}
              style={{ width: "auto" }}
            />
            <label htmlFor={`${uid}-preview`} style={{ margin: 0, fontSize: ".82rem" }}>
              Jadikan preview gratis — bisa dilihat calon peserta sebelum membayar
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
