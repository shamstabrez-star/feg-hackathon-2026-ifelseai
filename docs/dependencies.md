# Dependencies

Runtime and tooling dependencies. Exact versions are pinned in `package.json`
and `bun.lock`.

## Runtime

| Package | Purpose |
| --- | --- |
| react, react-dom (19) | UI |
| @tanstack/react-start, @tanstack/react-router | SSR framework, file-based routing |
| @tanstack/react-query | Data loading / caching |
| tailwindcss (v4) | Styling via semantic tokens |
| sonner | Toast notifications |
| lucide-react | Icons |
| class-variance-authority, clsx, tailwind-merge | Component variant utilities |
| zod | Input validation |

## Backend (optional)

- **Supabase** (optional): PostgreSQL, auth, storage. Not required for the
  demo journey; no secrets are needed to run it.

## Development / testing

| Package | Purpose |
| --- | --- |
| vite (7) | Dev server and build |
| typescript | Type checking (`bunx tsgo` / `tsc`) |
| vitest, jsdom, @testing-library/react | Unit & component tests |
| playwright (@playwright/test) | Real-browser E2E (1440 / 834 / 430 / 375) |
| eslint, prettier | Lint and format |

## External assets

- Supplied PSK screenshots/logo and screenshot-derived crops under
  `src/assets/` — used as the visual source of truth. No stock or generated
  marketing imagery.

## Notes

- No server-only native dependencies (no sharp/canvas/puppeteer) — the SSR
  runtime is edge-compatible.
- In this sandbox, Chromium E2E runs need
  `LD_LIBRARY_PATH="$NIX_LD_LIBRARY_PATH:$LD_LIBRARY_PATH"` (see README).
