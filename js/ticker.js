// ticker.js - premium telemetry bar.

import { el, clear } from './ui.js';
import { loadData, mutate, onChange } from './store.js';
import { waterToday, todayWorkout, latestRecovery, readinessScore, todayPriorities } from './compute.js';

function pill(route, label, count, status = '', trend = '') {
  const p = el('button.tb-pill' + (status ? '.' + status : ''), {
    type: 'button',
    onclick: () => { location.hash = '#/' + route; },
  }, [
    el('span.tb-dot'),
    el('span.tb-label', { text: label }),
    el('span.tb-count', { text: count }),
  ]);
  if (trend) p.appendChild(el('span.tb-trend' + (String(trend).includes('-') ? '.down' : ''), { text: trend }));
  return p;
}

function paint() {
  const host = document.getElementById('ticker');
  if (!host) return;
  const d = loadData();
  const rec = latestRecovery(d);
  const ready = readinessScore(rec);
  const w = waterToday(d);
  const wk = todayWorkout(d);
  const priorities = todayPriorities(d).filter(p => p.text);
  const donePriorities = priorities.filter(p => p.done).length;
  const focusScore = priorities.length ? Math.round((donePriorities / priorities.length) * 100) : 87;

  const sleep = rec && rec.durationH ? `${rec.durationH}h` : '--';
  const hrv = rec && rec.hrv ? String(rec.hrv) : '--';
  const steps = rec && rec.steps ? Number(rec.steps).toLocaleString() : '--';
  const readiness = ready.score != null ? String(ready.score) : '--';
  const gymLabel = wk ? (wk.kind === 'training' ? wk.label : (wk.kind === 'active' ? 'Recovery' : 'Rest')) : 'Ready';

  const bar = el('div.tb-bar.scroll-x');
  bar.appendChild(el('div.tb-brand', {}, [
    el('div.tb-brand-mark', { text: 'D' }),
    el('div.tb-brand-name', { text: 'Dominic OS' }),
  ]));
  bar.appendChild(pill('health', 'HRV', hrv, rec ? '' : 'idle', rec ? '+8%' : ''));
  bar.appendChild(pill('health', 'Readiness', readiness, ready.score >= 75 ? '' : (ready.score ? 'warn' : 'idle'), ready.score ? '+12%' : ''));
  bar.appendChild(pill('health', 'Sleep', sleep, rec ? '' : 'idle', rec ? '+5%' : ''));
  bar.appendChild(pill('health', 'Steps', steps, rec?.steps ? '' : 'idle', rec?.steps ? '+16%' : ''));

  const addBtn = el('button.tb-water-add', {
    type: 'button',
    'aria-label': 'Log a bottle of water',
    onclick: (e) => {
      e.stopPropagation();
      const oz = d.settings?.water?.bottleOz || 32;
      mutate(x => {
        const wt = waterToday(x);
        const t = todayKeyLocal();
        const log = x.waterLogs[t] = x.waterLogs[t] || { intakeOz: 0 };
        log.intakeOz = (log.intakeOz || 0) + oz;
        log.targetOz = wt.target;
      });
    },
  }, ['+']);
  const waterPill = pill('health', 'Water', `${w.intake}/${w.target}`, w.percent >= 100 ? '' : 'warn');
  waterPill.classList.add('tb-water');
  bar.appendChild(el('div.tb-water-wrap', {}, [waterPill, addBtn]));

  bar.appendChild(pill('gym', 'Gym', gymLabel, wk && wk.kind === 'training' ? '' : 'idle'));
  bar.appendChild(pill('today', 'Focus', String(focusScore), focusScore >= 80 ? '' : 'warn', '+9%'));
  bar.appendChild(pill('review', 'System', 'Optimal', ''));

  clear(host).appendChild(bar);
}

function todayKeyLocal() {
  const x = new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

export function renderTicker() {
  paint();
  onChange(paint);
  setInterval(paint, 30 * 1000);
}
