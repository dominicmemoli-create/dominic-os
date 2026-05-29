// dates.js — date utilities for Dominic OS
// All keys are LOCAL-time YYYY-MM-DD so "today" matches the user's clock.

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// YYYY-MM-DD in local time (NOT toISOString, which is UTC and can roll the day).
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  // Parse 'YYYY-MM-DD' as a local date (avoid UTC shift).
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtLong(d = new Date()) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtShort(key) {
  const d = parseKey(key);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function weekdayName(d = new Date()) {
  return DAYS[d.getDay()];
}

export function weekdayShort(d = new Date()) {
  return DAYS_SHORT[d.getDay()];
}

export const WEEKDAYS = DAYS;
export const WEEKDAYS_SHORT = DAYS_SHORT;

// How far through the waking day we are (06:00 -> 23:00 mapped 0..100).
export function dayProgressPercent(d = new Date()) {
  const start = 6 * 60;   // 6am
  const end = 23 * 60;    // 11pm
  const mins = d.getHours() * 60 + d.getMinutes();
  const pct = ((mins - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function nowMinutes(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

// Monday-based start of week.
export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Whole days from today until dateKey (negative = past).
export function daysUntil(dateKey) {
  if (!dateKey) return null;
  const target = parseKey(dateKey);
  const today = parseKey(todayKey());
  return Math.round((target - today) / 86400000);
}

export function relativeDue(dateKey) {
  const n = daysUntil(dateKey);
  if (n === null) return '';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n <= 7) return `in ${n}d`;
  return fmtShort(dateKey);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Late night';
}

// Last N day-keys ending today, oldest first.
export function lastNDays(n, from = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(todayKey(addDays(from, -i)));
  return out;
}
