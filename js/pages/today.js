// today.js - premium daily command center.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate, updateItem, deleteItem } from '../store.js';
import {
  todayKey,
  addDays,
  fmtLong,
  greeting,
  dayProgressPercent,
  relativeDue,
  daysUntil,
} from '../dates.js';
import {
  dataBackupCard,
  pageHero,
  pageGraphic,
  statTile,
  premiumEmpty,
  visibleItems,
  isDemoMode,
} from '../components.js';
import { waterToday, todayWorkout, nextDeadline, readinessToday } from '../compute.js';

const MODES = ['Focus', 'Balanced', 'Recover', 'Deep Work', 'Gym', 'Shutdown'];
const TRACKS = [
  { key: 'work', label: 'Priority', accent: 'mint' },
  { key: 'body', label: 'Body', accent: 'amber' },
  { key: 'school', label: 'Life', accent: 'sky' },
];
const SCORES = [
  { key: 'focus', label: 'Focus' },
  { key: 'body', label: 'Body' },
  { key: 'mind', label: 'Mind' },
  { key: 'recovery', label: 'Recovery' },
];
const CATEGORIES = ['Work', 'Body', 'School', 'Admin', 'Errand', 'Personal'];

let ledTimer = null;

function ensureTodayLog(d) {
  const t = todayKey();
  if (!d.dailyLogs[t] || (d.dailyLogs[t]._sample && !isDemoMode(d))) {
    d.dailyLogs[t] = {
      date: t,
      mode: 'Balanced',
      priorities: [],
      scorecard: { focus: 0, body: 0, mind: 0, recovery: 0 },
      reflection: { win: '', avoided: '', firstMove: '' },
    };
  }
  const log = d.dailyLogs[t];
  if (!log.scorecard) log.scorecard = { focus: 0, body: 0, mind: 0, recovery: 0 };
  if (!log.reflection) log.reflection = { win: '', avoided: '', firstMove: '' };
  TRACKS.forEach(tr => {
    if (!log.priorities.find(p => p.track === tr.key)) {
      log.priorities.push({ id: uid('p'), track: tr.key, text: '', done: false });
    }
  });
  return log;
}

export function render(main) {
  const refresh = () => render(main);
  mutate(x => { ensureTodayLog(x); });
  const d = loadData();
  const log = d.dailyLogs[todayKey()];
  const pct = dayProgressPercent();
  const water = waterToday(d);
  const workout = todayWorkout(d);
  const readiness = readinessToday(d);
  const deadline = nextDeadline(d);
  const tasks = visibleItems(d, d.tasks).sort(taskSort);
  const doneCount = log.priorities.filter(p => p.done && p.text).length;
  const setCount = log.priorities.filter(p => p.text).length;
  const name = d.profile?.name || 'Dominic';

  clear(main);

  main.appendChild(pageHero({
    kicker: fmtLong(),
    title: `${greeting()}, ${name}.`,
    subtitle: 'Training, execution, recovery, reflection.',
    tone: 'cool',
    graphic: pageGraphic('orbital', { progress: pct }),
    actions: [
      el('button.btn.primary', { type: 'button', onclick: () => quickTask(refresh) }, ['Quick capture']),
      el('button.btn.ghost', { type: 'button', onclick: () => { location.hash = '#/gym'; } }, ['Open gym']),
    ],
    metrics: [
      statTile('Day progress', pct + '%', 'current arc', 'mint'),
      statTile('Readiness', readiness.score ?? '--', readiness.call || 'manual', 'sky'),
      statTile('Water', `${water.intake}/${water.target}`, 'oz today', 'sky'),
      statTile('Training', workout ? workout.label : 'Ready', workout ? workout.kind : 'starter split', 'amber'),
    ],
  }));

  main.appendChild(buildLedTicker(d, log, tasks));

  const focusCard = el('div.card.card-glow');
  focusCard.appendChild(el('div.row.between', {}, [
    el('div', {}, [
      el('div.label-cap', { text: 'Today focus' }),
      el('div.row', { style: { alignItems: 'baseline', gap: '8px', marginTop: '4px' } }, [
        el('span.big-num', { text: doneCount }),
        el('span.mono.faint', { text: '/ ' + (setCount || 3) }),
        el('span.tiny.faint', { text: setCount && doneCount === setCount ? 'complete' : 'done' }),
      ]),
    ]),
    el('div.seg-bar', {}, TRACKS.map(tr => {
      const p = log.priorities.find(x => x.track === tr.key);
      return el('span.seg' + (p && p.done && p.text ? '.on' : ''));
    })),
  ]));
  TRACKS.forEach(tr => {
    const p = log.priorities.find(x => x.track === tr.key) || { text: '', done: false };
    focusCard.appendChild(el('div.item', {}, [
      el('input.check', {
        type: 'checkbox',
        checked: p.done,
        'aria-label': tr.label + ' done',
        onchange: e => {
          mutate(x => {
            const row = x.dailyLogs[todayKey()].priorities.find(z => z.track === tr.key);
            if (row) row.done = e.target.checked;
          });
          refresh();
        },
      }),
      el('div.grow', {}, [
        el('div.label-cap.text-' + tr.accent, { text: tr.label }),
        el('div.title' + (p.done ? '.strike' : ''), {
          text: p.text || `Set your ${tr.label.toLowerCase()}`,
          style: p.text ? {} : { color: 'var(--faint)', fontWeight: '600' },
        }),
      ]),
      el('button.icon-btn', { type: 'button', 'aria-label': 'Edit priority', onclick: () => editPriority(tr, p, refresh) }, ['Edit']),
    ]));
  });
  main.appendChild(el('section', { style: { marginTop: '16px' } }, [focusCard]));

  main.appendChild(el('div.grid.grid-2', { style: { marginTop: '14px' } }, [
    commandCard('Body / Gym', workout ? `${workout.label} day` : 'Starter split ready', workout ? `${workout.kind} - open Gym to train.` : 'Generate or adjust your week.', 'Open', () => { location.hash = '#/gym'; }),
    commandCard('Health', readiness.score ? `${readiness.score} readiness` : 'Manual recovery', water.percent + '% hydration progress.', 'Log', () => { location.hash = '#/health'; }),
    commandCard('School / Admin', deadline ? deadline.text : 'No real deadlines', deadline ? relativeDue(deadline.due) : 'Add classes, reminders, or follow-ups.', 'Review', () => { location.hash = '#/school'; }),
    quickCaptureCard(refresh),
  ]));

  main.appendChild(el('section', {}, [
    el('div.section-head', {}, [el('h2.section-title', { text: 'Mode' })]),
    el('div.modes', {}, MODES.map(m => el('button.mode-btn' + (log.mode === m ? '.active' : ''), {
      type: 'button',
      onclick: () => {
        mutate(x => { x.dailyLogs[todayKey()].mode = log.mode === m ? '' : m; });
        refresh();
      },
    }, [m]))),
  ]));

  main.appendChild(el('section', {}, [
    el('div.section-head', {}, [
      el('h2.section-title', { text: 'Tasks' }),
      el('button.btn.sm.primary', { type: 'button', onclick: () => editTask(null, refresh) }, ['Add']),
    ]),
    tasks.length
      ? el('div.card.list', {}, tasks.map(t => taskRow(t, refresh)))
      : premiumEmpty({ title: 'No real tasks yet', text: 'Capture only what actually matters today.', actionLabel: 'Add task', onAction: () => editTask(null, refresh), graphic: 'focus' }),
  ]));

  main.appendChild(scorecard(log, refresh));
  main.appendChild(reflectionCard(log));
  main.appendChild(el('section', { style: { marginTop: '18px' } }, [dataBackupCard(refresh)]));
}

function commandCard(title, value, sub, cta, onClick) {
  return el('div.card.tight', {}, [
    el('div.label-cap', { text: title }),
    el('div.kpi', { style: { marginTop: '8px' }, text: value }),
    el('p.tiny.muted', { style: { marginTop: '6px' }, text: sub }),
    el('button.btn.sm.ghost', { type: 'button', style: { marginTop: '12px' }, onclick: onClick }, [cta]),
  ]);
}

function quickCaptureCard(refresh) {
  const input = el('input', { placeholder: 'Task, thought, habit...', 'aria-label': 'Quick capture' });
  const add = () => {
    const title = input.value.trim();
    if (!title) { input.focus(); return; }
    updateItem('tasks', { id: uid('t'), title, category: 'Personal', priority: 'med', due: todayKey(), done: false });
    toast('Captured', 'ok');
    refresh();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  return el('div.card.tight', {}, [
    el('div.label-cap', { text: 'Quick capture' }),
    el('div.row', { style: { marginTop: '10px' } }, [
      input,
      el('button.icon-btn', { type: 'button', 'aria-label': 'Add capture', onclick: add }, ['+']),
    ]),
  ]);
}

function scorecard(log, refresh) {
  const scoreCard = el('section', {}, [el('div.section-head', {}, [el('h2.section-title', { text: 'Daily scorecard' })])]);
  const card = el('div.card');
  const scoreGrid = el('div.score-grid');
  SCORES.forEach(s => {
    const val = log.scorecard[s.key] || 0;
    const dots = el('div.dots');
    for (let i = 1; i <= 5; i++) {
      dots.appendChild(el('button.dot-btn' + (i <= val ? '.on' : ''), {
        type: 'button',
        'aria-label': `${s.label} ${i}`,
        onclick: () => {
          mutate(x => { x.dailyLogs[todayKey()].scorecard[s.key] = val === i ? i - 1 : i; });
          refresh();
        },
      }));
    }
    scoreGrid.appendChild(el('div.score-cell', {}, [el('div.label-cap', { text: s.label }), dots]));
  });
  card.appendChild(scoreGrid);
  scoreCard.appendChild(card);
  return scoreCard;
}

function reflectionCard(log) {
  const card = el('div.card');
  card.appendChild(el('div.label-cap', { text: 'Reflection' }));
  [
    { key: 'win', label: "Today's win" },
    { key: 'avoided', label: 'What I avoided' },
    { key: 'firstMove', label: "Tomorrow's first move" },
  ].forEach(rf => {
    const ta = el('textarea', { rows: 2, placeholder: 'Write the truth, briefly.' });
    ta.value = log.reflection[rf.key] || '';
    ta.addEventListener('change', () => {
      mutate(x => { x.dailyLogs[todayKey()].reflection[rf.key] = ta.value.trim(); });
      toast('Saved', 'ok');
    });
    card.appendChild(el('label.field', { style: { marginTop: '12px' } }, [
      el('span.field-label', { text: rf.label }),
      ta,
    ]));
  });
  return el('section', { style: { marginTop: '18px' } }, [card]);
}

function buildLedTicker(d, log, tasks) {
  const items = [];
  log.priorities.filter(p => p.text && !p.done).forEach(p => items.push({ status: 'pending', text: p.text }));
  const overdue = tasks.filter(t => !t.done && t.due && daysUntil(t.due) < 0).length;
  if (overdue) items.push({ status: 'miss', text: `${overdue} overdue item${overdue > 1 ? 's' : ''}` });
  if (!items.length) items.push({ status: 'done', text: log.priorities.some(p => p.text) ? 'Priorities are clean.' : 'Set the first priority for today.' });
  const totalP = log.priorities.filter(p => p.text).length;
  const doneP = log.priorities.filter(p => p.text && p.done).length;
  const stage = el('div.led-stage');
  const led = el('div.led-ticker', {}, [
    el('div.led-light', {}, [el('span.led-dot')]),
    el('div.led-label', { text: 'Command' }),
    stage,
    el('div.led-meta.mono', { text: `${doneP}/${totalP || 0}` }),
  ]);
  let idx = 0;
  let cur = null;
  function tick() {
    const it = items[idx % items.length];
    idx++;
    const row = el('div.led-row', {}, [
      el('span.led-status', { dataset: { status: it.status }, text: it.status === 'done' ? 'OK' : (it.status === 'pending' ? '>' : '!') }),
      el('span.led-text', { text: it.text }),
    ]);
    if (cur) {
      cur.classList.add('is-leaving');
      const old = cur;
      setTimeout(() => old.remove(), 460);
      row.classList.add('is-entering');
    }
    stage.appendChild(row);
    cur = row;
  }
  tick();
  if (ledTimer) clearInterval(ledTimer);
  if (items.length > 1) ledTimer = setInterval(tick, 4200);
  return led;
}

function taskSort(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const da = a.due ? daysUntil(a.due) : 9999;
  const db = b.due ? daysUntil(b.due) : 9999;
  return da - db;
}

function taskRow(t, refresh) {
  const overdue = t.due && !t.done && daysUntil(t.due) < 0;
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: t.done, 'aria-label': 'done', onchange: () => { updateItem('tasks', { id: t.id, done: !t.done }); refresh(); } }),
    el('span.pri', { class: t.priority || 'low' }),
    el('div.grow', {}, [
      el('div.title' + (t.done ? '.strike' : ''), { text: t.title }),
      el('div.meta', {}, [
        t.category ? el('span.chip', { text: t.category }) : null,
        t.due ? el('span.mono', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(t.due) }) : null,
        t._sample ? el('span.sample-badge', { text: 'sample' }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', title: 'Push to tomorrow', 'aria-label': 'Push to tomorrow', onclick: () => { updateItem('tasks', { id: t.id, due: todayKey(addDays(new Date(), 1)) }); toast('Pushed to tomorrow'); refresh(); } }, ['>']),
      el('button.icon-btn', { type: 'button', title: 'Edit', 'aria-label': 'Edit', onclick: () => editTask(t, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', title: 'Delete', 'aria-label': 'Delete', onclick: async () => { if (await confirmDialog(`Delete "${t.title}"?`)) { deleteItem('tasks', t.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function quickTask(refresh) {
  editTask(null, refresh);
}

function editTask(task, refresh) {
  const isNew = !task;
  const { form, values, validate } = buildForm([
    { name: 'title', label: 'Task', value: task?.title || '', required: true, placeholder: 'What needs doing?' },
    { name: 'category', label: 'Category', type: 'select', value: task?.category || 'Work', options: CATEGORIES },
    { name: 'priority', label: 'Priority', type: 'select', value: task?.priority || 'med', options: [{ value: 'high', label: 'High' }, { value: 'med', label: 'Medium' }, { value: 'low', label: 'Low' }] },
    { name: 'due', label: 'Due date', type: 'date', value: task?.due || todayKey() },
  ]);
  openModal({
    title: isNew ? 'New task' : 'Edit task',
    body: form,
    actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      {
        label: isNew ? 'Add task' : 'Save',
        kind: 'primary',
        onClick: () => {
          if (!validate()) return false;
          updateItem('tasks', { id: task?.id || uid('t'), done: task?.done || false, ...values() });
          toast(isNew ? 'Task added' : 'Saved', 'ok');
          refresh();
        },
      },
    ],
  });
}

function editPriority(track, p, refresh) {
  const { form, values } = buildForm([
    { name: 'text', label: `${track.label} priority`, value: p.text || '', placeholder: 'The one thing' },
  ]);
  openModal({
    title: `${track.label} priority`,
    body: form,
    actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      {
        label: 'Save',
        kind: 'primary',
        onClick: () => {
          mutate(x => {
            const row = x.dailyLogs[todayKey()].priorities.find(z => z.track === track.key);
            if (row) row.text = values().text;
          });
          refresh();
        },
      },
    ],
  });
}
