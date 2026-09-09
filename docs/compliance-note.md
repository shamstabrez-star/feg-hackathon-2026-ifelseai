# Compliance Note

## Privacy & data protection

- **No personal data is collected or displayed.** Session state is ephemeral,
  in-memory and resettable; nothing is persisted to a server in the demo.
- **Evidence is aggregate-only.** Supplied datasets (casino trends workbook,
  event logs) are surfaced solely as anonymized aggregates, distributions and
  derived metrics. No raw identifiers, session IDs, tokens, transactions,
  URLs or personal data appear anywhere in the UI or exports.
- **Provenance is explicit.** Every evidence row is labelled as live prototype
  signal, supplied-dataset derivation, or production target. Unavailable
  stages are shown as unavailable rather than estimated.

## Responsible gambling

- **Independent Responsible Gate** (`src/core/responsible-gate.ts`) evaluates
  every experience decision and can return PASS / ADAPT / SILENCE. It is not
  part of the decision engine and cannot be overridden by it.
- **No urgency mechanics**: no countdowns, no "bet now" pressure, no
  gamification, no win prediction, no pre-charging, no tokens.
- **Completion is terminal**: after a successful action the journey goes
  `COMPLETION → EXIT` with decision `NONE`; no immediate re-promotion.
- **Friction is treated as a signal to help, not to push**: HIGH friction
  simplifies and can silence promotional motion/content.

## Accessibility

- Keyboard focus and operable controls on all interactive surfaces, visible
  focus states, aria labels/live announcements, `prefers-reduced-motion`
  disables automatic motion while manual controls keep working, touch
  targets sized for mobile, no colour-only selection cues, and no
  page-level horizontal overflow at 1440 / 834 / 430 / 375.

## Content integrity

- All imagery is authentic supplied PSK artwork (screenshot crops); no
  AI-generated or third-party marketing art is invented.
- No chatbot, no AI assistant UI, no recommendation cards, no cross-product
  nudges (Sports context never steers Casino and vice versa).

## Licensing

- Code: MIT (see `LICENSE`). PSK trademarks and supplied artwork remain the
  property of their owner and are used for hackathon demonstration only.
