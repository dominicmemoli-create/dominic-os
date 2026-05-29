// health.js — supplements, water, sleep/recovery + readiness (Tier 1).

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate, updateItem, deleteItem } from '../store.js';
import { todayKey, fmtShort, lastNDays } from '../dates.js';
import {
  supplementStatus, TIMING_WINDOWS, TIMING_ORDER, waterTarget, waterToday,
  readinessScore, latestRecovery,
} from '../compute.js';
import { sparkline } from '../components.js';
import { isConnected, WEARABLE_STATUS } from '../wearableProvider.js';

const TIMING_ICON = { morning: '☀', lunch: '🍴', evening: '🌙', anytime: '∞' };

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Recovery · fuel · readiness' }),
    el('h1', { text: 'Health' }),
  ]));

  renderSupplements(main, refresh);
  renderWater(main, refresh);
  renderRecovery(main, refresh);
  renderWearableCard(main);

  main.appendChild(el('p.tiny.faint.center', { style: { marginTop: '20px' },
    text: 'Dominic OS tracks what you log. It is not medical advice — consult a professional for health decisions.' }));
}

/* ---------------- SUPPLEMENTS ---------------- */
function renderSupplements(main, refresh) {
  const d = loadData();
  const status = supplementStatus(d);

  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: 'Supplement stack' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => editSupplement(null, refresh) }, ['+ Add']),
  ]));
  main.appendChild(el('div.row.between', { style: { marginBottom: '12px' } }, [
    el('span.chip.mint', { text: `${status.takenCount}/${status.total} taken today` }),
    status.missed.length ? el('span.chip.pink', { text: `${status.missed.length} missed` }) : null,
    status.lowCount ? el('span.chip.amber', { text: `${status.lowCount} running low` }) : null,
  ].filter(Boolean)));

  if (!status.total) {
    main.appendChild(el('div.empty', {}, [el('p', { text: 'No supplements yet. Add your stack.' })]));
    return;
  }

  TIMING_ORDER.forEach(timing => {
    const items = status.byTiming[timing];
    if (!items.length) return;
    const group = el('div.timing-group');
    group.appendChild(el('div.timing-head', {}, [
      el('span', { text: TIMING_ICON[timing], style: { fontSize: '14px' } }),
      el('span.label-cap', { text: TIMING_WINDOWS[timing].label }),
    ]));
    const card = el('div.card.list');
    items.forEach(s => {
      const row = el('div.item' + (s.missed ? '.sup-missed' : ''), { style: s.missed ? { borderRadius: '10px', padding: '11px' } : {} }, [
        el('input.check', { type: 'checkbox', checked: s.taken, 'aria-label': 'taken',
          onchange: () => { mutate(x => { x.supplementLog[todayKey()] = x.supplementLog[todayKey()] || {}; if (s.taken) delete x.supplementLog[todayKey()][s.id]; else x.supplementLog[todayKey()][s.id] = true; }); refresh(); } }),
        el('div.grow', {}, [
          el('div.title' + (s.taken ? '.strike' : ''), { text: s.name }),
          el('div.meta', {}, [el('span', { text: s.dose }), s.missed ? el('span.text-pink', { text: 'MISSED — window passed' }) : null, s.runningLow ? el('span.text-amber', { text: 'running low' }) : null].filter(Boolean)),
        ]),
        el('div.actions', {}, [
          el('button.icon-btn', { type: 'button', title: s.runningLow ? 'Mark restocked' : 'Mark running low', onclick: () => { updateItem('supplements', { id: s.id, runningLow: !s.runningLow }); toast(s.runningLow ? 'Marked restocked' : 'Flagged to restock'); refresh(); } }, [s.runningLow ? '✓' : '⚑']),
          el('button.icon-btn', { type: 'button', title: 'Edit', onclick: () => editSupplement(s, refresh) }, ['✎']),
          el('button.icon-btn.danger', { type: 'button', title: 'Delete', onclick: async () => { if (await confirmDialog(`Delete ${s.name}?`)) { deleteItem('supplements', s.id); refresh(); } } }, ['🗑']),
        ]),
      ]);
      card.appendChild(row);
    });
    group.appendChild(card);
    main.appendChild(group);
  });
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
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => {
      if (!validate()) return false; const v = values();
      updateItem('supplements', { id: s?.id || uid('sup'), ...v });
      toast('Saved', 'ok'); refresh();
    } },
  ] });
}

/* ---------------- WATER ---------------- */
function renderWater(main, refresh) {
  const d = loadData();
  const w = d.settings.water;
  const target = waterTarget(w);
  const wt = waterToday(d);

  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title.accent', { text: 'Water' }),
    el('button.btn.sm.ghost', { type: 'button', onclick: () => editWaterSettings(refresh) }, ['⚙ Settings']),
  ]));

  const card = el('div.card');
  card.appendChild(el('div.water-display', {}, [
    el('div.big-num', { class: wt.percent >= 100 ? 'text-mint' : '', text: wt.intake + ' / ' + wt.target }),
    el('div.tiny.muted', { text: 'ounces today' }),
    el('div.bar', { style: { marginTop: '12px' } }, [el('span', { style: { width: wt.percent + '%' } })]),
  ]));
  const add = (oz) => { mutate(x => { const t = todayKey(); const log = x.waterLogs[t] = x.waterLogs[t] || { targetOz: wt.target, intakeOz: 0 }; log.intakeOz = Math.max(0, (log.intakeOz || 0) + oz); log.targetOz = wt.target; }); refresh(); };
  card.appendChild(el('div.water-controls', {}, [
    el('button.btn.mint', { type: 'button', onclick: () => add(w.bottleOz || 32) }, ['+' + (w.bottleOz || 32) + ' bottle']),
    el('button.btn', { type: 'button', onclick: () => add(16) }, ['+16']),
    el('button.btn', { type: 'button', onclick: () => add(8) }, ['+8']),
    el('button.btn.ghost', { type: 'button', onclick: () => add(-8) }, ['−8']),
  ]));

  // transparent target breakdown
  const bd = el('div', { style: { marginTop: '14px' } }, [el('div.label-cap', { text: 'How your target is calculated' })]);
  target.breakdown.forEach(([label, val]) => bd.appendChild(el('div.row.between', { style: { padding: '3px 0' } }, [el('span.tiny.muted', { text: label }), el('span.tiny', { text: '+' + val + ' oz' })])));
  bd.appendChild(el('div.row.between', { style: { padding: '5px 0 0', borderTop: '1px solid var(--border)', marginTop: '4px' } }, [el('span.tiny', { text: 'Daily target' }), el('span.tiny.text-mint', { text: target.targetOz + ' oz' })]));
  card.appendChild(bd);
  main.appendChild(card);

  // 14-day history
  const days = lastNDays(14);
  const hist = days.map(dk => d.waterLogs[dk]?.intakeOz || 0);
  if (hist.some(v => v > 0)) {
    main.appendChild(el('div.card', { style: { marginTop: '12px' } }, [
      el('div.row.between', { style: { marginBottom: '8px' } }, [el('div.label-cap', { text: '14-day intake' }), el('span.tiny.faint', { text: 'target ' + target.targetOz + ' oz' })]),
      sparkline(hist, true),
    ]));
  }
}

function editWaterSettings(refresh) {
  const w = loadData().settings.water;
  const { form, values } = buildForm([
    { name: 'weightLbs', label: 'Body weight (lb)', type: 'number', value: w.weightLbs, min: 80 },
    { name: 'age', label: 'Age', type: 'number', value: w.age, min: 10 },
    { name: 'activity', label: 'Activity level', type: 'select', value: w.activity, options: [{ value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High (training)' }] },
    { name: 'caffeineMg', label: 'Caffeine (mg/day)', type: 'number', value: w.caffeineMg, min: 0 },
    { name: 'bottleOz', label: 'Bottle size (oz)', type: 'number', value: w.bottleOz, min: 1 },
    { name: 'manualTargetOz', label: 'Manual target (oz, optional)', type: 'number', value: w.manualTargetOz ?? '', hint: 'Leave blank to auto-calculate.' },
  ]);
  openModal({ title: 'Water settings', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => {
      const v = values();
      mutate(x => { x.settings.water = { ...x.settings.water, weightLbs: v.weightLbs, age: v.age, activity: v.activity, caffeineMg: v.caffeineMg, bottleOz: v.bottleOz, manualTargetOz: v.manualTargetOz || null }; });
      toast('Saved', 'ok'); refresh();
    } },
  ] });
}

/* ---------------- SLEEP / RECOVERY ---------------- */
function renderRecovery(main, refresh) {
  const d = loadData();
  const latest = latestRecovery(d);
  const r = readinessScore(latest);

  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: 'Sleep & recovery' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => logRecovery(refresh) }, ['Log today']),
  ]));

  const card = el('div.card.card-glow');
  if (r.score == null) {
    card.appendChild(el('p.muted', { text: 'Log last night to get a readiness score and a training call.' }));
  } else {
    card.appendChild(el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: 'Readiness · ' + (latest.date === todayKey() ? 'today' : fmtShort(latest.date)) }),
        el('div.big-num', { text: r.score }),
        el('div.readiness-call', { class: 'call-' + r.call.toLowerCase(), text: r.call + ' day' }),
      ]),
      el('div', { style: { textAlign: 'right' } }, [
        el('div.tiny.muted', { text: latest.durationH + 'h sleep · Q' + latest.quality + '/5' }),
        el('div.tiny.muted', { text: 'RHR ' + (latest.rhr || '—') + ' · HRV ' + (latest.hrv || '—') }),
        el('div.tiny.muted', { text: 'Sore ' + (latest.soreness || '—') + '/5 · Mood ' + (latest.mood || '—') + '/5' }),
      ]),
    ]));
    card.appendChild(el('div.bar', { class: r.call === 'Recover' ? 'pink' : (r.call === 'Push' ? '' : 'amber'), style: { marginTop: '12px' } }, [el('span', { style: { width: r.score + '%' } })]));
  }
  main.appendChild(card);

  // recent
  const logs = [...(d.sleepRecoveryLogs || [])].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  if (logs.length) {
    const list = el('div.card.list', { style: { marginTop: '12px' } });
    logs.forEach(l => {
      const lr = readinessScore(l);
      list.appendChild(el('div.item', {}, [
        el('div.grow', {}, [el('div.title', { text: fmtShort(l.date) + ' · ' + l.durationH + 'h' }), el('div.meta', {}, [el('span', { text: 'RHR ' + (l.rhr || '—') }), el('span', { text: 'HRV ' + (l.hrv || '—') }), el('span', { text: (l.steps || 0) + ' steps' })])]),
        el('div.center', {}, [el('div.kpi', { class: 'call-' + lr.call.toLowerCase(), text: lr.score }), el('div.tiny.faint', { text: lr.call })]),
        el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete this log?')) { deleteItem('sleepRecoveryLogs', l.id); refresh(); } } }, ['🗑']),
      ]));
    });
    main.appendChild(list);
  }
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
  // live readiness preview
  const preview = el('div.card.tight', { style: { marginTop: '4px' } });
  const updatePreview = () => {
    const v = values();
    const r = readinessScore(v);
    clear(preview).appendChild(el('div.row.between', {}, [el('span.label-cap', { text: 'Projected readiness' }), el('span.kpi', { class: 'call-' + r.call.toLowerCase(), text: r.score + ' · ' + r.call })]));
  };
  form.addEventListener('input', updatePreview);
  const body = el('div', {}, [form, preview]);
  setTimeout(updatePreview, 0);

  openModal({ title: 'Log sleep & recovery', wide: true, body, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => {
      const v = values();
      const r = readinessScore(v);
      updateItem('sleepRecoveryLogs', { id: existing?.id || ('sr_' + t), date: t, ...v, readiness: r.score, call: r.call });
      toast('Recovery logged', 'ok'); refresh();
    } },
  ] });
}

/* ---------------- WEARABLE PREP ---------------- */
function renderWearableCard(main) {
  main.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Wearable sync' })]));
  main.appendChild(el('div.card', {}, [
    el('div.row.between', {}, [
      el('div.label-cap', { text: 'Status' }),
      el('span.chip', { class: isConnected() ? 'mint' : 'muted', text: isConnected() ? WEARABLE_STATUS.provider : 'Manual entry (V1)' }),
    ]),
    el('div', { style: { marginTop: '12px' } }, [
      roadmapRow('V1 · now', 'Manual entry', 'Log sleep, RHR, HRV, steps by hand. Active today.', true),
      roadmapRow('V2 · next', 'CSV import', 'Drop a WHOOP/Fitbit export to backfill recovery logs.', false),
      roadmapRow('V3 · later', 'Live API', 'Google Health Connect / Health API (not the deprecated Google Fit). Requires your credentials.', false),
    ]),
    el('p.tiny.faint', { style: { marginTop: '12px' }, text: 'No accounts connected, no secrets stored. Full plan in NEXT_STEPS.md.' }),
  ]));
}

function roadmapRow(stage, title, desc, active) {
  return el('div.row', { style: { gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' } }, [
    el('span.chip', { class: active ? 'mint' : 'muted', text: stage, style: { flex: 'none', marginTop: '2px' } }),
    el('div.grow', {}, [el('div.title', { text: title }), el('div.tiny.muted', { text: desc })]),
  ]);
}
