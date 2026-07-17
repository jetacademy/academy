# Audit & Optimizations Record

## 1. Skema Database
- Ditambahkan index-index pada model `Registration` (`programId`, `status`, `createdAt`), `Payment` (`status`), dan `Certificate` (`issuedAt`) untuk meningkatkan performa join dan filter kueri MySQL.
- Sinkronisasi skema berhasil dilakukan via `npx prisma db push`.
- Database di-seed ulang via `npm run db:seed`.

## 2. Workspace & TypeScript
- Mengecualikan folder dependency eksternal `ui-ux-pro-max-skill` dari kompilasi TypeScript melalui config `"exclude"` pada `tsconfig.json`.
- Menambahkan folder `ui-ux-pro-max-skill/**` ke `globalIgnores` pada `eslint.config.mjs`.

## 3. Resolusi Linter & Standar Next.js 16/React 19
- Memindahkan fungsi impure `Date.now()` dari server component beranda (`src/app/page.tsx`) ke helper `getDaysLeft` di `src/lib/format.ts`.
- Mengganti elemen jangkar `<a>` menjadi komponen `<Link>` dari `next/link` pada navbar, footer, sertifikat, dan detail program untuk mendukung SPA navigation secara penuh.
- Seluruh masalah linting teratasi sepenuhnya (`npm run lint` menghasilkan exit code 0).
