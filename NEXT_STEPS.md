# Next Steps

Dominic OS is now redesigned as a premium static PWA. The next work should deepen real data and device quality rather than add fake content.

## Immediate

1. Open `http://localhost:5610/#/today` and tap through all seven routes.
2. Use **Start fresh** if you want a clean real-user state.
3. Add one real task, one recovery log, and one workout session.
4. Export a backup after real data is entered.
5. Deploy through GitHub Pages after merging the redesign branch.

## Product Polish

- Add a true countdown rest timer to active workout mode.
- Add completion timestamps to tasks so Review can calculate period-specific execution stats.
- Add optional real exercise media through user-provided `imageUrl` values.
- Add a first-run onboarding modal only if it stays brief and does not make the app feel like a tutorial dashboard.
- Replace PNG app icons with final Dominic OS brand assets.

## Sync Path

Keep all persistence behind `js/store.js`.

1. Add a remote `app_state` table in Supabase or another JSON store.
2. Load local state first for instant startup.
3. Reconcile remote state by `updated_at`.
4. Debounce remote writes after `persist()`.
5. Keep secrets out of the frontend.

## Wearable Path

The app remains manual-first. `js/wearableProvider.js` is the correct future integration point.

- V2: CSV import from WHOOP, Fitbit, Apple Health export, or similar.
- V3: OAuth-backed wearable sync through a small backend/serverless function.
- Do not put client secrets in static JS.

## Guardrails

- Keep the app static unless sync/auth truly requires otherwise.
- Keep default mode free of fake school/admin/productivity/supplement data.
- Keep Gym machine/cable-first unless the user changes training preferences.
- Keep mobile touch targets at 44px minimum.
- Keep bottom spacing tied to the floating nav safe area.
