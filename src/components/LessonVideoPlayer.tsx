"use client";

import { useState } from "react";

/** Iframe player (Bunny Stream / YouTube / Vimeo) dengan skeleton loading — hindari kotak hitam kosong sebelum player siap. */
export default function LessonVideoPlayer({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="lms-video-frame">
      {!loaded && (
        <div className="lms-video-skeleton">
          <div className="lms-video-spinner" />
          <span>Memuat video…</span>
        </div>
      )}
      <iframe
        key={src}
        src={src}
        title={title}
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
