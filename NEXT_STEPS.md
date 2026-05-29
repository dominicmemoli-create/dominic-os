# Next Steps — Dominic OS

What to do tomorrow, plus the two integration paths and the things that need your private credentials.

## Do first (10 minutes)
1. **Open it.** `cd dominic-os && python -m http.server 5610`, open `http://localhost:5610`. Click every page.
2. **Make it yours.** Reset-to-demo data is clearly labeled ("sample" badges). Either edit those records or hit **Data & Backup → Reset to demo** after you've explored, then delete sample items as you replace them with real ones.
3. **Deploy.** Push to GitHub, import to Vercel (preset: Other, no build command). See `README.md`.
4. **Add to your phone's home screen** so it behaves like an app.
5. **Export a backup.** Build the habit now — local data is wiped if you clear site data.

## Polish backlog (nice-to-have)
- Replace the placeholder app icons (`icons/icon-192.png`, `icon-512.png`, `icon.svg`) with real AFTERGLOW/Dominic brand art.
- Add a completion timestamp to tasks so Review's "tasks done" can be windowed to the period instead of all-time.
- Add real exercise images by pasting URLs into each exercise's `imageUrl` field (Library → edit).
- Optional: rest-timer countdown during live workout logging.

---

## Path A — Supabase sync (phone ⇄ computer)
The UI never touches `localStorage` directly — it all goes through `js/store.js`. That's the only file you change.

1. Create a Supabase project. Add a single table, e.g. `app_state (user_id uuid pk, data jsonb, updated_at timestamptz)`. Enable Row Level Security so a user only sees their own row.
2. Add Supabase auth (magic link is simplest for one user).
3. In `store.js`, keep `localStorage` as the offline cache and add:
   - `loadData()` → read local first (instant), then fetch the remote row and reconcile by `updated_at` (last-write-wins is fine for a single user on two devices).
   - `persist()` → after writing local, upsert `{ user_id, data, updated_at: now }` to Supabase (debounce ~1s).
4. Because every mutation already calls `persist()` and emits a change event, the rest of the app needs **no changes**.

**TODO (your credentials):** Supabase project URL + anon key. Put them in a `js/config.js` that is git-ignored, or inject at deploy time. The anon key is browser-safe **only** with RLS enabled — do not skip RLS.

---

## Path B — Wearable / health data
V1 is manual. `js/wearableProvider.js` is a stub with the right interface so the Health page already calls it.

- **V2 — CSV import.** Implement `parseCsv(text)` to turn a WHOOP/Fitbit export into `sleepRecoveryLog` rows, and add a file picker on the Health page. No accounts, no secrets. Lowest-effort win.
- **V3 — Live API.** Use **Google Health Connect** (Android) or the **Health API** — *not* the deprecated Google Fit. Implement `connect()` (OAuth) and `fetchDailyMetrics(dateKey)` to fill `rhr`, `hrv`, `steps`, sleep automatically. WHOOP's developer OAuth is the same shape (developer app → redirect URL → token exchange) if you'd rather pull from WHOOP directly.

**TODO (your credentials):** OAuth client ID/secret + redirect URL for whichever provider you choose. These must live in a backend or serverless function (Vercel env vars) — **never** commit secrets to the static frontend. The token exchange needs a tiny serverless endpoint; the browser only ever sees a short-lived access token.

---

## Guardrails to keep
- Keep all storage access inside `store.js`.
- Keep progress photos compressed (the `compressImage` call already enforces ~400px / q0.6). Watch the storage meter.
- No secrets in the frontend. Anything with a client secret goes through a serverless function with env vars.
- The app is tracking-only, not medical advice — keep the disclaimer on the Health page.
