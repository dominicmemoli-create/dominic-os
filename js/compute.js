// compute.js — derived values shared by the ticker and pages.
// Pure functions over the data object; no storage writes here.

import { todayKey, nowMinutes, weekdayName, daysUntil } from './dates.js';
import { generateWorkoutFromSplit } from './workoutCoach.js';

// ---- Water target (transparent + editable) -------------------------------
// Half body-weight in oz, plus activity + caffeine offsets. Rounded to 4oz.
export function waterTarget(water) {
  if (!water) return { targetOz: 90, breakdown: [] };
  if (water.manualTargetOz) {
    return { targetOz: water.manualTargetOz, manual: true, breakdown: [['Manual override', water.manualTargetOz]] };
  }
  const base = Math.round((water.weightLbs || 175) * 0.5);
  const activityAdd = { low: 0, moderate: 12, high: 24 }[water.activity] ?? 12;
  const caffeineAdd = Math.round((water.caffeineMg || 0) / 50) * 1; // ~1oz per 50mg
  let total = base + activityAdd + caffeineAdd;
  total = Math.round(total / 4) * 4;
  return {
    targetOz: total,
    manual: false,
    breakdown: [
      ['Half body-weight', base],
      [`Activity (${water.activity || 'moderate'})`, activityAdd],
      ['Caffeine offset', caffeineAdd],
    ],
  };
}

export function waterToday(data) {
  const t = todayKey();
  const target = waterTarget(data.settings?.water).targetOz;
  const log = data.waterLogs?.[t];
  const intake = log?.intakeOz || 0;
  return { target, intake, percent: target ? Math.min(100, Math.round((intake / target) * 100)) : 0 };
}

// ---- Readiness score -----------------------------------------------------
export function readinessScore(log) {
  if (!log) return { score: null, call: null };
  const dur = log.durationH ?? 7;
  const quality = log.quality ?? 3;     // 1..5
  const hrv = log.hrv ?? 60;
  const rhr = log.rhr ?? 58;
  const soreness = log.soreness ?? 2;   // 1..5 (5 = very sore)
  const mood = log.mood ?? 3;           // 1..5

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const sleepDur = clamp01(dur / 8) * 30;
  const sleepQual = clamp01(quality / 5) * 10;
  const hrvPts = clamp01((hrv - 30) / 60) * 20;     // 30..90
  const rhrPts = clamp01((70 - rhr) / 25) * 15;     // 45..70 (lower better)
  const sorePts = clamp01((5 - soreness) / 4) * 15;
  const moodPts = clamp01(mood / 5) * 10;

  const score = Math.round(sleepDur + sleepQual + hrvPts + rhrPts + sorePts + moodPts);
  let call = 'Recover';
  if (score >= 75) call = 'Push';
  else if (score >= 60) call = 'Normal';
  else if (score >= 45) call = 'Maintain';
  return { score, call };
}

export function latestRecovery(data) {
  const logs = [...(data.sleepRecoveryLogs || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  return logs[0] || null;
}

export function readinessToday(data) {
  const r = readinessScore(latestRecovery(data));
  return r;
}

// ---- Supplement status ---------------------------------------------------
// Timing windows (minutes from midnight) used for the "missed" flag.
export const TIMING_WINDOWS = {
  morning: { label: 'Morning', start: 5 * 60, end: 11 * 60 },
  lunch: { label: 'Lunch', start: 11 * 60, end: 15 * 60 },
  evening: { label: 'Evening', start: 17 * 60, end: 22 * 60 },
  anytime: { label: 'Anytime', start: 0, end: 24 * 60 },
};
export const TIMING_ORDER = ['morning', 'lunch', 'evening', 'anytime'];

export function supplementStatus(data, dateKey = todayKey()) {
  const taken = data.supplementLog?.[dateKey] || {};
  const now = nowMinutes();
  const isToday = dateKey === todayKey();
  const byTiming = { morning: [], lunch: [], evening: [], anytime: [] };
  const missed = [];
  let takenCount = 0;
  const sups = data.supplements || [];

  for (const s of sups) {
    const isTaken = !!taken[s.id];
    if (isTaken) takenCount++;
    const win = TIMING_WINDOWS[s.timing] || TIMING_WINDOWS.anytime;
    // Missed = today, window has fully passed, not taken, and not 'anytime'.
    const isMissed = isToday && !isTaken && s.timing !== 'anytime' && now > win.end;
    if (isMissed) missed.push(s);
    (byTiming[s.timing] || byTiming.anytime).push({ ...s, taken: isTaken, missed: isMissed });
  }
  return { byTiming, missed, takenCount, total: sups.length, lowCount: sups.filter(s => s.runningLow).length };
}

// ---- Today's workout (from active split) ---------------------------------
export function todaySplitDay(data) {
  const split = (data.splits || []).find(s => s.id === data.activeSplitId) || (data.splits || [])[0];
  if (!split) return null;
  const wd = weekdayName();
  return (split.days || []).find(d => d.weekday === wd) || null;
}

export function todayWorkout(data) {
  const day = todaySplitDay(data);
  if (!day) return null;
  return generateWorkoutFromSplit(day, data);
}

// ---- Priorities + deadlines ----------------------------------------------
export function todayPriorities(data) {
  const log = data.dailyLogs?.[todayKey()];
  return log?.priorities || [];
}

export function nextDeadline(data) {
  const candidates = [];
  (data.assignments || []).forEach(a => { if (!a.done && a.due) candidates.push({ text: a.title, due: a.due, kind: 'Assignment' }); });
  (data.exams || []).forEach(e => { if (e.date) candidates.push({ text: e.title, due: e.date, kind: 'Exam' }); });
  (data.adminReminders || []).forEach(r => { if (!r.done && r.due) candidates.push({ text: r.text, due: r.due, kind: 'Admin' }); });
  (data.tasks || []).forEach(t => { if (!t.done && t.due) candidates.push({ text: t.title, due: t.due, kind: 'Task' }); });
  const p = data.productivity || {};
  (p.lifeAdmin || []).forEach(i => { if (!i.done && i.due) candidates.push({ text: i.text, due: i.due, kind: 'Admin' }); });
  (p.followUps || []).forEach(f => { if (f.status !== 'Done' && f.due) candidates.push({ text: f.action, due: f.due, kind: 'Follow-up' }); });
  candidates.sort((a, b) => (a.due < b.due ? -1 : 1));
  const future = candidates.filter(c => daysUntil(c.due) >= 0);
  return future[0] || candidates[0] || null;
}

// Next general-productivity action to surface in the ticker.
export function productivityNextAction(data) {
  const p = data.productivity || {};
  const wg = (p.weeklyGoals || []).find(g => g.status !== 'Done');
  if (wg) return wg.nextAction || wg.title;
  const pb = (p.priorityBacklog || []).find(i => !i.done);
  if (pb) return pb.nextAction || pb.title;
  const fu = (p.followUps || []).find(f => f.status !== 'Done');
  if (fu) return `${fu.person}: ${fu.action}`;
  return 'All clear';
}
