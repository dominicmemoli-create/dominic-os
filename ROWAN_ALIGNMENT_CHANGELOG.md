# Rowan Alignment Changelog

The "Rowan Visual Alignment + Product Correction" pass. The app was **not** rebuilt — the working data layer, store, export/import, workout builder, progression logic, health/school/admin/review pages, mobile nav, and dark theme were all preserved. A checkpoint branch `pre-rowan-visual-alignment` captures the previous state.

See `ROWAN_VISUAL_AUDIT.md` for the source-of-truth inspection that drove these changes.

## Visual changes
- **New palette = Rowan's.** Background `#050506` with a drifting warm-orange + cool-grey radial wash and a film-grain overlay. Text `#FAFAFA / #B8B6B0 / #76746E`. Semantics: green `#6BE3A4`, gold `#F2C063`, red `#FF6B6B`, water sky `#7DD3FC`. The old neon hot-pink/mint/amber scheme is gone. (Legacy class names like `text-pink` were repointed to the new palette rather than renamed across every file.)
- **Monospace numerals** (`ui-monospace`) for counts, weights, dates, percentages — the "instrument panel" feel.
- **Borderless glass cards**: `rgba(255,255,255,0.04)`, no border, 16px radius, `blur(24px) saturate(1.2)`, soft shadow.
- **Primary buttons** are now a white gradient pill with near-black text (Rowan), not a colored fill.
- **Section titles** are mono uppercase eyebrows with a dash-before + fading-line.
- **Gradient-masked page titles** (white→grey through the letterforms).
- Day ring recolored to a warm gold progress arc.

## Structural changes
- **Command bar** (`ticker.js`) rewritten from a scrolling marquee into Rowan's **sticky pill bar**: `Goals · Stack · Water(+) · Gym · Next`, each with a status dot (green/gold/**red miss-pulse after 6pm**) and a mono count. The **water `+` logs a bottle from any page**.
- **Cycling LED goal ticker** added to the Today page (NASDAQ strip): pulsing green LED, `GOALS` label, a `done/total` pill, and pending priorities / missed supplements / running-low / overdue / next focus action cycling every ~4.2s with slide animations.
- **Bottom nav** changed from edge-to-edge to a **floating rounded pill tabbar** (centered, blurred, shadowed) — Rowan's `.tabbar` look. The desktop sidebar is retained but the app is phone-first.
- **Today** gained a completion segmented bar + "X / 3 done · all done — solid day" feel.
- **Gym** progression is now shown as Rowan **prescription cards** (`po-rx`): big mono target headline + up/hold/down/new tag + reason, with the exercise visual inline.

## Navigation changes
- Routes are now: **Today · Productivity · Gym · Health · School · Admin · Review** (7).
- AFTERGLOW removed from routes, sidebar, bottom nav, and the command bar.

## How AFTERGLOW was removed & replaced
- Deleted `js/pages/afterglow.js`; added `js/pages/productivity.js`.
- `schema.js`: removed the entire `afterglow` object and all founder sample data (co-packers, regulatory/TTB/MLCC/FDA, Launch/Burgess, funding, product testing, pitch deck, stage tracker). Added a `productivity` object: `weeklyGoals, deepWorkBlocks, priorityBacklog, followUps, lifeAdmin, habits`, each with clearly-labeled general-life sample data.
- `store.js` `migrate()` performs a **v1→v2 upgrade**: it `delete`s any legacy `afterglow` key from existing localStorage, guarantees the `productivity` sub-collections exist, and (if the gym library is still the untouched demo) swaps in the expanded library — so old data neither crashes nor leaves dead AFTERGLOW state behind.
- `compute.js`: `afterglowNextAction()` → `productivityNextAction()`; deadlines now include productivity follow-ups/admin.
- `ticker.js`, `today.js`, `review.js`: all AFTERGLOW references replaced with productivity equivalents.
- Docs scrubbed of founder/startup language (this changelog and the audit are the only places AFTERGLOW is named, as "removed/replaced").
- **Verified:** a regex scan of the serialized app state for `afterglow|co-?packer|founder|burgess` returns nothing.

## Gym section changes
- Exercise library expanded from ~24 to **70 exercises**, **55 of them machine or cable** (~79%), modeled on a commercial gym (OneLife Fitness — selectorized & plate-loaded machines, cable stations, Smith, assisted machines, free weights, functional turf). See `EXERCISE_LIBRARY_NOTES.md`.
- Every exercise now carries full metadata (category, primary/secondary muscles, equipment, classification, sets/reps/rest/increment, difficulty, cues, common mistakes, substitutions, `imageUrl/imageSource/imageLicenseNotes`).
- **Every exercise card shows an intentional visual**: a classification-tinted card with a line-art glyph, a target-muscle badge, an equipment label, a movement-direction cue, and an "Instruction placeholder" tag. If an `imageUrl` is set it renders the photo with an **error fallback to the placeholder** — so a broken image can never appear.
- The sample split is now machine/cable-first; the weekly generator and exercise swap both draw from the expanded library (swap ranks same-category machine/cable options first).

## Health changes
- Inherits the Rowan palette; supplements stay grouped by morning/lunch/evening/anytime with the **red missed-dose pulse** and running-low flag; water add/subtract + transparent target + 14-day history; the **recovery + wearable cards sit below** the supplement and water sections (kept as future prep only).

## Ticker / topbar changes
- See "Command bar" + "LED goal ticker" above. No AFTERGLOW items remain.

## What remains different from Rowan, and why
- **SPA vs. file-per-tab.** Dominic OS stays a hash-router SPA over a single central store (preserves export/import and a shared data layer). Matching Rowan's *look* did not require copying his multi-HTML-file architecture.
- **Storage shape.** Kept the versioned single-object store + JSON backup rather than Rowan's `goals:DATE` / `stack:items` / `po_water_v1` keys.
- **Local-midnight day keys** (not Rowan's 6 AM boundary) to avoid migrating existing history.
- **No live Supabase/WHOOP.** Future prep only; no secrets in the frontend (matches Rowan's placeholder approach and the original Dominic OS constraints).
- **Desktop sidebar retained** as a convenience on wide screens; hidden on phones where the floating tabbar is primary.

## QA run (all passed)
All 16 modules import clean; all 7 pages render with no console errors; 0 horizontal overflow at 375px; v1→v2 migration verified (no AFTERGLOW, productivity present, 70 exercises/55 machine-cable); start→log→complete workout updates sessions + progression + PRs; exercise swap uses the expanded library; export→mutate→import round-trips; LED ticker + global water `+` + supplement windows all live. (Screenshot capture was unavailable — the headless renderer stalled on capture — so verification was done via DOM inspection.)
