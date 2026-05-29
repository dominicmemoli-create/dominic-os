# Premium UI Audit

Pre-redesign audit date: 2026-05-29.

## Scope

- Local app served at `http://127.0.0.1:5610`.
- Live app opened at `https://dominicmemoli-create.github.io/dominic-os/#/gym`.
- Routes audited: `#/today`, `#/productivity`, `#/gym`, `#/health`, `#/school`, `#/admin`, `#/review`.
- Viewports audited: `375x812`, `390x844`, `430x932`, `768x1024`, `1440x900`.
- Primary visual target: `C:/Users/dombo/Downloads/ChatGPT Image May 29, 2026, 11_20_35 AM.png`.

## Screenshots

Screenshots were captured for all 35 route/viewport combinations in `audit-screenshots/pre/`.

- `audit-screenshots/pre/today-375x812.png`
- `audit-screenshots/pre/productivity-375x812.png`
- `audit-screenshots/pre/gym-375x812.png`
- `audit-screenshots/pre/health-375x812.png`
- `audit-screenshots/pre/school-375x812.png`
- `audit-screenshots/pre/admin-375x812.png`
- `audit-screenshots/pre/review-375x812.png`
- The same seven routes were also captured at `390x844`, `430x932`, `768x1024`, and `1440x900`.

## Concept Comparison

The target image uses a cinematic black command surface, compact top metrics, aqua/green health-tech accents, soft glass cards, strong rings, human/body visuals, device-native mobile spacing, and premium exercise cards with imagery and clear set metadata. The current app has the correct information architecture, but it reads as stacked generic dark cards rather than a luxury performance OS.

Major gaps versus the concept:

- Current top ticker is cramped and utilitarian; concept ticker feels like a premium telemetry bar.
- Current pages are mostly text/list-driven; concept pages are visual-first with rings, body graphics, charts, and card systems.
- Current bottom nav has seven equal tabs; concept mobile nav is compact, safe-area aware, and less crowded.
- Current gym cards look generated; concept gym cards look like a polished training product with imagery, clear hierarchy, and premium CTA styling.
- Current non-gym pages open with fake sample records; concept feels personal but not cluttered.

## Findings

### Mobile Overlap And Compression

- The sticky ticker compresses too aggressively on narrow screens. The water pill shrinks to roughly 19px wide while its text needs about 55px, creating visible text collision.
- Many controls are below the 44px mobile tap target floor. Ticker pills are about 32px high, icon buttons are 30px, checkboxes are about 22-26px, and small action buttons are about 30px high.
- The mobile bottom nav has seven tabs and visually crowds the viewport. At `375x812`, the last tabs are partially clipped and the nav reads as cramped rather than intentional.
- Gym sub-tabs also compress: `Plan & Split`, `Body & Photos`, and `Progress` are below comfortable tap size and show text squeezing.
- Several card rows depend on single-line flex layouts. Gym hero/readiness and long metadata rows are close to overflowing at phone widths.

### Horizontal Overflow

- Automated checks did not find document-level horizontal overflow at the tested sizes.
- Element-level text overflow appeared repeatedly in the ticker, gym tabs, gym prescription rows, and a few dense chip rows.
- The current CSS has good baseline `box-sizing` and some `min-width: 0`, but it lacks a complete defensive layout system for every grid/flex child.

### Sticky And Fixed Layout

- Top ticker is sticky and does not fully cover page content, but it is visually cramped and too short for touch.
- Bottom nav uses safe-area positioning, but the main content needs a stronger, named bottom padding token tied to nav height plus safe-area.
- Full-page screenshots show the fixed nav over the viewport, which is expected, but final interactive content still needs a larger end spacer so forms and bottom CTAs never sit behind it.

### Weak Visual Hierarchy

- The app currently looks like stacked dark cards with labels, not a premium health-tech dashboard.
- Page headers are text-only on most pages, with no strong above-the-fold visual system.
- Charts are mostly simple bars/sparklines and do not feel integrated into a luxury product system.
- Desktop layout feels like a narrow admin panel rather than a cinematic command center.

### Filler And AI-Generated Feel

- `store.js` seeds fake data on first load through `seedData()`, so the default app opens with invented tasks, supplements, classes, reminders, contacts, subscriptions, body weight entries, PRs, and recovery logs.
- Productivity, School, Admin, Health, and Review all display sample data as if it were real user state. The sample badges help, but the default still feels fake.
- Pages that should be elegant empty shells are overloaded with placeholder details.

### Gym-Specific Issues

- Gym is the strongest section structurally, but the Today view still looks like a list of generated prescription cards.
- Exercise visuals are functional but too small and diagrammatic; they need a more intentional muscle/equipment visual system.
- Exercise cards do not yet expose every requested field in one polished card: target muscle, equipment tag, sets, reps, rest, target weight, last performance, form cue, swap, and log actions.
- Active workout mode is usable, but it is still a multi-exercise list rather than a focused premium workout flow.

## Files Causing Most Issues

- `css/styles.css`: global token system, tiny touch targets, cramped ticker/nav sizing, generic card styling, limited responsive utilities.
- `js/store.js` and `js/schema.js`: first-load demo seeding creates fake default app state.
- `js/ticker.js`: ticker pill layout creates compressed water text and sub-44px tap targets.
- `js/app.js`: mobile nav renders all seven tabs equally, creating crowding.
- `js/pages/gym.js`: strong data model but dense visual hierarchy, small sub-tabs, and list-heavy active workout UI.
- `js/pages/productivity.js`, `js/pages/health.js`, `js/pages/school.js`, `js/pages/admin.js`, `js/pages/review.js`: default views depend too much on sample data and not enough on premium empty states and graphics.

## Redesign Plan

1. Replace the visual foundation with a real tokenized design system: surfaces, glass, borders, glow colors, spacing, radius, typography, z-index, nav sizes, inputs, buttons, chart colors, and status colors.
2. Switch first-load data to real user mode: keep gym exercise library and a starter split, but remove fake non-gym data from default state. Keep demo data available behind an explicit load-demo/reset action.
3. Add reusable visual components for page hero graphics, metric rings, empty states, mini charts, body/muscle art, and exercise placeholders.
4. Rebuild every page around a premium hero, intentional graphics, strong empty states, and compact action forms rather than fake content.
5. Make Gym the centerpiece: cinematic workout hero, weekly split cards, full exercise cards with visuals and logging actions, active workout focus mode, progress cards, polished library filters, and machine/cable-first generator UI.
6. Rework mobile nav into a safe-area-aware premium dock with five primary tabs plus More, larger tap targets, and no clipped labels.
7. Add defensive mobile CSS for no overflow: strict max widths, `min-width: 0`, `overflow-wrap`, mobile-first grids, modal max-height, form sizing, and bottom padding tied to nav height.
8. Re-run all route/viewport checks, console checks, localStorage persistence checks, import/export checks, demo mode checks, and GitHub Pages path checks.

## Post-Redesign Audit

Post-redesign screenshots were captured for all 35 route/viewport combinations in `audit-screenshots/post/`.

- `audit-screenshots/post/today-375x812.png`
- `audit-screenshots/post/productivity-375x812.png`
- `audit-screenshots/post/gym-375x812.png`
- `audit-screenshots/post/health-375x812.png`
- `audit-screenshots/post/school-375x812.png`
- `audit-screenshots/post/admin-375x812.png`
- `audit-screenshots/post/review-375x812.png`
- The same seven routes were also captured at `390x844`, `430x932`, `768x1024`, and `1440x900`.

### What Changed

- The default app now opens in real-user mode with no fake non-gym records.
- Non-gym pages use premium empty states, concise forms, metrics, and intentional graphics.
- Gym is now the visual centerpiece with a cinematic workout hero, weekly split rail, visual exercise cards, live workout focus mode, and polished library filters.
- Mobile hero graphics were converted into background artwork on phones to avoid pushing controls below the fold.
- The mobile nav is now five primary tabs plus More, with larger touch targets and safe-area bottom positioning.
- Exercise visuals are generated locally and never depend on remote images.

### Remaining Notes

- Browser plugin automation and Edge CDP were attempted but did not run reliably in this sandbox; Chrome headless CLI was used for screenshot capture.
- CDP DOM evaluation was unavailable, so overflow/console verification used visual screenshots, JS syntax checks, route import checks, and local server smoke checks.
- The nav intentionally floats over the viewport like the concept image. Main content has bottom padding so final controls are not unreachable behind it.
