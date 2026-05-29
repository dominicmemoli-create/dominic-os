# Rowan Visual Audit

Inspection of Rowan Thistlebrooke's public dashboard repos to realign Dominic OS to that look and feel. The previous Dominic OS build admitted it did **not** inspect these — this pass fixes that.

## Repos inspected (git cloned from github.com/RowanThistlebrooke)
| Repo | Cloned | Key files read |
|---|---|---|
| `YTdashh1` | ✅ | `BUILD_DASHBOARD.md`, `index.html`, `health.html`, `gym.html`, `po-water.html`, `finance.html`, `topbar.js`, `README.md` |
| `dashboard` | ✅ | `weight1.html`, `weight102.html`, `tutorial-prompt (3).md`, `Phone and computer data sync` |
| `Episode-2-YTROWAN` | ✅ | `topbar.js`, `po-water.html`, `gym-standalone`, `Supplement tracker`, `SQL block`, `Supabase claude code prompt`, `auto connect Supabase from now on` |
| `YTROWAN-EP3` | ✅ | `finance.html`, `Vercel Links` |
| `SQL-supabase` | ✅ | `GYM fix 1`, `Gym fix 2`, `Last UI fix`, `UI UPDATE`, `Prompt for Phone fix`, `SQL`, `SQL 3rd`, `VS code prompt` |
| `Whoop-RowanTBK` | ✅ | `whoop.html`, `Step 1`, `VS code prompt once you have whoop keys`, `Whoop UX (Optional)` |

No repo or file failed to access.

> Source files live at `../_rowan_research/` (outside the Dominic OS git repo, not shipped).

## Rowan's layout patterns
- **Single self-contained HTML files per tab** (index/health/gym/po-water/finance), no build step, all CSS/JS inline. Pages are linked, not a SPA.
- **Centered single column.** `main` max-width **720px** (index uses 1100px), generous top padding that respects `env(safe-area-inset-top)`. Phone-first.
- **Stacked cards** — a page is a vertical list of glass cards with small uppercase mono "eyebrow" section titles.
- Everything is sized for a thumb: big tap targets, big numbers, short labels.

## Color / spacing / card patterns
- **Background `#050506`** (near-black, warmer than Dominic OS's `#0B0B14`). Two soft **radial washes** layered on: warm orange `rgba(224,118,88,0.16)` top-right, cool grey `rgba(180,180,200,0.06)` bottom-left, blurred 40px, drifting on a 36s loop. A **film-grain** dot overlay (`::after`, 3px tile, white ~1.4%) keeps the dark from looking flat.
- **Text:** `--text-primary #FAFAFA`, `--text-secondary #B8B6B0`, `--text-tertiary #76746E`. Apple system font stack; **monospace** (`ui-monospace, "SF Mono", Menlo`) for all numbers, counts, times, dates.
- **Semantic colors:** success/good **`#6BE3A4`** (green), warning **`#F2C063`** (gold), danger **`#FF6B6B`** (red), water/sky **`#7DD3FC`**. Health page accent green `#1D9E75`, stack-tag gold `#D8AB30`.
- **Card chassis:** `rgba(255,255,255,0.04)` background, **no visible border**, 16px radius, 18–22px padding, `backdrop-filter: blur(24px) saturate(1.2)`, shadow `0 12px 40px rgba(0,0,0,0.45)`.
- **Primary action buttons** are a **white gradient pill** (`#FFFFFF→#E8E5DD`) with near-black text — not a colored button.
- Section eyebrow: 10.5–11px mono, uppercase, 0.18em tracking, tertiary color, with a dash/`≡` glyph before and a fading hairline after.

## Navigation patterns
- **Bottom tab bar** (`.tabbar`) is the primary nav: a **floating, rounded pill container** (`.tabbar-inner`, max-width ~460px, `rgba(20,20,22,0.72)`, 18px radius, big shadow) centered above the safe area — **not** an edge-to-edge bar. Tabs are chunky (12–14px padding, 13px radius).
- No desktop sidebar in Rowan's app — it's phone-first; desktop just centers the same column.

## Topbar / ticker behavior (`topbar.js`)
- A **sticky pill command bar** self-injected on every page: a flex row of **stat pills** — `GOALS`, `STACK`, `WATER` (+ a `+` quick-add button), `GYM`, `FINANCE`.
- Each pill: a **status dot** (green good / gold warn / **red pulsing** = "missed", triggered when it's past 6pm and under half done), an uppercase label, and a **mono count** (`done/total`). Pills are links to their tab.
- The **water `+` button works from any page** — writes localStorage and (when configured) pushes to Supabase.
- Separately, the index page has a **NASDAQ-style LED "Goal Ticker"**: a strip with a pulsing green LED, the word `GOALS`, the current *pending* goal in mono, and a `done/total` pill; it **cycles one goal every 5s** with vertical slide in/out, and re-renders instantly on any goal edit (`goals-changed` event). Done goals drop out of rotation; all-done shows "✓ All goals done — solid day."
- Day boundary is **6 AM**, not midnight (`getActiveDateString`).

## Gym page structure (`gym.html` — "Progressive Overload Coach")
- Title literally **"Progressive Overload Coach"**, `po-` prefixed classes.
- **Prescription cards** (`.po-rx-card`): big **26px headline** (the recommended next set), an uppercase label eyebrow, a **tag pill** (`up`=green / `down`=red / `hold`=gold), and a one-line reason. The card is tinted green/red by direction. This is the progressive-overload coach surfaced as cards.
- A **weight tracker** (`wt-` classes) with a chart + **progress photos**, plus Today's Workout (sets grouped by exercise), split-rotation editor, and a settings modal. Bottom `.tabbar`.
- Shell `max-width: min(720px,100vw)`, hard guards against horizontal overflow (`min-width:0` on children, `img/canvas max-width:100%`).

## Health / supplement page structure (`health.html`)
- "Daily Stack". Supplements grouped into **timing windows** (morning/lunch/evening/anytime) — each window has a header (icon + title + time) and a list of `.stack-item` rows (grid: icon | name | dose | toggle).
- **Taken** rows go green-tinted + strikethrough. **Missed** rows get a red border and a **`pulse-red` animation** (the flash). A white progress fill bar shows stack completion.
- A running-low / restock affordance per item.

## Water tracker structure (`po-water.html`, `po_water_v1`)
- A **bottle/glass add–subtract** counter with a transparent computed target: `weightKg×35 + exercise + caffeine offset + sex/age adjust`, divided by chosen unit (bottle/glass/oz/ml).
- A **settings card** (weight, age, sex, activity hrs/week, caffeine mg/day, substances, bottle size, units) and a **14-day history**.

## Deploy / sync assumptions
- **Static, zero-build**, deployed to **Vercel/Netlify** (see `YTROWAN-EP3/Vercel Links`). Add-to-home-screen on phone.
- Optional **Supabase** sync: a single `app_state` table keyed by section (`goals`/`health`/...), with `data jsonb` + `updated_at`; the user pastes their own URL + publishable key (placeholders shipped). WHOOP is a later OAuth add-on (`Whoop-RowanTBK`), kept as future prep — **no secrets in the static frontend**.

---

## What Dominic OS did differently (the "why it didn't look like Rowan")
1. **Palette was neon.** `#0B0B14` bg with hot-pink `#FF2E63` + mint `#08FDD8` + amber accents read as a custom neon SaaS product. Rowan is **warm near-black `#050506`** with **white text + green/gold/red semantics** and a warm radial wash. This was the single biggest mismatch.
2. **Ticker was a scrolling marquee**, not Rowan's **pill command bar** + **cycling LED goal strip**.
3. **Bottom nav was edge-to-edge**, not Rowan's **floating rounded pill tabbar**.
4. **Desktop sidebar + "Command Center" branding** gave an enterprise-productivity feel; Rowan is phone-first with no sidebar.
5. **No monospace** for numbers/dates; Rowan leans on mono for that "instrument panel" feel.
6. **Cards had visible borders** and tighter radii; Rowan uses borderless glass with heavy blur + soft shadow.
7. **Gym progression** was shown as small flag chips, not Rowan's **big prescription headline cards**.
8. **Exercise cards had empty gradient boxes** with no real visual; Rowan's gym always shows something intentional.
9. **AFTERGLOW/founder framing** is not part of Rowan's general-life dashboard at all.

## What changed to align (summary — full list in ROWAN_ALIGNMENT_CHANGELOG.md)
- Rewrote `styles.css` to Rowan's design tokens: `#050506` + warm radial wash + film grain, `#FAFAFA/#B8B6B0/#76746E` text, green/gold/red/sky semantics, borderless blurred glass cards, mono numerals, white-gradient primary buttons.
- Converted the ticker into a **Rowan pill command bar** (Goals / Stack / Water+ / Gym / Next) with status dots + red miss-pulse + a working global water `+`, and added a **cycling LED goal ticker** on Today.
- Made the bottom nav a **floating rounded pill tabbar**; de-emphasized the desktop sidebar.
- Rebuilt gym progression as **`po-rx`-style prescription cards** and gave every exercise an **intentional visual** (SVG instruction placeholder or real image with safe fallback).
- Removed **AFTERGLOW entirely**, replaced with a general **Productivity** section.
- Expanded the exercise library to **70+ machine/cable-first** movements.

## What I intentionally did NOT copy, and why
- **Separate HTML-file-per-tab architecture.** Dominic OS is a working hash-router SPA with a central data layer; splitting into standalone files would be a from-scratch rebuild (explicitly out of scope) and would lose the shared store/export/import. I kept the SPA and matched the *look*, not the file layout.
- **Rowan's exact localStorage key shapes** (`goals:DATE`, `stack:items`, `po_water_v1`). Dominic OS already has a versioned single-object store with backup/restore; re-keying would break export/import. I kept the store and aligned the UI.
- **6 AM day boundary.** Kept Dominic OS's local-midnight day keys to avoid migrating all existing history; noted as a possible future tweak.
- **Live Supabase/WHOOP code.** Kept as future prep only (no secrets in frontend), consistent with both Rowan's placeholders and the original Dominic OS constraints.
- **The literal "Polish" Anthropic-API goal button.** Out of scope and would require a key in the frontend.
