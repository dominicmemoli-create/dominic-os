// ticker.js — the sticky NASDAQ-style command bar. Goals stay visible.
// Subscribes to store changes so it refreshes when data mutates.

import { el, clear } from './ui.js';
import { loadData, onChange } from './store.js';
import {
  todayPriorities, supplementStatus, waterToday, todayWorkout,
  afterglowNextAction, nextDeadline, readinessToday,
} from './compute.js';
import { relativeDue } from './dates.js';

function item(label, value, kind) {
  return el('span.ticker-item' + (kind ? '.' + kind : ''), {}, [
    el('span.ticker-label', { text: label }),
    el('b', { text: value }),
  ]);
}

function buildItems(data) {
  const items = [];

  // Top priorities
  const pris = todayPriorities(data).filter(p => !p.done).slice(0, 3);
  if (pris.length) {
    pris.forEach((p, i) => items.push(item(`Priority ${i + 1}`, p.text)));
  } else {
    items.push(item('Priorities', 'All clear ✓', 'good'));
  }

  // Missed supplements
  const sup = supplementStatus(data);
  if (sup.missed.length) items.push(item('Missed', `${sup.missed.length} supplement${sup.missed.length > 1 ? 's' : ''}`, 'alert'));
  else items.push(item('Supplements', `${sup.takenCount}/${sup.total} taken`, sup.takenCount === sup.total && sup.total ? 'good' : ''));
  if (sup.lowCount) items.push(item('Restock', `${sup.lowCount} running low`, 'warn'));

  // Water
  const w = waterToday(data);
  items.push(item('Water', `${w.intake}/${w.target} oz`, w.percent >= 100 ? 'good' : (w.percent < 40 ? 'warn' : '')));

  // Workout
  const wk = todayWorkout(data);
  if (wk) {
    const label = wk.kind === 'training' ? wk.label : (wk.kind === 'active' ? 'Active recovery' : 'Rest day');
    items.push(item("Today's lift", label, wk.kind === 'training' ? '' : 'good'));
  }

  // AFTERGLOW next action
  items.push(item('AFTERGLOW', afterglowNextAction(data)));

  // Next deadline
  const dl = nextDeadline(data);
  if (dl) items.push(item('Next due', `${dl.text} · ${relativeDue(dl.due)}`,
    relativeDue(dl.due).includes('overdue') ? 'alert' : ''));

  // Readiness
  const r = readinessToday(data);
  if (r.score != null) {
    const kind = r.call === 'Push' ? 'good' : (r.call === 'Recover' ? 'alert' : (r.call === 'Maintain' ? 'warn' : ''));
    items.push(item('Readiness', `${r.score} · ${r.call}`, kind));
  }

  return items;
}

export function renderTicker() {
  const host = document.getElementById('ticker');
  if (!host) return;
  function paint() {
    const data = loadData();
    const items = buildItems(data);
    const track = el('div.ticker-track');
    // duplicate the sequence for a seamless looping marquee
    [...items, ...items.map(n => n.cloneNode(true))].forEach((n, i) => {
      if (i) track.appendChild(el('span.ticker-dot'));
      track.appendChild(n);
    });
    clear(host).appendChild(track);
  }
  paint();
  onChange(paint);
}
