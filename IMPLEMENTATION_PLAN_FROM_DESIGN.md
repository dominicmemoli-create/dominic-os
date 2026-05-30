# Implementation Plan — Claude Design → Dominic OS

**Date:** 2026-05-29
**Design source of truth:** `Dominic OS Design System` handoff bundle (Claude Design export)
**Target repo:** `dominic-os` (vanilla HTML/CSS/ES-module PWA, GitHub Pages)
**Checkpoint branch:** `pre-design-implementation` (restore point taken before any edits)

> Goal: implement the Claude Design prototype's *visual* direction into the existing app.
> **Do not redesign from scratch. Preserve all current functionality.**

---

## 1. What the handoff defines (visual source of truth)

Read top-to-bottom: `README.md`, `SKILL.md`, `colors_and_type.css`, and the
`ui_kits/dominic-os-app/` recreation (`lib.jsx`, `shell.jsx`, `app-shell.css`,
`app-screens.css`, `screen-*.jsx`).

Non-negotiables pulled from the handoff:

- **Deep-black cinematic canvas**, charcoal **glass** cards, state-driven accents
  (mint = optimal/primary, cyan = recovery/data, amber = effort, hot-pink =
  stalled/danger, violet = accent).
- **Type system:** **Space Grotesk** (display/headings/nav/large metrics),
  **Inter** (body), **JetBrains Mono** (numerals/telemetry/eyebrows).
- **Signature muscle map:** original front+back athletic-anatomy SVG with
  **state-driven bloom** — Push lights chest/delts/triceps (warm), Pull lights
  back/rear-delts/biceps (cool/blue), Legs lights quads/hams/glutes/calves (gold).
- **Glowing conic metric rings** that draw in on load.
- **Command ticker** (top), **floating safe-area bottom nav**.
- **Premium exercise cards** (thumbnail, sets·reps·rest·target, equipment tag, cue).
- **Motion:** rings/charts draw in, cards fade+rise staggered on screen change,
  buttons scale on press, muscle highlights cross-fade. Honor `prefers-reduced-motion`.
- **Premium empty states instead of fake data.** 44px tap targets. No emoji. No overflow.

## 2. Current repo state (audit)

The live app already carries a "premium redesign pass" — `css/styles.css` already
matches the handoff's color/surface/gradient/radii/shadow tokens almost exactly,
and the shell (ticker, floating nav, glass cards, chips, buttons) is in place.

**Functionality that MUST be preserved (verified present & working):**

| Capability | Where |
|---|---|
| Hash routing (`#/gym`, etc.) | `js/app.js` |
| localStorage persistence | `js/store.js` (single `dominicOS` key) |
| Import / export / reset | `js/store.js` + `dataBackupCard` (Today, Admin) |
| Workout generation (rule-based, double-progression) | `js/workoutCoach.js` |
| Workout logging → history + PRs | `js/pages/gym.js` (session) |
| Exercise library (60+, CRUD, filter) | `js/pages/gym.js` + `js/schema.js` |
| Mobile PWA / safe area | `index.html`, `manifest.json`, `styles.css` |
| GitHub Pages compatibility | static, relative paths, no build step |

**Gaps vs. the handoff (what this plan fixes):**

1. **Fonts** — repo uses system sans/mono; handoff mandates Space Grotesk + Inter + JetBrains Mono.
2. **Muscle map** — repo `pageGraphic('muscle')` is an abstract blob, not the anatomical map with states.
3. **Motion** — no staggered entrance, no ring draw-in, button press is a 1px nudge not a scale.
4. **Exercise imagery** — every library item is a placeholder; handoff maps real (public-domain) photos.
5. **Minor filler fallbacks** — ticker Focus defaults to `87`, health graphic ring to `82` with no data.

## 3. Change set (additive, low-risk)

### CSS — `css/styles.css`
- Add Google Fonts `@import` (Space Grotesk, Inter, JetBrains Mono).
- Add `--display` token; route `--font` through Inter and `--mono` through JetBrains Mono.
- Apply Space Grotesk to headings, hero/page titles, nav labels, ring values, `.big-num`/`.kpi`.
- Port the handoff **`.mmap` muscle-map styles** verbatim (push/pull/legs bloom + breathe).
- Add **entrance animation** (`.main.screen-anim > *` fade/rise w/ nth-child stagger).
- Add **ring draw-in** transition; button `:active { scale(.97) }`.
- `.muscle-figure` wrapper sizing for hero + dedicated map card.

### JS
- `js/components.js` — add `muscleMap(day)` builder (vanilla port of `lib.jsx` MuscleMap)
  + `splitTone()`; upgrade `pageGraphic('muscle', {day})` to render it. Ring draw-in (rAF) in `metricRing`.
- `js/app.js` — trigger the entrance animation on **route change only** (not in-page refresh).
- `js/pages/gym.js` — render the real muscle map (lit for today's split) in the hero
  and as a dedicated "Today's target" card; keep all session/logging logic untouched.
- `js/ticker.js` — make Focus honest when there are no priorities (`--`/idle, not `87`).
- `js/schema.js` — add real Free Exercise DB (public-domain) image URLs to ~15 core
  machine/cable lifts, with the existing `onerror` placeholder fallback intact
  (no broken images possible). Bump `DATA_VERSION` 3→4 so untouched libraries refresh.

### Out of scope / explicitly NOT doing
- No route removal, no schema-shape changes, no backend, no secrets.
- No new build step (stays static for GitHub Pages).
- No fabricated default records (starter mode stays: library + 1 split only).

## 4. Verification (post-edit)
- Serve locally, load every route: `today, gym, health, productivity, review, school, admin`.
- Test mobile width (~390px) — no horizontal overflow, nav doesn't overlap content.
- Verify no console errors.
- Verify workout **generation** (Gym → Today) and **logging** (start → complete sets → save → Progress/PRs).
- Verify import/export still round-trips.
- Confirm `prefers-reduced-motion` disables the new animations.

## 5. Deliverables
- `IMPLEMENTATION_PLAN_FROM_DESIGN.md` (this file)
- `CHANGELOG_DESIGN_IMPLEMENTATION.md` (written after edits)
- Checkpoint branch `pre-design-implementation` for rollback.
