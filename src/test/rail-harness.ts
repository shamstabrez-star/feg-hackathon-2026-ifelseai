import { vi } from "vitest";

/**
 * Test-only helpers for the content rail. Nothing here is imported by the app.
 */

export type ScrollSpy = {
  scrollBy: ReturnType<typeof vi.fn>;
  scrollTo: ReturnType<typeof vi.fn>;
  /** Sets what the track reports as its scroll position. */
  setScrollLeft: (value: number) => void;
};

/** jsdom has no layout: give elements stable, deterministic geometry. */
export function stubLayout({
  cardWidth = 160,
  clientWidth = 600,
  scrollWidth = 2000,
}: { cardWidth?: number; clientWidth?: number; scrollWidth?: number } = {}): ScrollSpy {
  let scrollLeft = 0;
  const spy: ScrollSpy = {
    scrollBy: vi.fn(),
    scrollTo: vi.fn(),
    setScrollLeft: (value) => {
      scrollLeft = value;
    },
  };

  const define = (name: string, get: () => number) =>
    vi.spyOn(HTMLElement.prototype, name as "clientWidth", "get").mockImplementation(get);

  define("offsetWidth", () => cardWidth);
  define("clientWidth", () => clientWidth);
  define("scrollWidth", () => scrollWidth);
  vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => scrollLeft);

  Object.assign(HTMLElement.prototype, { scrollBy: spy.scrollBy, scrollTo: spy.scrollTo });
  return spy;
}

/** Deterministic prefers-reduced-motion. */
export function stubMatchMedia(reduced: boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes("reduce"),
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      addListener: (fn: () => void) => listeners.add(fn),
      removeListener: (fn: () => void) => listeners.delete(fn),
      dispatchEvent: () => false,
    })),
  );
}

/** Deterministic document.hidden. */
export function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
}
