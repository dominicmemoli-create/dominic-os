// components.js - reusable premium UI widgets shared across pages.

import { el, toast, openModal, confirmDialog } from './ui.js';
import {
  downloadBackup,
  importBackup,
  resetToDemo,
  resetToStarter,
  storageInfo,
} from './store.js';

export function isDemoMode(data) {
  return !!(data && data.meta && data.meta.demoMode);
}

export function visibleItems(data, items) {
  const arr = Array.isArray(items) ? items : [];
  return isDemoMode(data) ? arr : arr.filter(item => item && !item._sample);
}

// Storage usage meter.
export function storageMeter() {
  const info = storageInfo();
  const cls = info.percent >= 92 ? 'full' : (info.near ? 'near' : '');
  const wrap = el('div.storage-meter' + (cls ? '.' + cls : ''), {}, [
    el('div.row.between', {}, [
      el('span.label-cap', { text: 'Local storage' }),
      el('span.tiny.muted', { text: `${info.mb} MB / ${info.quotaMb} MB (${info.percent}%)` }),
    ]),
    el('div.bar', { style: { marginTop: '8px' } }, [
      el('span', { style: { width: info.percent + '%' } }),
    ]),
  ]);
  if (info.near) {
    wrap.appendChild(el('p.tiny.text-amber', {
      style: { marginTop: '8px' },
      text: 'Storage is getting full. Export a backup and delete old progress photos to free space.',
    }));
  }
  return wrap;
}

export function dataBackupCard(onAfterChange) {
  return el('div.card', {}, [
    el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: 'Data vault' }),
        el('h2', { text: 'Backup and mode' }),
      ]),
      el('span.chip.muted', { text: 'localStorage' }),
    ]),
    el('p.small.muted', {
      style: { margin: '10px 0 14px' },
      text: 'Everything lives in this browser. Export regularly before clearing site data or switching modes.',
    }),
    el('div.row.wrap', { style: { gap: '8px' } }, [
      el('button.btn.sm.primary', {
        type: 'button',
        onclick: () => { downloadBackup(); toast('Backup downloaded', 'ok'); },
      }, ['Export backup']),
      el('button.btn.sm', { type: 'button', onclick: () => importFlow(onAfterChange) }, ['Import backup']),
      el('button.btn.sm.ghost', { type: 'button', onclick: () => demoFlow(onAfterChange) }, ['Load demo']),
      el('button.btn.sm.danger', { type: 'button', onclick: () => starterFlow(onAfterChange) }, ['Start fresh']),
    ]),
    el('div', { style: { marginTop: '16px' } }, [storageMeter()]),
  ]);
}

function importFlow(onAfterChange) {
  const fileInput = el('input', { type: 'file', accept: 'application/json,.json' });
  const body = el('div', {}, [
    el('p.muted.small', { text: 'Select a Dominic OS backup (.json). This replaces all current data.' }),
    el('div', { style: { marginTop: '12px' } }, [fileInput]),
  ]);
  openModal({
    title: 'Import backup',
    body,
    actions: [
      { label: 'Cancel', kind: 'ghost', onClick: () => true },
      {
        label: 'Import and replace',
        kind: 'primary',
        onClick: () => {
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
        },
      },
    ],
  });
}

async function demoFlow(onAfterChange) {
  const ok = await confirmDialog('This replaces current data with clearly labeled demo records. Export a backup first if you want to keep anything.', { confirmLabel: 'Load demo', kind: 'danger' });
  if (!ok) return;
  resetToDemo();
  toast('Demo data loaded', 'ok');
  onAfterChange && onAfterChange();
}

async function starterFlow(onAfterChange) {
  const ok = await confirmDialog('This wipes your data and returns Dominic OS to real-user mode with only the gym library and starter split. Export a backup first if you want to keep anything.', { confirmLabel: 'Start fresh', kind: 'danger' });
  if (!ok) return;
  resetToStarter();
  toast('Fresh mode restored', 'ok');
  onAfterChange && onAfterChange();
}

export function kpiTile(label, value, sub, accent) {
  return statTile(label, value, sub, accent);
}

export function statTile(label, value, sub = '', accent = '') {
  return el('div.metric-tile', {}, [
    el('div.label-cap', { text: label }),
    el('div.metric-value' + (accent ? '.text-' + accent : ''), { text: String(value) }),
    sub ? el('div.tiny.muted', { text: sub }) : null,
  ].filter(Boolean));
}

export function sparkline(values, mint = false) {
  const safe = Array.isArray(values) && values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = max - min || 1;
  return el('div.spark', {}, safe.map(v => {
    const h = 8 + ((v - min) / range) * 44;
    return el('div.bar-v' + (mint ? '.mint' : ''), {
      style: { height: h + 'px' },
      title: String(v),
    });
  }));
}

export function metricRing(value, label, color = 'var(--green)') {
  const n = Number(value);
  const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  return el('div.metric-ring', { style: { '--p': pct, '--ring-color': color } }, [
    el('div.metric-ring-inner', {}, [
      el('div.metric-ring-value', { text: Number.isFinite(n) ? String(value) : '0' }),
      el('div.metric-ring-label', { text: label }),
    ]),
  ]);
}

export function pageHero({ kicker, title, subtitle, tone = 'cool', graphic, actions = [], metrics = [] }) {
  return el('section.hero-panel.' + tone, {}, [
    el('div.hero-copy', {}, [
      kicker ? el('div.hero-kicker', { text: kicker }) : null,
      el('h1.hero-title', { text: title }),
      subtitle ? el('p.hero-sub', { text: subtitle }) : null,
      actions.length ? el('div.hero-actions', {}, actions) : null,
      metrics.length ? el('div.metric-strip', {}, metrics) : null,
    ].filter(Boolean)),
    el('div.hero-visual', {}, [graphic || pageGraphic('orbital')]),
  ]);
}

export function pageGraphic(type, options = {}) {
  if (type === 'focus') {
    return el('div.focus-graphic', {}, [
      el('div.focus-lanes', {}, [
        el('div.focus-lane', {}, [el('span', { style: { width: (options.a || 82) + '%' } })]),
        el('div.focus-lane', {}, [el('span')]),
        el('div.focus-lane', {}, [el('span')]),
      ]),
    ]);
  }
  if (type === 'recovery') {
    return el('div.recovery-graphic', {}, [
      metricRing(options.score ?? 82, options.label || 'Recovery', 'var(--cyan)'),
      el('div.recovery-bottle', { style: { '--fill': (options.fill || 58) + '%' } }),
    ]);
  }
  if (type === 'school') {
    return el('div.semester-graphic', {}, [
      el('div.semester-stack', {}, [
        el('div.semester-card'),
        el('div.semester-card'),
        el('div.semester-card'),
      ]),
    ]);
  }
  if (type === 'admin') {
    return el('div.control-graphic', {}, [
      el('div.control-grid', {}, Array.from({ length: 9 }, () => el('div.control-cell'))),
    ]);
  }
  if (type === 'review') {
    return el('div.analytics-graphic', {}, [el('div.analytics-web')]);
  }
  if (type === 'muscle') {
    return el('div.muscle-map', {}, [
      el('div.muscle-body', {}, [
        el('span.muscle-line.chest'),
        el('span.muscle-line.back'),
        el('span.muscle-line.legs'),
      ]),
    ]);
  }
  const progress = options.progress ?? 78;
  return el('div.orbital-graphic', {}, [
    el('div.orbit-line'),
    el('span.orbit-dot.one'),
    el('span.orbit-dot.two'),
    el('span.orbit-dot.three'),
    el('div.orbital-core', {}, [el('span', { text: String(progress) + '%' })]),
  ]);
}

export function premiumEmpty({ title, text, actionLabel, onAction, graphic = 'orbital' }) {
  return el('div.empty.center', {}, [
    el('div.empty-graphic', {}, [emptyIcon(graphic)]),
    el('div', {}, [
      el('h3', { text: title }),
      text ? el('p.small.muted', { style: { marginTop: '6px' }, text }) : null,
    ].filter(Boolean)),
    actionLabel ? el('button.btn.sm.primary', { type: 'button', onclick: onAction }, [actionLabel]) : null,
  ].filter(Boolean));
}

function emptyIcon(type) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const paths = {
    focus: '<path d="M12 20h40M12 32h28M12 44h18"/><path d="M46 32l4 4 8-10"/>',
    recovery: '<circle cx="32" cy="32" r="20"/><path d="M22 34h8l4-12 5 20 4-8h7"/>',
    school: '<path d="M10 22l22-10 22 10-22 10-22-10Z"/><path d="M18 28v12c8 5 20 5 28 0V28"/>',
    admin: '<path d="M20 14h24v36H20z"/><path d="M26 24h12M26 32h12M26 40h8"/>',
    review: '<path d="M12 48V28M28 48V16M44 48V34"/><path d="M8 52h48"/>',
    muscle: '<circle cx="32" cy="14" r="6"/><path d="M32 20v30M20 28h24M24 50h16"/>',
  };
  svg.innerHTML = paths[type] || '<path d="M32 8l20 12v24L32 56 12 44V20L32 8Z"/><path d="M32 8v48M12 20l20 12 20-12"/>';
  return svg;
}
