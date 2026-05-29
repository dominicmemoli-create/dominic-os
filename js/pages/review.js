// review.js - analytics and reflection.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, updateItem, deleteItem } from '../store.js';
import { todayKey, lastNDays, fmtShort } from '../dates.js';
import { readinessScore, waterTarget } from '../compute.js';
import { pageHero, pageGraphic, statTile, premiumEmpty, visibleItems, sparkline } from '../components.js';

let period = 'weekly';

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const days = period === 'weekly' ? 7 : 30;
  const stats = computeStats(d, days);
  const coll = period === 'weekly' ? 'weeklyReviews' : 'monthlyReviews';
  const reviews = visibleItems(d, d[coll]).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  main.appendChild(pageHero({
    kicker: 'Life Review',
    title: 'Reflect and refine.',
    subtitle: 'Training, recovery, execution, reflection.',
    tone: 'violet',
    graphic: pageGraphic('review'),
    actions: [
      el('button.btn.primary', { type: 'button', onclick: () => editReview(coll, stats, refresh) }, ['New reflection']),
      el('button.btn.ghost', { type: 'button', onclick: () => { period = period === 'weekly' ? 'monthly' : 'weekly'; refresh(); } }, [period === 'weekly' ? 'Monthly' : 'Weekly']),
    ],
    metrics: [
      statTile('Overall', stats.overallScore || '--', 'score', 'mint'),
      statTile('Workouts', stats.workouts, days + 'd', 'pink'),
      statTile('Readiness', stats.avgReadiness ?? '--', stats.readinessCall || 'manual', 'sky'),
      statTile('Tasks', `${stats.tasksDone}/${stats.tasksTotal}`, 'done', 'amber'),
    ],
  }));

  const toggle = el('div.pill-toggle', { style: { marginTop: '16px' } });
  ['weekly', 'monthly'].forEach(p => toggle.appendChild(el('button' + (period === p ? '.active' : ''), { type: 'button', onclick: () => { period = p; refresh(); } }, [p[0].toUpperCase() + p.slice(1)])));
  main.appendChild(toggle);

  main.appendChild(el('div.grid.grid-3', { style: { marginTop: '16px' } }, [
    statTile('Volume', (stats.volume / 1000).toFixed(1) + 'k', 'lb', 'mint'),
    statTile('Water days', `${stats.waterHit}/${stats.waterLogged}`, 'hit target', 'sky'),
    statTile('Supplements', stats.supAdherence + '%', 'adherence', 'amber'),
    statTile('Goals', `${stats.goalsDone}/${stats.goalsTotal}`, 'done', 'mint'),
    statTile('Backlog', `${stats.backlogDone}/${stats.backlogTotal}`, 'cleared', 'sky'),
    statTile('PRs', stats.prs, 'set', 'pink'),
  ]));

  main.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Performance chart' })]));
  main.appendChild(el('div.card', {}, [
    el('div.row.between', { style: { marginBottom: '12px' } }, [
      el('div.label-cap', { text: days + '-day activity' }),
      el('span.chip.mint', { text: stats.overallScore ? stats.overallScore + ' score' : 'not enough data' }),
    ]),
    sparkline(stats.activitySeries, true),
  ]));

  main.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Score rings' })]));
  main.appendChild(el('div.card', {}, [
    scoreLine('Focus', stats.scorecard.focus),
    scoreLine('Body', stats.scorecard.body),
    scoreLine('Mind', stats.scorecard.mind),
    scoreLine('Recovery', stats.scorecard.recovery),
  ]));

  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: (period === 'weekly' ? 'Weekly' : 'Monthly') + ' reflections' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => editReview(coll, stats, refresh) }, ['New']),
  ]));
  if (!reviews.length) {
    main.appendChild(premiumEmpty({ title: 'No reflections yet', text: 'Capture wins, lessons, and next focus when you actually review.', actionLabel: 'New reflection', onAction: () => editReview(coll, stats, refresh), graphic: 'review' }));
  } else {
    reviews.forEach(rv => main.appendChild(reviewCard(rv, coll, refresh)));
  }
}

function scoreLine(label, v) {
  const value = v || 0;
  return el('div', { style: { marginBottom: '12px' } }, [
    el('div.row.between', {}, [el('span.small', { text: label }), el('span.tiny.muted', { text: value.toFixed(1) + ' / 5' })]),
    el('div.bar', { style: { marginTop: '6px' } }, [el('span', { style: { width: ((value / 5) * 100) + '%' } })]),
  ]);
}

function reviewCard(rv, coll, refresh) {
  return el('div.card.tight', { style: { marginBottom: '10px' } }, [
    el('div.row.between', {}, [
      el('div.label-cap', { text: fmtShort(rv.createdAt) }),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete reflection?')) { deleteItem(coll, rv.id); refresh(); } } }, ['Del']),
    ]),
    rv.wins ? el('p.small', { style: { marginTop: '10px' } }, ['Wins: ' + rv.wins]) : null,
    rv.lessons ? el('p.small', { style: { marginTop: '6px' } }, ['Lessons: ' + rv.lessons]) : null,
    rv.focus ? el('p.small.text-mint', { style: { marginTop: '6px' }, text: 'Next: ' + rv.focus }) : null,
  ].filter(Boolean));
}

function computeStats(d, days) {
  const window = lastNDays(days);
  const inWindow = dk => window.includes(dk);
  const sessions = visibleItems(d, d.workoutSessions).filter(s => s.completed && inWindow(s.date));
  let volume = 0;
  const activitySeries = window.map(dk => {
    let dayVolume = 0;
    sessions.filter(s => s.date === dk).forEach(s => s.exercises.forEach(e => e.sets.forEach(st => {
      if (st.done && st.weight && st.reps) dayVolume += st.weight * st.reps;
    })));
    volume += dayVolume;
    return Math.round(dayVolume / 100);
  });

  const recs = visibleItems(d, d.sleepRecoveryLogs).filter(l => inWindow(l.date));
  const readinessVals = recs.map(l => readinessScore(l).score).filter(v => v != null);
  const avgReadiness = readinessVals.length ? Math.round(readinessVals.reduce((a, b) => a + b, 0) / readinessVals.length) : null;
  const readinessCall = avgReadiness == null ? '' : (avgReadiness >= 75 ? 'Push' : avgReadiness >= 60 ? 'Normal' : avgReadiness >= 45 ? 'Maintain' : 'Recover');
  const tasks = visibleItems(d, d.tasks);
  const tasksDone = tasks.filter(t => t.done).length;
  const tasksTotal = tasks.length;
  const target = waterTarget(d.settings.water).targetOz;
  let waterLogged = 0;
  let waterHit = 0;
  window.forEach(dk => {
    const w = d.waterLogs[dk];
    if (w && w.intakeOz > 0) {
      waterLogged++;
      if (w.intakeOz >= (w.targetOz || target)) waterHit++;
    }
  });
  const sups = visibleItems(d, d.supplements);
  const total = sups.length || 1;
  let supDays = 0;
  let supSum = 0;
  window.forEach(dk => {
    const log = d.supplementLog[dk];
    if (log) {
      supDays++;
      supSum += Object.keys(log).length / total;
    }
  });
  const supAdherence = supDays && sups.length ? Math.round((supSum / supDays) * 100) : 0;
  const scKeys = ['focus', 'body', 'mind', 'recovery'];
  const scAcc = { focus: [], body: [], mind: [], recovery: [] };
  window.forEach(dk => {
    const log = d.dailyLogs[dk];
    if (log?.scorecard && !(log._sample && !d.meta?.demoMode)) scKeys.forEach(k => { if (log.scorecard[k]) scAcc[k].push(log.scorecard[k]); });
  });
  const scorecard = {};
  scKeys.forEach(k => { scorecard[k] = scAcc[k].length ? scAcc[k].reduce((a, b) => a + b, 0) / scAcc[k].length : 0; });
  const p = d.productivity || {};
  const goals = visibleItems(d, p.weeklyGoals);
  const backlog = visibleItems(d, p.priorityBacklog);
  const prs = visibleItems(d, d.personalRecords).filter(p => inWindow(p.date)).length;
  const overallParts = [
    avgReadiness,
    tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : null,
    sessions.length ? Math.min(100, sessions.length * 16) : null,
    waterLogged ? Math.round((waterHit / waterLogged) * 100) : null,
  ].filter(v => v != null);
  const overallScore = overallParts.length ? Math.round(overallParts.reduce((a, b) => a + b, 0) / overallParts.length) : null;
  return {
    workouts: sessions.length,
    volume: Math.round(volume),
    avgReadiness,
    readinessCall,
    tasksDone,
    tasksTotal,
    waterLogged,
    waterHit,
    supAdherence,
    scorecard,
    goalsDone: goals.filter(g => g.status === 'Done').length,
    goalsTotal: goals.length,
    backlogDone: backlog.filter(i => i.done).length,
    backlogTotal: backlog.length,
    prs,
    overallScore,
    activitySeries,
  };
}

function editReview(coll, stats, refresh) {
  const { form, values } = buildForm([
    { name: 'wins', label: 'Wins', type: 'textarea', value: '', placeholder: 'What went well?' },
    { name: 'lessons', label: 'Lessons', type: 'textarea', value: '', placeholder: 'What did I learn?' },
    { name: 'focus', label: 'Next focus', type: 'textarea', value: '', placeholder: 'The one thing for next period.' },
  ]);
  const snapshot = el('p.tiny.faint', {
    style: { marginTop: '8px' },
    text: `Snapshot: ${stats.workouts} workouts, readiness ${stats.avgReadiness ?? '--'}, score ${stats.overallScore ?? '--'}`,
  });
  openModal({ title: 'New reflection', wide: true, body: el('div', {}, [form, snapshot]), actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => { updateItem(coll, { id: uid('rv'), createdAt: todayKey(), snapshot: { workouts: stats.workouts, readiness: stats.avgReadiness, score: stats.overallScore }, ...values() }); toast('Saved', 'ok'); refresh(); } },
  ] });
}
