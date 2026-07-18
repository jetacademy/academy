import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // upload PDF/gambar materi & sertifikat via server action (maks 20 MB + overhead encoding)
      bodySizeLimit: "25mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        // Halaman publik — cache di CDN
        source: "/program/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=60" },
        ],
      },
      {
        // Sertifikat publik — cache lebih lama
        source: "/sertifikat/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=3600" },
        ],
      },
      {
        // Halaman autentikasi — jangan cache
        source: "/((?!_next/static|_next/image|favicon\\.ico|program|sertifikat).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        // Security headers untuk SEMUA halaman
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
