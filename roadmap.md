# Roadmap

- [x] Final product experience enhancement: decision-ready stage, betslip clarity, judge framing quotes and validation targets
- [x] Calm horizontal content motion on selected existing rows (Casino browse rows only; pause on interaction, reduced-motion, intelligence-state aware)
- [x] Automated tests for Casino browse rail motion (vitest + jsdom, 39 tests)
- [x] Playwright E2E setup + real-browser carousel motion tests (reduced-motion, hover/click/keyboard/touch pause + deferred single-step resume)
- [x] E2E: hidden-tab/visibility restore test + focused idle-step snapshot (alignment/no jitter)
- [x] PSK Casino lobby enhancement using clean supplied-screenshot crops, intent-aware ordering, and progressive rows

## Playwright E2E (Casino content rails) — done

- Real-browser suite at 1440 / 834 / 430 / 375 (`bun run test:e2e`).
- Covers idle discrete stepping, alignment, end wrapping, hover / card click /
  keyboard / touch / swipe pausing and eligible deferred resume, search and
  active-selection suppression, hidden-tab behaviour, reduced motion, page
  overflow, and focused rail snapshots.
- Sandbox constraint: Chromium needs `LD_LIBRARY_PATH="$NIX_LD_LIBRARY_PATH:$LD_LIBRARY_PATH"`.

- [ ] Make the existing PSK hero context-aware: default carousel, search/event prioritisation, decision/completion suppression, deferred loading, judge trace, and responsive verification.
