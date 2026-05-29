// admin.js — reminders/errands, contacts, subscriptions (finance-lite). Tier 2.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, updateItem, deleteItem } from '../store.js';
import { todayKey, relativeDue, daysUntil, fmtShort } from '../dates.js';
import { dataBackupCard } from '../components.js';

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();

  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Errands · contacts · money' }),
    el('h1', { text: 'Admin' }),
  ]));

  // reminders / errands
  main.appendChild(head('Reminders & errands', () => editReminder(null, refresh)));
  const rem = [...d.adminReminders].sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : ((a.due || '') < (b.due || '') ? -1 : 1));
  if (!rem.length) emptyInto(main, 'Nothing on the list.');
  else { const list = el('div.card.list'); rem.forEach(r => {
    const overdue = r.due && !r.done && daysUntil(r.due) < 0;
    list.appendChild(el('div.item', {}, [
      el('input.check', { type: 'checkbox', checked: r.done, onchange: () => { updateItem('adminReminders', { id: r.id, done: !r.done }); refresh(); } }),
      el('div.grow', {}, [el('div.title' + (r.done ? '.strike' : ''), { text: r.text }), r.due ? el('div.meta', {}, [el('span', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(r.due) })]) : null].filter(Boolean)),
      el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editReminder(r, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { deleteItem('adminReminders', r.id); refresh(); } } }, ['🗑'])]),
    ]));
  }); main.appendChild(list); }

  // subscriptions (finance-lite)
  main.appendChild(head('Subscriptions', () => editSub(null, refresh)));
  const monthly = d.subscriptions.reduce((sum, s) => sum + (s.cycle === 'yearly' ? (s.cost || 0) / 12 : (s.cost || 0)), 0);
  main.appendChild(el('div.row.between', { style: { marginBottom: '10px' } }, [
    el('span.chip.mint', { text: '$' + monthly.toFixed(2) + ' / mo est.' }),
    el('span.chip.muted', { text: '$' + (monthly * 12).toFixed(0) + ' / yr' }),
  ]));
  if (!d.subscriptions.length) emptyInto(main, 'No subscriptions tracked.');
  else { const list = el('div.card.list'); d.subscriptions.forEach(s => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: s.name }), el('div.meta', {}, [el('span', { text: '$' + (s.cost || 0) + '/' + (s.cycle || 'monthly') }), s.renews ? el('span', { class: daysUntil(s.renews) <= 5 ? 'text-amber' : 'muted', text: 'renews ' + relativeDue(s.renews) }) : null].filter(Boolean))]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editSub(s, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { deleteItem('subscriptions', s.id); refresh(); } } }, ['🗑'])]),
  ]))); main.appendChild(list); }
  main.appendChild(el('p.tiny.faint', { style: { marginTop: '6px' }, text: 'Manual entries only — no bank connections.' }));

  // contacts
  main.appendChild(head('Contacts', () => editContact(null, refresh)));
  if (!d.contacts.length) emptyInto(main, 'No contacts saved.');
  else { const list = el('div.card.list'); d.contacts.forEach(c => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: c.name }), el('div.meta', {}, [c.role ? el('span', { text: c.role }) : null, c.contact ? el('span', { text: c.contact }) : null].filter(Boolean))]),
    el('div.actions', {}, [el('button.icon-btn', { type: 'button', onclick: () => editContact(c, refresh) }, ['✎']), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete?')) { deleteItem('contacts', c.id); refresh(); } } }, ['🗑'])]),
  ]))); main.appendChild(list); }

  // backup
  main.appendChild(el('section', { style: { marginTop: '20px' } }, [dataBackupCard(refresh)]));
}

function head(title, onAdd) { return el('div.section-head', {}, [el('h2.section-title', { text: title }), el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['+ Add'])]); }
function emptyInto(main, text) { main.appendChild(el('div.empty', {}, [el('p', { text })])); }

function editReminder(r, refresh) {
  const isNew = !r;
  const { form, values, validate } = buildForm([
    { name: 'text', label: 'Reminder / errand', value: r?.text || '', required: true },
    { name: 'due', label: 'Due (optional)', type: 'date', value: r?.due || '' },
  ]);
  openModal({ title: isNew ? 'New reminder' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('adminReminders', { id: r?.id || uid('ad'), done: r?.done || false, ...values() }); toast('Saved', 'ok'); refresh(); } },
  ] });
}

function editSub(s, refresh) {
  const isNew = !s;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Subscription', value: s?.name || '', required: true },
    { name: 'cost', label: 'Cost ($)', type: 'number', value: s?.cost ?? 0, step: 0.01, min: 0 },
    { name: 'cycle', label: 'Cycle', type: 'select', value: s?.cycle || 'monthly', options: ['monthly', 'yearly'] },
    { name: 'renews', label: 'Renews (optional)', type: 'date', value: s?.renews || '' },
  ]);
  openModal({ title: isNew ? 'New subscription' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('subscriptions', { id: s?.id || uid('su'), ...values() }); refresh(); } },
  ] });
}

function editContact(c, refresh) {
  const isNew = !c;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Name', value: c?.name || '', required: true },
    { name: 'role', label: 'Role / context', value: c?.role || '' },
    { name: 'contact', label: 'Email / phone', value: c?.contact || '' },
  ]);
  openModal({ title: isNew ? 'New contact' : 'Edit', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('contacts', { id: c?.id || uid('co'), ...values() }); refresh(); } },
  ] });
}
