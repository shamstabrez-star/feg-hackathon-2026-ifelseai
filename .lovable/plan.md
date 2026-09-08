# Adaptive Session Engine

Extends the existing PSK prototype in place. No rebuild, no redesign, no new products, no chatbot, no customer-facing AI wording. The Sports journey, shell, search, markets, betslip and evidence layer stay exactly as they are.

## 1. Full journey state machine

The current session recognises six stages. It becomes ten, derived automatically from real interactions:

```text
ENTRY → DISCOVERY → INTENT → CONTEXT → EXPLORATION → DECISION → ACTION → TRANSACTION → COMPLETION → EXIT
```

- ENTRY — session opened, no meaningful interaction yet
- DISCOVERY — browsing or a first search typed
- INTENT — a search resolves to a clear target (high confidence)
- CONTEXT — that target's event is opened, context established
- EXPLORATION — markets reviewed or expanded on the event
- DECISION — an outcome is selected
- ACTION — selection sits in the betslip and stake is set
- TRANSACTION — Confirm pressed, placement in flight
- COMPLETION — bet accepted
- EXIT — Done pressed after completion

Nothing is user-activated and nothing is animated on a timer; each transition follows an actual event already logged in the session.

## 2. Session context object

The session exposes one structured, privacy-safe object: sessionId (synthetic, e.g. S-R8NF), journeyStage, intent, intentConfidence, activeSport, activeEvent, activeCompetition, activeSearch, lastViewedEvent, lastSelectedMarket, frictionLevel, responsibleGate, experienceDecision, outcome. No identifiers, tokens, URLs or personal data — same sanitisation rules already in force.

## 3. Intent and context

- "Madird" continues to resolve to Real Madrid with no visible correction; the session records intent "Find Real Madrid" with high confidence.
- Opening Real Madrid – Inter Milano sets activeSport Football, activeEvent and activeCompetition, and the context persists across pages for the rest of the session.

## 4. Recommendation rail

The existing "We recommend" area only changes its heading and ordering: "Related to your search" during an active search, "Continue where you left off" after an event was opened, "Relevant to you" on strong context, and the plain PSK rail when there is no reason to adapt. No new component, no forced suggestions.

## 5. Decision, gate, friction, performance

- Experience decision stays SIMPLIFY / DISCOVER / CONTINUE / NONE, now fed by the fuller stage model: new session → NONE, typo with a clear target → SIMPLIFY, active search with results → DISCOVER, returning to a viewed event → CONTINUE, completed journey → NONE.
- Responsible gate is evaluated before any optimisation and can only restrict it: PASS / ADAPT / SILENCE; SILENCE suppresses all adaptation. Prototype control layer, no regulatory claims.
- Friction becomes a banded level LOW / MEDIUM / HIGH over the existing score, with conservative thresholds. Ordinary navigation and Back are never friction.
- Performance values remain measured-only; anything unmeasured reads "Not measured".

## 6. Intelligence trace (judge only)

Collapsed stays "⌁ PSK Intelligence · Session active". Expanded reads live from the session: Session, Intent, Context, Journey (previous → current), Friction, Decision, Responsible Gate, Outcome, Experience Decision. After confirmation: Outcome "Bet accepted", Experience Decision NONE, reason "Journey completed successfully. No additional intervention required." After Done: stage EXIT, decision NONE, and nothing further is suggested. Existing evidence, metrics and event sections are kept.

## 7. Technical notes

- `src/core/types.ts` — widen `JourneyStage` to the ten states; add `IntentConfidence`, `FrictionLevel`, `SessionContext`.
- `src/core/experience-decision.ts` — rewrite `journeyStage()` for the ten-state machine and extend `decideExperience` inputs (intent confidence, exited flag, transaction in flight).
- `src/core/session-state.ts` — add `exited` and `placing` flags plus an `exit` action; extend `deriveSession` to build the session-context object and friction band.
- `src/core/friction-engine.ts` — add `frictionLevel(score)` banding.
- `src/lib/session-intelligence.tsx` — expose `sessionContext` and an `exit()` call; React adapter only, no logic.
- `src/components/psk/Betslip.tsx` — Confirm marks TRANSACTION, Done calls `exit()`.
- `src/components/psk/IntelligenceTrace.tsx` — render the fields from `sessionContext`.
- `src/components/psk/PskSidebar.tsx` — rail heading/order reads the stage and decision.

## 8. Verification

Playwright run of the full journey (Sports → "Madird" → Real Madrid – Inter Milano → markets → selection → betslip → Confirm → Bet accepted → Done) at 1440, 834, 430 and 375 px, asserting the trace progresses ENTRY → DISCOVERY → INTENT → CONTEXT → EXPLORATION → DECISION → ACTION → TRANSACTION → COMPLETION → EXIT with NONE at the end, zero horizontal overflow, no console errors and no change to existing routes.
