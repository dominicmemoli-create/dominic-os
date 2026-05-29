// workoutCoach.js — RULE-BASED training logic. No AI, no API calls.
//
// Progression model: DOUBLE PROGRESSION within each exercise's rep range.
//   - Work in a range, e.g. 6–9 reps for 4 sets.
//   - When you hit the TOP of the range on every working set, next session add
//     one weight increment and reset to the BOTTOM of the range.
//   - Otherwise, try to add a rep toward the top of the range (same weight).
//   - If you miss the BOTTOM of the range on the top set for 2 sessions running,
//     the lift is STALLED -> suggest a ~10% deload to rebuild.
// These same rules are summarized in BUILD_LOG.md.

import { todayKey, addDays } from './dates.js';

export function e1rm(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30)); // Epley
}

// All completed sets for one exercise across history, newest first.
export function getExerciseHistory(data, exerciseId) {
  const out = [];
  const sessions = [...(data.workoutSessions || [])]
    .filter(s => s.completed)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  for (const s of sessions) {
    const ex = (s.exercises || []).find(e => e.exerciseId === exerciseId);
    if (ex) {
      const doneSets = (ex.sets || []).filter(st => st.done && st.weight != null && st.reps != null);
      if (doneSets.length) out.push({ date: s.date, sets: doneSets });
    }
  }
  return out;
}

function topSet(sets) {
  return sets.reduce((best, s) => (s.weight > (best?.weight ?? -1) ? s : best), null);
}

// Core progression decision for a single exercise.
export function suggestProgression(exercise, history) {
  const low = exercise.repLow ?? 8;
  const high = exercise.repHigh ?? 12;
  const inc = exercise.increment ?? 5;

  if (!history || history.length === 0) {
    return {
      status: 'new',
      targetWeight: null,
      targetReps: low,
      label: 'New lift',
      note: `Pick a weight you can do for ${low} clean reps, then build to ${high}.`,
    };
  }

  const last = history[0];
  const lastTop = topSet(last.sets);
  const workWeight = lastTop.weight;
  const reachedTop = last.sets.every(s => s.reps >= high);
  const minRepsLast = Math.min(...last.sets.map(s => s.reps));

  // stall detection: bottom-of-range missed on the top set 2 sessions running
  let stalled = false;
  if (history.length >= 2) {
    const prevTop = topSet(history[1].sets);
    if (lastTop.reps < low && prevTop.reps < low && prevTop.weight >= workWeight) stalled = true;
  }

  if (stalled) {
    const deload = Math.max(inc, Math.round((workWeight * 0.1) / inc) * inc);
    return {
      status: 'stalled',
      targetWeight: Math.max(0, workWeight - deload),
      targetReps: low,
      label: 'Stalled',
      note: `Missed ${low} reps twice. Deload ~10% to ${Math.max(0, workWeight - deload)} lb and rebuild.`,
    };
  }

  if (reachedTop) {
    return {
      status: 'increase',
      targetWeight: workWeight + inc,
      targetReps: low,
      label: 'Ready to add weight',
      note: `Hit ${high} on all sets — add ${inc} lb to ${workWeight + inc} and reset to ${low} reps.`,
    };
  }

  return {
    status: 'hold',
    targetWeight: workWeight,
    targetReps: Math.min(high, (lastTop.reps || low) + 1),
    label: 'Add a rep',
    note: `Stay at ${workWeight} lb, push toward ${high} reps per set.`,
  };
}

// Build today's planned workout from a split day.
export function generateWorkoutFromSplit(splitDay, data) {
  if (!splitDay || splitDay.kind !== 'training') {
    return { kind: splitDay?.kind || 'rest', label: splitDay?.label || 'Rest', plannedExercises: [] };
  }
  const exMap = Object.fromEntries((data.exercises || []).map(e => [e.id, e]));
  const plannedExercises = (splitDay.exerciseIds || []).map(id => {
    const ex = exMap[id];
    if (!ex) return null;
    const hist = getExerciseHistory(data, id);
    const prog = suggestProgression(ex, hist);
    const lastTop = hist[0] ? topSet(hist[0].sets) : null;
    return {
      exerciseId: id,
      name: ex.name,
      category: ex.category,
      primaryMuscle: ex.primaryMuscle,
      equipment: ex.equipment,
      classification: ex.classification,
      sets: ex.defaultSets,
      repLow: ex.repLow, repHigh: ex.repHigh,
      restSec: ex.restSec,
      cues: ex.cues,
      imageUrl: ex.imageUrl,
      lastPerformance: lastTop ? `${lastTop.weight} lb × ${lastTop.reps}` : '—',
      targetWeight: prog.targetWeight,
      targetReps: prog.targetReps,
      progStatus: prog.status,
      progLabel: prog.label,
      progNote: prog.note,
    };
  }).filter(Boolean);

  return { kind: 'training', label: splitDay.label, location: splitDay.location,
    durationMin: splitDay.durationMin, focusMuscles: splitDay.focusMuscles, plannedExercises };
}

// Listed substitutions first, then same-category alternatives, for a swap.
export function recommendExerciseSwaps(exercise, data) {
  const all = data.exercises || [];
  const byId = Object.fromEntries(all.map(e => [e.id, e]));
  const out = [];
  const seen = new Set([exercise.id]);
  (exercise.substitutions || exercise.replacements || []).forEach(id => {
    if (byId[id] && !seen.has(id)) { out.push(byId[id]); seen.add(id); }
  });
  // prefer same-category machine/cable options first
  const sameCat = all.filter(e => !seen.has(e.id) && e.category === exercise.category);
  const rank = e => (e.classification === 'machine' || e.classification === 'cable') ? 0 : 1;
  sameCat.sort((a, b) => rank(a) - rank(b));
  sameCat.forEach(e => { if (!seen.has(e.id)) { out.push(e); seen.add(e.id); } });
  return out.slice(0, 8);
}

// Trim volume when recovery is poor. readiness 0..100.
export function adjustWorkoutForRecovery(workout, readiness) {
  if (!workout || workout.kind !== 'training' || readiness == null) {
    return { workout, message: null };
  }
  if (readiness >= 75) {
    return { workout, message: 'Readiness high — green light to push top sets.' };
  }
  if (readiness >= 60) {
    return { workout, message: 'Readiness normal — run the plan as written.' };
  }
  if (readiness >= 40) {
    return { workout, message: 'Readiness moderate — hold weights, skip extra sets.' };
  }
  // Recover: drop a set per exercise, hold weight.
  const trimmed = {
    ...workout,
    plannedExercises: workout.plannedExercises.map(p => ({
      ...p,
      sets: Math.max(2, p.sets - 1),
      targetWeight: p.progStatus === 'increase' ? (p.targetWeight - (p.targetWeight && p.repLow ? 0 : 0)) : p.targetWeight,
      progNote: 'Low readiness: holding weight, one fewer set.',
    })),
  };
  return { workout: trimmed, message: 'Readiness low — volume trimmed. Consider active recovery instead.' };
}

// Weekly training summary pulled straight from sessions.
export function summarizeWeeklyTraining(data) {
  const from = todayKey(addDays(new Date(), -6));
  const sessions = (data.workoutSessions || []).filter(s => s.completed && s.date >= from);
  let volume = 0, setCount = 0;
  for (const s of sessions) {
    for (const ex of s.exercises || []) {
      for (const st of ex.sets || []) {
        if (st.done && st.weight && st.reps) { volume += st.weight * st.reps; setCount++; }
      }
    }
  }
  const prs = (data.personalRecords || []).filter(p => p.date >= from);

  // Lifts ready to increase / stalled, scanned across the library.
  const ready = [], stalled = [];
  for (const ex of data.exercises || []) {
    const hist = getExerciseHistory(data, ex.id);
    if (!hist.length) continue;
    const prog = suggestProgression(ex, hist);
    if (prog.status === 'increase') ready.push({ name: ex.name, note: prog.note });
    if (prog.status === 'stalled') stalled.push({ name: ex.name, note: prog.note });
  }

  return {
    sessions: sessions.length,
    volume: Math.round(volume),
    setCount,
    prs: prs.length,
    ready,
    stalled,
  };
}
