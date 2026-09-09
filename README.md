# PSK Intelligence — Hackathon 2026

A context-aware content and session engine under a faithful PSK front end.
The customer sees normal PSK; the intelligence is visible through behaviour —
the right existing PSK content gets priority at the right moment.

- **Live:** https://feg.ifelseai.com
- **Primary demo:** Sports journey (search `Madird` → Real Madrid)
- **Secondary proof:** Casino lobby (`/casino`, search `diamonds` / `Book`)

## Repository structure

```
├── README.md            ← you are here
├── LICENSE              ← MIT
├── .gitignore
├── .env.example         ← copy to .env; no secrets needed for the demo
├── src/                 ← app source (routes, components, core engines, data)
├── tests/               ← map of all test suites (unit + E2E)
├── docs/
│   ├── impact-case.md
│   ├── compliance-note.md
│   ├── architecture.md
│   └── dependencies.md
├── demo/                ← demo script, URLs, capture notes (video excluded)
└── e2e/                 ← Playwright real-browser specs (see tests/README.md)
```

## Quick start

```bash
bun install
bun run dev            # http://localhost:8080
```

## Tests

```bash
bunx vitest run        # unit/component (39 tests)
bun run test:e2e       # real-browser, viewports 1440 / 834 / 430 / 375
```

See `tests/README.md` for the full suite map and sandbox notes.

## Built with

React 19 · TanStack Start/Router · TypeScript · Tailwind CSS v4 · Vite 7 ·
Vitest · Playwright.
