# Dominic OS

A personal life command center for Dominic — founder life (AFTERGLOW), gym, health/recovery, school, and admin — on one fast, premium, mobile-friendly screen.

Built as **plain static HTML + CSS + vanilla JS (ES modules)**. No build step, no framework, no backend. Open it and it runs.

---

## What it does

- **Today** — greeting, day-progress ring, mode selector, top-3 priorities (startup / body / school), full task CRUD, daily scorecard, quick reflection. History is kept per date and never overwritten.
- **Gym** (the centerpiece) — split editor, exercise library, weekly plan generator, **live set-by-set workout logging**, and **rule-based progressive-overload coaching** (double progression). Body-weight trend + compressed progress photos. PRs, volume, and "ready to add weight" / "stalled" flags.
- **Health** — supplement stack with timing windows + **flashing missed-dose warnings** + running-low flags, a transparent water tracker, and manual sleep/recovery logging that produces a **readiness score** and a Push / Normal / Maintain / Recover call.
- **AFTERGLOW** — founder dashboard: stage tracker, weekly priorities, co-packer outreach, regulatory checklist, MSU Launch tasks, product testing, funding readiness, 7-day queue.
- **School / Admin / Review** — classes/assignments/exams/study blocks, reminders/contacts/subscriptions, and a Review page that auto-pulls live stats from your logs.

All data lives in your browser via `localStorage`, routed through one data layer (`js/store.js`). Export/import JSON backups any time.

---

## Run it locally

ES modules must be served over HTTP (opening `index.html` via `file://` will not load the modules). Any static server works:

```bash
# Python 3 (already on your machine)
cd dominic-os
python -m http.server 5610
# then open http://localhost:5610
```

```bash
# or Node
npx serve dominic-os
```

> The repo also includes `.claude/launch.json` so the in-editor preview can serve it on port 5610.

### Add it to your phone
Open the served URL on your phone (same Wi-Fi, use your computer's LAN IP, e.g. `http://192.168.1.x:5610`), then **Share → Add to Home Screen**. It installs as a standalone app (`manifest.json` + icons included).

---

## Deploy to Vercel (zero config)

This is a static site, so there is nothing to build.

1. Push the `dominic-os/` folder to a Git repo (see commit already made).
2. In Vercel: **New Project → Import** the repo.
3. Framework preset: **Other**. Build command: **(none)**. Output directory: **`.`** (or set the root to `dominic-os/` if the repo has other folders).
4. Deploy. Done.

**Netlify** is the same: drag-and-drop the `dominic-os` folder onto the Netlify dashboard, or point it at the repo with no build command and publish directory = the app folder.

There are no environment variables and no secrets in V1.

---

## Backups (important)

Everything is stored in the browser. Clearing site data wipes it. Use **Data & Backup → Export backup** (on Today and Admin) regularly. Import restores from a backup file. Reset-to-demo restores the sample data.

---

## Docs
- `BUILD_LOG.md` — what was built, key decisions, and the gym progression rules.
- `DATA_SCHEMA.md` — every data model and localStorage key.
- `NEXT_STEPS.md` — what to do next, the Supabase-sync path, the wearable plan, and credential TODOs.
