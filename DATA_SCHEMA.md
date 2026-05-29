# Data Schema — Dominic OS

All app data is stored under **one** `localStorage` key and accessed only through `js/store.js`.

| Key | Value |
|---|---|
| `dominicOS` | A single JSON object (the whole app state). Shape below. |

Exported backups wrap it as `{ app, version, exportedAt, data }`.

Field source legend: **M** = manual entry · **C** = calculated/derived · **F** = future-synced (wearable/Supabase).

---

## Root object
```
{
  meta:        { version:int, seeded:bool, createdAt:dateKey },
  profile:     { name, bodyWeightGoalLow:int, bodyWeightGoalHigh:int },
  settings:    { water: { weightLbs, age, activity('low'|'moderate'|'high'), caffeineMg, bottleOz, manualTargetOz|null } },
  dailyLogs:   { [dateKey]: dailyLog },
  tasks:       [ task ],
  exercises:   [ exercise ],
  splits:      [ weeklySplit ],
  activeSplitId: id|null,
  workoutTemplates: [ workoutTemplate ],
  plannedWeek: { weekStart:dateKey, days:[ plannedWorkout ] } | null,
  workoutSessions:  [ workoutSession ],
  personalRecords:  [ personalRecord ],
  bodyWeightEntries:[ bodyWeightEntry ],
  progressPhotos:   [ progressPhoto ],
  supplements:      [ supplement ],
  supplementLog:    { [dateKey]: { [supplementId]: true } },
  waterLogs:        { [dateKey]: waterLog },
  sleepRecoveryLogs:[ sleepRecoveryLog ],
  afterglow:   { stage, stages:[str], weeklyPriorities:[afterglowItem], coPackers:[coPackerContact],
                 regulatory:[regulatoryItem], launchTasks:[afterglowItem], productTests:[...],
                 funding:[...], queue7day:[...] },
  classes:     [ schoolClass ],
  assignments: [ assignment ],
  exams:       [ exam ],
  studyBlocks: [ studyBlock ],
  adminReminders: [ adminReminder ],
  contacts:    [ contact ],
  subscriptions: [ subscription ],
  weeklyReviews:  [ weeklyReview ],
  monthlyReviews: [ monthlyReview ]
}
```
`dateKey` = local-time `"YYYY-MM-DD"`.

---

## Models (field · type · example · source)

**dailyLog** — `date` str `"2026-05-29"` M · `mode` str `"Deep Work"` M · `priorities` [{id, track('startup'|'body'|'school'), text, done}] M · `scorecard` {focus,body,founder,recovery: 0–5} M · `reflection` {moved, avoided, firstMove} M

**task** — `id` · `title` str M · `category` str `"AFTERGLOW"` M · `priority` `"high"|"med"|"low"` M · `due` dateKey M · `done` bool M

**exercise** — `id` · `name` M · `muscleGroup` M · `pattern` M · `equipment` M · `defaultSets` int M · `repLow`/`repHigh` int M · `increment` lb M · `restSec` int M · `cues` str M · `replacements` [exerciseId] M · `imageUrl` str M

**weeklySplit** — `id` · `name` M · `type` `"PPL"|"Upper/Lower"|…` M · `days` [{weekday, kind('training'|'active'|'rest'), label, location, durationMin, focusMuscles:[str], exerciseIds:[id]}] M

**plannedWorkout** (in `plannedWeek.days`) — `weekday` · `kind` · `label` · `location` · `durationMin` · `plannedExercises` [plannedExercise] C

**plannedExercise** — `exerciseId` · `name` · `sets` int · `repLow`/`repHigh` · `restSec` · `cues` · `lastPerformance` str C · `targetWeight` lb C · `targetReps` C · `progStatus` `"increase"|"hold"|"stalled"|"new"` C · `progNote` str C

**workoutSession** — `id` · `date` dateKey M · `dayLabel` M · `completed` bool · `notes` M · `exercises` [{exerciseId, name, notes, sets:[completedSet]}]

**completedSet** — `weight` lb M · `reps` int M · `done` bool M

**personalRecord** — `id` · `exerciseId` · `weight` M · `reps` M · `date` dateKey · `e1rm` int C (Epley)

**bodyWeightEntry** — `id` · `date` dateKey M · `weight` lb M · `notes` M

**progressPhoto** — `id` · `date` dateKey M · `weight` lb M · `notes` M · `thumb` dataURL (JPEG ~400px q0.6) C

**supplement** — `id` · `name` M · `dose` M · `timing` `"morning"|"lunch"|"evening"|"anytime"` M · `runningLow` bool M. Taken state lives in `supplementLog[dateKey][id]`. "Missed" is **derived** (C): today + window elapsed + not taken + not 'anytime'.

**waterLog** — `targetOz` int (C, snapshot of calc) · `intakeOz` int M. Target = ½ body-weight(oz) + activity offset + caffeine offset, rounded to 4 (or `manualTargetOz`).

**sleepRecoveryLog** — `id` · `date` dateKey M · `durationH` M · `quality` 1–5 M · `rhr` bpm M · `hrv` ms M · `steps` M · `soreness` 1–5 M · `mood` 1–5 M · `readiness` 0–100 C · `call` `"Push"|"Normal"|"Maintain"|"Recover"` C. *(rhr/hrv/steps become **F** once a wearable is connected.)*

**afterglowItem** — `id` · `text` M · `done` bool M *(queue7day also has `day`)*
**coPackerContact** — `id` · `name` M · `contact` M · `stage` M · `moq` M · `notes` M
**regulatoryItem** — `id` · `item` M · `status` `"Not started"|"Researching"|"In progress"|"Open question"|"Done"` M · `notes` M
**(productTest)** — `id` · `name` M · `result` M · `date` M  **(funding item)** — `id` · `item` M · `status` M

**schoolClass** — `id` · `name` M · `code` M · `professor` M · `room` M · `schedule` M
**assignment** — `id` · `classId` · `title` M · `due` dateKey M · `done` bool M
**exam** — `id` · `classId` · `title` M · `date` dateKey M
**studyBlock** — `id` · `classId` · `day` weekday M · `time` M · `durationMin` M

**adminReminder** — `id` · `text` M · `due` dateKey M · `done` bool M
**contact** — `id` · `name` M · `role` M · `contact` M
**subscription** — `id` · `name` M · `cost` num M · `cycle` `"monthly"|"yearly"` M · `renews` dateKey M

**weeklyReview / monthlyReview** — `id` · `createdAt` dateKey · `wins` M · `lessons` M · `focus` M · `snapshot` {workouts, readiness, bwDelta} C

---
*Sample/demo records carry `_sample:true` so they can be visually badged. They are seeded only on first load (or via Reset to demo).*
