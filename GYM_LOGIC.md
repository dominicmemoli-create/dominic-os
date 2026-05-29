# Gym Logic

All gym logic is rule-based (no AI, no API). It lives in `js/workoutCoach.js`, with exercise selection driven by the split you edit in **Gym → Plan & Split**.

## Machine/cable-first exercise selection
- A workout is built from the **active split's day** (`generateWorkoutFromSplit(splitDay, data)`): it reads that day's `exerciseIds` and looks each up in the library.
- The shipped sample split is **machine/cable-first**, so out of the box generated weeks favor selectorized machines, plate-loaded machines, and cable stations.
- Selection is fully editable: open a split day, toggle exercises on/off (chips), and the generator uses exactly what you pick. There is no hidden barbell bias.

## Set & rep logic
- Each exercise defines a **rep range** (`repLow`–`repHigh`), `defaultSets`, `restSec`, and a weight `increment`. Defaults skew toward hypertrophy on machines/cables (10–15 reps) and lower reps on heavy free-weight compounds (6–10).
- Today's target weight/reps for each exercise come from the progression rules below, using your logged history.

## Progression logic — double progression
Work within the rep range. Each completed session updates the recommendation:
- **Increase** (`up` tag) — every working set hit the **top** of the range last session → add one `increment` and reset the target to the **bottom** of the range.
- **Hold** (`hold` tag) — otherwise → keep the weight and target one more rep toward the top.
- **Stalled** (`down` tag) — the top set missed the **bottom** of the range for **2 sessions running** → suggest a ~10% deload and rebuild.
- **New** (`new` tag) — no history → start at the bottom of the range; weight shows `—` (or `BW` for bodyweight/functional) until you log it.
- **Est. 1RM** uses Epley (`weight × (1 + reps/30)`); the best e1rm per exercise becomes its PR.
- **Recovery adjustment** (`adjustWorkoutForRecovery`) — when readiness < 40 the workout drops one set per exercise and holds weight; 40–60 holds; ≥ 75 green-lights pushing top sets.

These recommendations surface on the Gym → Today tab as **prescription cards** (big target headline + up/hold/down/new tag + reason).

## Swap exercise logic
`recommendExerciseSwaps(exercise, data)`:
1. The exercise's own listed `substitutions` first.
2. Then other exercises in the **same category**, **ranked machine/cable-first**.
Returns up to 8 options. Swapping recomputes the new exercise's target from its own history.

## Exercise image fallback logic
`exerciseVisual(exercise)` in `js/pages/gym.js`:
- If `imageUrl` is set → `<img>` with an `error` handler that swaps to the placeholder, so **no broken-image icon can ever render**.
- Otherwise → an intentional **instruction placeholder** (classification-tinted card, line-art glyph, muscle badge, equipment label, movement cue, "Instruction placeholder" tag).
See `EXERCISE_LIBRARY_NOTES.md` for adding real images.

## How to add more exercises
- **In-app:** Gym → Library → **+ Add exercise**. Fill name, category, primary muscle, equipment, classification, sets/reps/rest/increment, difficulty, cues, common mistakes, and optionally an image URL.
- **In code:** add an `mk(...)` line to `exList()` in `js/schema.js` (then Reset to demo or import a fresh seed to pick it up).
- New exercises are immediately available to split days, the generator, and swaps.

## How to add real image URLs later
Set `imageUrl` per exercise (in the Library editor or `schema.js`). `imageSource` flips to `user`; record provenance in `imageLicenseNotes`. Safe open sources: `free-exercise-db`, `wger` (see `EXERCISE_LIBRARY_NOTES.md`). The placeholder still guards any load failure.
