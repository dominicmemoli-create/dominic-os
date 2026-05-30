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

/* ===== Signature muscle map (front + back athletic anatomy) =====
   Vanilla port of the Claude Design `lib.jsx` MuscleMap. Highlight bloom is
   driven by the `.mmap.push/.pull/.legs` CSS classes, so muscle paths only
   carry semantic classes (chest, lat, quad, ...). */
const MM_DEFS = `
<defs>
  <radialGradient id="mmTorso" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="rgba(255,255,255,0.07)"/><stop offset="1" stop-color="rgba(255,255,255,0.012)"/></radialGradient>
  <linearGradient id="mmForm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,0.085)"/><stop offset="1" stop-color="rgba(255,255,255,0.022)"/></linearGradient>
  <linearGradient id="mmWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd089"/><stop offset="0.5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff5f7a"/></linearGradient>
  <linearGradient id="mmCool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdf2ff"/><stop offset="0.5" stop-color="#72d9ff"/><stop offset="1" stop-color="#5aa0ff"/></linearGradient>
  <linearGradient id="mmGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffedb3"/><stop offset="0.5" stop-color="#ffd166"/><stop offset="1" stop-color="#ffab3d"/></linearGradient>
</defs>`;
const MM_BASE = `
  <ellipse class="body" cx="52" cy="18" rx="10.5" ry="11.5"/>
  <path class="body" d="M46 27 L58 27 L57 35 Q52 38 47 35 Z"/>
  <path class="body" d="M33 45 Q52 39 71 45 L65 114 Q52 122 39 114 Z"/>
  <ellipse class="body" cx="24" cy="78" rx="7.5" ry="21"/><ellipse class="body" cx="80" cy="78" rx="7.5" ry="21"/>
  <ellipse class="body" cx="20.5" cy="119" rx="6" ry="19"/><ellipse class="body" cx="83.5" cy="119" rx="6" ry="19"/>
  <ellipse class="body" cx="19" cy="142" rx="5" ry="7"/><ellipse class="body" cx="85" cy="142" rx="5" ry="7"/>
  <path class="body" d="M39 112 Q52 120 65 112 L62 132 Q52 138 42 132 Z"/>
  <ellipse class="body" cx="44" cy="156" rx="9.5" ry="27"/><ellipse class="body" cx="60" cy="156" rx="9.5" ry="27"/>
  <ellipse class="body" cx="45.5" cy="199" rx="7.5" ry="25"/><ellipse class="body" cx="58.5" cy="199" rx="7.5" ry="25"/>
  <ellipse class="body" cx="45.5" cy="223" rx="5" ry="5"/><ellipse class="body" cx="58.5" cy="223" rx="5" ry="5"/>`;
const MM_FRONT = MM_BASE + `
  <path class="m fdelt" d="M30 50 C20 51 16 58 16 66 C24 71 32 67 34 60 C35 54 33 50 30 50 Z"/>
  <path class="m fdelt" d="M74 50 C84 51 88 58 88 66 C80 71 72 67 70 60 C69 54 71 50 74 50 Z"/>
  <path class="m chest" d="M50 46 C39 45 31 50 31 59 C31 68 41 72 50 66 C51 59 51 52 50 46 Z"/>
  <path class="m chest" d="M54 46 C65 45 73 50 73 59 C73 68 63 72 54 66 C53 59 53 52 54 46 Z"/>
  <ellipse class="m bi" cx="23" cy="80" rx="6.5" ry="15"/><ellipse class="m bi" cx="81" cy="80" rx="6.5" ry="15"/>
  <path class="m tri" d="M16 66 C13 74 14 88 18 96 L21.5 92 C19 83 19 73 20 67 Z"/>
  <path class="m tri" d="M88 66 C91 74 90 88 86 96 L82.5 92 C85 83 85 73 84 67 Z"/>
  <rect class="m abs" x="44" y="68" width="16" height="40" rx="5"/>
  <path class="m oblique" d="M43 72 C38.5 78 38.5 98 43 108 L45.5 106 L45.5 74 Z"/>
  <path class="m oblique" d="M61 72 C65.5 78 65.5 98 61 108 L58.5 106 L58.5 74 Z"/>
  <path class="m quad" d="M40 116 C34 120 35 148 41 166 C45 172 49.5 168 49.5 150 L49 118 Z"/>
  <path class="m quad" d="M64 116 C70 120 69 148 63 166 C59 172 54.5 168 54.5 150 L55 118 Z"/>
  <path class="m calf" d="M41 178 C37 184 39 202 44 209 C47 211 48.5 203 48.5 193 L47.5 178 Z"/>
  <path class="m calf" d="M63 178 C67 184 65 202 60 209 C57 211 55.5 203 55.5 193 L56.5 178 Z"/>
  <path class="seg" d="M52 47 L52 65"/><path class="seg" d="M52 68 L52 107"/>
  <path class="seg" d="M45 80 L59 80 M45 90 L59 90 M45 100 L59 100"/>
  <path class="seg" d="M44 124 L46.5 160 M60 124 L57.5 160"/>`;
const MM_BACK = MM_BASE + `
  <path class="m uback" d="M40 33 Q52 30 64 33 L68 56 Q52 62 36 56 Z"/>
  <path class="m rdelt" d="M30 50 C20 51 16 58 16 66 C24 71 32 67 34 60 C35 54 33 50 30 50 Z"/>
  <path class="m rdelt" d="M74 50 C84 51 88 58 88 66 C80 71 72 67 70 60 C69 54 71 50 74 50 Z"/>
  <path class="m lat" d="M35 54 C29 64 32 86 45 94 L50 66 C48 59 42 55 35 54 Z"/>
  <path class="m lat" d="M69 54 C75 64 72 86 59 94 L54 66 C56 59 62 55 69 54 Z"/>
  <ellipse class="m tri" cx="23" cy="80" rx="6.5" ry="15"/><ellipse class="m tri" cx="81" cy="80" rx="6.5" ry="15"/>
  <path class="m erector" d="M47 94 Q52 98 57 94 L56 112 Q52 116 48 112 Z"/>
  <path class="m glute" d="M41 113 C34 115 34 130 44 133 C51 134 51 117 47 113 Z"/>
  <path class="m glute" d="M63 113 C70 115 70 130 60 133 C53 134 53 117 57 113 Z"/>
  <path class="m ham" d="M41 136 C36 140 37 160 42 173 C46 178 49.5 173 49.5 156 L48.5 138 Z"/>
  <path class="m ham" d="M63 136 C68 140 67 160 62 173 C58 178 54.5 173 54.5 156 L55.5 138 Z"/>
  <path class="m calf" d="M41 178 C37 184 39 202 44 209 C47 211 48.5 203 48.5 193 L47.5 178 Z"/>
  <path class="m calf" d="M63 178 C67 184 65 202 60 209 C57 211 55.5 203 55.5 193 L56.5 178 Z"/>
  <path class="seg" d="M52 31 L52 112"/><path class="seg" d="M44 40 L44 52 M60 40 L60 52"/>
  <path class="seg" d="M42 70 L48 82 M62 70 L56 82"/>`;

// Map a split day (or label) to a highlight tone: push / pull / legs / '' (none).
export function splitTone(day) {
  if (!day) return '';
  if (day.kind && day.kind !== 'training') return '';
  const hay = ((day.label || '') + ' ' + (day.focusMuscles || []).join(' ')).toLowerCase();
  if (/(leg|quad|ham|glute|calf|lower)/.test(hay)) return 'legs';
  if (/(pull|back|lat|row|bicep|rear)/.test(hay)) return 'pull';
  if (/(push|chest|shoulder|tricep|press|upper)/.test(hay)) return 'push';
  return '';
}

// Build the front+back muscle map figure. `tone` is '', 'push', 'pull' or 'legs'.
export function muscleMap(tone = '') {
  const wrap = el('div.muscle-figure');
  const holder = document.createElement('div');
  holder.innerHTML =
    `<svg class="mmap ${tone}" viewBox="0 0 220 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">` +
    MM_DEFS +
    '<g transform="translate(0,4)">' + MM_FRONT + '</g>' +
    '<g transform="translate(116,4)">' + MM_BACK + '</g>' +
    '</svg>';
  if (holder.firstElementChild) wrap.appendChild(holder.firstElementChild);
  return wrap;
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
  // Start at 0 and let CSS transition draw the arc in on load.
  const ring = el('div.metric-ring', { style: { '--p': 0, '--ring-color': color } }, [
    el('div.metric-ring-inner', {}, [
      el('div.metric-ring-value', { text: Number.isFinite(n) ? String(value) : '0' }),
      el('div.metric-ring-label', { text: label }),
    ]),
  ]);
  requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.setProperty('--p', pct); }));
  return ring;
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
    return muscleMap(options.tone || splitTone(options.day));
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
