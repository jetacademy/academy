# Jetschool Academy — Frontend & UX Audit Report

**Date**: 2026-07-18  
**Scope**: All pages, components, layouts, and CSS  
**Runtime**: Next.js 16.2.10, React 19.2.4  

---

## 🔴 CRITICAL

### C1. Hydration Mismatch — Footer Year
**File**: `src/components/Footer.tsx:25`  
**Issue**: `{new Date().getFullYear()}` renders on the server and hydrates on the client. If the year ticks over between server render and client hydration (e.g. around New Year's, or if an ISR/stale cache serves the old year), React throws a hydration error.  
**Severity**: HIGH  
**Fix**: Use a static year or wrap in a `'use client'` component with `useEffect`:

```tsx
// Option A: Static year (update once per year)
<span>© 2026 Jetschool Academy</span>

// Option B: Client-component with effect
"use client"; import { useState, useEffect } from "react";
const [year, setYear] = useState(2026);
useEffect(() => { setYear(new Date().getFullYear()); }, []);
```

Apply the same fix to `src/app/program/[slug]/page.tsx:355` (duplicate footer).

---

### C2. Missing `'use client'` — Server Component with Inline Style Mutation
**File**: `src/components/Navbar.tsx:58-65`  
**Issue**: The component IS marked `'use client'`, but it uses `onMouseEnter`/`onMouseLeave` handlers that directly mutate `e.currentTarget.style`. This bypasses React's reconciliation and can cause stale style state and unexpected behavior during concurrent rendering (React 19).  
**Severity**: HIGH  
**Fix**: Replace inline style mutation with CSS classes + state:

```tsx
const [hovered, setHovered] = useState(false);
// ...onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
// className={hovered ? "dashboard-btn hover" : "dashboard-btn"}
```

---

### C3. Inline Server Action Closure — Server Action Re-created on Every Render
**File**: `src/app/member/lms/[registrationId]/page.tsx:142-146`  
**Issue**: `handleMarkComplete()` is defined inside the component body with `"use server"`, capturing `registrationId`, `currentLessonId`, and `nextHref` from the component scope. In Next.js 16, this pattern is supported but fragile — any change to those variables creates a new action reference, which can cause issues with form submissions and cached renders.  
**Severity**: MEDIUM-HIGH  
**Fix**: Extract to a separate server action file or pass values via hidden form inputs:

```tsx
// In server action file:
export async function markLessonComplete(registrationId: string, lessonId: string, nextHref: string) { ... }

// In component:
<form action={markLessonComplete.bind(null, registrationId, currentLessonId, nextHref)}>
```

---

### C4. `dangerouslySetInnerHTML` Without Server-side Sanitization in Render
**File**: `src/app/member/lms/[registrationId]/page.tsx:320`  
**Issue**: Rendering `currentLesson.content` via `dangerouslySetInnerHTML`. While the code comments say sanitization happens at save-time, there is no runtime sanitization in the render path. If an admin account is compromised, stored XSS could execute.  
**Severity**: MEDIUM-HIGH  
**Fix**: Apply DOMPurify (or equivalent) client-side as a defense-in-depth layer:

```tsx
import DOMPurify from "isomorphic-dompurify";
// ... dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentLesson.content) }}
```

But since this is a Server Component, apply sanitization at read-time from the database instead.

---

## 🟠 HIGH

### H1. No Suspense Boundaries Around Async Server Components
**Files**: 
- `src/app/page.tsx:41` — entire page is `async`
- `src/app/program/[slug]/page.tsx:31` — entire page is `async`
- `src/app/member/lms/[registrationId]/page.tsx:36` — entire page is `async`
- `src/app/sertifikat/[number]/page.tsx:20` — entire page is `async`

**Issue**: Top-level async Server Components block the entire page render. There are no `<Suspense>` fallbacks for any data-dependent sections. If any DB query is slow (e.g., `getPrograms()`, `getProgramBySlug()`, Prisma queries), users see a blank page (no loading skeleton, no spinner). Next.js 16 treats async components as fully blocking unless wrapped in Suspense.  
**Severity**: HIGH  
**Fix**: Wrap data-dependent sections in `<Suspense fallback={<Skeleton />}>`:

```tsx
// Example: Wrap the programs grid
<Suspense fallback={<ProgramGridSkeleton />}>
  <ProgramGrid />
</Suspense>
```

---

### H2. Duplicate Google SVG Icon (Bloated Bundle)
**Files**: `src/components/RegisterForm.tsx:150-155` and `src/app/member/login/page.tsx:95-100`  
**Issue**: The same Google logo SVG (~700 bytes) is duplicated inline in two components. Should be extracted as a reusable sub-component or added to `Icon.tsx`.  
**Severity**: HIGH  
**Fix**: Extract to a shared `GoogleIcon` sub-component or add to `Icon.tsx`:

```tsx
// In Icon.tsx:
google: <path d="M17.64 9.2..." /> // with multiple paths using <g>
```

---

### H3. Missing Alt Text / Accessible Names for Interactive Icons
**Files**: `src/components/Icon.tsx:38` (all usages across ~20 files)  
**Issue**: `Icon` component has `aria-hidden` but no `aria-label` on its parent interactive elements. When used as the sole content of a button or link (e.g., `src/app/page.tsx:114` — `<Icon name={TYPE_ICON[p.type]} />` inside `<span className="dot-btn">`), screen readers have no accessible name to describe the action.  
**Severity**: HIGH  
**Fix**: Add `aria-label` to the parent interactive elements, or pass a label prop to `Icon`:

```tsx
// On the dot-btn span or parent:
<span className="dot-btn dot-p" aria-label={`Tipe program: ${TYPE_LABEL[p.type]}`}>
```

---

### H4. Pure CSS `color-mix()` and `-webkit-background-clip: text` — Browser Compatibility
**File**: `src/app/globals.css:144,317`  
**Issue**: `color-mix(in srgb, ...)` and `-webkit-background-clip: text` are relatively modern CSS features. `color-mix` is only ~80% browser support (no Firefox < 113, no Safari < 16.2). The navbar background could render as fully opaque in older browsers.  
**Severity**: HIGH  
**Fix**: Add a solid-color fallback:

```css
.nav {
  background: var(--bg); /* fallback */
  background: color-mix(in srgb, var(--bg) 88%, transparent);
}
```

---

### H5. Mobile Certificate — Forced Horizontal Scroll with `min-width: 750px`
**File**: `src/app/globals.css:1976-1978`  
**Issue**: On mobile (<768px), the certificate gets `min-width: 750px`, forcing horizontal scrolling on any device narrower than 750px. This is extremely poor UX on phones (360-430px viewports).  
**Severity**: HIGH  
**Fix**: Use responsive font sizes and allow the certificate to flow naturally at mobile widths instead of forcing a fixed min-width. Consider a stacked/vertical mobile layout alternative.

---

### H6. Admin Tables — No Loading/Empty Skeleton for Data
**Files**: `src/app/webadmin/(panel)/page.tsx:80-128`, `src/app/webadmin/(panel)/program/page.tsx:20-55`, `src/app/webadmin/(panel)/pendaftar/page.tsx:67-115`, `src/app/webadmin/(panel)/sertifikat/page.tsx:30-47`  
**Issue**: Server components fetch data and render synchronously. If a query is slow, the user sees a blank screen with no progress indicator. The empty state messages are only shown after the data loads.  
**Severity**: HIGH  
**Fix**: Wrap table sections in `<Suspense>` boundaries:

```tsx
<Suspense fallback={<div className="tbl-wrap"><p className="muted">Memuat data...</p></div>}>
  <RegistrationsTable />
</Suspense>
```

---

## 🟡 MEDIUM

### M1. CSS Duplication — `.prg-desc-cta-card` Redeclared
**File**: `src/app/globals.css:770-779` and `1249-1255`  
**Issue**: `.prg-desc-cta-card` is defined twice. The second declaration adds hover transitions. This is intentional additive CSS but makes maintenance harder.  
**Severity**: MEDIUM  
**Fix**: Merge hover transitions into the original block.

### M2. CSS Duplication — `.check-list li` Redeclared
**File**: `src/app/globals.css:886-903` and `1258-1267`  
**Issue**: `.check-list li` is defined twice with additive properties.  
**Severity**: MEDIUM  
**Fix**: Merge into one declaration block.

### M3. CSS Duplication — `.prg-hero-wrap` Media Query
**File**: `src/app/globals.css:693-697` and `1928-1933`  
**Issue**: Duplicate `@media (max-width: 900px)` for `.prg-hero-wrap`.  
**Severity**: MEDIUM  
**Fix**: Remove the duplicate block.

### M4. CSS Bloat — Unused CSS Rules (~400 lines)
**File**: `src/app/globals.css` — Rules like `.featured-card`, `.cat-tabs-container`, `.cat-tab`, `.cat-tag`, `.testi-card`, `.testi-profile`, `.testi-avatar`, `.hero-pills`, `.hero-pill`, `.orbit-wrap`, `.orbit-core`, `.orbit-chip`, `.ticket-card`, `.mock-browser`, `.pmm-validation-box`, `.pmm-grid`, `.pain-points-grid` (~400+ lines) are likely unused or only used in future/uncommitted pages.  
**Severity**: MEDIUM  
**Fix**: Audit and remove unused CSS. Use a tool like PurgeCSS in the build pipeline.

### M5. CSS Variables — Unused Aliases
**File**: `src/app/globals.css:35-39`  
**Issue**: `--paper`, `--paper-2`, `--gold`, `--yellow` are aliases labeled "utk komponen lama" (for old components). If no components reference them, remove.  
**Severity**: LOW-MEDIUM  
**Fix**: Search all files for these variable usages.

### M6. No Loading States on Form Submissions Lacking Immediate Feedback
**Files**:
- `CheckoutForm.tsx:69` — `disabled={loading}` — OK, has loading
- `RegisterForm.tsx:224` — `disabled={state === "loading"}` — OK
- `AdminRegistrationForm.tsx:91-93` — **No loading state at all** — pressing submit gives no visual feedback
- `Admin tabs/forms` — **Most admin forms lack loading indicators on submit buttons**

**Severity**: MEDIUM  
**Fix**: Add loading states to all submit buttons, especially in admin CRUD forms.

### M7. No Form Validation on WhatsApp Input for Mobile Users
**Files**: Multiple forms use `<input type="tel" pattern="0[0-9]{8,13}">`  
**Issue**: The `pattern` attribute only validates on submit via HTML5 constraint validation. There's no inline real-time validation or custom error message (the default browser tooltip "Please match the requested format" is unhelpful).  
**Severity**: MEDIUM  
**Fix**: Add `title="Format: 08xxxxxxxxx (min 10 digit)"` and custom validation via `onInvalid` handler:

```tsx
onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Nomor WA harus diawali 0, 9-14 digit')}
onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
```

### M8. `{...rest}` Object Spreading in Links — Potential Over-render
**File**: `src/app/webadmin/(panel)/pendaftar/page.tsx:123-127`  
**Issue**: `new URLSearchParams({...(q ? { q } : {}), ...})` creates a new object reference on every render of the Server Component, which can cause unnecessary client-side re-renders.  
**Severity**: LOW-MEDIUM  
**Fix**: Build the params string conditionally instead:

```tsx
const params = new URLSearchParams();
if (q) params.set("q", q);
if (program) params.set("program", program);
if (status) params.set("status", status);
params.set("page", String(currentPage - 1));
```

### M9. Page Title Missing on Server Error / Not-Found Pages
**File**: `src/app/program/[slug]/page.tsx:27`  
**Issue**: `notFound()` is called in the async component, but there's no custom `not-found.tsx` in the route group. Next.js will show the default 404 page with no branding.  
**Severity**: MEDIUM  
**Fix**: Add `src/app/program/[slug]/not-found.tsx` and `src/app/sertifikat/[number]/not-found.tsx` with branded content.

### M10. `admin-auth.ts` Session Check Runs Twice
**File**: `src/app/webadmin/(panel)/layout.tsx:12` and each child page  
**Issue**: The layout calls `requireAdmin()`, and some child pages also call `requireAdmin()` (e.g., `cert/page.tsx:7`). This results in duplicate session checks.  
**Severity**: MEDIUM  
**Fix**: Remove duplicate `requireAdmin()` calls from child pages that are already protected by the parent layout.

---

## 🟢 LOW

### L1. Unused Type Imports
**Files**: Multiple files — e.g., `src/app/program/[slug]/page.tsx:11` imports `ProgramType` but only uses it in `TYPE_CLASS` Record typing.  
**Severity**: LOW  
**Fix**: Clean up unused imports.

### L2. Prefer `const` Enum Over Plain Object for TYPE_CLASS
**File**: `src/app/page.tsx:15-20` and `src/app/program/[slug]/page.tsx:17-22`  
**Issue**: `TYPE_CLASS` is a plain object duplicated across two files.  
**Severity**: LOW  
**Fix**: Extract shared constants to a single location (e.g., `src/lib/fallback.ts`).

### L3. No `htmlFor` on Hidden Input Labels
**File**: `src/components/CertCustomizer.tsx:261` — `<label htmlFor="bg-upload">` — OK  
**File**: Multiple places — some `<label>` elements reference `id` attributes correctly.  
**No critical issues found here**, but audit all labels for proper `htmlFor`.

### L4. Hardcoded Strings in Components
**File**: `src/components/GoogleAuthModal.tsx:162-167` — Dev-mode mock account instructions contain raw HTML in a production component. Should be gated behind `process.env.NODE_ENV`.  
**Severity**: LOW  
**Fix**: Conditionally render dev-only content:

```tsx
{!clientId && process.env.NODE_ENV !== "production" && (...)}
```

### L5. Meta Description Length
**File**: `src/app/layout.tsx:14-15`  
**Issue**: Meta description is 129 characters — adequate, but could be more specific (includes keywords, location, unique value props).  
**Severity**: LOW  
**Fix**: Consider optimizing for SEO with a more keyword-rich description.

### L6. No Open Graph Images
**File**: `src/app/layout.tsx:12-16`  
**Issue**: `metadata` object has `title` and `description` but no `openGraph` or `twitter` fields. Social shares will lack images and rich previews.  
**Severity**: LOW  
**Fix**: Add:

```tsx
export const metadata: Metadata = {
  title: "...",
  description: "...",
  openGraph: {
    title: "Jetschool Academy",
    description: "...",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};
```

---

## 📋 SUMMARY

### Issue Count by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 CRITICAL | 4 | Hydration mismatch, style mutation, server action closure, XSS risk |
| 🟠 HIGH | 6 | No Suspense, duplicated icons, accessibility, browser compat, mobile cert, admin loading |
| 🟡 MEDIUM | 10 | CSS bloat/duplication, missing loading states, form validation, missing 404 pages |
| 🟢 LOW | 6 | Unused imports, hardcoded strings, OG images, metadata |

### Component Health Summary

| Component | Status | Key Issues |
|-----------|--------|------------|
| `Navbar.tsx` | ⚠️ | Inline style mutation (C2) |
| `RegisterForm.tsx` | ⚠️ | Duplicate Google icon (H2) |
| `CheckoutForm.tsx` | ✅ | Clean |
| `Footer.tsx` | 🔴 | Hydration mismatch (C1) |
| `ScrollReveal.tsx` | ✅ | Clean |
| `Icon.tsx` | ⚠️ | Missing aria-labels on parents (H3) |
| `LessonQuiz.tsx` | ✅ | Clean |
| `LessonFields.tsx` | ✅ | Clean |
| `RichTextEditor.tsx` | ⚠️ | Uses deprecated `document.execCommand` (deprecated in Chrome/Chromium) |
| `CertCustomizer.tsx` | ⚠️ | Uses `<img>` tags (acceptable), large file (884 lines) |
| `GoogleAuthModal.tsx` | ⚠️ | L4 Dev-mode content in production |
| `globals.css` | ⚠️ | ~500+ lines unused/bloat, duplicate declarations, browser compat |
| Admin pages | ⚠️ | No Suspense, no loading states on forms |

### Top 5 Fixes by Impact

1. **C1** — Fix hydration mismatch (instant fix, prevents runtime errors)
2. **H1** — Add Suspense boundaries (huge UX improvement for slow queries)
3. **H4** — Add CSS fallbacks (browser compatibility)
4. **H3** — Add aria-labels (accessibility legal requirement in some jurisdictions)
5. **M4** — Purge unused CSS (reduce bundle by ~30%)

### Files Modified in This Audit
- None — this is a read-only report. The findings above include specific fix code where applicable.
