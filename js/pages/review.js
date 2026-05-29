// review.js — weekly / monthly review. Auto-pulls stats from stored data.

import { el, clear, toast, openModal, buildForm, confirmDialog, uid } from '../ui.js';
import { loadData, updateItem, deleteItem } from '../store.js';
import { todayKey, lastNDays, fmtShort } from '../dates.js';
import { readinessScore, waterTarget } from '../compute.js';
import { summarizeWeeklyTraining } from '../workoutCoach.js';
import { kpiTile } from '../components.js';

let period = 'weekly'; // 'weekly' | 'monthly'

export function render(main) {
  const refresh = () => render(main);
  clear(main);
  const d = loadData();
  const days = period === 'weekly' ? 7 : 30;
  const stats = computeStats(d, days);

  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Auto-pulled from your logs' }),
    el('h1', { text: 'Review' }),
  ]));

  const toggle = el('div.pill-toggle', { style: { marginBottom: '16px' } });
  ['weekly', 'monthly'].forEach(p => toggle.appendChild(el('button' + (period === p ? '.active' : ''), { type: 'button', onclick: () => { period = p; refresh(); } }, [p[0].toUpperCase() + p.slice(1)])));
  main.appendChild(toggle);

  // KPI grid
  const grid = el('div.grid.grid-3');
  grid.appendChild(kpiTile('Workouts', String(stats.workouts), days + 'd', 'pink'));
  grid.appendChild(kpiTile('Volume', (stats.volume / 1000).toFixed(1) + 'k', 'lb', 'mint'));
  grid.appendChild(kpiTile('Avg readiness', stats.avgReadiness ?? '—', stats.readinessCall || '', 'amber'));
  grid.appendChild(kpiTile('Tasks done', `${stats.tasksDone}/${stats.tasksTotal}`, 'all-time', 'mint'));
  grid.appendChild(kpiTile('Water days', `${stats.waterHit}/${stats.waterLogged}`, 'hit target', 'pink'));
  grid.appendChild(kpiTile('Supplements', stats.supAdherence + '%', 'adherence', 'amber'));
  main.appendChild(grid);

  // scorecard averages
  main.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Scorecard averages' })]));
  const sc = el('div.card');
  [['focus', 'Focus'], ['body', 'Body'], ['mind', 'Mind'], ['recovery', 'Recovery']].forEach(([k, label]) => {
    const v = stats.scorecard[k];
    sc.appendChild(el('div', { style: { marginBottom: '10px' } }, [
      el('div.row.between', {}, [el('span.small', { text: label }), el('span.tiny.muted', { text: (v ?? 0).toFixed(1) + ' / 5' })]),
      el('div.bar', { style: { marginTop: '5px' } }, [el('span', { style: { width: ((v || 0) / 5 * 100) + '%' } })]),
    ]));
  });
  main.appendChild(sc);

  // body + founder snapshot
  main.appendChild(el('div.card', { style: { marginTop: '12px' } }, [
    el('div.row.between', {}, [el('span.label-cap', { text: 'Body weight change' }), el('span', { class: stats.bwDelta > 0 ? 'text-mint' : (stats.bwDelta < 0 ? 'text-amber' : 'muted'), text: (stats.bwDelta > 0 ? '+' : '') + stats.bwDelta + ' lb' })]),
    el('div.hr'),
    el('div.row.between', {}, [el('span.label-cap', { text: 'Weekly goals done' }), el('span.text-mint', { text: stats.goalsDone + ' / ' + stats.goalsTotal })]),
    el('div.hr'),
    el('div.row.between', {}, [el('span.label-cap', { text: 'Backlog cleared' }), el('span', { text: stats.backlogDone + ' / ' + stats.backlogTotal })]),
    el('div.hr'),
    el('div.row.between', {}, [el('span.label-cap', { text: 'Habit consistency' }), el('span.text-amber', { text: stats.habitPct + '%' })]),
    el('div.hr'),
    el('div.row.between', {}, [el('span.label-cap', { text: 'PRs set' }), el('span.text-mint', { text: String(stats.prs) })]),
  ]));

  // review notes
  const coll = period === 'weekly' ? 'weeklyReviews' : 'monthlyReviews';
  main.appendChild(el('div.section-head', {}, [
    el('h2.section-title', { text: (period === 'weekly' ? 'Weekly' : 'Monthly') + ' reflections' }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => editReview(coll, stats, refresh) }, ['+ New']),
  ]));
  const reviews = [...d[coll]].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (!reviews.length) main.appendChild(el('div.empty', {}, [el('p', { text: 'No reflections yet. Capture wins, lessons, and next focus.' })]));
  else reviews.forEach(rv => main.appendChild(el('div.card.tight', { style: { marginBottom: '10px' } }, [
    el('div.row.between', {}, [el('div.label-cap', { text: fmtShort(rv.createdAt) }), el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete reflection?')) { deleteItem(coll, rv.id); refresh(); } } }, ['🗑'])]),
    rv.wins ? el('p.small', {}, [el('b.text-mint', { text: 'Wins: ' }), rv.wins]) : null,
    rv.lessons ? el('p.small', { style: { marginTop: '5px' } }, [el('b.text-amber', { text: 'Lessons: ' }), rv.lessons]) : null,
    rv.focus ? el('p.small', { style: { marginTop: '5px' } }, [el('b.text-pink', { text: 'Next: ' }), rv.focus]) : null,
  ].filter(Boolean))));

  main.appendChild(el('p.tiny.faint.center', { style: { marginTop: '18px' }, text: 'Stats recompute from your logs every time you open this page.' }));
}

function computeStats(d, days) {
  const window = lastNDays(days);
  const inWindow = dk => window.includes(dk);

  // workouts + volume
  const sum = summarizeWeeklyTraining(d); // 7d figures
  const sessions = d.workoutSessions.filter(s => s.completed && inWindow(s.date));
  let volume = 0;
  sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach(st => { if (st.done && st.weight && st.reps) volume += st.weight * st.reps; })));

  // readiness
  const recs = d.sleepRecoveryLogs.filter(l => inWindow(l.date));
  const readinessVals = recs.map(l => readinessScore(l).score).filter(v => v != null);
  const avgReadiness = readinessVals.length ? Math.round(readinessVals.reduce((a, b) => a + b, 0) / readinessVals.length) : null;
  const readinessCall = avgReadiness == null ? '' : (avgReadiness >= 75 ? 'Push' : avgReadiness >= 60 ? 'Normal' : avgReadiness >= 45 ? 'Maintain' : 'Recover');

  // tasks (all-time done vs total)
  const tasksDone = d.tasks.filter(t => t.done).length;
  const tasksTotal = d.tasks.length;

  // water adherence
  const target = waterTarget(d.settings.water).targetOz;
  let waterLogged = 0, waterHit = 0;
  window.forEach(dk => { const w = d.waterLogs[dk]; if (w && w.intakeOz > 0) { waterLogged++; if (w.intakeOz >= (w.targetOz || target)) waterHit++; } });

  // supplement adherence (avg taken/total across logged days)
  const total = d.supplements.length || 1;
  let supDays = 0, supSum = 0;
  window.forEach(dk => { const log = d.supplementLog[dk]; if (log) { supDays++; supSum += Object.keys(log).length / total; } });
  const supAdherence = supDays ? Math.round((supSum / supDays) * 100) : 0;

  // scorecard averages
  const scKeys = ['focus', 'body', 'mind', 'recovery'];
  const scAcc = { focus: [], body: [], mind: [], recovery: [] };
  window.forEach(dk => { const log = d.dailyLogs[dk]; if (log?.scorecard) scKeys.forEach(k => { if (log.scorecard[k]) scAcc[k].push(log.scorecard[k]); }); });
  const scorecard = {};
  scKeys.forEach(k => { scorecard[k] = scAcc[k].length ? scAcc[k].reduce((a, b) => a + b, 0) / scAcc[k].length : 0; });

  // body weight delta
  const bw = [...d.bodyWeightEntries].filter(e => inWindow(e.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const bwDelta = bw.length >= 2 ? +(bw.at(-1).weight - bw[0].weight).toFixed(1) : 0;

  // productivity progress
  const p2 = d.productivity || {};
  const goalsDone = (p2.weeklyGoals || []).filter(g => g.status === 'Done').length;
  const goalsTotal = (p2.weeklyGoals || []).length;
  const backlogDone = (p2.priorityBacklog || []).filter(i => i.done).length;
  const backlogTotal = (p2.priorityBacklog || []).length;
  // habit consistency over the window
  let habitCells = 0, habitHit = 0;
  (p2.habits || []).forEach(h => { window.forEach(dk => { habitCells++; if (h.log && h.log[dk]) habitHit++; }); });
  const habitPct = habitCells ? Math.round((habitHit / habitCells) * 100) : 0;

  // prs in window
  const prs = d.personalRecords.filter(p => inWindow(p.date)).length;

  return {
    workouts: sessions.length, volume: Math.round(volume),
    avgReadiness, readinessCall,
    tasksDone, tasksTotal,
    waterLogged, waterHit,
    supAdherence,
    scorecard, bwDelta,
    goalsDone, goalsTotal, backlogDone, backlogTotal, habitPct, prs,
  };
}

function editReview(coll, stats, refresh) {
  const { form, values } = buildForm([
    { name: 'wins', label: 'Wins', type: 'textarea', value: '', placeholder: 'What went well?' },
    { name: 'lessons', label: 'Lessons', type: 'textarea', value: '', placeholder: 'What did I learn / avoid?' },
    { name: 'focus', label: 'Next focus', type: 'textarea', value: '', placeholder: 'The one thing for next period.' },
  ]);
  const snapshot = el('p.tiny.faint', { style: { marginTop: '6px' }, text: `Snapshot: ${stats.workouts} workouts · readiness ${stats.avgReadiness ?? '—'} · BW ${stats.bwDelta > 0 ? '+' : ''}${stats.bwDelta}lb` });
  openModal({ title: 'New reflection', wide: true, body: el('div', {}, [form, snapshot]), actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => { const v = values(); updateItem(coll, { id: uid('rv'), createdAt: todayKey(), snapshot: { workouts: stats.workouts, readiness: stats.avgReadiness, bwDelta: stats.bwDelta }, ...v }); toast('Saved', 'ok'); refresh(); } },
  ] });
}
