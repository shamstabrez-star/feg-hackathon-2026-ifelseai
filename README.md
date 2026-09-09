# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## End-to-end tests (Playwright)

Real-browser checks for the calm Casino content rails.

```bash
bunx playwright install chromium          # once
bun run test:e2e                          # all viewports: 1440 / 834 / 430 / 375
bun run test:e2e -- --project=mobile-430  # one viewport
bun run test:e2e:update-snapshots         # refresh rail snapshots
```

The suite starts the dev server itself (`bun run dev`, port 8080; override with
`E2E_PORT` / `E2E_BASE_URL`) and reuses one that is already running.

What is covered: idle one-card stepping and card alignment, end-of-row return,
pausing on hover, card click/tap, keyboard focus and touch/swipe with resume
only after the quiet window, suppression during search, an active sports
selection and a hidden tab, `prefers-reduced-motion` disabling automatic motion
while the arrows keep working, no page-level horizontal overflow, and focused
before/after snapshots of the rail.

Notes and limitations:
- No test-only UI or hooks exist in the product; every assertion reads real DOM
  scroll positions, real input events and real CSS media emulation.
- A browser tab cannot be truly backgrounded from a test, so the visibility test
  overrides `document.hidden`/`visibilityState` and dispatches a real
  `visibilitychange`, which is exactly the signal the rail reads.
- In this sandbox Chromium needs its libraries on the path:
  `LD_LIBRARY_PATH="$NIX_LD_LIBRARY_PATH:$LD_LIBRARY_PATH" bun run test:e2e`.
