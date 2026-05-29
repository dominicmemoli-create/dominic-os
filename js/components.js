// components.js — reusable UI widgets shared across pages.

import { el, toast, openModal, confirmDialog, buildForm } from './ui.js';
import { downloadBackup, importBackup, resetToDemo, storageInfo } from './store.js';

// Storage usage meter with near-limit warning (rule 3).
export function storageMeter() {
  const info = storageInfo();
  const cls = info.percent >= 92 ? 'full' : (info.near ? 'near' : '');
  const wrap = el('div.storage-meter' + (cls ? '.' + cls : ''), {}, [
    el('div.row.between', {}, [
      el('span.label-cap', { text: 'Local storage' }),
      el('span.tiny.muted', { text: `${info.mb} MB / ${info.quotaMb} MB (${info.percent}%)` }),
    ]),
    el('div.bar', { style: { marginTop: '6px' } }, [el('span', { style: { width: info.percent + '%' } })]),
  ]);
  if (info.near) {
    wrap.appendChild(el('p.tiny.text-amber', { style: { marginTop: '7px' },
      text: '⚠ Storage is getting full. Export a backup and delete old progress photos to free space.' }));
  }
  return wrap;
}

// Data & Backup card: export / import / reset-to-demo + storage meter.
export function dataBackupCard(onAfterChange) {
  const card = el('div.card', {}, [
    el('div.row.between', {}, [
      el('h2.section-title', { text: 'Data & Backup' }),
      el('span.chip.muted', { text: 'localStorage' }),
    ]),
    el('p.tiny.muted', { style: { margin: '6px 0 12px' },
      text: 'Everything lives in this browser. Export regularly — clearing site data wipes it.' }),
    el('div.row.wrap', { style: { gap: '8px' } }, [
      el('button.btn.sm.primary', { type: 'button', onclick: () => { downloadBackup(); toast('Backup downloaded', 'ok'); } }, ['↓ Export backup']),
      el('button.btn.sm', { type: 'button', onclick: () => importFlow(onAfterChange) }, ['↑ Import backup']),
      el('button.btn.sm.ghost', { type: 'button', onclick: () => resetFlow(onAfterChange) }, ['↺ Reset to demo']),
    ]),
    el('div', { style: { marginTop: '14px' } }, [storageMeter()]),
  ]);
  return card;
}

function importFlow(onAfterChange) {
  const fileInput = el('input', { type: 'file', accept: 'application/json,.json' });
  const { form } = buildForm([]);
  const body = el('div', {}, [
    el('p.muted.small', { text: 'Select a Dominic OS backup (.json). This replaces all current data.' }),
    el('div', { style: { marginTop: '12px' } }, [fileInput]),
  ]);
  openModal({
    title: 'Import backup',
    body,
    actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      { label: 'Import & replace', kind: 'primary', onClick: () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) { toast('Choose a file first', 'warn'); return false; }
        const reader = new FileReader();
        reader.onload = () => {
          const res = importBackup(String(reader.result));
          if (res.ok) { toast('Backup imported', 'ok'); onAfterChange && onAfterChange(); }
          else toast(res.error || 'Import failed', 'error');
        };
        reader.readAsText(f);
        return true;
      } },
    ],
  });
}

async function resetFlow(onAfterChange) {
  const ok = await confirmDialog('This wipes your data and restores the demo sample data. Export a backup first if you want to keep anything.', { confirmLabel: 'Reset to demo', kind: 'danger' });
  if (!ok) return;
  resetToDemo();
  toast('Reset to demo data', 'ok');
  onAfterChange && onAfterChange();
}

// Small KPI tile.
export function kpiTile(label, value, sub, accent) {
  return el('div.card.tight', {}, [
    el('div.label-cap', { text: label }),
    el('div.kpi' + (accent ? '.text-' + accent : ''), { text: value, style: { marginTop: '4px' } }),
    sub ? el('div.tiny.muted', { text: sub }) : null,
  ].filter(Boolean));
}

// Tiny vertical-bar sparkline from an array of numbers.
export function sparkline(values, mint = false) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  return el('div.spark', {}, values.map(v => {
    const h = 8 + ((v - min) / range) * 36;
    return el('div.bar-v' + (mint ? '.mint' : ''), { style: { height: h + 'px' }, title: String(v) });
  }));
}
