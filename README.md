# Dominic OS

Dominic OS is a static, mobile-first life dashboard for training, recovery, execution, school, admin, and review. The premium redesign targets a futuristic black health-tech product: compact telemetry, glass panels, cinematic page graphics, safe mobile navigation, and Gym as the centerpiece.

The app is still plain HTML, CSS, and vanilla JS modules. There is no build step, backend, paid API, or secret requirement.

## Product Shape

- **Today**: command-center greeting, day progress, quick capture, mode selector, focus cards, and reflection.
- **Productivity**: weekly goal lanes, deep work blocks, backlog, follow-ups, and premium empty states.
- **Gym**: starter split, machine/cable-first exercise library, generated workouts, visual exercise cards, set logging, progression summaries, body weight, and progress photos.
- **Health**: manual recovery, hydration, supplements, and wearable-sync shell without medical claims.
- **School**: classes, assignments, exams, and study blocks with clean empty states.
- **Admin**: reminders, contacts, subscriptions, and backup/export controls.
- **Review**: weekly/monthly score shells, training summary, recovery summary, and reflection prompts.

First load now opens in real-user mode: no fake non-gym clutter. Demo data is available only from the explicit **Load demo** action in the backup card.

## Run Locally

Serve the repo over HTTP because ES modules do not run from `file://`.

```bash
cd dominic-os
python -m http.server 5610
```

Then open `http://localhost:5610/#/today`.

If Python is unavailable, any static server works.

```bash
npx serve .
```

## Data And Backups

All data is stored in `localStorage` under one key through `js/store.js`.

- Export/import JSON backups from the backup card.
- **Load demo** intentionally replaces current data with labeled sample data.
- **Start fresh** returns to real-user mode with only the gym library and starter split.
- Progress photos are compressed before saving to protect browser storage.

## Deploy To GitHub Pages

This repo is GitHub Pages compatible because all assets use relative paths and routing is hash-based.

```bash
git push origin pre-premium-redesign
```

Then merge/push to the branch configured for Pages, or publish this branch from repository settings. No build command is needed.

## Docs

- `DESIGN_SYSTEM.md`: premium token and component system.
- `PREMIUM_UI_AUDIT.md`: before/after audit notes and screenshot matrix.
- `MOBILE_QA.md`: route and viewport QA notes.
- `CHANGELOG_PREMIUM_REDESIGN.md`: implementation summary.
- `GYM_LOGIC.md`: workout generation, progression, swap, and logging logic.
- `EXERCISE_LIBRARY_NOTES.md`: exercise library and placeholder visual rules.
- `DATA_SCHEMA.md`: local data model.
