// health.js - recovery, hydration, supplements, and wearable-ready shell.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate, updateItem, deleteItem } from '../store.js';
import { todayKey, fmtShort, lastNDays } from '../dates.js';
import {
  supplementStatus,
  TIMING_WINDOWS,
  TIMING_ORDER,
  waterTarget,
  waterToday,
  readinessScore,
  latestRecovery,
} from '../compute.js';
import { pageHero, pageGraphic, statTile, premiumEmpty, sparkline, visibleItems } from '../components.js';
import { isConnected, WEARABLE_STATUS } from '../wearableProvider.js';

const TIMING_LABEL = { morning: 'Morning', lunch: 'Lunch', evening: 'Evening', anytime: 'Anytime' };

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const latest = latestRecovery({ ...d, sleepRecoveryLogs: visibleItems(d, d.sleepRecoveryLogs) });
  const ready = readinessScore(latest);
  const water = waterToday(d);
  const sups = visibleItems(d, d.supplements);

  main.appendChild(pageHero({
    kicker: 'Health Intelligence',
    title: 'Optimize biology.',
    subtitle: 'Recovery, hydration, supplements, wearable shell.',
    tone: 'cool',
    graphic: pageGraphic('recovery', { score: ready.score ?? 82, fill: water.percent || 45, label: 'Readiness' }),
    actions: [
      el('button.btn.primary', { type: 'button', onclick: () => logRecovery(refresh) }, ['Log recovery']),
      el('button.btn.ghost', { type: 'button', onclick: () => editSupplement(null, refresh) }, ['Add supplement']),
    ],
    metrics: [
      statTile('Readiness', ready.score ?? '--', ready.call || 'manual', 'mint'),
      statTile('Sleep', latest?.durationH ? latest.durationH + 'h' : '--', 'last log', 'sky'),
      statTile('Hydration', water.percent + '%', `${water.intake}/${water.target} oz`, 'sky'),
      statTile('Stack', sups.length, 'supplements', 'amber'),
    ],
  }));

  renderRecovery(main, refresh, d, latest, ready);
  renderWater(main, refresh);
  renderSupplements(main, refresh, sups);
  renderWearableCard(main);

  main.appendChild(el('p.tiny.faint.center', {
    style: { marginTop: '20px' },
    text: 'Dominic OS tracks what you log. It is not medical advice.',
  }));
}

function renderRecovery(main, refresh, d, latest, ready) {
  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: 'Recovery' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => logRecovery(refresh) }, ['Log']),
  ]));

  const card = el('div.card.card-glow');
  if (ready.score == null) {
    card.appendChild(premiumEmpty({
      title: 'No recovery log yet',
      text: 'Log sleep, HRV, RHR, steps, soreness, and mood to get a training call.',
      actionLabel: 'Log recovery',
      onAction: () => logRecovery(refresh),
      graphic: 'recovery',
    }));
  } else {
    card.appendChild(el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: latest.date === todayKey() ? 'Today' : fmtShort(latest.date) }),
        el('div.big-num', { text: ready.score }),
        el('div.readiness-call', { class: 'call-' + ready.call.toLowerCase(), text: ready.call + ' day' }),
      ]),
      pageGraphic('recovery', { score: ready.score, fill: 62, label: 'Ready' }),
    ]));
    card.appendChild(el('div.grid.grid-3', { style: { marginTop: '14px' } }, [
      statTile('Sleep', latest.durationH + 'h', 'duration', 'sky'),
      statTile('HRV', latest.hrv || '--', 'ms', 'mint'),
      statTile('RHR', latest.rhr || '--', 'bpm', 'amber'),
    ]));
  }
  main.appendChild(card);

  const logs = visibleItems(d, d.sleepRecoveryLogs).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  if (logs.length) {
    main.appendChild(el('div.card.list', { style: { marginTop: '14px' } }, logs.map(l => {
      const lr = readinessScore(l);
      return el('div.item', {}, [
        el('div.grow', {}, [
          el('div.title', { text: `${fmtShort(l.date)} - ${l.durationH}h` }),
          el('div.meta', {}, [
            el('span', { text: 'RHR ' + (l.rhr || '--') }),
            el('span', { text: 'HRV ' + (l.hrv || '--') }),
            el('span', { text: (l.steps || 0) + ' steps' }),
          ]),
        ]),
        el('div.center', {}, [
          el('div.kpi', { class: 'call-' + lr.call.toLowerCase(), text: lr.score }),
          el('div.tiny.faint', { text: lr.call }),
        ]),
        el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete this log?')) { deleteItem('sleepRecoveryLogs', l.id); refresh(); } } }, ['Del']),
      ]);
    })));
  }
}

function renderWater(main, refresh) {
  const d = loadData();
  const w = d.settings.water;
  const target = waterTarget(w);
  const wt = waterToday(d);

  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title.accent', { text: 'Hydration' }),
    el('button.btn.sm.ghost', { type: 'button', onclick: () => editWaterSettings(refresh) }, ['Settings']),
  ]));

  const card = el('div.card');
  card.appendChild(el('div.grid.grid-2', {}, [
    el('div.water-display', {}, [
      el('div.big-num', { class: wt.percent >= 100 ? 'text-mint' : '', text: wt.intake + ' / ' + wt.target }),
      el('div.tiny.muted', { text: 'ounces today' }),
      el('div.bar', { style: { marginTop: '12px' } }, [el('span', { style: { width: wt.percent + '%' } })]),
    ]),
    pageGraphic('recovery', { score: wt.percent, fill: wt.percent || 22, label: 'Water' }),
  ]));
  const add = (oz) => {
    mutate(x => {
      const t = todayKey();
      const log = x.waterLogs[t] = x.waterLogs[t] || { targetOz: wt.target, intakeOz: 0 };
      log.intakeOz = Math.max(0, (log.intakeOz || 0) + oz);
      log.targetOz = wt.target;
    });
    refresh();
  };
  card.appendChild(el('div.water-controls', {}, [
    el('button.btn.mint', { type: 'button', onclick: () => add(w.bottleOz || 32) }, ['+' + (w.bottleOz || 32) + ' bottle']),
    el('button.btn', { type: 'button', onclick: () => add(16) }, ['+16']),
    el('button.btn', { type: 'button', onclick: () => add(8) }, ['+8']),
    el('button.btn.ghost', { type: 'button', onclick: () => add(-8) }, ['-8']),
  ]));
  card.appendChild(el('div', { style: { marginTop: '14px' } }, [
    el('div.label-cap', { text: 'Target formula' }),
    ...target.breakdown.map(([label, val]) => el('div.row.between', { style: { padding: '3px 0' } }, [
      el('span.tiny.muted', { text: label }),
      el('span.tiny', { text: '+' + val + ' oz' }),
    ])),
  ]));
  main.appendChild(card);

  const days = lastNDays(14);
  const hist = days.map(dk => d.waterLogs[dk]?.intakeOz || 0);
  if (hist.some(v => v > 0)) {
    main.appendChild(el('div.card', { style: { marginTop: '14px' } }, [
      el('div.row.between', { style: { marginBottom: '8px' } }, [
        el('div.label-cap', { text: '14-day intake' }),
        el('span.tiny.faint', { text: 'target ' + target.targetOz + ' oz' }),
      ]),
      sparkline(hist, true),
    ]));
  }
}

function renderSupplements(main, refresh, sups) {
  const d = loadData();
  const status = supplementStatus({ ...d, supplements: sups });

  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: 'Supplement timeline' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => editSupplement(null, refresh) }, ['Add']),
  ]));

  if (!sups.length) {
    main.appendChild(premiumEmpty({
      title: 'No supplement stack yet',
      text: 'Add only the stack you actually take. Demo data stays behind Load demo.',
      actionLabel: 'Add supplement',
      onAction: () => editSupplement(null, refresh),
      graphic: 'recovery',
    }));
    return;
  }

  TIMING_ORDER.forEach(timing => {
    const items = status.byTiming[timing];
    if (!items.length) return;
    const group = el('div.timing-group');
    group.appendChild(el('div.timing-head', {}, [
      el('span.label-cap', { text: TIMING_LABEL[timing] || TIMING_WINDOWS[timing].label }),
    ]));
    const card = el('div.card.list');
    items.forEach(s => card.appendChild(supplementRow(s, refresh)));
    group.appendChild(card);
    main.appendChild(group);
  });
}

function supplementRow(s, refresh) {
  return el('div.item' + (s.missed ? '.sup-missed' : ''), {}, [
    el('input.check', { type: 'checkbox', checked: s.taken, 'aria-label': 'taken', onchange: () => { mutate(x => { x.supplementLog[todayKey()] = x.supplementLog[todayKey()] || {}; if (s.taken) delete x.supplementLog[todayKey()][s.id]; else x.supplementLog[todayKey()][s.id] = true; }); refresh(); } }),
    el('div.grow', {}, [
      el('div.title' + (s.taken ? '.strike' : ''), { text: s.name }),
      el('div.meta', {}, [
        el('span', { text: s.dose || 'dose not set' }),
        s.missed ? el('span.text-pink', { text: 'window passed' }) : null,
        s.runningLow ? el('span.text-amber', { text: 'running low' }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => { updateItem('supplements', { id: s.id, runningLow: !s.runningLow }); toast(s.runningLow ? 'Restocked' : 'Flagged'); refresh(); } }, [s.runningLow ? 'OK' : 'Low']),
      el('button.icon-btn', { type: 'button', onclick: () => editSupplement(s, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog(`Delete ${s.name}?`)) { deleteItem('supplements', s.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function editSupplement(s, refresh) {
  const isNew = !s;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Name', value: s?.name || '', required: true },
    { name: 'dose', label: 'Dose', value: s?.dose || '', placeholder: '5g / 1 cap / 2000 IU' },
    { name: 'timing', label: 'Timing', type: 'select', value: s?.timing || 'morning', options: [{ value: 'morning', label: 'Morning' }, { value: 'lunch', label: 'Lunch' }, { value: 'evening', label: 'Evening' }, { value: 'anytime', label: 'Anytime' }] },
    { name: 'runningLow', label: 'Running low', type: 'checkbox', value: s?.runningLow || false },
  ]);
  openModal({ title: isNew ? 'New supplement' : s.name, body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('supplements', { id: s?.id || uid('sup'), ...values() }); toast('Saved', 'ok'); refresh(); } },
  ] });
}

function editWaterSettings(refresh) {
  const w = loadData().settings.water;
  const { form, values } = buildForm([
    { name: 'weightLbs', label: 'Body weight (lb)', type: 'number', value: w.weightLbs, min: 80 },
    { name: 'age', label: 'Age', type: 'number', value: w.age, min: 10 },
    { name: 'activity', label: 'Activity level', type: 'select', value: w.activity, options: [{ value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High (training)' }] },
    { name: 'caffeineMg', label: 'Caffeine (mg/day)', type: 'number', value: w.caffeineMg, min: 0 },
    { name: 'bottleOz', label: 'Bottle size (oz)', type: 'number', value: w.bottleOz, min: 1 },
    { name: 'manualTargetOz', label: 'Manual target (oz, optional)', type: 'number', value: w.manualTargetOz ?? '' },
  ]);
  openModal({ title: 'Water settings', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => { const v = values(); mutate(x => { x.settings.water = { ...x.settings.water, weightLbs: v.weightLbs, age: v.age, activity: v.activity, caffeineMg: v.caffeineMg, bottleOz: v.bottleOz, manualTargetOz: v.manualTargetOz || null }; }); toast('Saved', 'ok'); refresh(); } },
  ] });
}

function logRecovery(refresh) {
  const t = todayKey();
  const existing = loadData().sleepRecoveryLogs.find(l => l.date === t);
  const { form, values } = buildForm([
    { name: 'durationH', label: 'Sleep (hours)', type: 'number', value: existing?.durationH ?? 7.5, step: 0.1, min: 0 },
    { name: 'quality', label: 'Sleep quality (1-5)', type: 'number', value: existing?.quality ?? 4, min: 1, max: 5 },
    { name: 'rhr', label: 'Resting HR (bpm)', type: 'number', value: existing?.rhr ?? 55, min: 30 },
    { name: 'hrv', label: 'HRV (ms)', type: 'number', value: existing?.hrv ?? 65, min: 0 },
    { name: 'steps', label: 'Steps yesterday', type: 'number', value: existing?.steps ?? 8000, min: 0 },
    { name: 'soreness', label: 'Soreness (1-5, 5=worst)', type: 'number', value: existing?.soreness ?? 2, min: 1, max: 5 },
    { name: 'mood', label: 'Mood (1-5)', type: 'number', value: existing?.mood ?? 4, min: 1, max: 5 },
  ]);
  openModal({ title: 'Log sleep and recovery', wide: true, body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => { const v = values(); const r = readinessScore(v); updateItem('sleepRecoveryLogs', { id: existing?.id || ('sr_' + t), date: t, ...v, readiness: r.score, call: r.call }); toast('Recovery logged', 'ok'); refresh(); } },
  ] });
}

function renderWearableCard(main) {
  main.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Wearable sync' })]));
  main.appendChild(el('div.card', {}, [
    el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: 'Future connection' }),
        el('h2', { text: isConnected() ? WEARABLE_STATUS.provider : 'Manual mode' }),
      ]),
      el('span.chip', { class: isConnected() ? 'mint' : 'muted', text: isConnected() ? 'Connected' : 'V1' }),
    ]),
    el('p.small.muted', { style: { marginTop: '10px' }, text: 'No accounts connected and no secrets stored. CSV/API sync can be added later without changing the tracking model.' }),
  ]));
}
