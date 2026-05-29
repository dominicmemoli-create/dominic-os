// today.js — Daily Command Center, Rowan-aligned.
// Day ring + cycling LED goal ticker + priorities + tasks + scorecard + reflection.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate, updateItem, deleteItem } from '../store.js';
import { todayKey, addDays, fmtLong, greeting, dayProgressPercent, relativeDue, daysUntil } from '../dates.js';
import { dataBackupCard } from '../components.js';
import { supplementStatus, productivityNextAction } from '../compute.js';

const MODES = [
  { id: 'Morning', icon: '☀' }, { id: 'Deep Work', icon: '◎' }, { id: 'Gym', icon: '🏋' },
  { id: 'Errands', icon: '🚗' }, { id: 'Evening', icon: '🌙' }, { id: 'Shutdown', icon: '⏻' },
];
const TRACKS = [
  { key: 'work', label: 'Work', accent: 'mint' },
  { key: 'body', label: 'Body', accent: 'amber' },
  { key: 'school', label: 'School', accent: 'sky' },
];
const SCORES = [
  { key: 'focus', label: 'Focus' }, { key: 'body', label: 'Body' },
  { key: 'mind', label: 'Mind' }, { key: 'recovery', label: 'Recovery' },
];
const CATEGORIES = ['Work', 'Body', 'School', 'Admin', 'Errand', 'Personal'];

let ledTimer = null; // single cycling-ticker interval

function ensureTodayLog(d) {
  const t = todayKey();
  if (!d.dailyLogs[t]) {
    d.dailyLogs[t] = {
      date: t, mode: '', priorities: [],
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

  clear(main);
  const name = d.profile?.name || 'Dominic';

  // ---- header: greeting + day ring ----
  const pct = dayProgressPercent();
  main.appendChild(el('div.page-head', {}, [
    el('div.row.between', { style: { alignItems: 'flex-start' } }, [
      el('div', {}, [
        el('div.eyebrow', { text: fmtLong() }),
        el('h1', { text: `${greeting()}, ${name}.` }),
        el('p.sub', { text: 'One screen. Run the day.' }),
      ]),
      el('div.ring', { dataset: { label: pct + '%' }, style: { '--p': pct } }),
    ]),
  ]));

  // ---- cycling LED goal ticker ----
  main.appendChild(buildLedTicker(d, log));

  // ---- top priorities card (with completion bar) ----
  const doneCount = log.priorities.filter(p => p.done && p.text).length;
  const setCount = log.priorities.filter(p => p.text).length;
  const priCard = el('div.card');
  priCard.appendChild(el('div.row.between', {}, [
    el('div', {}, [
      el('div.label-cap', { text: 'Top priorities' }),
      el('div.row', { style: { alignItems: 'baseline', gap: '6px', marginTop: '2px' } }, [
        el('span.big-num.mono', { text: doneCount }),
        el('span.mono.faint', { text: '/ ' + (setCount || 3) }),
        el('span.tiny.faint', { text: setCount && doneCount === setCount ? 'all done — solid day' : 'done' }),
      ]),
    ]),
    el('div.seg-bar', {}, TRACKS.map(tr => {
      const p = log.priorities.find(x => x.track === tr.key);
      return el('span.seg' + (p && p.done && p.text ? '.on' : ''));
    })),
  ]));
  TRACKS.forEach(tr => {
    const p = log.priorities.find(x => x.track === tr.key) || { text: '', done: false };
    priCard.appendChild(el('div.item', {}, [
      el('input.check', { type: 'checkbox', checked: p.done, 'aria-label': 'done',
        onchange: e => { mutate(x => { x.dailyLogs[todayKey()].priorities.find(z => z.track === tr.key).done = e.target.checked; }); refresh(); } }),
      el('div.grow', {}, [
        el('div.label-cap.text-' + tr.accent, { text: tr.label }),
        el('div.title' + (p.done ? '.strike' : ''), { text: p.text || `Set your ${tr.label.toLowerCase()} priority`, style: p.text ? {} : { color: 'var(--faint)', fontWeight: '500' } }),
      ]),
      el('button.icon-btn', { type: 'button', 'aria-label': 'edit', onclick: () => editPriority(tr, p, refresh) }, ['✎']),
    ]));
  });
  main.appendChild(el('section', { style: { marginTop: '4px' } }, [priCard]));

  // ---- mode selector ----
  const modeWrap = el('div.modes');
  MODES.forEach(m => {
    modeWrap.appendChild(el('button.mode-btn' + (log.mode === m.id ? '.active' : ''), {
      type: 'button',
      onclick: () => { mutate(x => { x.dailyLogs[todayKey()].mode = (log.mode === m.id ? '' : m.id); }); refresh(); },
    }, [el('span.mode-ico', { text: m.icon }), m.id]));
  });
  main.appendChild(el('section', {}, [el('div.section-head', {}, [el('h2.section-title', { text: 'Mode' })]), modeWrap]));

  // ---- tasks ----
  const taskSection = el('section', {});
  taskSection.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: 'Tasks' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => editTask(null, refresh) }, ['+ Add']),
  ]));
  const tasks = [...loadData().tasks].sort(taskSort);
  if (!tasks.length) taskSection.appendChild(el('div.empty', {}, [el('p', { text: 'No tasks yet. Add the first one.' })]));
  else { const list = el('div.card.list'); tasks.forEach(t => list.appendChild(taskRow(t, refresh))); taskSection.appendChild(list); }
  main.appendChild(taskSection);

  // ---- scorecard ----
  const scoreCard = el('div.card');
  scoreCard.appendChild(el('h2.section-title', { text: 'Daily scorecard', style: { marginBottom: '12px' } }));
  const scoreGrid = el('div.score-grid');
  SCORES.forEach(s => {
    const val = log.scorecard[s.key] || 0;
    const dots = el('div.dots');
    for (let i = 1; i <= 5; i++) dots.appendChild(el('button.dot-btn' + (i <= val ? '.on' : ''), {
      type: 'button', 'aria-label': `${s.label} ${i}`,
      onclick: () => { mutate(x => { x.dailyLogs[todayKey()].scorecard[s.key] = (val === i ? i - 1 : i); }); refresh(); },
    }));
    scoreGrid.appendChild(el('div.score-cell', {}, [el('div.label-cap', { text: s.label }), dots]));
  });
  scoreCard.appendChild(scoreGrid);
  main.appendChild(el('section', {}, [scoreCard]));

  // ---- reflection ----
  const refCard = el('div.card');
  refCard.appendChild(el('h2.section-title', { text: 'Quick reflection', style: { marginBottom: '12px' } }));
  [
    { key: 'win', label: "Today's win" },
    { key: 'avoided', label: 'What I avoided' },
    { key: 'firstMove', label: "Tomorrow's first move" },
  ].forEach(rf => {
    const ta = el('textarea', { rows: 2, placeholder: '—' });
    ta.value = log.reflection[rf.key] || '';
    ta.addEventListener('change', () => { mutate(x => { x.dailyLogs[todayKey()].reflection[rf.key] = ta.value.trim(); }); toast('Saved', 'ok'); });
    refCard.appendChild(el('label.field', { style: { marginBottom: '12px' } }, [el('span.field-label', { text: rf.label }), ta]));
  });
  main.appendChild(el('section', {}, [refCard]));

  main.appendChild(el('section', {}, [dataBackupCard(refresh)]));
  main.appendChild(el('p.tiny.faint.center', { style: { marginTop: '18px' }, text: 'Daily history is kept per date and never overwritten.' }));
}

// ---- cycling LED goal ticker (Rowan index pattern) ----
function buildLedTicker(d, log) {
  const items = [];
  log.priorities.filter(p => p.text && !p.done).forEach(p => items.push({ status: 'pending', text: p.text }));
  const sup = supplementStatus(d);
  if (sup.missed.length) items.push({ status: 'miss', text: `Missed: ${sup.missed.map(s => s.name).join(', ')}` });
  if (sup.lowCount) items.push({ status: 'warn', text: `Restock ${sup.lowCount} supplement${sup.lowCount > 1 ? 's' : ''}` });
  const overdue = (d.tasks || []).filter(t => !t.done && t.due && daysUntil(t.due) < 0).length;
  if (overdue) items.push({ status: 'miss', text: `${overdue} task${overdue > 1 ? 's' : ''} overdue` });
  const next = productivityNextAction(d);
  if (next && next !== 'All clear') items.push({ status: 'pending', text: 'Focus → ' + next });
  const totalP = log.priorities.filter(p => p.text).length;
  const doneP = log.priorities.filter(p => p.text && p.done).length;
  if (!items.length) items.push({ status: 'done', text: totalP ? '✓ Priorities done — solid day.' : 'No priorities set — add one to get rolling.' });

  const stage = el('div.led-stage');
  const led = el('div.led-ticker', {}, [
    el('div.led-light', {}, [el('span.led-dot')]),
    el('div.led-label', { text: 'GOALS' }),
    stage,
    el('div.led-meta.mono', { text: `${doneP}/${totalP || 0}` }),
  ]);

  let idx = 0; let cur = null;
  function tick() {
    const it = items[idx % items.length];
    idx++;
    const row = el('div.led-row', {}, [
      el('span.led-status', { dataset: { status: it.status }, text: it.status === 'done' ? '✓' : (it.status === 'pending' ? '○' : '!') }),
      el('span.led-text', { text: it.text }),
    ]);
    if (cur) { cur.classList.add('is-leaving'); const old = cur; setTimeout(() => old.remove(), 460); row.classList.add('is-entering'); }
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
  const da = a.due ? daysUntil(a.due) : 9999, db = b.due ? daysUntil(b.due) : 9999;
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
      el('button.icon-btn', { type: 'button', title: 'Push to tomorrow', 'aria-label': 'push to tomorrow', onclick: () => { updateItem('tasks', { id: t.id, due: todayKey(addDays(new Date(), 1)) }); toast('Pushed to tomorrow'); refresh(); } }, ['→']),
      el('button.icon-btn', { type: 'button', title: 'Edit', 'aria-label': 'edit', onclick: () => editTask(t, refresh) }, ['✎']),
      el('button.icon-btn.danger', { type: 'button', title: 'Delete', 'aria-label': 'delete', onclick: async () => { if (await confirmDialog(`Delete "${t.title}"?`)) { deleteItem('tasks', t.id); refresh(); } } }, ['🗑']),
    ]),
  ]);
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
    title: isNew ? 'New task' : 'Edit task', body: form,
    actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      { label: isNew ? 'Add task' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('tasks', { id: task?.id || uid('t'), done: task?.done || false, ...values() }); toast(isNew ? 'Task added' : 'Saved', 'ok'); refresh(); } },
    ],
  });
}

function editPriority(track, p, refresh) {
  const { form, values } = buildForm([{ name: 'text', label: `${track.label} priority`, value: p.text || '', placeholder: 'The one thing for ' + track.label.toLowerCase() }]);
  openModal({
    title: `${track.label} priority`, body: form,
    actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      { label: 'Save', kind: 'primary', onClick: () => { mutate(x => { x.dailyLogs[todayKey()].priorities.find(z => z.track === track.key).text = values().text; }); refresh(); } },
    ],
  });
}
