// app.js — shell, navigation, hash router. Entry point (loaded as a module).

import { el, clear, openModal } from './ui.js';
import { loadData } from './store.js';
import { renderTicker } from './ticker.js';

import * as today from './pages/today.js';
import * as productivity from './pages/productivity.js';
import * as gym from './pages/gym.js';
import * as health from './pages/health.js';
import * as school from './pages/school.js';
import * as admin from './pages/admin.js';
import * as review from './pages/review.js';

// Minimal inline icon set (stroke-based, premium look).
const ICONS = {
  today: '<path d="M3 10h18M7 3v3M17 3v3"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 14h3"/>',
  productivity: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  gym: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  health: '<path d="M3 12h4l2 5 4-12 2 7h6"/>',
  school: '<path d="M3 8l9-4 9 4-9 4-9-4Z"/><path d="M7 10v5a5 3 0 0 0 10 0v-5"/>',
  admin: '<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14 1.5h-4l-.4 2.5a7 7 0 0 0-2.2 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3l.4 2.5h4l.4-2.5a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z"/>',
  review: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
};

const ROUTES = [
  { id: 'today', label: 'Today', icon: 'today', mod: today },
  { id: 'productivity', label: 'Productivity', shortLabel: 'Focus', icon: 'productivity', mod: productivity },
  { id: 'gym', label: 'Gym', icon: 'gym', mod: gym },
  { id: 'health', label: 'Health', icon: 'health', mod: health },
  { id: 'school', label: 'School', icon: 'school', mod: school },
  { id: 'admin', label: 'Admin', icon: 'admin', mod: admin },
  { id: 'review', label: 'Review', icon: 'review', mod: review },
];

function svgIcon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.innerHTML = ICONS[name] || '';
  return svg;
}

function currentRoute() {
  const id = (location.hash || '#/today').replace('#/', '');
  return ROUTES.find(r => r.id === id) || ROUTES[0];
}

function buildSidebar(active) {
  const side = document.getElementById('sidebar');
  clear(side);
  side.appendChild(el('div.brand', {}, [
    el('div.logo', { text: 'D' }),
    el('div', {}, [
      el('div.brand-name', { text: 'Dominic OS' }),
      el('div.brand-sub', { text: 'Command Center' }),
    ]),
  ]));
  ROUTES.forEach(r => {
    const btn = el('button.side-item' + (r.id === active.id ? '.active' : ''), {
      type: 'button', onclick: () => { location.hash = '#/' + r.id; },
    });
    btn.appendChild(svgIcon(r.icon));
    btn.appendChild(el('span', { text: r.label }));
    side.appendChild(btn);
  });
  const d = loadData();
  side.appendChild(el('div.side-foot', {}, [`Hey ${d.profile?.name || 'Dominic'} — let's move.`]));
}

function buildBottomNav(active) {
  const nav = document.getElementById('bottomnav');
  clear(nav);
  const primary = ['today', 'gym', 'health', 'productivity', 'review'];
  const routes = ROUTES.filter(r => primary.includes(r.id));
  routes.forEach(r => {
    const btn = el('button.nav-item' + (r.id === active.id ? '.active' : ''), {
      type: 'button', 'aria-label': r.label, onclick: () => { location.hash = '#/' + r.id; },
    });
    btn.appendChild(svgIcon(r.icon));
    btn.appendChild(el('span', { text: r.shortLabel || r.label }));
    nav.appendChild(btn);
  });
  const moreActive = !primary.includes(active.id);
  const more = el('button.nav-item' + (moreActive ? '.active' : ''), {
    type: 'button',
    'aria-label': 'More',
    onclick: openMoreNav,
  });
  more.appendChild(svgIcon('admin'));
  more.appendChild(el('span', { text: 'More' }));
  nav.appendChild(more);
}

function openMoreNav() {
  const list = el('div.list');
  ROUTES.filter(r => ['school', 'admin'].includes(r.id)).forEach(r => {
    const row = el('button.side-item', {
      type: 'button',
      onclick: () => {
        location.hash = '#/' + r.id;
        const top = document.querySelectorAll('.modal-overlay');
        const modal = top[top.length - 1];
        if (modal) {
          modal.classList.remove('show');
          setTimeout(() => modal.remove(), 180);
        }
      },
    });
    row.appendChild(svgIcon(r.icon));
    row.appendChild(el('span', { text: r.label }));
    list.appendChild(row);
  });
  openModal({
    title: 'More',
    body: list,
    actions: [{ label: 'Close', kind: 'ghost', onClick: () => true }],
  });
}

function renderRoute() {
  const route = currentRoute();
  buildSidebar(route);
  buildBottomNav(route);
  const main = document.getElementById('main');
  clear(main);
  main.scrollTop = 0;
  window.scrollTo(0, 0);
  try {
    route.mod.render(main);
  } catch (e) {
    console.error('[app] page render failed:', route.id, e);
    main.appendChild(el('div.card', {}, [
      el('h2', { text: 'Something broke on this page.' }),
      el('p.muted', { text: String(e && e.message || e) }),
    ]));
  }
  main.focus({ preventScroll: true });

  // Staggered entrance animation — runs on route change only. In-page refreshes
  // call the page's render() directly (not renderRoute), so they never re-trigger
  // it. `rise` keyframe ends fully visible, so content is safe even if removed early.
  main.classList.remove('is-entering');
  void main.offsetWidth; // force reflow so the animation restarts cleanly
  main.classList.add('is-entering');
  clearTimeout(renderRoute._entranceTimer);
  renderRoute._entranceTimer = setTimeout(() => main.classList.remove('is-entering'), 900);
}

let _booted = false;
function boot() {
  if (_booted) return;
  _booted = true;
  loadData();            // seed on first load
  renderTicker();
  window.addEventListener('hashchange', renderRoute);
  if (!location.hash) location.hash = '#/today';
  renderRoute();
}

document.addEventListener('DOMContentLoaded', boot);
// In case the module loads after DOMContentLoaded already fired:
if (document.readyState !== 'loading') boot();
