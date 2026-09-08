/**
 * Layer 4b — Product context.
 *
 * The portable session/context model recognises which existing PSK product the
 * customer is actually in. It never creates a product, a recommendation or a
 * cross-product prompt: it only tells the session engine which context is
 * active, so context from one product can never steer another.
 */

export type ProductKey =
  | "SPORT"
  | "LIVE"
  | "CASINO"
  | "LIVE_CASINO"
  | "LOTTO"
  | "VIRTUALS"
  | "FORUM"
  | "PSK_ARENA"
  | "OTHER";

export type ProductProfile = {
  key: ProductKey;
  /** Judge-facing product label. */
  label: string;
  /** Default intent when the customer simply enters the product. */
  intent: string;
  /** Default active context label for that product. */
  context: string;
};

export const PRODUCTS: Record<ProductKey, ProductProfile> = {
  SPORT: { key: "SPORT", label: "Sport", intent: "Browse sports offer", context: "Sports" },
  LIVE: { key: "LIVE", label: "Live", intent: "Browse live events", context: "Live sports" },
  CASINO: { key: "CASINO", label: "Casino", intent: "Browse casino", context: "Casino" },
  LIVE_CASINO: {
    key: "LIVE_CASINO",
    label: "Live Casino",
    intent: "Browse live casino",
    context: "Live casino",
  },
  LOTTO: { key: "LOTTO", label: "Lotto", intent: "Browse draws", context: "Lotto" },
  VIRTUALS: {
    key: "VIRTUALS",
    label: "Virtuals",
    intent: "Browse virtual events",
    context: "Virtual events",
  },
  FORUM: { key: "FORUM", label: "Forum", intent: "Community discovery", context: "Forum" },
  PSK_ARENA: {
    key: "PSK_ARENA",
    label: "PSK Arena",
    intent: "Community discovery",
    context: "PSK Arena",
  },
  OTHER: { key: "OTHER", label: "PSK", intent: "Browse the offer", context: "PSK" },
};

/** Maps an existing PSK route to the product the customer is actually in. */
export function productFromPath(pathname: string): ProductKey {
  const p = pathname.toLowerCase();
  if (p.startsWith("/live-casino")) return "LIVE_CASINO";
  if (p.startsWith("/live")) return "LIVE";
  if (p.startsWith("/casino")) return "CASINO";
  if (p.startsWith("/loto") || p.startsWith("/lotto")) return "LOTTO";
  if (p.startsWith("/virtuals")) return "VIRTUALS";
  if (p.startsWith("/forum")) return "FORUM";
  if (p.startsWith("/psk-arena")) return "PSK_ARENA";
  if (p === "/" || p.startsWith("/match") || p.startsWith("/swipe-and-bet")) return "SPORT";
  return "OTHER";
}
