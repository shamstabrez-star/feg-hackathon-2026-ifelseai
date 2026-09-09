# Architecture

PSK Intelligence is a context-aware content and session engine layered under a
faithful PSK front end. The customer sees normal PSK; the judge sees the
intelligence at work through a judge-only trace panel.

## Stack

- **React 19 + TanStack Start/Router** (SSR, file-based routes) — Vite 7 build
- **TypeScript** end to end
- **Tailwind CSS v4** (semantic tokens in `src/styles.css`)
- **Vitest + jsdom** for unit/component tests; **Playwright** for real-browser E2E
- Optional **Lovable Cloud** (Supabase-managed) for persistence/auth — not
  required for the demo

## Conceptual layers

Framework-independent modules live in `src/core/`; React binds to them through
a thin adapter (`src/lib/session-intelligence.tsx` + `src/lib/session-context.ts`).

```
UI layer            src/components/psk/*, src/routes/*
  │                   PSK shell, Sports journey, Casino lobby, hero, rails, betslip
  ▼
Session State       src/core/session-state.ts        reducer, stages ENTRY → … → EXIT
Intent              src/core/intent-engine.ts        entity-aware intent (teams, players, …)
Search Intel.       src/core/search-intelligence.ts  typo tolerant (Madird → Real Madrid), UNKNOWN fallback
Context             src/core/context-engine.ts       product-scoped, short-lived, privacy-safe
Relevance           src/core/relevance-engine.ts     ordering of existing content only
Friction            src/core/friction-engine.ts      LOW / MEDIUM / HIGH, conservative thresholds
Responsible Gate    src/core/responsible-gate.ts     independent PASS / ADAPT / SILENCE
Experience Decision src/core/experience-decision.ts  SHOW / PRIORITISE / DEFER / SILENCE, SIMPLIFY / DISCOVER / CONTINUE / NONE
Evidence / Metrics  src/core/metrics-engine.ts, src/data/evidence.ts
```

## Key design rules

- **Intelligence is invisible to the customer.** It reorders, defers or
  simplifies existing PSK surfaces; it never adds popups, chatbots,
  recommendations or urgency.
- **Product isolation.** Sports context never steers Casino and vice versa.
- **Privacy-safe.** Only aggregate/anonymized signals; no raw IDs, sessions,
  tokens or personal data anywhere in the UI or evidence.
- **Responsible Gate is independent** of the decision engine and can silence
  any adaptation.
- **Completion is clean**: `COMPLETION → EXIT`, decision `NONE`, no follow-up
  promotion.

## Content surfaces

- **Sports hero** (`src/components/psk/SportsHero.tsx`): context-aware surface
  using supplied PSK screenshot crops; prioritises relevant banners on strong
  intent, pauses motion in decision/transaction, `NONE` after completion.
- **Casino lobby** (`src/components/psk/CasinoLobby.tsx`): curated low-load
  sections with calm horizontal rails (`src/lib/rail-motion.ts`), Casino-only
  SHOW/PRIORITISE/DEFER/SILENCE orchestration (`src/data/casino-orchestration.ts`).
- **Judge trace** (`src/components/psk/IntelligenceTrace.tsx`): judge-only
  panel with LIVE SESSION vs DATASET EVIDENCE, WHY rows, provenance and
  limitations.

## Testing

- Unit/component: `src/lib/rail-motion.test.ts`,
  `src/components/psk/ContentRail.test.tsx` (39 tests, `bunx vitest run`)
- Real-browser E2E: `e2e/` with Playwright projects for 1440 / 834 / 430 / 375
- See `tests/README.md` for the full map.
