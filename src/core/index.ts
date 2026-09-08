/**
 * PSK Intelligence core — framework-agnostic product architecture.
 *
 * Layered on purpose, so the same logic can back any UI layer:
 *   1. PSK UI              — src/components/psk, src/routes (React today)
 *   2. Session state       — ./session-state
 *   3. Intent engine       — ./intent-engine
 *   4. Context engine      — ./context-engine
 *   5. Relevance engine    — ./relevance-engine
 *   6. Friction engine     — ./friction-engine
 *   7. Responsible gate    — ./responsible-gate
 *   8. Experience decision — ./experience-decision
 *   9. Evidence / metrics  — ./metrics-engine + src/data/evidence
 *
 * Nothing below layer 1 imports React or any UI framework.
 */

export * from "./types";
export * from "./session-state";
export * from "./intent-engine";
export * from "./context-engine";
export * from "./relevance-engine";
export * from "./friction-engine";
export * from "./responsible-gate";
export * from "./experience-decision";
export * from "./metrics-engine";
