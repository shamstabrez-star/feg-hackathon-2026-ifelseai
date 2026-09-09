import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/session-intelligence";
import { sportsHeroDecision, sportsHeroItems } from "@/data/sports-hero";
import { cn } from "@/lib/utils";

const REST_MS = 7000;

export function SportsHero() {
  const { state, responsibleGate } = useSession();
  const decision = sportsHeroDecision(state, responsibleGate.state);
  const ordered = useMemo(
    () => [
      ...sportsHeroItems.filter((item) => item.id === decision.priorityId),
      ...sportsHeroItems.filter((item) => item.id !== decision.priorityId),
    ],
    [decision.priorityId],
  );
  const [active, setActive] = useState(0);
  const [primaryLoaded, setPrimaryLoaded] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const cooldown = useRef<number | null>(null);

  useEffect(() => {
    setActive(0);
    setPrimaryLoaded(false);
    if (decision.loading !== "Intent-aware prefetch") return;
    const priority = ordered[0];
    if (!priority) return;
    const image = new Image();
    image.src = priority.src;
  }, [decision.loading, decision.priorityId, ordered]);

  useEffect(() => {
    if (decision.motion !== "ACTIVE" || interacted || ordered.length < 2) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || document.visibilityState === "hidden") return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % ordered.length), REST_MS);
    return () => window.clearInterval(timer);
  }, [decision.motion, interacted, ordered.length]);

  useEffect(
    () => () => {
      if (cooldown.current !== null) window.clearTimeout(cooldown.current);
    },
    [],
  );

  if (decision.decision === "NONE") return null;

  const pauseTemporarily = () => {
    setInteracted(true);
    if (cooldown.current !== null) window.clearTimeout(cooldown.current);
    cooldown.current = window.setTimeout(() => setInteracted(false), REST_MS);
  };
  const shown = ordered[active] ?? ordered[0];
  if (!shown) return null;

  return (
    <section
      aria-label="PSK offers"
      className={cn("mb-4", decision.motion === "OFF" && "opacity-70")}
      onPointerDown={pauseTemporarily}
      onFocusCapture={() => setInteracted(true)}
      onBlurCapture={pauseTemporarily}
      onMouseEnter={() => setInteracted(true)}
      onMouseLeave={pauseTemporarily}
    >
      <div className="relative aspect-[1.76/1] max-h-[12rem] min-h-[8.5rem] overflow-hidden rounded-md bg-surface sm:aspect-[3.2/1] sm:max-h-[15rem]">
        {ordered.map((item, index) => {
          const visible = index === active;
          if (index > 0 && !primaryLoaded) return null;
          return (
            <img
              key={item.id}
              src={item.src}
              alt={item.label}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
              onLoad={() => index === 0 && setPrimaryLoaded(true)}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-600 motion-reduce:transition-none",
                visible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            />
          );
        })}
      </div>
      {decision.motion === "ACTIVE" && ordered.length > 1 ? (
        <div className="mt-2 flex justify-center gap-2" aria-label="Choose offer">
          {ordered.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.label}`}
              aria-pressed={index === active}
              onClick={() => {
                setActive(index);
                pauseTemporarily();
              }}
              className={cn(
                "h-2.5 w-2.5 rounded-full outline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                index === active ? "bg-primary" : "bg-muted-foreground/40",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}