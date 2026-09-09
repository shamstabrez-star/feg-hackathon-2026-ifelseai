# PSK Casino experience enhancement

## Goal
Upgrade only the existing Casino page so it resembles the supplied real PSK Casino references while preserving the PSK shell, Sports journey, shared intelligence engines, responsible controls, judge evidence boundaries, and calm carousel behaviour.

## Implementation

1. **Recover authentic PSK Casino artwork**
   - Crop only clearly visible individual banners, game tiles, jackpot artwork, and provider marks from the supplied screenshots.
   - Preserve the pixels as supplied: no regeneration, recolouring, enhancement, invented copy, providers, values, or branded creative.
   - Use the best native-quality crop available; retain an existing neutral prototype placeholder where a clean crop is not possible.
   - Upload the cropped binary assets through the project asset pipeline and reference their immutable cached URLs.

2. **Build the PSK-style Casino lobby within the existing shell**
   - Keep the existing main navigation and add the screenshot-backed Casino secondary navigation within the Casino page.
   - Add a restrained promotional area based on supplied PSK banner crops, followed by the existing search and curated content rows.
   - Organise supplied content into PSK Favorites, New Games, Provider of the Week, Popular, provider collections, Jackpots, Themes, Table Games, Instant Games, and Providers only where the references support them.
   - Keep the first carousel accessible as **“Slots games”** and preserve direct rail-item structure required by current motion and browser tests.
   - Use fixed image ratios, readable labels/badges, keyboard-accessible controls, and mobile-first horizontal rows without page overflow.

3. **Add Casino-only content orchestration**
   - Keep the current session engines unchanged and derive a local Casino presentation state: `SHOW`, `PRIORITISE`, `DEFER`, or `SILENCE`.
   - Default browsing uses curated PSK ordering and normal density.
   - `diamonds` prioritises supplied Diamond titles; `Playtech` prioritises supplied Playtech/provider content; `blackjack` prioritises table content.
   - MEDIUM friction reduces competing rows; HIGH friction simplifies; Responsible Gate ADAPT/SILENCE reduces or suppresses promotional/discovery content.
   - Active intent, search, selection, transaction, completion, reduced motion, and hidden-tab rules continue to govern the existing carousel without changing its timing or behaviour.

4. **Progressive and stable loading**
   - Render the shell, navigation, visible promotion, first visible row, and immediately relevant results first.
   - Defer below-fold rows with viewport-aware loading and stable reserved heights/aspect ratios to avoid layout shift.
   - Lazy-load images, reuse CDN-cached assets, and provide appropriately sized crops for mobile where the supplied source allows it.
   - Keep search results static and preserve existing debounced `Book` discovery and product-scoped context.

5. **Judge-only transparency**
   - Add concise live rows for Casino content decision, reason, loading state, and asset provenance.
   - Label screenshot-derived assets truthfully and keep immutable dataset evidence separate from live prototype signals.
   - Report only measured values; otherwise show `Unavailable in prototype`.

## Technical boundaries
- Primary changes stay in Casino route/data/presentation modules plus cropped asset pointers.
- Do not modify the Sports routes, betslip, shared Session/Intent/Context/Friction/Responsible/Decision engines, or carousel controller unless a verified regression requires a minimal correction.
- No game launch, automatic bet/stake/action, recommendation engine, new product surface, urgency, cross-product nudge, or customer-facing intelligence terminology.

## Verification
- Run TypeScript, lint, and all existing unit tests.
- Run the real-browser Playwright suite at 1440, 834, 430, and 375 px; update focused Casino snapshots only after the lobby is stable.
- Verify Casino default browse, `Book`, `diamonds`, `Playtech`, and `blackjack`; carousel idle/manual/pause/reduced-motion/visibility behaviour; lazy loading and stable geometry; keyboard/touch reachability; no page overflow or console errors.
- Re-run the Sports `Madird → Real Madrid → selection → accepted bet → Done` journey to confirm no regression.
- Document the headless visibility simulation and required browser library-path environment constraint truthfully.
