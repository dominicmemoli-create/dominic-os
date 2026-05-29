// admin.js - life control panel.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, updateItem, deleteItem } from '../store.js';
import { todayKey, relativeDue, daysUntil } from '../dates.js';
import { dataBackupCard, pageHero, pageGraphic, statTile, premiumEmpty, visibleItems } from '../components.js';

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const reminders = visibleItems(d, d.adminReminders);
  const contacts = visibleItems(d, d.contacts);
  const subs = visibleItems(d, d.subscriptions);
  const openReminders = reminders.filter(r => !r.done);
  const monthly = subs.reduce((sum, s) => sum + (s.cycle === 'yearly' ? (s.cost || 0) / 12 : (s.cost || 0)), 0);

  main.appendChild(pageHero({
    kicker: 'Life Control',
    title: 'Control panel.',
    subtitle: 'Reminders, subscriptions, contacts, backups.',
    tone: 'cool',
    graphic: pageGraphic('admin'),
    actions: [
      el('button.btn.primary', { type: 'button', onclick: () => editReminder(null, refresh) }, ['Add reminder']),
      el('button.btn.ghost', { type: 'button', onclick: () => editSub(null, refresh) }, ['Add subscription']),
    ],
    metrics: [
      statTile('Reminders', openReminders.length, 'open', 'amber'),
      statTile('Contacts', contacts.length, 'saved', 'sky'),
      statTile('Subscriptions', subs.length, 'tracked', 'mint'),
      statTile('Monthly', '$' + monthly.toFixed(0), 'estimated', 'pink'),
    ],
  }));

  main.appendChild(head('Reminders', () => editReminder(null, refresh)));
  const rem = reminders.sort((a, b) => (a.done !== b.done) ? (a.done ? 1 : -1) : ((a.due || '') < (b.due || '') ? -1 : 1));
  if (!rem.length) main.appendChild(premiumEmpty({ title: 'No reminders yet', text: 'Add real errands, documents, and loose loops.', actionLabel: 'Add reminder', onAction: () => editReminder(null, refresh), graphic: 'admin' }));
  else main.appendChild(el('div.card.list', {}, rem.map(r => reminderRow(r, refresh))));

  main.appendChild(head('Subscriptions', () => editSub(null, refresh)));
  if (!subs.length) main.appendChild(premiumEmpty({ title: 'No subscriptions tracked', text: 'Add recurring costs only when you want this panel to monitor them.', actionLabel: 'Add subscription', onAction: () => editSub(null, refresh), graphic: 'admin' }));
  else main.appendChild(el('div.card.list', {}, subs.map(s => subRow(s, refresh))));

  main.appendChild(head('Contacts', () => editContact(null, refresh)));
  if (!contacts.length) main.appendChild(premiumEmpty({ title: 'No contacts saved', text: 'Track important people and follow-up context here.', actionLabel: 'Add contact', onAction: () => editContact(null, refresh), graphic: 'admin' }));
  else main.appendChild(el('div.card.list', {}, contacts.map(c => contactRow(c, refresh))));

  main.appendChild(el('section', { style: { marginTop: '20px' } }, [dataBackupCard(refresh)]));
}

function head(title, onAdd) {
  return el('div.section-head', {}, [
    el('h2.section-title', { text: title }),
    el('button.btn.sm.primary', { type: 'button', onclick: onAdd }, ['Add']),
  ]);
}

function reminderRow(r, refresh) {
  const overdue = r.due && !r.done && daysUntil(r.due) < 0;
  return el('div.item', {}, [
    el('input.check', { type: 'checkbox', checked: r.done, onchange: () => { updateItem('adminReminders', { id: r.id, done: !r.done }); refresh(); } }),
    el('div.grow', {}, [
      el('div.title' + (r.done ? '.strike' : ''), { text: r.text }),
      r.due ? el('div.meta', {}, [el('span', { class: overdue ? 'text-pink' : 'muted', text: relativeDue(r.due) })]) : null,
    ].filter(Boolean)),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editReminder(r, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete reminder?')) { deleteItem('adminReminders', r.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function subRow(s, refresh) {
  return el('div.item', {}, [
    el('div.grow', {}, [
      el('div.title', { text: s.name }),
      el('div.meta', {}, [
        el('span.chip.mint', { text: '$' + (s.cost || 0) + '/' + (s.cycle || 'monthly') }),
        s.renews ? el('span', { class: daysUntil(s.renews) <= 5 ? 'text-amber' : 'muted', text: 'renews ' + relativeDue(s.renews) }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editSub(s, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete subscription?')) { deleteItem('subscriptions', s.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function contactRow(c, refresh) {
  return el('div.item', {}, [
    el('div.grow', {}, [
      el('div.title', { text: c.name }),
      el('div.meta', {}, [
        c.role ? el('span', { text: c.role }) : null,
        c.contact ? el('span', { text: c.contact }) : null,
      ].filter(Boolean)),
    ]),
    el('div.actions', {}, [
      el('button.icon-btn', { type: 'button', onclick: () => editContact(c, refresh) }, ['Edit']),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete contact?')) { deleteItem('contacts', c.id); refresh(); } } }, ['Del']),
    ]),
  ]);
}

function editReminder(r, refresh) {
  const isNew = !r;
  const { form, values, validate } = buildForm([
    { name: 'text', label: 'Reminder / errand', value: r?.text || '', required: true },
    { name: 'due', label: 'Due (optional)', type: 'date', value: r?.due || '' },
  ]);
  openModal({ title: isNew ? 'New reminder' : 'Edit reminder', body: form, actions: [
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
  openModal({ title: isNew ? 'New subscription' : 'Edit subscription', body: form, actions: [
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
  openModal({ title: isNew ? 'New contact' : 'Edit contact', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; updateItem('contacts', { id: c?.id || uid('co'), ...values() }); refresh(); } },
  ] });
}
