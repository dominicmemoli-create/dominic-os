# Build Log — Dominic OS

Overnight V1 build. Goal: a working, polished, mobile-friendly dashboard that opens and deploys with zero config.

## What was built

**Tier 1 (finished + polished):**
- App shell: responsive layout, dark premium theme, sticky NASDAQ-style command ticker, mobile bottom nav (7 routes) + desktop sidebar, hash router.
- Central data layer (`store.js`) over a single `localStorage` key, with import/export JSON backup, reset-to-demo, storage meter + near-limit warning, and a change-event bus that live-refreshes the ticker.
- **Today** — day-progress ring, mode selector, 3 track priorities, full task CRUD (add/edit/delete/done/push-to-tomorrow), 0–5 scorecard, reflection. Daily logs keyed by date, never overwritten.
- **Gym** — sub-tabbed (Today / Plan & Split / Library / Body & Photos / Progress). Split editor, exercise library CRUD, weekly plan generator, live set-by-set logging with swap/add/remove, completion that writes a session + updates PRs, and a progression view. Body-weight tracker with 7-day sparkline; compressed progress photos.
- **Health** — supplement stack grouped by timing with flashing missed flags + running-low; transparent water target (with breakdown) + 14-day history; manual sleep/recovery → readiness score + training call; wearable-prep roadmap card.

**Tier 2 (working CRUD + clearly-labeled sample data):**
- **AFTERGLOW** — stage tracker, weekly priorities, co-packers, regulatory checklist, Launch tasks, product testing, funding readiness, 7-day queue.
- **School** — classes, assignments, exams, study blocks.
- **Admin** — reminders/errands, subscriptions (monthly/yearly cost roll-up), contacts.
- **Review** — auto-computes workouts, volume, readiness avg, task/water/supplement adherence, scorecard averages, bodyweight delta, PRs over a weekly/monthly window; plus saved reflections.

## Key decisions
- **No framework / no build step.** ES modules with a thin DOM helper (`ui.js`'s `el()`), so it deploys as static files and never breaks on a missing toolchain. Pages are modules exporting `render(main)` and rebuild from the store on every change (simple + robust over diffing).
- **One storage key, one data layer.** Every read/write goes through `store.js`. UI never touches `localStorage` directly, so swapping in Supabase later touches only that file (see `NEXT_STEPS.md`).
- **Photos are compressed at capture.** `compressImage()` downscales to ~400px and re-encodes JPEG q0.6 to a thumbnail data-URL before storage; storage meter warns near the ~5MB cap and saves fail gracefully.
- **No secrets, no OAuth, no fake AI.** `wearableProvider.js` is an empty-function stub. Workout logic is fully rule-based in `workoutCoach.js`. Exercise images use styled placeholders with an editable `imageUrl`.
- **Local-time date keys** (`dates.js`) so "today" matches the wall clock (not UTC).

## Source reference (Rowan Thistlebrooke) — time-boxed
Did **not** spend session time hunting the GitHub repos (`RowanThistlebrooke` — YTdashh1, dashboard, Whoop-RowanTBK, etc.); per the brief they may be private/unreachable and chasing them isn't worth the overnight budget. Built from the transcript understanding instead and **improved on it** where called out: centralized storage (vs scattered `getItem`), mobile-first bottom nav, photo compression, and a cleaner premium UI. Patterns adopted: always-visible goals via a sticky ticker, supplement timing windows with flashing missed warnings, a personal-inputs water tracker, gym progressive-overload coaching, and a Supabase-sync-ready data layer. The WHOOP OAuth structure is kept only as a future pattern (`wearableProvider.js`), not a V1 feature.

## Gym progression rules (rule-based, in `workoutCoach.js`)
**Double progression within each exercise's rep range** (e.g. 4 sets of 6–9):
- **Increase** — if every working set hit the **top** of the range last session → add one `increment` (lb) and reset target to the **bottom** of the range. Flagged "ready to add weight".
- **Hold** — otherwise → keep the weight, target one more rep toward the top.
- **Stalled** — if the top set missed the **bottom** of the range for **2 sessions running** → suggest a ~10% deload and rebuild. Flagged red.
- **New** — no history → pick a weight for the bottom of the range.
- **Est. 1RM** uses Epley (`weight × (1 + reps/30)`); the best e1rm per exercise becomes its PR.
- **Recovery adjustment** — readiness <40 trims one set/exercise and holds weight; 40–60 holds; ≥75 green-lights pushing.

## QA performed
Served via `python -m http.server` and driven in the preview browser:
- All 7 pages render with content; **no console errors**.
- Live workout: logged 3 sets at top of range → progression correctly flipped to "increase" (+5 lb, reset reps) and recorded a PR; session persisted.
- Export → mutate → import round-trip restored exact state; reset-to-demo works; storage meter reads correctly.
- Water add, supplement toggle, running-low, and readiness all update live.
- Mobile (375px): **zero horizontal overflow**. Desktop (1280px): sidebar shows, bottom nav hides.
- One bug found + fixed: `review.js` imported `summarizeWeeklyTraining` from the wrong module.

## Known limitations / left for later
- Tasks track a `done` boolean but not a completion timestamp, so Review's "tasks done" is all-time, not windowed.
- App icons are generated placeholders (gradient "D"). Replace with real brand art.
- Desktop screenshot capture was flaky in the QA tool (renderer, not the app) — verified desktop structurally instead.
- See `NEXT_STEPS.md` for Supabase sync and the wearable integration plan.
