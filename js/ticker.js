// ticker.js — Rowan-style sticky PILL COMMAND BAR.
// A row of stat pills (Goals / Stack / Water+ / Gym / Next) with status dots
// (green good · gold warn · red pulsing miss) and mono counts. The water "+"
// logs a bottle from anywhere. Subscribes to store changes to stay live.

import { el, clear } from './ui.js';
import { loadData, mutate, onChange } from './store.js';
import {
  todayPriorities, supplementStatus, waterToday, todayWorkout, nextDeadline,
} from './compute.js';
import { relativeDue } from './dates.js';

function statusFromCount(done, total) {
  if (!total) return 'idle';
  if (done >= total) return 'good';
  if (done >= total * 0.5) return 'warn';
  return new Date().getHours() >= 18 ? 'miss' : 'warn';
}

function pill(route, label, count, status, extra) {
  const p = el('button.tb-pill' + (status ? '.' + status : ''), { type: 'button',
    onclick: () => { location.hash = '#/' + route; } }, [
    el('span.tb-dot'),
    el('span.tb-label', { text: label }),
    el('span.tb-count', { text: count }),
  ]);
  if (extra) p.appendChild(extra);
  return p;
}

function paint() {
  const host = document.getElementById('ticker');
  if (!host) return;
  const d = loadData();

  // Goals = today's top priorities
  const pris = todayPriorities(d);
  const gDone = pris.filter(p => p.done).length;
  const gTotal = pris.length;

  // Stack = supplements taken today
  const sup = supplementStatus(d);
  let stackStatus = statusFromCount(sup.takenCount, sup.total);
  if (sup.missed.length) stackStatus = 'miss';

  // Water
  const w = waterToday(d);
  const waterStatus = statusFromCount(w.intake, w.target);

  // Workout today
  const wk = todayWorkout(d);
  const wkLabel = wk ? (wk.kind === 'training' ? wk.label : (wk.kind === 'active' ? 'Recovery' : 'Rest')) : '—';

  // Next deadline
  const dl = nextDeadline(d);
  const dlText = dl ? relativeDue(dl.due) : '—';
  const dlStatus = dl && relativeDue(dl.due).includes('overdue') ? 'miss' : '';

  const bar = el('div.tb-bar.scroll-x');

  bar.appendChild(pill('today', 'Goals', gTotal ? `${gDone}/${gTotal}` : '0/0', statusFromCount(gDone, gTotal)));
  bar.appendChild(pill('health', 'Stack', sup.total ? `${sup.takenCount}/${sup.total}` : '0/0', stackStatus));

  // Water pill with a + quick-add
  const addBtn = el('button.tb-water-add', { type: 'button', 'aria-label': 'Log a bottle of water',
    onclick: (e) => {
      e.stopPropagation();
      const oz = d.settings?.water?.bottleOz || 32;
      mutate(x => { const t = waterToday(x); const tk = require_today(); const log = x.waterLogs[tk] = x.waterLogs[tk] || { intakeOz: 0 }; log.intakeOz = (log.intakeOz || 0) + oz; log.targetOz = t.target; });
      e.currentTarget.classList.add('flash');
      setTimeout(() => e.currentTarget && e.currentTarget.classList.remove('flash'), 220);
    } }, ['+']);
  const waterPill = pill('health', 'Water', `${w.intake}/${w.target}`, waterStatus);
  waterPill.classList.add('tb-water');
  const waterWrap = el('div.tb-water-wrap', {}, [waterPill, addBtn]);
  bar.appendChild(waterWrap);

  bar.appendChild(pill('gym', 'Gym', wkLabel, wk && wk.kind === 'training' ? '' : 'good'));
  bar.appendChild(pill('school', 'Next', dlText, dlStatus));

  clear(host).appendChild(bar);
}

// local today key without importing (avoid circular churn)
function require_today() {
  const x = new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

export function renderTicker() {
  paint();
  onChange(paint);
  setInterval(paint, 30 * 1000); // keep counts fresh (miss-pulse after 6pm etc.)
}
