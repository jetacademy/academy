import type { ContentBlock } from "@/lib/content-blocks";
import { getEmbedUrl } from "@/lib/video";
import { rupiah } from "@/lib/format";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";
import Icon from "@/components/Icon";

/** Merender array blok konten — dipakai di halaman publik program DAN live preview editor admin (harus identik). */
export default function ProgramContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks.length) return null;
  return (
    <div className="prg-blocks">
      {blocks.map((block) => (
        <ContentBlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return block.text ? <h2 className="prg-blk-heading">{block.text}</h2> : null;

    case "text":
      return block.html ? (
        <div className="prg-blk-text rt-content" dangerouslySetInnerHTML={{ __html: block.html }} />
      ) : null;

    case "image":
      return block.url ? (
        <figure className="prg-blk-image">
          {/* eslint-disable-next-line @next/next/no-img-element -- ukuran gambar konten bebas (bukan thumbnail 16:9) */}
          <img src={block.url} alt={block.caption || ""} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      ) : null;

    case "video": {
      const embed = getEmbedUrl(block.url);
      return embed ? (
        <figure className="prg-blk-video">
          <LessonVideoPlayer src={embed} title={block.caption || "Video"} />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      ) : null;
    }

    case "list":
      return block.items.length ? (
        <div className="prg-blk-list">
          {block.title && <h3>{block.title}</h3>}
          <ul className="check-list">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null;

    case "stack":
      return block.items.length ? (
        <div className="prg-blk-stack">
          {block.title && <h3>{block.title}</h3>}
          <ul className="prg-blk-stack-list">
            {block.items.map((item, i) => (
              <li key={i}>
                <Icon name="check" size={16} />
                <span>{item.label}</span>
                {item.value > 0 && <b>{rupiah(item.value)}</b>}
              </li>
            ))}
          </ul>
        </div>
      ) : null;

    case "quote":
      return block.text ? (
        <blockquote className="prg-blk-quote">
          <p>&ldquo;{block.text}&rdquo;</p>
          {block.author && <cite>— {block.author}</cite>}
        </blockquote>
      ) : null;

    default:
      return null;
  }
}
