# Exercise Library Notes

## How the library was built
The default library is generated in `js/schema.js` via a compact `mk()` builder so all 70 exercises share a consistent shape and sane defaults. It was modeled on what you actually walk into at a commercial gym like **OneLife Fitness** — researched from their published equipment/amenities pages (selectorized strength machines, plate-loaded machines, cable stations, a Smith machine, assisted machines, free weights, and functional turf with sleds/ropes/kettlebells). The emphasis is deliberately **machine- and cable-first** and beginner/intermediate-friendly, not barbell-or-bodyweight-only.

## Counts
- **70 exercises total**, **55 machine or cable** (~79%).
- By classification: machine (35), cable (20), free weight (8), bodyweight (4), functional (3) — *approximate; counts shift if you edit the library.*
- By category: Chest 10 · Back 10 · Shoulders 10 · Biceps 8 · Triceps 8 (one assisted-dip shared with Chest) · Legs 13 · Core 6 · Functional 5.

## Classifications
- **machine** — selectorized/plate-loaded/Smith/assisted (e.g. Machine Chest Press, Leg Press, Hack Squat, Pec Deck, Lat Pulldown machine variants, Hip Abductor/Adductor).
- **cable** — cable-station movements (Cable Fly, Seated Cable Row, Triceps Pushdown, Cable Lateral Raise, Face Pull, Cable Crunch, Cable Glute Kickback).
- **free weight** — dumbbell/EZ-bar movements kept as accessories (Incline DB Press, DB Shoulder Press, EZ-Bar Curl, Concentration Curl).
- **bodyweight** — Push-Up, Plank, Captain's Chair Leg Raise, Decline Sit-Up.
- **functional** — turf work: Sled Push, Battle Ropes, Kettlebell Swing, Med Ball Slam, Farmer's Carry (logged as reps/lengths/seconds).

## How image placeholders work
There are **no scraped/copyrighted photos**. Every exercise card renders through `exerciseVisual()` in `js/pages/gym.js`:
1. If `exercise.imageUrl` is set → render an `<img>`. If it fails to load, an `error` handler removes it and falls back to the placeholder, so **a broken-image icon can never appear**.
2. Otherwise → render an **intentional instruction placeholder**: a classification-tinted card containing
   - a simple **line-art SVG glyph** chosen by classification (machine frame / cable pulley / dumbbell / stick figure / sled),
   - a **target-muscle badge** (top-left),
   - an **equipment label** + **movement-direction cue** (bottom),
   - an **"Instruction placeholder"** tag (top-right).

This looks like a machine instruction label rather than a blank box, so you can tell at a glance what each movement is.

## How to add real images later
Each exercise has three image fields:
- `imageUrl` — paste a URL (or a local `images/…` path you add to the project) in **Gym → Library → Edit**, or set it directly in `schema.js`.
- `imageSource` — flips to `user` automatically when you set a URL (else `placeholder`).
- `imageLicenseNotes` — record where the image came from and its license.

**Safe sources** for open exercise media (not auto-imported here to avoid licensing surprises and broken hotlinks):
- `free-exercise-db` — https://github.com/yuhonas/free-exercise-db (public-domain images, predictable raw URLs per exercise).
- `wger` — https://github.com/wger-project/wger and https://wger.readthedocs.io/ (AGPL project; check its media licensing before redistributing).

To bulk-add: map each exercise `id` to a source image, set `imageUrl`, and the card will use it automatically (with the placeholder still guarding any load failure).

## Why copyrighted images were not scraped
Random Google Images results are almost always copyrighted and hotlink-fragile (they break and show a broken icon). The brief explicitly forbids scraping them and forbids broken image icons. The placeholder system guarantees an intentional visual with zero network dependency, and the `imageUrl` + fallback path lets you add properly-licensed photos whenever you want.

## How the workout generator uses the library
- `generateWorkoutFromSplit()` (in `workoutCoach.js`) pulls each split day's `exerciseIds` from the library and computes targets via the progression rules (see `GYM_LOGIC.md`).
- The shipped sample split (`Push / Pull / Legs (Machine Focus)`) is intentionally machine/cable-first, so generated weeks favor machines out of the box.
- **Exercise swap** (`recommendExerciseSwaps()`) offers an exercise's listed `substitutions` first, then other same-category options **ranked machine/cable-first**.
- You're never locked in: edit the split, add your own exercises, or build a barbell-style split later — the generator just uses whatever exercises a day contains.
