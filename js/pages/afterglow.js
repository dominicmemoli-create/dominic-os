// afterglow.js — founder dashboard (Tier 2: working CRUD + sample data).

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, mutate } from '../store.js';
import { fmtShort, todayKey } from '../dates.js';

// helpers to mutate a nested afterglow array
function agAdd(coll, item) { mutate(d => { d.afterglow[coll] = d.afterglow[coll] || []; d.afterglow[coll].push(item); }); }
function agUpdate(coll, id, patch) { mutate(d => { const x = (d.afterglow[coll] || []).find(i => i.id === id); if (x) Object.assign(x, patch); }); }
function agDelete(coll, id) { mutate(d => { d.afterglow[coll] = (d.afterglow[coll] || []).filter(i => i.id !== id); }); }

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const ag = loadData().afterglow;

  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Premium RTD cocktail · 4-pack + 2oz recovery shot' }),
    el('h1', { text: 'AFTERGLOW' }),
    el('p.sub', { text: 'Founder command center — funding, product, regulatory, launch.' }),
  ]));

  // stage tracker
  main.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Stage' })]));
  const stages = el('div.stages');
  const curIdx = ag.stages.indexOf(ag.stage);
  ag.stages.forEach((s, i) => {
    stages.appendChild(el('button.stage-node' + (i < curIdx ? '.done' : (i === curIdx ? '.current' : '')), {
      type: 'button', onclick: () => { mutate(d => { d.afterglow.stage = s; }); toast('Stage: ' + s, 'ok'); refresh(); },
    }, [s]));
  });
  main.appendChild(stages);

  // weekly priorities
  checklistSection(main, refresh, 'This week\'s priorities', 'weeklyPriorities', 'priority');

  // co-packer outreach
  main.appendChild(sectionHead('Co-packer outreach', () => editCoPacker(null, refresh)));
  if (!ag.coPackers.length) emptyInto(main, 'No co-packers tracked yet.');
  ag.coPackers.forEach(cp => main.appendChild(el('div.card.tight', { style: { marginBottom: '10px' } }, [
    el('div.row.between', {}, [
      el('div.grow', {}, [
        el('div.row', { style: { gap: '8px' } }, [el('div.title', { text: cp.name }), cp._sample ? el('span.sample-badge', { text: 'sample' }) : null].filter(Boolean)),
        el('div.meta', {}, [el('span.chip.mint', { text: cp.stage }), el('span', { text: 'MOQ ' + (cp.moq || '—') })]),
        cp.contact ? el('div.tiny.faint', { style: { marginTop: '3px' }, text: cp.contact }) : null,
        cp.notes ? el('p.tiny.muted', { style: { marginTop: '5px' }, text: cp.notes }) : null,
      ].filter(Boolean)),
      el('div.actions', {}, [
        el('button.icon-btn', { type: 'button', onclick: () => editCoPacker(cp, refresh) }, ['✎']),
        el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete ' + cp.name + '?')) { agDelete('coPackers', cp.id); refresh(); } } }, ['🗑']),
      ]),
    ]),
  ])));

  // regulatory checklist
  main.appendChild(sectionHead('Regulatory checklist', () => editRegulatory(null, refresh)));
  const regList = el('div.card.list');
  if (!ag.regulatory.length) emptyInto(main, 'No regulatory items yet.');
  else { ag.regulatory.forEach(r => regList.appendChild(regRow(r, refresh))); main.appendChild(regList); }

  // Burgess / Launch tasks
  checklistSection(main, refresh, 'Burgess / MSU Launch tasks', 'launchTasks', 'task');

  // product testing
  main.appendChild(sectionHead('Product testing', () => editProductTest(null, refresh)));
  if (!ag.productTests.length) emptyInto(main, 'No product tests logged.');
  ag.productTests.forEach(pt => main.appendChild(el('div.card.tight', { style: { marginBottom: '8px' } }, [
    el('div.row.between', {}, [
      el('div.grow', {}, [el('div.title', { text: pt.name }), el('div.tiny.muted', { text: pt.result }), pt.date ? el('div.tiny.faint', { text: fmtShort(pt.date) }) : null].filter(Boolean)),
      el('div.actions', {}, [
        el('button.icon-btn', { type: 'button', onclick: () => editProductTest(pt, refresh) }, ['✎']),
        el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete test?')) { agDelete('productTests', pt.id); refresh(); } } }, ['🗑']),
      ]),
    ]),
  ])));

  // funding readiness
  main.appendChild(sectionHead('Funding readiness', () => editFunding(null, refresh)));
  const fundList = el('div.card.list');
  if (!ag.funding.length) emptyInto(main, 'No funding items yet.');
  else { ag.funding.forEach(f => fundList.appendChild(fundRow(f, refresh))); main.appendChild(fundList); }

  // 7-day queue
  main.appendChild(sectionHead('7-day action queue', () => editQueue(null, refresh)));
  const qList = el('div.card.list');
  if (!ag.queue7day.length) emptyInto(main, 'Queue is empty.');
  else { ag.queue7day.forEach(q => qList.appendChild(el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: q.done, onchange: () => { agUpdate('queue7day', q.id, { done: !q.done }); refresh(); } }),
    el('span.chip.muted', { text: q.day, style: { flex: 'none' } }),
    el('div.grow', {}, [el('div.title' + (q.done ? '.strike' : ''), { text: q.text })]),
    el('button.icon-btn.danger', { type: 'button', onclick: () => { agDelete('queue7day', q.id); refresh(); } }, ['🗑']),
  ]))); main.appendChild(qList); }
}

/* shared bits */
function sectionHead(title, onAdd) {
  return el('div.section-head', {}, [el('h2.section-title', { text: title }), el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['+ Add'])]);
}
function emptyInto(main, text) { main.appendChild(el('div.empty', {}, [el('p', { text })])); }

function checklistSection(main, refresh, title, coll, noun) {
  const ag = loadData().afterglow;
  main.appendChild(sectionHead(title, () => {
    const { form, values, validate } = buildForm([{ name: 'text', label: noun, value: '', required: true }]);
    openModal({ title: 'New ' + noun, body: form, actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      { label: 'Add', kind: 'primary', onClick: () => { if (!validate()) return false; agAdd(coll, { id: uid(coll), text: values().text, done: false }); refresh(); } },
    ] });
  }));
  const list = el('div.card.list');
  if (!(ag[coll] || []).length) { emptyInto(main, 'Nothing here yet.'); return; }
  ag[coll].forEach(it => list.appendChild(el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: it.done, onchange: () => { agUpdate(coll, it.id, { done: !it.done }); refresh(); } }),
    el('div.grow', {}, [el('div.title' + (it.done ? '.strike' : ''), { text: it.text }), it._sample ? el('div.meta', {}, [el('span.sample-badge', { text: 'sample' })]) : null].filter(Boolean)),
    el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { agDelete(coll, it.id); refresh(); } } }, ['🗑']),
  ])));
  main.appendChild(list);
}

function regRow(r, refresh) {
  const statusColor = { 'Done': 'mint', 'In progress': 'amber', 'Researching': 'amber', 'Not started': 'muted', 'Open question': 'pink' }[r.status] || 'muted';
  return el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: r.item }), el('div.meta', {}, [el('span.chip', { class: statusColor, text: r.status }), r.notes ? el('span', { text: r.notes }) : null].filter(Boolean))]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editRegulatory(r, refresh) }, ['✎']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { agDelete('regulatory', r.id); refresh(); } } }, ['🗑']),
    ]),
  ]);
}

function fundRow(f, refresh) {
  const statusColor = { 'Done': 'mint', 'In progress': 'amber', 'Not started': 'muted' }[f.status] || 'muted';
  return el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: f.item }), el('div.meta', {}, [el('span.chip', { class: statusColor, text: f.status })])]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editFunding(f, refresh) }, ['✎']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { agDelete('funding', f.id); refresh(); } } }, ['🗑']),
    ]),
  ]);
}

/* editors */
function editCoPacker(cp, refresh) {
  const isNew = !cp;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Company', value: cp?.name || '', required: true },
    { name: 'contact', label: 'Contact', value: cp?.contact || '' },
    { name: 'stage', label: 'Stage', type: 'select', value: cp?.stage || 'Researching', options: ['Researching', 'Intro call done', 'Awaiting reply', 'Quote received', 'Sample run', 'Signed', 'Passed'] },
    { name: 'moq', label: 'MOQ', value: cp?.moq || '' },
    { name: 'notes', label: 'Notes', type: 'textarea', value: cp?.notes || '' },
  ]);
  openModal({ title: isNew ? 'New co-packer' : cp.name, body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) agAdd('coPackers', { id: uid('cp'), ...v }); else agUpdate('coPackers', cp.id, v); toast('Saved', 'ok'); refresh(); } },
  ] });
}

function editRegulatory(r, refresh) {
  const isNew = !r;
  const { form, values, validate } = buildForm([
    { name: 'item', label: 'Item', value: r?.item || '', required: true },
    { name: 'status', label: 'Status', type: 'select', value: r?.status || 'Not started', options: ['Not started', 'Researching', 'In progress', 'Open question', 'Done'] },
    { name: 'notes', label: 'Notes', type: 'textarea', value: r?.notes || '' },
  ]);
  openModal({ title: isNew ? 'New regulatory item' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) agAdd('regulatory', { id: uid('rg'), ...v }); else agUpdate('regulatory', r.id, v); refresh(); } },
  ] });
}

function editProductTest(pt, refresh) {
  const isNew = !pt;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'What was tested', value: pt?.name || '', required: true },
    { name: 'result', label: 'Result / takeaway', type: 'textarea', value: pt?.result || '' },
    { name: 'date', label: 'Date', type: 'date', value: pt?.date || todayKey() },
  ]);
  openModal({ title: isNew ? 'New product test' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) agAdd('productTests', { id: uid('pt'), ...v }); else agUpdate('productTests', pt.id, v); refresh(); } },
  ] });
}

function editFunding(f, refresh) {
  const isNew = !f;
  const { form, values, validate } = buildForm([
    { name: 'item', label: 'Deliverable', value: f?.item || '', required: true },
    { name: 'status', label: 'Status', type: 'select', value: f?.status || 'Not started', options: ['Not started', 'In progress', 'Done'] },
  ]);
  openModal({ title: isNew ? 'New funding item' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); if (isNew) agAdd('funding', { id: uid('fn'), ...v }); else agUpdate('funding', f.id, v); refresh(); } },
  ] });
}

function editQueue(q, refresh) {
  const { form, values, validate } = buildForm([
    { name: 'day', label: 'Day', type: 'select', value: 'Mon', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    { name: 'text', label: 'Action', value: '', required: true },
  ]);
  openModal({ title: 'Add to queue', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Add', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); agAdd('queue7day', { id: uid('q'), day: v.day, text: v.text, done: false }); refresh(); } },
  ] });
}
