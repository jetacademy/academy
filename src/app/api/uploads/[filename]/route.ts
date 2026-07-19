import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads");

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

/**
 * GET /api/uploads/:filename
 * Menyajikan file upload dari direktori persistent (luar public/).
 * Tidak perlu remotePatterns, tidak hilang saat redeploy.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: cegah path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = join(UPLOADS_DIR, filename);

  if (!existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
