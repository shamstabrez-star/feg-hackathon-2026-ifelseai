# Final simplification pass

Items 1 (real PSK content) and 2 (intent-aware content + progressive loading) are already implemented: the Casino lobby and hero both run on the cropped PSK screenshot artwork, prioritise relevant content on intent, defer unrelated rows, and load first-visible assets eagerly with the rest lazily. No changes there.

The remaining gap is item 3: the final confirmation step does not show a payment method, and the review step reads as a paragraph rather than a scannable summary.

## What changes

Only the betslip confirmation surface (`src/components/psk/Betslip.tsx`):

1. Replace the free-text confirm paragraph with a compact, clearly labelled review block:
   - Selection (each pick: match, market, outcome, odds)
   - Stake
   - Total odds
   - Potential return
   - Payment method
2. Payment method: a simple read-only line showing the demo account balance method used by PSK (e.g. "PSK account balance"), with a plain "Change" affordance that reveals one or two familiar alternatives. No card entry, no tokens, no stored details, no charge of any kind — display only.
3. Keep the existing single primary "Confirm" button and "Back" button, unchanged in behaviour, position and responsible-gate disabling.
4. Keep the existing accepted-ticket screen; add the same payment-method line there for consistency.
5. Keep wording neutral — no countdowns, no "hurry", no predicted winnings beyond the existing factual potential-return figure.

## Not touched

Carousel/rail motion, Session Engine, Intent, Context, Friction, Responsible Gate, Sports journey, Casino orchestration, hero decision logic, judge trace structure.

## Verification

- Typecheck, lint, Prettier.
- Existing Vitest suite (39 tests).
- Real-browser check of the Sports flow (search → match → selection → review → Confirm → Bet accepted → Done) at 1440 / 834 / 430 / 375, confirming no horizontal overflow and no console errors.
