# Data Schema — Dominic OS (v2)

All app data is stored under **one** `localStorage` key and accessed only through `js/store.js`.

| Key | Value |
|---|---|
| `dominicOS` | A single JSON object (the whole app state, `meta.version: 2`). |

Exported backups wrap it as `{ app, version, exportedAt, data }`. On load, `migrate()` upgrades older data: it drops any legacy `afterglow` key, ensures `productivity` exists, and refreshes the demo exercise library.

Field source legend: **M** = manual · **C** = calculated · **F** = future-synced.

---

## Root object
```
{
  meta:        { version:2, seeded:bool, createdAt:dateKey },
  profile:     { name, bodyWeightGoalLow, bodyWeightGoalHigh },
  settings:    { water: { weightLbs, age, activity, caffeineMg, bottleOz, manualTargetOz|null } },
  dailyLogs:   { [dateKey]: dailyLog },
  tasks:       [ task ],
  exercises:   [ exercise ],
  splits:      [ weeklySplit ],
  activeSplitId, workoutTemplates:[],
  plannedWeek: { weekStart, days:[ plannedWorkout ] } | null,
  workoutSessions:[ workoutSession ], personalRecords:[ personalRecord ],
  bodyWeightEntries:[ bodyWeightEntry ], progressPhotos:[ progressPhoto ],
  supplements:[ supplement ], supplementLog:{ [dateKey]:{ [supId]:true } },
  waterLogs:{ [dateKey]: waterLog }, sleepRecoveryLogs:[ sleepRecoveryLog ],
  productivity: {                      // replaces the removed AFTERGLOW section
    weeklyGoals:[weeklyGoal], deepWorkBlocks:[deepWorkBlock],
    priorityBacklog:[priorityBacklogItem], followUps:[personalFollowUp],
    lifeAdmin:[lifeAdminItem], habits:[habitSupportItem]
  },
  classes:[schoolClass], assignments:[assignment], exams:[exam], studyBlocks:[studyBlock],
  adminReminders:[adminReminder], contacts:[contact], subscriptions:[subscription],
  weeklyReviews:[weeklyReview], monthlyReviews:[monthlyReview]
}
```
`dateKey` = local-time `"YYYY-MM-DD"`. **There is no `afterglow` key** — it was removed in v2.

---

## Daily / tasks
**dailyLog** — `date` M · `mode` M · `priorities` [{id, track('work'|'body'|'school'), text, done}] M · `scorecard` {focus, body, mind, recovery: 0–5} M · `reflection` {win, avoided, firstMove} M

**task** — `id` · `title` M · `category` ('Work'|'Body'|'School'|'Admin'|'Errand'|'Personal') M · `priority` ('high'|'med'|'low') M · `due` dateKey M · `done` bool M

## Productivity models (new in v2)
**weeklyGoal** — `id` · `title` M · `category` M · `priority` M · `status` ('Not started'|'In progress'|'Done') M · `due` dateKey M · `nextAction` M
**deepWorkBlock** — `id` · `title` M · `date` dateKey M · `time` M · `focus` (category) M · `status` ('Planned'|'Done') M · `notes` M
**priorityBacklogItem** — `id` · `title` M · `category` M · `priority` M · `energy` ('high'|'medium'|'low') M · `nextAction` M · `done` bool M
**personalFollowUp** — `id` · `person` M · `action` M · `due` dateKey M · `status` ('Open'|'Done') M · `notes` M
**lifeAdminItem** — `id` · `text` M · `type` ('Errand'|'Appointment'|'Form'|'Chore'|'Misc') M · `due` dateKey M · `done` bool M
**habitSupportItem** — `id` · `name` M · `log` { [dateKey]: true } M *(weekly consistency = ticked days in the window, C)*
*(A general `projectArea` can be modeled as a `weeklyGoal` with a project-style `title`/`category`; no separate collection is required.)*

## Gym models (expanded in v2)
**exercise** — `id` · `name` M · `category` ('Chest'|'Back'|'Shoulders'|'Biceps'|'Triceps'|'Legs'|'Core'|'Functional') M · `primaryMuscle` M · `secondaryMuscles` [str] M · `equipment` M · `classification` ('machine'|'cable'|'free weight'|'bodyweight'|'functional') M · `defaultSets` M · `repLow`/`repHigh` M · `restSec` M · `increment` lb M · `difficulty` ('Beginner'|'Intermediate'|'Advanced') M · `cues` M · `commonMistakes` M · `substitutions` [exerciseId] M · `imageUrl` M · `imageSource` ('placeholder'|'user') C · `imageLicenseNotes` M

**exerciseImage** *(conceptual, embedded in `exercise`)* — `imageUrl` · `imageSource` · `imageLicenseNotes`. If `imageUrl` is empty the UI renders an intentional placeholder; a failed `imageUrl` load falls back to the placeholder (never a broken icon).

**weeklySplit** — `id` · `name` M · `type` M · `days` [workoutDay] M
**workoutDay** — `weekday` · `kind` ('training'|'active'|'rest') · `label` · `location` · `durationMin` · `focusMuscles` [str] · `exerciseIds` [exerciseId]
**plannedWorkout** (in `plannedWeek.days`) — `weekday` · `kind` · `label` · `location` · `durationMin` · `plannedExercises` [plannedExercise] C
**plannedExercise** — `exerciseId` · `name` · `category` · `primaryMuscle` · `equipment` · `classification` · `sets` · `repLow`/`repHigh` · `restSec` · `cues` · `imageUrl` · `lastPerformance` C · `targetWeight` C · `targetReps` C · `progStatus` ('increase'|'hold'|'stalled'|'new') C · `progLabel`/`progNote` C
**workoutSession** — `id` · `date` M · `dayLabel` · `completed` bool · `notes` M · `exercises` [{exerciseId, name, notes, sets:[completedSet]}]
**completedSet** — `weight` M · `reps` M · `done` bool M
**progressionRule** *(conceptual — see GYM_LOGIC.md)* — double progression within `repLow`–`repHigh` using `increment`.
**personalRecord** — `id` · `exerciseId` · `weight` M · `reps` M · `date` · `e1rm` C (Epley)
**bodyWeightEntry** — `id` · `date` M · `weight` M · `notes` M
**progressPhoto** — `id` · `date` M · `weight` M · `notes` M · `thumb` dataURL (JPEG ~400px q0.6) C

## Health models
**supplement** — `id` · `name` M · `dose` M · `timing` ('morning'|'lunch'|'evening'|'anytime') M · `runningLow` bool M. Taken state in `supplementLog[dateKey][id]`; "missed" is derived (C).
**waterLog** — `targetOz` C · `intakeOz` M.
**sleepRecoveryLog** — `id` · `date` M · `durationH`/`quality`/`rhr`/`hrv`/`steps`/`soreness`/`mood` M · `readiness` C · `call` C. (rhr/hrv/steps → **F** once a wearable connects.)

## School / Admin / Review models
**schoolClass** — `id` · `name`/`code`/`professor`/`room`/`schedule` M
**assignment** — `id` · `classId` · `title` M · `due` M · `done` M  ·  **exam** — `id` · `classId` · `title` · `date`  ·  **studyBlock** — `id` · `classId` · `day` · `time` · `durationMin`
**adminReminder** — `id` · `text` · `due` · `done`  ·  **contact** — `id` · `name`/`role`/`contact`  ·  **subscription** — `id` · `name` · `cost` · `cycle` · `renews`
**weeklyReview / monthlyReview** — `id` · `createdAt` · `wins`/`lessons`/`focus` M · `snapshot` {workouts, readiness, bwDelta} C

---
*Sample records carry `_sample:true` for badging; seeded on first load or via Reset to demo.*
