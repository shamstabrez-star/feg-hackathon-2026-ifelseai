import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { setDocumentHidden, stubLayout, stubMatchMedia, type ScrollSpy } from "@/test/rail-harness";

const railMotion = vi.fn();
vi.mock("@/lib/rail-motion", () => ({ useRailMotion: () => railMotion() }));

import { ContentRail } from "@/components/psk/ContentRail";

/** Matches the controller's rest + step budget (6500ms + 600ms). */
const CYCLE_MS = 7100;
const RESUME_AFTER_INTERACTION_MS = 9000;

let scroll: ScrollSpy;

function renderRail({ allowed = true, reduced = false } = {}) {
  railMotion.mockReturnValue({ allowed, reason: allowed ? "allowed" : "paused" });
  stubMatchMedia(reduced);
  scroll = stubLayout();
  const view = render(
    <ContentRail title="Popular" label="Popular games">
      {["a", "b", "c", "d", "e"].map((id) => (
        <div key={id} data-rail-item>
          <button type="button">Game {id}</button>
        </div>
      ))}
    </ContentRail>,
  );
  // Flush the reduced-motion effect that gates all automatic movement.
  act(() => {
    vi.advanceTimersByTime(0);
  });
  return view;
}

const track = () => screen.getByRole("group", { name: "Popular games" });
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  setDocumentHidden(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ContentRail automatic motion", () => {
  it("advances exactly one discrete step per rest cycle, left to right", () => {
    renderRail();
    advance(CYCLE_MS);
    expect(scroll.scrollBy).toHaveBeenCalledTimes(1);
    expect(scroll.scrollBy).toHaveBeenCalledWith({ left: 168, behavior: "smooth" });

    advance(CYCLE_MS);
    expect(scroll.scrollBy).toHaveBeenCalledTimes(2);
  });

  it("does not move before a full rest interval has elapsed", () => {
    renderRail();
    advance(CYCLE_MS - 1);
    expect(scroll.scrollBy).not.toHaveBeenCalled();
  });

  it("wraps back to the start instead of jumping when the end is reached", () => {
    renderRail();
    scroll.setScrollLeft(2000 - 600); // fully scrolled
    advance(CYCLE_MS);
    expect(scroll.scrollBy).not.toHaveBeenCalled();
    expect(scroll.scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
  });

  it("never moves when the customer prefers reduced motion", () => {
    renderRail({ reduced: true });
    advance(CYCLE_MS * 3);
    expect(scroll.scrollBy).not.toHaveBeenCalled();
    expect(scroll.scrollTo).not.toHaveBeenCalled();
  });

  it("never moves while the tab is hidden, and resumes once visible again", () => {
    renderRail();
    setDocumentHidden(true);
    advance(CYCLE_MS * 2);
    expect(scroll.scrollBy).not.toHaveBeenCalled();

    setDocumentHidden(false);
    advance(CYCLE_MS);
    expect(scroll.scrollBy).toHaveBeenCalledTimes(1);
  });
});

describe("ContentRail interaction always wins", () => {
  it.each([
    ["desktop hover", () => fireEvent.mouseEnter(screen.getByText("Popular").closest("section")!)],
    ["touch", () => fireEvent.touchStart(track())],
    ["pointer drag", () => fireEvent.pointerDown(track())],
    ["manual scroll wheel", () => fireEvent.wheel(track())],
    ["keyboard navigation", () => fireEvent.keyDown(track(), { key: "ArrowRight" })],
    ["clicking a card", () => fireEvent.pointerDown(screen.getByText("Game a"))],
    ["keyboard focus in the rail", () => screen.getByText("Game a").focus()],
  ])("pauses automatic motion on %s", (_label, interact) => {
    renderRail();
    act(() => {
      interact();
    });
    advance(CYCLE_MS * 2);
    expect(scroll.scrollBy).not.toHaveBeenCalled();
  });

  it("keeps motion paused while focus stays inside the rail", () => {
    renderRail();
    act(() => {
      fireEvent.focusIn(screen.getByText("Game a"));
    });
    advance(CYCLE_MS * 3);
    expect(scroll.scrollBy).not.toHaveBeenCalled();
  });

  it("resumes only after the deferred inactivity delay following an interaction", () => {
    renderRail();
    act(() => {
      fireEvent.pointerDown(track());
    });
    // Pointer interaction sets a resume delay; the mouse never entered, so the
    // only thing holding motion back is the inactivity window.
    advance(CYCLE_MS);
    expect(scroll.scrollBy).not.toHaveBeenCalled();

    advance(RESUME_AFTER_INTERACTION_MS);
    expect(scroll.scrollBy).toHaveBeenCalledTimes(1);
  });

  it("resumes after the pointer leaves, once inactivity has passed", () => {
    renderRail();
    const section = screen.getByText("Popular").closest("section")!;
    act(() => {
      fireEvent.mouseEnter(section);
    });
    advance(CYCLE_MS * 2);
    expect(scroll.scrollBy).not.toHaveBeenCalled();

    act(() => {
      fireEvent.mouseLeave(section);
    });
    advance(CYCLE_MS);
    expect(scroll.scrollBy).toHaveBeenCalledTimes(1);
  });
});

describe("ContentRail manual controls", () => {
  it("keeps arrows working in both directions", () => {
    renderRail();
    fireEvent.click(screen.getByRole("button", { name: "Scroll Popular games right" }));
    expect(scroll.scrollBy).toHaveBeenLastCalledWith({ left: 168, behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: "Scroll Popular games left" }));
    expect(scroll.scrollBy).toHaveBeenLastCalledWith({ left: -168, behavior: "smooth" });
  });

  it("still allows manual arrows when the session engine has stopped auto-motion", () => {
    renderRail({ allowed: false });
    advance(CYCLE_MS * 2);
    expect(scroll.scrollBy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Scroll Popular games right" }));
    expect(scroll.scrollBy).toHaveBeenCalledTimes(1);
  });

  it("exposes the track as a labelled, keyboard-reachable region", () => {
    renderRail();
    expect(track()).toHaveAttribute("tabindex", "0");
  });
});

describe("ContentRail session-intelligence gating", () => {
  it("does not auto-advance whenever the engine reports motion is not allowed", () => {
    // Covers search typing/results, high intent, game or match opening, filters,
    // betslip interaction, transaction, completion/exit and MEDIUM/HIGH friction —
    // every one of those is expressed by the engine as allowed: false.
    renderRail({ allowed: false });
    advance(CYCLE_MS * 5);
    expect(scroll.scrollBy).not.toHaveBeenCalled();
    expect(scroll.scrollTo).not.toHaveBeenCalled();
  });
});
