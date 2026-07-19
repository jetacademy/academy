import type { ContentBlock } from "@/lib/content-blocks";
import { getEmbedUrl } from "@/lib/video";
import { rupiah } from "@/lib/format";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";

/** Merender array blok konten — dipakai di halaman publik program DAN live preview editor admin (harus identik). */
export default function ProgramContentBlocks({ blocks, noReveal }: { blocks: ContentBlock[]; noReveal?: boolean }) {
  if (!blocks.length) return null;
  return (
    <div className="prg-blocks">
      {blocks.map((block) => (
        <ContentBlockView key={block.id} block={block} noReveal={noReveal} />
      ))}
    </div>
  );
}

/**
 * Render satu blok — diekspor supaya editor admin bisa memakai render PERSIS sama di kanvas inline.
 * `noReveal` mematikan animasi scroll-reveal (dipakai di editor admin — blok di-edit/re-render
 * berkali-kali di sana, observer ScrollReveal global bentrok dgn itu & memicu hydration warning).
 */
export function ContentBlockView({ block, noReveal }: { block: ContentBlock; noReveal?: boolean }) {
  const cardClass = noReveal ? "prg-blk-card" : "prg-blk-card reveal";
  const mediaClass = noReveal ? "prg-blk-card prg-blk-media" : "prg-blk-card prg-blk-media reveal";
  const quoteClass = noReveal ? "prg-blk-quote" : "prg-blk-quote reveal";

  switch (block.type) {
    case "heading":
      return block.text ? <h2 className="prg-blk-heading">{block.text}</h2> : null;

    case "text":
      return block.html ? (
        <div className={cardClass}>
          <div className="prg-blk-text rt-content" dangerouslySetInnerHTML={{ __html: block.html }} />
        </div>
      ) : null;

    case "image":
      return block.url ? (
        <figure className={mediaClass}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ukuran gambar konten bebas (bukan thumbnail 16:9) */}
          <img src={block.url} alt={block.caption || ""} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      ) : null;

    case "video": {
      const embed = getEmbedUrl(block.url);
      return embed ? (
        <figure className={mediaClass}>
          <LessonVideoPlayer src={embed} title={block.caption || "Video"} />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      ) : null;
    }

    case "list":
      return block.items.length ? (
        <div className={cardClass}>
          {block.title && <h3 className="prg-blk-card-title">{block.title}</h3>}
          <ul className="check-list">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null;

    case "stack":
      return block.items.length ? (
        <div className={cardClass}>
          {block.title && <h3 className="prg-blk-card-title">{block.title}</h3>}
          <div className="stack">
            {block.items.map((item, i) => (
              <div className="stack-row" key={i}>
                <span>{item.label}</span>
                {item.value > 0 ? <span className="val">{rupiah(item.value)}</span> : <span className="val incl">✓</span>}
              </div>
            ))}
          </div>
        </div>
      ) : null;

    case "quote":
      return block.text ? (
        <blockquote className={quoteClass}>
          <span className="prg-blk-quote-mark">&ldquo;</span>
          <p>{block.text}</p>
          {block.author && <cite>{block.author}</cite>}
        </blockquote>
      ) : null;

    default:
      return null;
  }
}
