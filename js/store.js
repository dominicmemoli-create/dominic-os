// store.js — the ONE data layer for Dominic OS.
// Every read/write in the app goes through here. Today it persists to
// localStorage under a single key; swapping in Supabase later means changing
// only this file (see NEXT_STEPS.md), not the UI.

import { emptyData, seedData, starterData, DATA_VERSION } from './schema.js';

const ROOT_KEY = 'dominicOS';
const BROWSER_QUOTA_BYTES = 5 * 1024 * 1024; // ~5MB typical localStorage cap

let _cache = null;
const _subs = new Set();

// ---- core load/save ------------------------------------------------------
export function loadData() {
  if (_cache) return _cache;
  let raw = null;
  try { raw = localStorage.getItem(ROOT_KEY); } catch (e) { /* storage blocked */ }

  if (!raw) {
    _cache = starterData();        // first ever load -> real-user mode
    persist();
    return _cache;
  }
  try {
    const parsed = JSON.parse(raw);
    _cache = migrate(parsed);
  } catch (e) {
    console.warn('[store] corrupt data, reseeding', e);
    _cache = starterData();
    persist();
  }
  return _cache;
}

// Save the whole object (used after mutations). Returns {ok, error}.
export function saveData(data) {
  if (data) _cache = data;
  return persist();
}

function persist() {
  try {
    localStorage.setItem(ROOT_KEY, JSON.stringify(_cache));
    emit();
    return { ok: true };
  } catch (e) {
    // Most likely QuotaExceededError (photos too big).
    console.error('[store] save failed', e);
    emit();
    return { ok: false, error: e };
  }
}

// Forward-compatible migration. Stamps version, backfills new keys, and
// performs the v1 -> v2 upgrade (AFTERGLOW removed, Productivity added,
// expanded exercise library).
function migrate(data) {
  const base = emptyData();
  const merged = { ...base, ...data };
  merged.meta = { ...base.meta, ...(data.meta || {}), version: DATA_VERSION };
  const fromVersion = (data.meta && data.meta.version) || 1;
  if (fromVersion < 3 && looksLikeUntouchedDemo(data)) {
    return starterData();
  }
  merged.settings = { ...base.settings, ...(data.settings || {}) };
  merged.settings.water = { ...base.settings.water, ...((data.settings || {}).water || {}) };
  merged.profile = { ...base.profile, ...(data.profile || {}) };

  // Productivity replaces AFTERGLOW — ensure all sub-collections exist.
  merged.productivity = { ...base.productivity, ...(data.productivity || {}) };
  for (const k of ['weeklyGoals', 'deepWorkBlocks', 'priorityBacklog', 'followUps', 'lifeAdmin', 'habits']) {
    if (!Array.isArray(merged.productivity[k])) merged.productivity[k] = [];
  }
  // Drop any legacy AFTERGLOW/founder data so nothing dead lingers.
  delete merged.afterglow;

  // v1 -> v2: if the gym library is still the untouched demo, swap in the
  // expanded machine/cable-first library (and its matching sample split).
  if (fromVersion < DATA_VERSION) {
    const exs = Array.isArray(data.exercises) ? data.exercises : [];
    const untouchedLibrary = exs.length === 0 || exs.every(e => e && e._sample);
    if (untouchedLibrary) {
      const fresh = seedData();
      merged.exercises = fresh.exercises;
      merged.splits = fresh.splits;
      merged.activeSplitId = fresh.activeSplitId;
      merged.plannedWeek = null;
    }
  }
  return merged;
}

function looksLikeUntouchedDemo(data) {
  if (!data || !data.meta || !data.meta.seeded) return false;
  const collections = [
    'tasks', 'supplements', 'sleepRecoveryLogs', 'bodyWeightEntries',
    'workoutSessions', 'personalRecords', 'classes', 'assignments', 'exams',
    'studyBlocks', 'adminReminders', 'contacts', 'subscriptions',
    'weeklyReviews', 'monthlyReviews',
  ];
  const hasRealTopLevel = collections.some(name => {
    const arr = data[name];
    return Array.isArray(arr) && arr.some(item => item && !item._sample);
  });
  const p = data.productivity || {};
  const hasRealProductivity = [
    'weeklyGoals', 'deepWorkBlocks', 'priorityBacklog', 'followUps', 'lifeAdmin', 'habits',
  ].some(name => Array.isArray(p[name]) && p[name].some(item => item && !item._sample));
  return !hasRealTopLevel && !hasRealProductivity;
}

// ---- collection helpers (arrays of {id}) ---------------------------------
export function getCollection(name) {
  const d = loadData();
  return d[name];
}

// Upsert by id into an array collection, then persist.
export function updateItem(name, item) {
  const d = loadData();
  if (!Array.isArray(d[name])) {
    console.warn(`[store] ${name} is not an array collection`);
    return { ok: false };
  }
  const i = d[name].findIndex(x => x.id === item.id);
  if (i >= 0) d[name][i] = { ...d[name][i], ...item };
  else d[name].push(item);
  return saveData(d);
}

export function deleteItem(name, id) {
  const d = loadData();
  if (!Array.isArray(d[name])) return { ok: false };
  d[name] = d[name].filter(x => x.id !== id);
  return saveData(d);
}

// Mutate the whole object via a callback, then persist. Convenience for
// nested structures (dailyLogs, waterLogs, afterglow, ...).
export function mutate(fn) {
  const d = loadData();
  fn(d);
  return saveData(d);
}

// ---- backup / restore ----------------------------------------------------
export function exportBackup() {
  const d = loadData();
  const payload = {
    app: 'Dominic OS',
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    data: d,
  };
  return JSON.stringify(payload, null, 2);
}

// Download a .json backup file.
export function downloadBackup() {
  const blob = new Blob([exportBackup()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `dominic-os-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Accepts the JSON string from a backup file. Returns {ok, error}.
export function importBackup(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { ok: false, error: 'Not valid JSON.' };
  }
  const incoming = parsed && parsed.data ? parsed.data : parsed;
  if (!incoming || typeof incoming !== 'object' || !('tasks' in incoming)) {
    return { ok: false, error: 'This file does not look like a Dominic OS backup.' };
  }
  _cache = migrate(incoming);
  return persist();
}

// Wipe back to the labeled demo seed.
export function resetToDemo() {
  _cache = seedData();
  return persist();
}

export function resetToStarter() {
  _cache = starterData();
  return persist();
}

// ---- storage diagnostics -------------------------------------------------
export function storageInfo() {
  const d = loadData();
  const bytes = new Blob([JSON.stringify(d)]).size;
  const percent = Math.min(100, Math.round((bytes / BROWSER_QUOTA_BYTES) * 100));
  return {
    bytes,
    kb: +(bytes / 1024).toFixed(1),
    mb: +(bytes / 1024 / 1024).toFixed(2),
    percent,
    quotaMb: BROWSER_QUOTA_BYTES / 1024 / 1024,
    near: percent >= 80,
  };
}

// ---- change subscription (ticker / live UI refresh) ----------------------
export function onChange(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}

function emit() {
  for (const cb of _subs) {
    try { cb(_cache); } catch (e) { console.error('[store] subscriber error', e); }
  }
}
