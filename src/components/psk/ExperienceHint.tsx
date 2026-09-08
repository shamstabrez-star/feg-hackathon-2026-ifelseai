import { useSession } from "@/lib/session-intelligence";

/**
 * Customer-facing adaptation driven by the live decision engine.
 * Plain product language only — no AI or assistant wording.
 */
export function ExperienceHint({ className }: { className?: string }) {
  const { intelligence, responsibleGate } = useSession();
  if (!responsibleGate.pass) return null;

  const copy: Record<string, string | null> = {
    SIMPLIFY: "Showing the main markets first. Use “Show more markets” for the full list.",
    DISCOVER: "Popular right now: match result, both teams to score and total goals.",
    CONTINUE: null,
    NONE: null,
  };

  const text = copy[intelligence.decision];
  if (!text) return null;

  return (
    <p
      className={`rounded-md bg-surface-2 px-3 py-2 text-xs text-muted-foreground ${className ?? ""}`}
    >
      {text}
    </p>
  );
}
