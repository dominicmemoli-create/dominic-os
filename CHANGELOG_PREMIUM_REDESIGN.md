# Premium Redesign Changelog

Date: 2026-05-29

## Added

- Premium dark design system in `css/styles.css`.
- New reusable hero, metric, empty-state, chart, backup, and graphic helpers in `js/components.js`.
- Post-redesign screenshot matrix in `audit-screenshots/post/`.
- Explicit real-user starter mode with demo data behind **Load demo**.
- Gym exercise card visuals with generated SVG/CSS placeholders.
- Active workout focused flow with current exercise, set rows, progress dots, and rest timer shell.
- Five-primary-tab mobile nav plus More modal for School/Admin.
- Premium page graphics for Today, Productivity, Gym, Health, School, Admin, and Review.

## Changed

- First load now uses `starterData()` instead of fake full-app demo records.
- Store migration replaces untouched legacy demo data with starter mode.
- Top ticker now behaves like a compact telemetry strip.
- Non-gym pages now render premium empty states and real-data forms by default.
- Gym Today, split, library, active session, and progress layouts were upgraded visually.
- README and next steps now describe the premium GitHub Pages app.

## Preserved

- Hash routing.
- Static GitHub Pages compatibility.
- `localStorage` persistence.
- JSON export/import.
- Demo reset.
- Gym generator, workout logging, progression summaries, body weight, and progress photo storage.

## QA Notes

- Syntax checks pass for all JS modules.
- Route import smoke test passes for all seven pages.
- Chrome headless screenshots were captured for all requested viewports.
- Browser plugin/Edge CDP automation was attempted but unavailable/crashing in this sandbox, so Chrome headless CLI was used for screenshots.
