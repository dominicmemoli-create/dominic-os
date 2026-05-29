// school.js - clean semester shell.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, updateItem, deleteItem } from '../store.js';
import { todayKey, relativeDue, daysUntil, fmtShort, WEEKDAYS } from '../dates.js';
import { pageHero, pageGraphic, statTile, premiumEmpty, visibleItems } from '../components.js';

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const classes = visibleItems(d, d.classes);
  const assignments = visibleItems(d, d.assignments);
  const exams = visibleItems(d, d.exams);
  const blocks = visibleItems(d, d.studyBlocks);
  const classMap = Object.fromEntries(classes.map(c => [c.id, c]));

  main.appendChild(pageHero({
    kicker: 'School OS',
    title: 'Semester control.',
    subtitle: 'Classes, assignments, exams, study blocks.',
    tone: 'violet',
    graphic: pageGraphic('school'),
    actions: [
      el('button.btn.primary', { type: 'button', onclick: () => editClass(null, refresh) }, ['Add class']),
      el('button.btn.ghost', { type: 'button', onclick: () => editAssignment(null, classMap, refresh) }, ['Add assignment']),
    ],
    metrics: [
      statTile('Classes', classes.length, 'active', 'sky'),
      statTile('Assignments', assignments.filter(a => !a.done).length, 'open', 'amber'),
      statTile('Exams', exams.length, 'scheduled', 'pink'),
      statTile('Study', blocks.length, 'blocks', 'mint'),
    ],
  }));

  main.appendChild(head('Assignments', () => editAssignment(null, classMap, refresh)));
  const asgmts = assignments.sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : ((a.due || '') < (b.due || '') ? -1 : 1));
  if (!asgmts.length) main.appendChild(premiumEmpty({ title: 'No assignments yet', text: 'Add real coursework when the semester starts.', actionLabel: 'Add assignment', onAction: () => editAssignment(null, classMap, refresh), graphic: 'school' }));
  else main.appendChild(el('div.card.list', {}, asgmts.map(a => assignmentRow(a, classMap, refresh))));

  main.appendChild(head('Exams', () => editExam(null, classMap, refresh)));
  if (!exams.length) main.appendChild(premiumEmpty({ title: 'No exams scheduled', text: 'Exam cards will appear here with countdowns.', actionLabel: 'Add exam', onAction: () => editExam(null, classMap, refresh), graphic: 'school' }));
  else main.appendChild(el('div.card.list', {}, exams.sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1)).map(x => examRow(x, classMap, refresh))));

  main.appendChild(head('Classes', () => editClass(null, refresh)));
  if (!classes.length) main.appendChild(premiumEmpty({ title: 'No classes yet', text: 'Build the semester map with only the courses you are actually taking.', actionLabel: 'Add class', onAction: () => editClass(null, refresh), graphic: 'school' }));
  else {
    const grid = el('div.grid.grid-2');
    classes.forEach(c => grid.appendChild(classCard(c, refresh)));
    main.appendChild(grid);
  }

  main.appendChild(head('Study blocks', () => editStudyBlock(null, classMap, refresh)));
  if (!blocks.length) main.appendChild(premiumEmpty({ title: 'No study blocks planned', text: 'Schedule focused work for exams or assignments.', actionLabel: 'Add study block', onAction: () => editStudyBlock(null, classMap, refresh), graphic: 'focus' }));
  else main.appendChild(el('div.card.list', {}, blocks.map(sb => studyRow(sb, classMap, refresh))));
}

function head(title, onAdd) {
  return el('div.section-head', {}, [
    el('h2.section-title', { text: title }),
    el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['Add']),
  ]);
}

function assignmentRow(a, classMap, refresh) {
  const overdue = a.due && !a.done && daysUntil(a.due) < 0;
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: a.done, onchange: () => { updateItem('assignments', { id: a.id, done: !a.done }); refresh(); } }),
    el('div.grow', {}, [
      el('div.title' + (a.done ? '.strike' : ''), { text: a.title }),
      el('div.meta', {}, [
        el('span.chip', { text: classMap[a.classId]?.code || 'Class' }),
        a.due ? el('span', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(a.due) }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editAssignment(a, classMap, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete assignment?')) { deleteItem('assignments', a.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function examRow(x, classMap, refresh) {
  return el('div.item', {}, [
    el('div.grow', {}, [
      el('div.title', { text: x.title }),
      el('div.meta', {}, [
        el('span.chip', { text: classMap[x.classId]?.code || 'Class' }),
        el('span', { class: daysUntil(x.date) <= 3 ? 'text-pink' : 'muted', text: relativeDue(x.date) }),
      ]),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editExam(x, classMap, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete exam?')) { deleteItem('exams', x.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function classCard(c, refresh) {
  return el('div.card.tight', {}, [
    el('div.row.between', {}, [
      el('span.chip.sky', { text: c.code || 'Class' }),
      c._sample ? el('span.sample-badge', { text: 'sample' }) : null,
    ].filter(Boolean)),
    el('h3', { style: { marginTop: '12px' }, text: c.name }),
    el('div.meta', {}, [
      c.professor ? el('span', { text: c.professor }) : null,
      c.schedule ? el('span', { text: c.schedule }) : null,
      c.room ? el('span', { text: c.room }) : null,
    ].filter(Boolean)),
    el('div.row.wrap', { style: { marginTop: '14px' } }, [
      el('button.btn.sm.ghost', { type: 'button', onclick: () => editClass(c, refresh) }, ['Edit']),
      el('button.btn.sm.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete class?')) { deleteItem('classes', c.id); refresh(); } } }, ['Delete']),
    ]),
  ]);
}

function studyRow(sb, classMap, refresh) {
  return el('div.item', {}, [
    el('div.grow', {}, [
      el('div.title', { text: (classMap[sb.classId]?.code || 'Study') + ' - ' + sb.day }),
      el('div.meta', {}, [el('span', { text: sb.time || 'time not set' }), el('span', { text: sb.durationMin + ' min' })]),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editStudyBlock(sb, classMap, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete study block?')) { deleteItem('studyBlocks', sb.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function classOptions(classMap) {
  const opts = Object.values(classMap).map(c => ({ value: c.id, label: c.code || c.name }));
  return opts.length ? opts : [{ value: '', label: '(add a class first)' }];
}

function editAssignment(a, classMap, refresh) {
  const isNew = !a;
  const { form, values, validate } = buildForm([
    { name: 'title', label: 'Assignment', value: a?.title || '', required: true },
    { name: 'classId', label: 'Class', type: 'select', value: a?.classId || Object.keys(classMap)[0] || '', options: classOptions(classMap) },
    { name: 'due', label: 'Due', type: 'date', value: a?.due || todayKey() },
  ]);
  openModal({ title: isNew ? 'New assignment' : 'Edit assignment', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('assignments', { id: a?.id || uid('as'), done: a?.done || false, ...values() }); toast('Saved', 'ok'); refresh(); } },
  ] });
}

function editExam(x, classMap, refresh) {
  const isNew = !x;
  const { form, values, validate } = buildForm([
    { name: 'title', label: 'Exam', value: x?.title || '', required: true },
    { name: 'classId', label: 'Class', type: 'select', value: x?.classId || Object.keys(classMap)[0] || '', options: classOptions(classMap) },
    { name: 'date', label: 'Date', type: 'date', value: x?.date || todayKey() },
  ]);
  openModal({ title: isNew ? 'New exam' : 'Edit exam', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('exams', { id: x?.id || uid('ex'), ...values() }); refresh(); } },
  ] });
}

function editClass(c, refresh) {
  const isNew = !c;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Class name', value: c?.name || '', required: true },
    { name: 'code', label: 'Code', value: c?.code || '', placeholder: 'FI 311' },
    { name: 'professor', label: 'Professor', value: c?.professor || '' },
    { name: 'room', label: 'Room', value: c?.room || '' },
    { name: 'schedule', label: 'Schedule', value: c?.schedule || '', placeholder: 'MWF 10:20' },
  ]);
  openModal({ title: isNew ? 'New class' : 'Edit class', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('classes', { id: c?.id || uid('cl'), ...values() }); refresh(); } },
  ] });
}

function editStudyBlock(sb, classMap, refresh) {
  const isNew = !sb;
  const { form, values, validate } = buildForm([
    { name: 'classId', label: 'Class', type: 'select', value: sb?.classId || Object.keys(classMap)[0] || '', options: classOptions(classMap) },
    { name: 'day', label: 'Day', type: 'select', value: sb?.day || 'Monday', options: WEEKDAYS },
    { name: 'time', label: 'Time', value: sb?.time || '', placeholder: '4:00 PM' },
    { name: 'durationMin', label: 'Duration (min)', type: 'number', value: sb?.durationMin ?? 60 },
  ]);
  openModal({ title: isNew ? 'New study block' : 'Edit study block', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('studyBlocks', { id: sb?.id || uid('sb'), ...values() }); refresh(); } },
  ] });
}
