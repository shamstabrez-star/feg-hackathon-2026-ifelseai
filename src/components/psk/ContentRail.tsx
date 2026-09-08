import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRailMotion } from "@/lib/rail-motion";

/**
 * An ordinary PSK horizontal content row with manual arrows, swipe and
 * keyboard scrolling. Automatic movement is a *discrete* one-step advance,
 * never a ticker: one card group every few seconds, 600ms smooth, and only
 * while the customer is genuinely idle and the session engine allows it.
 */

const STEP_MS = 600;
const REST_MS = 6500;
const RESUME_AFTER_INTERACTION_MS = 9000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function ContentRail({
  title,
  label,
  children,
  className,
}: {
  title: ReactNode;
  /** Accessible name for the scrollable region. */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastInteraction = useRef(0);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const reduced = usePrefersReducedMotion();
  const motion = useRailMotion();

  const step = useCallback((direction: 1 | -1, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-item]");
    const amount = card ? card.offsetWidth + 8 : Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: direction * amount, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const noteInteraction = useCallback(() => {
    lastInteraction.current = Date.now();
  }, []);

  // Discrete auto-advance. Never runs when the customer is interacting, when
  // reduced motion is preferred, or when the session engine says otherwise.
  useEffect(() => {
    if (reduced || !motion.allowed || hovering || focusWithin) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      if (Date.now() - lastInteraction.current < RESUME_AFTER_INTERACTION_MS) return;
      if (document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 4) return;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else step(1);
    }, REST_MS + STEP_MS);
    return () => clearInterval(timer);
  }, [reduced, motion.allowed, hovering, focusWithin, step]);

  return (
    <section
      className={cn("min-w-0", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={() => setFocusWithin(false)}
      onPointerDownCapture={noteInteraction}
      onTouchStartCapture={noteInteraction}
      onKeyDownCapture={noteInteraction}
      onWheelCapture={noteInteraction}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="truncate text-sm font-bold tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label={`Scroll ${label} left`}
            onClick={() => {
              noteInteraction();
              step(-1);
            }}
            className="grid h-9 w-9 place-items-center rounded-sm bg-surface-2 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${label} right`}
            onClick={() => {
              noteInteraction();
              step(1);
            }}
            className="grid h-9 w-9 place-items-center rounded-sm bg-surface-2 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        onScroll={noteInteraction}
        className="scroll-x mt-2 flex snap-x snap-mandatory gap-2 pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {children}
      </div>
    </section>
  );
}
