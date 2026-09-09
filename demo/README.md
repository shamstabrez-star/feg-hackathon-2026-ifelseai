# Demo

Everything needed to present the prototype except the demo video.

## Live URLs

- Production: https://feg.ifelseai.com
- Sitemap: https://feg.ifelseai.com/sitemap.xml

## Demo script (5 minutes)

1. **Default state** — open `/` (Sports). Judge panel: CONTENT INTELLIGENCE /
   SHOW, "No strong intent — preserving normal PSK discovery."
2. **Search with a typo** — search `Madird`. Intent resolves to Real Madrid /
   football with HIGH confidence; the relevant supplied PSK hero banner moves
   to the primary position; unrelated banners defer; hero motion pauses.
   Judge panel: PRIORITISE — "Real Madrid intent detected".
3. **Open the match** — active event context: relevant content prioritised,
   competing promotion deferred, hero motion paused. Judge panel: "Active
   event context → competing content reduced."
4. **Select a market** — hero goes quiet; betslip becomes the focus. Final
   surface shows exactly Selection / Stake / Total odds / Potential return /
   Payment method / CONFIRM.
5. **Confirm & complete** — bet accepted receipt, Done → `EXIT`, decision
   `NONE`; no follow-up promotion.
6. **Casino proof** — open `/casino`, search `diamonds` or `Book`: relevant
   existing sections/games prioritise; calm rails step one card at a time and
   pause on interaction; responsible gate can SILENCE motion entirely.
7. **Friction path** — repeat reformulated/empty searches to reach MEDIUM
   (SIMPLIFY reduces density); recover by selecting a result. Show the
   Responsible Gate row remaining independent throughout.

## Judge panel

Toggle the judge-only trace panel during the demo to show LIVE SESSION vs
DATASET EVIDENCE, WHY THIS DECISION, SESSION TRACE, provenance and
limitations, measured-only timings, and the independent Responsible Gate.

## Documents

- `PSK_Intelligence_Compliance_Note_FEG_2026.pdf` — compliance note for the
  PSK Intelligence prototype (privacy, responsible-gaming guardrails, data
  provenance).

## Screenshots / captures

Focused E2E rail snapshots are regenerated under `e2e/__screenshots__/` via
`bun run test:e2e:update-snapshots`. Demo video: **not included** (recorded
separately).
