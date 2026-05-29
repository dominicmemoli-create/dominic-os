// productivity.js - execution lanes, not fake startup clutter.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate } from '../store.js';
import { todayKey, fmtShort, relativeDue, daysUntil } from '../dates.js';
import { pageHero, pageGraphic, statTile, premiumEmpty, visibleItems } from '../components.js';

const CATS = ['Work', 'Body', 'School', 'Personal', 'Admin', 'Errand'];
const GOAL_STATUS = ['Not started', 'In progress', 'Done'];
const PRIORITIES = [{ value: 'high', label: 'High' }, { value: 'med', label: 'Medium' }, { value: 'low', label: 'Low' }];
const ENERGY = [{ value: 'high', label: 'High energy' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low / quick' }];

function pAdd(coll, item) { mutate(d => { d.productivity[coll] = d.productivity[coll] || []; d.productivity[coll].push(item); }); }
function pUpdate(coll, id, patch) { mutate(d => { const x = (d.productivity[coll] || []).find(i => i.id === id); if (x) Object.assign(x, patch); }); }
function pDelete(coll, id) { mutate(d => { d.productivity[coll] = (d.productivity[coll] || []).filter(i => i.id !== id); }); }
const statusColor = s => ({ 'Done': 'mint', 'In progress': 'amber', 'Open': 'sky', 'Not started': 'muted', 'Planned': 'sky' }[s] || 'muted');

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const p = d.productivity || {};
  const goals = visibleItems(d, p.weeklyGoals);
  const blocks = visibleItems(d, p.deepWorkBlocks);
  const backlog = visibleItems(d, p.priorityBacklog).sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : 0);
  const followUps = visibleItems(d, p.followUps);
  const habits = visibleItems(d, p.habits);

  main.appendChild(pageHero({
    kicker: 'Productivity OS',
    title: 'Execute the week.',
    subtitle: 'Goal lanes, deep work, backlog, follow-ups.',
    tone: 'cool',
    graphic: pageGraphic('focus'),
    actions: [
      el('button.btn.primary', { type: 'button', onclick: () => editGoal(null, refresh) }, ['Add goal']),
      el('button.btn.ghost', { type: 'button', onclick: () => editDeepWork(null, refresh) }, ['Schedule block']),
    ],
    metrics: [
      statTile('Goals', `${goals.filter(g => g.status === 'Done').length}/${goals.length}`, 'this week', 'mint'),
      statTile('Deep work', blocks.length, 'scheduled', 'sky'),
      statTile('Backlog', backlog.filter(i => !i.done).length, 'open', 'amber'),
      statTile('Follow-ups', followUps.filter(f => f.status !== 'Done').length, 'open', 'pink'),
    ],
  }));

  main.appendChild(section('Weekly goal lanes', () => editGoal(null, refresh)));
  if (!goals.length) {
    main.appendChild(premiumEmpty({ title: 'No weekly goals yet', text: 'Create one real outcome for the week.', actionLabel: 'Add goal', onAction: () => editGoal(null, refresh), graphic: 'focus' }));
  } else {
    const grid = el('div.grid.grid-3');
    goals.forEach(g => grid.appendChild(goalCard(g, refresh)));
    main.appendChild(grid);
  }

  main.appendChild(section('Deep work blocks', () => editDeepWork(null, refresh)));
  if (!blocks.length) {
    main.appendChild(premiumEmpty({ title: 'No focus blocks scheduled', text: 'Protect time before the day gets loud.', actionLabel: 'Add block', onAction: () => editDeepWork(null, refresh), graphic: 'focus' }));
  } else {
    main.appendChild(el('div.card.list', {}, blocks.map(b => blockRow(b, refresh))));
  }

  main.appendChild(section('Priority backlog', () => editBacklog(null, refresh)));
  if (!backlog.length) {
    main.appendChild(premiumEmpty({ title: 'Backlog is clear', text: 'Keep it intentional. Add only the next real thing.', actionLabel: 'Add item', onAction: () => editBacklog(null, refresh), graphic: 'focus' }));
  } else {
    main.appendChild(el('div.card.list', {}, backlog.map(i => backlogRow(i, refresh))));
  }

  main.appendChild(section('Personal follow-ups', () => editFollowUp(null, refresh)));
  if (!followUps.length) {
    main.appendChild(premiumEmpty({ title: 'No follow-ups tracked', text: 'Add people or loops you do not want to drop.', actionLabel: 'Add follow-up', onAction: () => editFollowUp(null, refresh), graphic: 'admin' }));
  } else {
    main.appendChild(el('div.card.list', {}, followUps.map(f => followUpRow(f, refresh))));
  }

  main.appendChild(section('Habit support', () => editHabit(null, refresh)));
  if (!habits.length) {
    main.appendChild(premiumEmpty({ title: 'No habits pinned', text: 'Use this only for habits worth seeing every day.', actionLabel: 'Add habit', onAction: () => editHabit(null, refresh), graphic: 'review' }));
  } else {
    const grid = el('div.grid.grid-2');
    habits.forEach(h => grid.appendChild(habitCard(h, refresh)));
    main.appendChild(grid);
  }
}

function section(title, onAdd) {
  return el('div.section-head', {}, [
    el('h2.section-title', { text: title }),
    el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['Add']),
  ]);
}

function goalCard(g, refresh) {
  const overdue = g.due && daysUntil(g.due) < 0 && g.status !== 'Done';
  return el('div.card', {}, [
    el('div.row.between', {}, [
      el('span.chip', { class: statusColor(g.status), text: g.status }),
      g._sample ? el('span.sample-badge', { text: 'sample' }) : null,
    ].filter(Boolean)),
    el('h3', { style: { marginTop: '12px' }, text: g.title }),
    el('div.meta', {}, [
      el('span.chip.muted', { text: g.category }),
      el('span.pri', { class: g.priority || 'low' }),
      g.due ? el('span', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(g.due) }) : null,
    ].filter(Boolean)),
    g.nextAction ? el('p.small.text-mint', { style: { marginTop: '12px' }, text: g.nextAction }) : null,
    el('div.row.wrap', { style: { marginTop: '14px' } }, [
      el('button.btn.sm.ghost', { type: 'button', onclick: () => pUpdate('weeklyGoals', g.id, { status: g.status === 'Done' ? 'In progress' : 'Done' }) || refresh() }, [g.status === 'Done' ? 'Reopen' : 'Done']),
      el('button.btn.sm.ghost', { type: 'button', onclick: () => editGoal(g, refresh) }, ['Edit']),
      el('button.btn.sm.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete this goal?')) { pDelete('weeklyGoals', g.id); refresh(); } } }, ['Delete']),
    ]),
  ].filter(Boolean));
}

function blockRow(b, refresh) {
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: b.status === 'Done', onchange: () => { pUpdate('deepWorkBlocks', b.id, { status: b.status === 'Done' ? 'Planned' : 'Done' }); refresh(); } }),
    el('div.grow', {}, [
      el('div.title' + (b.status === 'Done' ? '.strike' : ''), { text: b.title }),
      el('div.meta', {}, [
        el('span.chip.sky', { text: (b.date ? fmtShort(b.date) : '') + (b.time ? ' ' + b.time : '') }),
        el('span.chip', { text: b.focus }),
        el('span.chip', { class: statusColor(b.status), text: b.status }),
      ]),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editDeepWork(b, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete block?')) { pDelete('deepWorkBlocks', b.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function backlogRow(i, refresh) {
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: i.done, onchange: () => { pUpdate('priorityBacklog', i.id, { done: !i.done }); refresh(); } }),
    el('span.pri', { class: i.priority || 'low' }),
    el('div.grow', {}, [
      el('div.title' + (i.done ? '.strike' : ''), { text: i.title }),
      el('div.meta', {}, [
        el('span.chip', { text: i.category }),
        i.energy ? el('span.chip.muted', { text: i.energy }) : null,
        i.nextAction ? el('span.text-mint', { text: i.nextAction }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editBacklog(i, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete item?')) { pDelete('priorityBacklog', i.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function followUpRow(f, refresh) {
  const overdue = f.due && f.status !== 'Done' && daysUntil(f.due) < 0;
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: f.status === 'Done', onchange: () => { pUpdate('followUps', f.id, { status: f.status === 'Done' ? 'Open' : 'Done' }); refresh(); } }),
    el('div.grow', {}, [
      el('div.title' + (f.status === 'Done' ? '.strike' : ''), { text: f.person }),
      el('div.meta', {}, [
        el('span', { text: f.action }),
        f.due ? el('span', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(f.due) }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editFollowUp(f, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete follow-up?')) { pDelete('followUps', f.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function habitCard(h, refresh) {
  const count = Object.values(h.log || {}).filter(Boolean).length;
  return el('div.card.tight', {}, [
    el('div.row.between', {}, [
      el('div.title', { text: h.name }),
      el('span.chip.mint', { text: count + ' hits' }),
    ]),
    el('div.row.wrap', { style: { marginTop: '12px' } }, [
      el('button.btn.sm.ghost', { type: 'button', onclick: () => { mutate(d => { const hh = d.productivity.habits.find(x => x.id === h.id); hh.log = hh.log || {}; hh.log[todayKey()] = !hh.log[todayKey()]; }); refresh(); } }, ['Toggle today']),
      el('button.btn.sm.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete habit?')) { pDelete('habits', h.id); refresh(); } } }, ['Delete']),
    ]),
  ]);
}

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
  ]);
  openModal({ title: isNew ? 'New follow-up' : 'Edit follow-up', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) pAdd('followUps', { id: uid('fu'), ...v }); else pUpdate('followUps', f.id, v); refresh(); } },
  ] });
}

function editHabit(h, refresh) {
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Habit', value: h?.name || '', required: true, placeholder: 'e.g. In bed by 11:30' },
  ]);
  openModal({ title: h ? 'Edit habit' : 'New habit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: h ? 'Save' : 'Add', kind: 'primary', onClick: () => { if (!validate()) return false; if (h) pUpdate('habits', h.id, { name: values().name }); else pAdd('habits', { id: uid('hb'), name: values().name, log: {} }); refresh(); } },
  ] });
}
