// productivity.js — general life execution dashboard (replaces AFTERGLOW).
// Weekly goals, deep work, priority backlog, follow-ups, life admin, habits.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate } from '../store.js';
import { todayKey, fmtShort, relativeDue, daysUntil, lastNDays, WEEKDAYS_SHORT, parseKey } from '../dates.js';

const CATS = ['Work', 'Body', 'School', 'Personal', 'Admin', 'Errand'];
const GOAL_STATUS = ['Not started', 'In progress', 'Done'];
const PRIORITIES = [{ value: 'high', label: 'High' }, { value: 'med', label: 'Medium' }, { value: 'low', label: 'Low' }];
const ENERGY = [{ value: 'high', label: 'High energy' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low / quick' }];
const ADMIN_TYPES = ['Errand', 'Appointment', 'Form', 'Chore', 'Misc'];

function pAdd(coll, item) { mutate(d => { d.productivity[coll] = d.productivity[coll] || []; d.productivity[coll].push(item); }); }
function pUpdate(coll, id, patch) { mutate(d => { const x = (d.productivity[coll] || []).find(i => i.id === id); if (x) Object.assign(x, patch); }); }
function pDelete(coll, id) { mutate(d => { d.productivity[coll] = (d.productivity[coll] || []).filter(i => i.id !== id); }); }

const statusColor = s => ({ 'Done': 'green', 'In progress': 'gold', 'Researching': 'gold', 'Open': 'sky', 'Not started': 'muted', 'Planned': 'sky' }[s] || 'muted');

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const p = loadData().productivity;

  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Execution · not a to-do graveyard' }),
    el('h1', { text: 'Productivity' }),
    el('p.sub', { text: 'Goals, deep work, follow-ups and life admin in one place.' }),
  ]));

  // ---- Weekly Goals ----
  main.appendChild(head('Weekly goals', () => editGoal(null, refresh)));
  if (!p.weeklyGoals.length) emptyInto(main, 'No goals set this week.');
  p.weeklyGoals.forEach(g => main.appendChild(el('div.card.tight', { style: { marginBottom: '10px' } }, [
    el('div.row.between', {}, [
      el('div.grow', {}, [
        el('div.row', { style: { gap: '8px', flexWrap: 'wrap' } }, [el('div.title', { text: g.title }), g._sample ? el('span.sample-badge', { text: 'sample' }) : null].filter(Boolean)),
        el('div.meta', {}, [el('span.chip', { class: statusColor(g.status), text: g.status }), el('span.chip', { text: g.category }), el('span.pri', { class: g.priority }), g.due ? el('span', { class: daysUntil(g.due) < 0 ? 'text-pink' : 'muted', text: relativeDue(g.due) }) : null].filter(Boolean)),
        g.nextAction ? el('div.tiny.text-mint', { style: { marginTop: '5px' }, text: '→ ' + g.nextAction }) : null,
      ].filter(Boolean)),
      el('div.actions', {}, [
        el('button.icon-btn', { type: 'button', title: 'Edit', onclick: () => editGoal(g, refresh) }, ['✎']),
        el('button.icon-btn.danger', { type: 'button', title: 'Delete', onclick: async () => { if (await confirmDialog('Delete this goal?')) { pDelete('weeklyGoals', g.id); refresh(); } } }, ['🗑']),
      ]),
    ]),
  ])));

  // ---- Deep Work Blocks ----
  main.appendChild(head('Deep work blocks', () => editDeepWork(null, refresh)));
  if (!p.deepWorkBlocks.length) emptyInto(main, 'No deep work scheduled.');
  p.deepWorkBlocks.forEach(b => main.appendChild(el('div.card.tight', { style: { marginBottom: '8px' } }, [
    el('div.row.between', {}, [
      el('div.grow', {}, [
        el('div.title' + (b.status === 'Done' ? '.strike' : ''), { text: b.title }),
        el('div.meta', {}, [el('span.chip.sky', { text: (b.date ? fmtShort(b.date) : '') + (b.time ? ' · ' + b.time : '') }), el('span.chip', { text: b.focus }), el('span.chip', { class: statusColor(b.status), text: b.status })]),
        b.notes ? el('div.tiny.muted', { style: { marginTop: '4px' }, text: b.notes }) : null,
      ].filter(Boolean)),
      el('div.actions', {}, [
        el('button.icon-btn', { type: 'button', title: b.status === 'Done' ? 'Reopen' : 'Mark done', onclick: () => { pUpdate('deepWorkBlocks', b.id, { status: b.status === 'Done' ? 'Planned' : 'Done' }); refresh(); } }, [b.status === 'Done' ? '↩' : '✓']),
        el('button.icon-btn', { type: 'button', onclick: () => editDeepWork(b, refresh) }, ['✎']),
        el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete block?')) { pDelete('deepWorkBlocks', b.id); refresh(); } } }, ['🗑']),
      ]),
    ]),
  ])));

  // ---- Priority Backlog ----
  main.appendChild(head('Priority backlog', () => editBacklog(null, refresh)));
  const backlog = [...p.priorityBacklog].sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : 0);
  if (!backlog.length) emptyInto(main, 'Backlog is empty.');
  else { const list = el('div.card.list'); backlog.forEach(i => list.appendChild(el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: i.done, onchange: () => { pUpdate('priorityBacklog', i.id, { done: !i.done }); refresh(); } }),
    el('span.pri', { class: i.priority || 'low' }),
    el('div.grow', {}, [el('div.title' + (i.done ? '.strike' : ''), { text: i.title }), el('div.meta', {}, [el('span.chip', { text: i.category }), i.energy ? el('span.chip.muted', { text: i.energy + ' energy' }) : null, i.nextAction ? el('span', { text: '→ ' + i.nextAction }) : null].filter(Boolean))]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editBacklog(i, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { pDelete('priorityBacklog', i.id); refresh(); } } }, ['🗑'])]),
  ]))); main.appendChild(list); }

  // ---- Personal Follow-Ups ----
  main.appendChild(head('Personal follow-ups', () => editFollowUp(null, refresh)));
  if (!p.followUps.length) emptyInto(main, 'No follow-ups tracked.');
  else { const list = el('div.card.list'); p.followUps.forEach(f => list.appendChild(el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: f.status === 'Done', onchange: () => { pUpdate('followUps', f.id, { status: f.status === 'Done' ? 'Open' : 'Done' }); refresh(); } }),
    el('div.grow', {}, [el('div.title' + (f.status === 'Done' ? '.strike' : ''), { text: f.person }), el('div.meta', {}, [el('span', { text: f.action }), f.due ? el('span', { class: daysUntil(f.due) < 0 && f.status !== 'Done' ? 'text-pink' : 'muted', text: relativeDue(f.due) }) : null, f.notes ? el('span.tiny.faint', { text: f.notes }) : null].filter(Boolean))]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editFollowUp(f, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { pDelete('followUps', f.id); refresh(); } } }, ['🗑'])]),
  ]))); main.appendChild(list); }

  // ---- Life Admin ----
  main.appendChild(head('Life admin', () => editAdmin(null, refresh)));
  const admin = [...p.lifeAdmin].sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : ((a.due || '') < (b.due || '') ? -1 : 1));
  if (!admin.length) emptyInto(main, 'Nothing on the list.');
  else { const list = el('div.card.list'); admin.forEach(i => list.appendChild(el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: i.done, onchange: () => { pUpdate('lifeAdmin', i.id, { done: !i.done }); refresh(); } }),
    el('div.grow', {}, [el('div.title' + (i.done ? '.strike' : ''), { text: i.text }), el('div.meta', {}, [el('span.chip.muted', { text: i.type || 'Misc' }), i.due ? el('span', { class: daysUntil(i.due) < 0 && !i.done ? 'text-pink' : 'muted', text: relativeDue(i.due) }) : null].filter(Boolean))]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editAdmin(i, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { pDelete('lifeAdmin', i.id); refresh(); } } }, ['🗑'])]),
  ]))); main.appendChild(list); }

  // ---- Habit Support ----
  main.appendChild(head('Habit support', () => editHabit(null, refresh)));
  const days = lastNDays(7);
  if (!p.habits.length) emptyInto(main, 'No habits yet. Add one to keep it visible.');
  else {
    const card = el('div.card');
    // weekday header
    const headRow = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr repeat(7, 26px) 28px', gap: '4px', alignItems: 'center', marginBottom: '8px' } }, [
      el('span.label-cap', { text: 'Habit' }),
      ...days.map(dk => el('span.tiny.faint.center', { text: WEEKDAYS_SHORT[parseKey(dk).getDay()][0] })),
      el('span', {}),
    ]);
    card.appendChild(headRow);
    p.habits.forEach(h => {
      const count = days.filter(dk => h.log && h.log[dk]).length;
      const row = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr repeat(7, 26px) 28px', gap: '4px', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--border)' } });
      row.appendChild(el('div', {}, [el('div.small', { text: h.name, style: { fontWeight: '600' } }), el('div.tiny.faint', { text: count + '/7 this week' })]));
      days.forEach(dk => {
        const on = !!(h.log && h.log[dk]);
        row.appendChild(el('button.habit-cell' + (on ? '.on' : ''), { type: 'button', 'aria-label': h.name + ' ' + dk, title: fmtShort(dk),
          onclick: () => { mutate(d => { const hh = d.productivity.habits.find(x => x.id === h.id); hh.log = hh.log || {}; if (hh.log[dk]) delete hh.log[dk]; else hh.log[dk] = true; }); refresh(); } }));
      });
      row.appendChild(el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete habit?')) { pDelete('habits', h.id); refresh(); } } }, ['🗑']));
      card.appendChild(row);
    });
    main.appendChild(card);
  }

  main.appendChild(el('p.tiny.faint.center', { style: { marginTop: '18px' }, text: 'Productivity items save instantly and sync to the command bar.' }));
}

function head(title, onAdd) { return el('div.section-head', {}, [el('h2.section-title', { text: title }), el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['+ Add'])]); }
function emptyInto(main, text) { main.appendChild(el('div.empty', {}, [el('p', { text })])); }

/* editors */
function editGoal(g, refresh) {
  const isNew = !g;
  const { form, values, validate } = buildForm([
    { name: 'title', label: 'Goal', value: g?.title || '', required: true },
    { name: 'category', label: 'Category', type: 'select', value: g?.category || 'Work', options: CATS },
    { name: 'priority', label: 'Priority', type: 'select', value: g?.priority || 'med', options: PRIORITIES },
    { name: 'status', label: 'Status', type: 'select', value: g?.status || 'Not started', options: GOAL_STATUS },
    { name: 'due', label: 'Due', type: 'date', value: g?.due || '' },
    { name: 'nextAction', label: 'Next action', value: g?.nextAction || '', placeholder: 'The very next step' },
  ]);
  openModal({ title: isNew ? 'New weekly goal' : 'Edit goal', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) pAdd('weeklyGoals', { id: uid('wg'), ...v }); else pUpdate('weeklyGoals', g.id, v); toast('Saved', 'ok'); refresh(); } },
  ] });
}

function editDeepWork(b, refresh) {
  const isNew = !b;
  const { form, values, validate } = buildForm([
    { name: 'title', label: 'Block title', value: b?.title || '', required: true },
    { name: 'date', label: 'Date', type: 'date', value: b?.date || todayKey() },
    { name: 'time', label: 'Time', value: b?.time || '', placeholder: '9:00 AM' },
    { name: 'focus', label: 'Focus area', type: 'select', value: b?.focus || 'Work', options: CATS },
    { name: 'status', label: 'Status', type: 'select', value: b?.status || 'Planned', options: ['Planned', 'Done'] },
    { name: 'notes', label: 'Notes', type: 'textarea', value: b?.notes || '' },
  ]);
  openModal({ title: isNew ? 'New deep work block' : 'Edit block', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) pAdd('deepWorkBlocks', { id: uid('dw'), ...v }); else pUpdate('deepWorkBlocks', b.id, v); refresh(); } },
  ] });
}

function editBacklog(i, refresh) {
  const isNew = !i;
  const { form, values, validate } = buildForm([
    { name: 'title', label: 'Task', value: i?.title || '', required: true },
    { name: 'category', label: 'Category', type: 'select', value: i?.category || 'Personal', options: CATS },
    { name: 'priority', label: 'Priority', type: 'select', value: i?.priority || 'med', options: PRIORITIES },
    { name: 'energy', label: 'Energy needed', type: 'select', value: i?.energy || 'medium', options: ENERGY },
    { name: 'nextAction', label: 'Next action', value: i?.nextAction || '' },
  ]);
  openModal({ title: isNew ? 'New backlog item' : 'Edit item', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) pAdd('priorityBacklog', { id: uid('pb'), done: false, ...v }); else pUpdate('priorityBacklog', i.id, v); refresh(); } },
  ] });
}

function editFollowUp(f, refresh) {
  const isNew = !f;
  const { form, values, validate } = buildForm([
    { name: 'person', label: 'Person / context', value: f?.person || '', required: true },
    { name: 'action', label: 'Action needed', value: f?.action || '', required: true },
    { name: 'due', label: 'Due', type: 'date', value: f?.due || '' },
    { name: 'status', label: 'Status', type: 'select', value: f?.status || 'Open', options: ['Open', 'Done'] },
    { name: 'notes', label: 'Notes', value: f?.notes || '' },
  ]);
  openModal({ title: isNew ? 'New follow-up' : 'Edit follow-up', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) pAdd('followUps', { id: uid('fu'), ...v }); else pUpdate('followUps', f.id, v); refresh(); } },
  ] });
}

function editAdmin(i, refresh) {
  const isNew = !i;
  const { form, values, validate } = buildForm([
    { name: 'text', label: 'Item', value: i?.text || '', required: true },
    { name: 'type', label: 'Type', type: 'select', value: i?.type || 'Errand', options: ADMIN_TYPES },
    { name: 'due', label: 'Due (optional)', type: 'date', value: i?.due || '' },
  ]);
  openModal({ title: isNew ? 'New life admin item' : 'Edit item', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) pAdd('lifeAdmin', { id: uid('la'), done: false, ...v }); else pUpdate('lifeAdmin', i.id, v); refresh(); } },
  ] });
}

function editHabit(h, refresh) {
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Habit', value: '', required: true, placeholder: 'e.g. In bed by 11:30' },
  ]);
  openModal({ title: 'New habit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Add', kind: 'primary', onClick: () => { if (!validate()) return false; pAdd('habits', { id: uid('hb'), name: values().name, log: {} }); refresh(); } },
  ] });
}
