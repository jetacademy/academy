import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // upload PDF/gambar materi & sertifikat via server action (maks 20 MB + overhead encoding)
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [
      {
        // Semua halaman SSR — jangan cache HTML di browser/CDN/proxy
        source: "/((?!_next/static|_next/image|favicon\\.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
