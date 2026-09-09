# Tests

The test suites live in two locations (kept there so tooling configs remain
untouched); this directory is the single map.

## Unit & component tests — colocated with source

- `src/lib/rail-motion.test.ts` — Casino rail motion controller: idle step /
  resume, hover/touch/pointer/swipe/click/keyboard pauses, cooldown, manual
  arrows/swipe, suppression states (search, high intent, selection, betslip,
  transaction, completion, friction), reduced motion, hidden visibility,
  focus retention.
- `src/components/psk/ContentRail.test.tsx` — rail component behaviour.

Run:

```bash
bunx vitest run        # 39 tests
```

## Real-browser E2E — `e2e/`

- `e2e/carousel-motion.spec.ts` — deterministic DOM scroll assertions for
  idle stepping, pause/resume with exactly one step after cooldown, reduced
  motion never changing position, visibility/background restore.
- `e2e/carousel-eligibility.spec.ts` — intelligence-aware eligibility
  (search/betslip/action/completion suppression).
- `e2e/carousel-visual.spec.ts` — focused rail snapshots (no brittle
  whole-page shots), geometry, zero horizontal overflow.
- `e2e/rail.ts` — shared helpers.

Run:

```bash
bun run test:e2e                          # projects: 1440 / 834 / 430 / 375
bun run test:e2e -- --project=mobile-430  # single viewport
```

The suite starts the dev server itself (port 8080; override with
`E2E_PORT` / `E2E_BASE_URL`) or reuses a running one.

Sandbox note: Chromium needs its libraries on the path:
`LD_LIBRARY_PATH="$NIX_LD_LIBRARY_PATH:$LD_LIBRARY_PATH" bun run test:e2e`.
