// school.js — classes, assignments, exams, study blocks (Tier 2).

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, updateItem, deleteItem } from '../store.js';
import { todayKey, relativeDue, daysUntil, fmtShort, WEEKDAYS } from '../dates.js';

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const classMap = Object.fromEntries(d.classes.map(c => [c.id, c]));

  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Broad College of Business · finance' }),
    el('h1', { text: 'School' }),
  ]));

  // assignments (most actionable first)
  main.appendChild(head('Assignments', () => editAssignment(null, classMap, refresh)));
  const asgmts = [...d.assignments].sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : ((a.due || '') < (b.due || '') ? -1 : 1));
  if (!asgmts.length) emptyInto(main, 'No assignments yet.');
  else { const list = el('div.card.list'); asgmts.forEach(a => list.appendChild(assignmentRow(a, classMap, refresh))); main.appendChild(list); }

  // exams
  main.appendChild(head('Exams', () => editExam(null, classMap, refresh)));
  const exams = [...d.exams].sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1));
  if (!exams.length) emptyInto(main, 'No exams scheduled.');
  else { const list = el('div.card.list'); exams.forEach(x => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: x.title }), el('div.meta', {}, [el('span.chip', { text: classMap[x.classId]?.code || '—' }), el('span', { class: daysUntil(x.date) <= 3 ? 'text-pink' : 'muted', text: relativeDue(x.date) })])]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editExam(x, classMap, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete exam?')) { deleteItem('exams', x.id); refresh(); } } }, ['🗑'])]),
  ]))); main.appendChild(list); }

  // classes
  main.appendChild(head('Classes', () => editClass(null, refresh)));
  if (!d.classes.length) emptyInto(main, 'No classes yet.');
  else d.classes.forEach(c => main.appendChild(el('div.card.tight', { style: { marginBottom: '8px' } }, [
    el('div.row.between', {}, [
      el('div.grow', {}, [
        el('div.row', { style: { gap: '8px' } }, [el('div.title', { text: c.name }), c._sample ? el('span.sample-badge', { text: 'sample' }) : null].filter(Boolean)),
        el('div.meta', {}, [el('span.chip.amber', { text: c.code }), c.professor ? el('span', { text: c.professor }) : null, c.schedule ? el('span', { text: c.schedule }) : null, c.room ? el('span', { text: c.room }) : null].filter(Boolean)),
      ]),
      el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editClass(c, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete class?')) { deleteItem('classes', c.id); refresh(); } } }, ['🗑'])]),
    ]),
  ])));

  // study blocks
  main.appendChild(head('Study blocks', () => editStudyBlock(null, classMap, refresh)));
  if (!d.studyBlocks.length) emptyInto(main, 'No study blocks planned.');
  else { const list = el('div.card.list'); d.studyBlocks.forEach(sb => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: (classMap[sb.classId]?.code || 'Study') + ' · ' + sb.day }), el('div.meta', {}, [el('span', { text: sb.time }), el('span', { text: sb.durationMin + ' min' })])]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editStudyBlock(sb, classMap, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: () => { deleteItem('studyBlocks', sb.id); refresh(); } }, ['🗑'])]),
  ]))); main.appendChild(list); }
}

function head(title, onAdd) { return el('div.section-head', {}, [el('h2.section-title', { text: title }), el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['+ Add'])]); }
function emptyInto(main, text) { main.appendChild(el('div.empty', {}, [el('p', { text })])); }

function assignmentRow(a, classMap, refresh) {
  const overdue = a.due && !a.done && daysUntil(a.due) < 0;
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: a.done, onchange: () => { updateItem('assignments', { id: a.id, done: !a.done }); refresh(); } }),
    el('div.grow', {}, [el('div.title' + (a.done ? '.strike' : ''), { text: a.title }), el('div.meta', {}, [el('span.chip', { text: classMap[a.classId]?.code || '—' }), a.due ? el('span', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(a.due) }) : null].filter(Boolean))]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editAssignment(a, classMap, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { deleteItem('assignments', a.id); refresh(); } } }, ['🗑'])]),
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
  openModal({ title: isNew ? 'New assignment' : 'Edit', body: form, actions: [
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
  openModal({ title: isNew ? 'New exam' : 'Edit', body: form, actions: [
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
  openModal({ title: isNew ? 'New class' : 'Edit', body: form, actions: [
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
  openModal({ title: isNew ? 'New study block' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('studyBlocks', { id: sb?.id || uid('sb'), ...values() }); refresh(); } },
  ] });
}
