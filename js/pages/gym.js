// gym.js — the centerpiece. Sub-tabbed: Today / Plan & Split / Library / Body / Progress.
// Real workout logging with rule-based progression (see workoutCoach.js).

import { el, clear, toast, openModal, buildForm, confirmDialog, uid, compressImage } from '../ui.js';
import { loadData, mutate, updateItem, deleteItem, saveData, storageInfo } from '../store.js';
import { todayKey, fmtShort, weekdayName, lastNDays, WEEKDAYS } from '../dates.js';
import {
  generateWorkoutFromSplit, suggestProgression, getExerciseHistory,
  recommendExerciseSwaps, summarizeWeeklyTraining, adjustWorkoutForRecovery, e1rm,
} from '../workoutCoach.js';
import { todaySplitDay, readinessToday } from '../compute.js';
import { sparkline, kpiTile, storageMeter } from '../components.js';

let gymTab = 'today';
let activeSession = null; // live logging state held in-module

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'plan', label: 'Plan & Split' },
  { id: 'library', label: 'Library' },
  { id: 'body', label: 'Body & Photos' },
  { id: 'progress', label: 'Progress' },
];

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Rear Delts', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
const PATTERNS = ['Horizontal Push', 'Vertical Push', 'Incline Push', 'Horizontal Pull', 'Vertical Pull', 'Hinge', 'Squat', 'Isolation'];
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band'];

export function render(main) {
  const refresh = () => render(main);
  clear(main);

  main.appendChild(el('div.page-head', {}, [
    el('div.eyebrow', { text: 'Lean bulk · progressive overload' }),
    el('h1', { text: 'Gym' }),
  ]));

  // sub-tabs
  const tabBar = el('div.pill-toggle.scroll-x', { style: { marginBottom: '16px' } });
  TABS.forEach(t => tabBar.appendChild(el('button' + (gymTab === t.id ? '.active' : ''), {
    type: 'button', onclick: () => { gymTab = t.id; refresh(); },
  }, [t.label])));
  main.appendChild(tabBar);

  const body = el('div');
  main.appendChild(body);

  if (activeSession) { renderSession(body, refresh); return; }
  if (gymTab === 'today') renderToday(body, refresh);
  else if (gymTab === 'plan') renderPlan(body, refresh);
  else if (gymTab === 'library') renderLibrary(body, refresh);
  else if (gymTab === 'body') renderBody(body, refresh);
  else if (gymTab === 'progress') renderProgress(body, refresh);
}

/* ============================ TODAY ============================ */
function renderToday(c, refresh) {
  const d = loadData();
  const day = todaySplitDay(d);
  if (!day) {
    c.appendChild(el('div.empty', {}, [
      el('p', { text: 'No training split set up yet.' }),
      el('button.btn.primary', { type: 'button', onclick: () => { gymTab = 'plan'; render(document.getElementById('main')); } }, ['Set up your split']),
    ]));
    return;
  }

  let workout = generateWorkoutFromSplit(day, d);
  const r = readinessToday(d);
  const adj = adjustWorkoutForRecovery(workout, r.score);
  workout = adj.workout;

  // header card
  const head = el('div.card.card-glow', {}, [
    el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: weekdayName() + ' · ' + (day.location || 'Gym') }),
        el('h2', { text: workout.kind === 'training' ? workout.label + ' Day' : (workout.kind === 'active' ? 'Active Recovery' : 'Rest Day'), style: { fontSize: '22px', marginTop: '3px' } }),
        workout.kind === 'training' ? el('p.tiny.muted', { text: `${workout.plannedExercises.length} exercises · ~${day.durationMin} min · ${(day.focusMuscles || []).join(', ')}` }) : null,
      ].filter(Boolean)),
      r.score != null ? el('div.center', {}, [
        el('div.label-cap', { text: 'Readiness' }),
        el('div.kpi', { text: r.score }),
        el('div.readiness-call', { class: 'call-' + (r.call || '').toLowerCase(), text: r.call || '' }),
      ]) : null,
    ].filter(Boolean)),
  ]);
  if (adj.message) head.appendChild(el('p.tiny', { class: r.call === 'Recover' ? 'text-pink' : 'muted', style: { marginTop: '10px' }, text: '◈ ' + adj.message }));
  c.appendChild(head);

  if (workout.kind !== 'training') {
    c.appendChild(el('div.card', { style: { marginTop: '13px' } }, [
      el('p.muted', { text: workout.kind === 'active' ? 'Active recovery — walk, mobility, light cardio. Log nothing or add a quick session below.' : 'Rest and recover. Hydrate, sleep, eat. Nothing to log today.' }),
    ]));
    if (workout.kind === 'active') {
      c.appendChild(el('button.btn.block.ghost', { type: 'button', style: { marginTop: '12px' }, onclick: () => startEmptySession(refresh) }, ['+ Log an ad-hoc session']));
    }
    return;
  }

  // start button
  c.appendChild(el('button.btn.primary.block', { type: 'button', style: { margin: '13px 0' },
    onclick: () => startSession(workout, refresh) }, ['▶  Start workout & log sets']));

  // exercise preview cards
  const grid = el('div.grid.grid-2', { style: { marginTop: '4px' } });
  workout.plannedExercises.forEach(p => grid.appendChild(exercisePreviewCard(p)));
  c.appendChild(grid);
}

function exercisePreviewCard(p) {
  const media = el('div.ex-media');
  if (p.imageUrl) media.appendChild(el('img', { src: p.imageUrl, alt: p.name, loading: 'lazy', onerror: function () { this.remove(); media.appendChild(el('span.ex-ph', { text: p.muscleGroup })); } }));
  else media.appendChild(el('span.ex-ph', { text: p.muscleGroup }));

  const flag = el('span.prog-flag', { class: 'prog-' + p.progStatus, text: p.progLabel });
  return el('div.ex-card', {}, [
    media,
    el('div.ex-body', {}, [
      el('div.row.between', {}, [el('div.ex-name', { text: p.name }), flag]),
      el('div.ex-sub', { text: `${p.sets} sets · ${p.repLow}-${p.repHigh} reps · ${p.restSec}s rest` }),
      el('div.ex-targets', {}, [
        el('div', {}, [el('div.t-label', { text: 'Last' }), el('div.t-val', { style: { fontSize: '13px' }, text: p.lastPerformance })]),
        el('div', {}, [el('div.t-label', { text: 'Target' }), el('div.t-val', { class: 'text-mint', text: (p.targetWeight != null ? p.targetWeight + ' lb' : '—') + ' × ' + p.targetReps })]),
      ]),
      el('p.tiny.muted', { style: { marginTop: '9px' }, text: '“' + p.cues + '”' }),
    ]),
  ]);
}

/* ============================ LIVE SESSION ============================ */
function startSession(workout, refresh) {
  activeSession = {
    date: todayKey(),
    dayLabel: workout.label,
    notes: '',
    exercises: workout.plannedExercises.map(p => ({
      exerciseId: p.exerciseId, name: p.name, cues: p.cues, restSec: p.restSec,
      repLow: p.repLow, repHigh: p.repHigh, targetWeight: p.targetWeight, targetReps: p.targetReps,
      progNote: p.progNote, notes: '',
      sets: Array.from({ length: p.sets }, () => ({ weight: p.targetWeight ?? '', reps: '', done: false })),
    })),
  };
  refresh();
}

function startEmptySession(refresh) {
  activeSession = { date: todayKey(), dayLabel: 'Ad-hoc', notes: '', exercises: [] };
  refresh();
}

function renderSession(c, refresh) {
  const s = activeSession;
  c.appendChild(el('div.card.card-glow', {}, [
    el('div.row.between', {}, [
      el('div', {}, [el('div.label-cap.text-pink', { text: 'Live workout' }), el('h2', { text: s.dayLabel + ' · ' + fmtShort(s.date), style: { fontSize: '20px' } })]),
      el('button.btn.sm.ghost', { type: 'button', onclick: async () => { if (await confirmDialog('Discard this in-progress workout? Nothing will be saved.', { confirmLabel: 'Discard', kind: 'danger' })) { activeSession = null; refresh(); } } }, ['Discard']),
    ]),
  ]));

  s.exercises.forEach((ex, ei) => c.appendChild(sessionExerciseCard(ex, ei, refresh)));

  c.appendChild(el('button.btn.block.ghost', { type: 'button', style: { marginTop: '12px' }, onclick: () => addExerciseToSession(refresh) }, ['+ Add exercise']));

  const noteTa = el('textarea', { rows: 2, placeholder: 'Session notes (energy, pumps, niggles)…' });
  noteTa.value = s.notes;
  noteTa.addEventListener('input', () => { s.notes = noteTa.value; });
  c.appendChild(el('div.card', { style: { marginTop: '12px' } }, [el('label.field', {}, [el('span.field-label', { text: 'Session notes' }), noteTa])]));

  c.appendChild(el('button.btn.mint.block', { type: 'button', style: { margin: '14px 0 4px' }, onclick: () => completeSession(refresh) }, ['✓  Complete & save to history']));
}

function sessionExerciseCard(ex, ei, refresh) {
  const card = el('div.card', { style: { marginTop: '12px' } });
  card.appendChild(el('div.row.between', {}, [
    el('div', {}, [
      el('div.ex-name', { text: ex.name }),
      ex.targetReps ? el('div.tiny.text-mint', { text: 'Target: ' + (ex.targetWeight != null ? ex.targetWeight + ' lb' : '—') + ' × ' + ex.targetReps + (ex.progNote ? ' · ' + ex.progNote : '') }) : null,
    ].filter(Boolean)),
    el('div.actions', {}, [
      ex.exerciseId ? el('button.icon-btn', { type: 'button', title: 'Swap exercise', onclick: () => swapSessionExercise(ei, refresh) }, ['⇄']) : null,
      el('button.icon-btn.danger', { type: 'button', title: 'Remove', onclick: () => { activeSession.exercises.splice(ei, 1); refresh(); } }, ['🗑']),
    ].filter(Boolean)),
  ]));

  const head = el('div.set-row', { style: { marginTop: '8px' } }, [
    el('div.set-n.label-cap', { text: '#' }), el('div.label-cap', { text: 'Weight' }), el('div.label-cap', { text: 'Reps' }), el('div.label-cap', { text: '✓' }),
  ]);
  card.appendChild(head);

  ex.sets.forEach((set, si) => {
    const wInput = el('input', { type: 'number', inputmode: 'decimal', value: set.weight, placeholder: '0', 'aria-label': 'weight' });
    wInput.addEventListener('input', () => { set.weight = wInput.value === '' ? '' : Number(wInput.value); });
    const rInput = el('input', { type: 'number', inputmode: 'numeric', value: set.reps, placeholder: String(ex.targetReps || ''), 'aria-label': 'reps' });
    rInput.addEventListener('input', () => { set.reps = rInput.value === '' ? '' : Number(rInput.value); });
    const chk = el('input.check', { type: 'checkbox', checked: set.done, 'aria-label': 'set done' });
    chk.addEventListener('change', () => {
      set.done = chk.checked;
      if (set.done && set.reps === '') { set.reps = ex.targetReps || 0; rInput.value = set.reps; }
    });
    card.appendChild(el('div.set-row', {}, [el('div.set-n', { text: si + 1 }), wInput, rInput, chk]));
  });

  card.appendChild(el('div.row', { style: { marginTop: '4px', gap: '8px' } }, [
    el('button.btn.sm.ghost', { type: 'button', onclick: () => { ex.sets.push({ weight: ex.sets.at(-1)?.weight ?? '', reps: '', done: false }); refresh(); } }, ['+ set']),
    ex.sets.length > 1 ? el('button.btn.sm.ghost', { type: 'button', onclick: () => { ex.sets.pop(); refresh(); } }, ['− set']) : null,
    ex.cues ? el('span.tiny.muted', { style: { marginLeft: '4px' }, text: '“' + ex.cues + '”' }) : null,
  ].filter(Boolean)));
  return card;
}

function swapSessionExercise(ei, refresh) {
  const d = loadData();
  const ex = d.exercises.find(e => e.id === activeSession.exercises[ei].exerciseId);
  if (!ex) return;
  const alts = recommendExerciseSwaps(ex, d);
  if (!alts.length) { toast('No alternatives in library', 'warn'); return; }
  const list = el('div.list');
  alts.forEach(a => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: a.name }), el('div.meta', {}, [el('span.chip', { text: a.muscleGroup }), el('span.chip.muted', { text: a.equipment })])]),
    el('button.btn.sm.primary', { type: 'button', onclick: () => {
      const hist = getExerciseHistory(d, a.id);
      const prog = suggestProgression(a, hist);
      const old = activeSession.exercises[ei];
      activeSession.exercises[ei] = {
        exerciseId: a.id, name: a.name, cues: a.cues, restSec: a.restSec,
        repLow: a.repLow, repHigh: a.repHigh, targetWeight: prog.targetWeight, targetReps: prog.targetReps,
        progNote: prog.note, notes: '',
        sets: Array.from({ length: a.defaultSets }, () => ({ weight: prog.targetWeight ?? '', reps: '', done: false })),
      };
      closeTopModal(); refresh();
    } }, ['Swap']),
  ])));
  openModal({ title: 'Swap exercise', body: list, actions: [{ label: 'Cancel', kind: 'ghost', onClick: () => true }] });
}

function addExerciseToSession(refresh) {
  const d = loadData();
  const list = el('div.list', { style: { maxHeight: '50vh', overflow: 'auto' } });
  [...d.exercises].sort((a, b) => a.name.localeCompare(b.name)).forEach(a => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: a.name }), el('div.meta', {}, [el('span.chip', { text: a.muscleGroup })])]),
    el('button.btn.sm.primary', { type: 'button', onclick: () => {
      const hist = getExerciseHistory(d, a.id);
      const prog = suggestProgression(a, hist);
      activeSession.exercises.push({
        exerciseId: a.id, name: a.name, cues: a.cues, restSec: a.restSec,
        repLow: a.repLow, repHigh: a.repHigh, targetWeight: prog.targetWeight, targetReps: prog.targetReps,
        progNote: prog.note, notes: '',
        sets: Array.from({ length: a.defaultSets }, () => ({ weight: prog.targetWeight ?? '', reps: '', done: false })),
      });
      closeTopModal(); refresh();
    } }, ['Add']),
  ])));
  openModal({ title: 'Add exercise', body: list, actions: [{ label: 'Done', kind: 'ghost', onClick: () => true }] });
}

function completeSession(refresh) {
  const s = activeSession;
  const loggedExercises = s.exercises
    .map(ex => ({ exerciseId: ex.exerciseId, name: ex.name, notes: ex.notes || '',
      sets: ex.sets.filter(st => st.done || (st.weight !== '' && st.reps !== '')).map(st => ({ weight: Number(st.weight) || 0, reps: Number(st.reps) || 0, done: st.done })) }))
    .filter(ex => ex.sets.length);

  if (!loggedExercises.length) { toast('Log at least one set first', 'warn'); return; }

  const session = { id: uid('sess'), date: todayKey(), dayLabel: s.dayLabel, completed: true, notes: s.notes || '', exercises: loggedExercises };

  mutate(d => {
    d.workoutSessions.push(session);
    // PRs: best e1rm per exercise
    loggedExercises.forEach(ex => {
      ex.sets.forEach(st => {
        if (!st.done || !st.weight || !st.reps) return;
        const est = e1rm(st.weight, st.reps);
        const existing = d.personalRecords.find(p => p.exerciseId === ex.exerciseId);
        if (!existing) {
          d.personalRecords.push({ id: uid('pr'), exerciseId: ex.exerciseId, weight: st.weight, reps: st.reps, date: todayKey(), e1rm: est });
        } else if (est > (existing.e1rm || 0)) {
          existing.weight = st.weight; existing.reps = st.reps; existing.date = todayKey(); existing.e1rm = est;
        }
      });
    });
  });

  activeSession = null;
  toast('Workout saved — progression updated', 'ok');
  gymTab = 'progress';
  refresh();
}

/* ============================ PLAN & SPLIT ============================ */
function renderPlan(c, refresh) {
  const d = loadData();
  const split = (d.splits || []).find(s => s.id === d.activeSplitId) || (d.splits || [])[0];

  // split selector + actions
  c.appendChild(el('div.card', {}, [
    el('div.row.between', {}, [
      el('div', {}, [el('div.label-cap', { text: 'Active split' }), el('h2', { text: split ? split.name : 'No split', style: { fontSize: '18px' } }), split ? el('span.chip.pink', { text: split.type }) : null].filter(Boolean)),
      el('button.icon-btn', { type: 'button', title: 'Edit split name/type', onclick: () => split && editSplitMeta(split, refresh) }, ['✎']),
    ]),
    el('div.row.wrap', { style: { marginTop: '12px', gap: '8px' } }, [
      el('button.btn.sm.primary', { type: 'button', onclick: () => generateWeek(refresh) }, ['⚡ Generate week']),
      el('button.btn.sm.ghost', { type: 'button', onclick: () => newSplit(refresh) }, ['+ New split']),
      (d.splits || []).length > 1 ? el('button.btn.sm.ghost', { type: 'button', onclick: () => switchSplit(refresh) }, ['Switch split']) : null,
    ].filter(Boolean)),
  ]));

  if (!split) return;

  // 7-day split editor
  c.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Weekly split' })]));
  WEEKDAYS.forEach((wd, idx) => {
    const day = split.days.find(x => x.weekday === wd) || { weekday: wd, kind: 'rest', label: 'Rest', exerciseIds: [] };
    const isToday = wd === weekdayName();
    const card = el('div.card.tight', { style: { marginBottom: '10px', borderColor: isToday ? 'var(--pink)' : '' } });
    card.appendChild(el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: wd + (isToday ? ' · today' : '') }),
        el('div.row', { style: { gap: '8px', marginTop: '2px' } }, [
          el('div.title', { text: day.label || day.kind }),
          el('span.chip', { class: day.kind === 'training' ? 'mint' : 'muted', text: day.kind }),
        ]),
        day.kind === 'training' ? el('div.tiny.muted', { style: { marginTop: '4px' }, text: `${(day.exerciseIds || []).length} exercises · ${day.location || '—'} · ${day.durationMin || 0}min` }) : null,
      ].filter(Boolean)),
      el('button.btn.sm.ghost', { type: 'button', onclick: () => editSplitDay(split, day, refresh) }, ['Edit']),
    ]));
    c.appendChild(card);
  });

  // generated week preview
  if (d.plannedWeek && d.plannedWeek.weekStart) {
    c.appendChild(el('div.section-head', {}, [el('h2.section-title.accent', { text: 'Generated week' }), el('span.tiny.faint', { text: 'week of ' + fmtShort(d.plannedWeek.weekStart) })]));
    d.plannedWeek.days.forEach(pd => {
      if (pd.kind !== 'training') return;
      const wrap = el('div.card.tight', { style: { marginBottom: '10px' } });
      wrap.appendChild(el('div.row.between', {}, [
        el('div.title', { text: pd.weekday + ' · ' + pd.label }),
        el('button.btn.sm.ghost', { type: 'button', onclick: () => regenerateDay(pd.weekday, refresh) }, ['↻ Regen']),
      ]));
      const ul = el('div', { style: { marginTop: '6px' } });
      pd.plannedExercises.forEach(pe => ul.appendChild(el('div.row.between', { style: { padding: '3px 0' } }, [
        el('span.small', { text: pe.name }),
        el('span.tiny.text-mint', { text: (pe.targetWeight != null ? pe.targetWeight + 'lb' : '—') + ' × ' + pe.targetReps + ' · ' + pe.sets + ' sets' }),
      ])));
      wrap.appendChild(ul);
      c.appendChild(wrap);
    });
  }
}

function generateWeek(refresh) {
  mutate(d => {
    const split = (d.splits || []).find(s => s.id === d.activeSplitId) || d.splits[0];
    if (!split) return;
    const monday = mondayKey();
    d.plannedWeek = {
      weekStart: monday,
      days: split.days.map(day => {
        const w = generateWorkoutFromSplit(day, d);
        return { weekday: day.weekday, kind: w.kind, label: w.label, location: day.location, durationMin: day.durationMin, plannedExercises: w.plannedExercises || [] };
      }),
    };
  });
  toast('Week generated from your split', 'ok');
  refresh();
}
function mondayKey() {
  // local Monday key
  const x = new Date();
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return todayKey(x);
}
function regenerateDay(weekday, refresh) {
  mutate(d => {
    const split = (d.splits || []).find(s => s.id === d.activeSplitId) || d.splits[0];
    const day = split.days.find(x => x.weekday === weekday);
    if (!day || !d.plannedWeek) return;
    const w = generateWorkoutFromSplit(day, d);
    const slot = d.plannedWeek.days.find(x => x.weekday === weekday);
    if (slot) { slot.plannedExercises = w.plannedExercises || []; slot.label = w.label; slot.kind = w.kind; }
  });
  refresh();
}

function editSplitMeta(split, refresh) {
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Split name', value: split.name, required: true },
    { name: 'type', label: 'Type', type: 'select', value: split.type, options: ['PPL', 'Upper/Lower', 'Full Body', 'Bro Split', 'Custom'] },
  ]);
  openModal({ title: 'Edit split', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => { if (!validate()) return false; const v = values(); mutate(d => { const s = d.splits.find(x => x.id === split.id); s.name = v.name; s.type = v.type; }); refresh(); } },
  ] });
}

function newSplit(refresh) {
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Split name', value: '', required: true, placeholder: 'e.g. Upper/Lower 4-day' },
    { name: 'type', label: 'Type', type: 'select', value: 'Custom', options: ['PPL', 'Upper/Lower', 'Full Body', 'Bro Split', 'Custom'] },
  ]);
  openModal({ title: 'New split', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Create', kind: 'primary', onClick: () => {
      if (!validate()) return false; const v = values();
      const id = uid('split');
      mutate(d => {
        d.splits.push({ id, name: v.name, type: v.type, days: WEEKDAYS.map(wd => ({ weekday: wd, kind: 'rest', label: 'Rest', location: '', durationMin: 0, focusMuscles: [], exerciseIds: [] })) });
        d.activeSplitId = id;
      });
      toast('Split created — now set up each day', 'ok'); refresh();
    } },
  ] });
}

function switchSplit(refresh) {
  const d = loadData();
  const list = el('div.list');
  d.splits.forEach(s => list.appendChild(el('div.item', {}, [
    el('div.grow', {}, [el('div.title', { text: s.name }), el('div.meta', {}, [el('span.chip', { text: s.type })])]),
    el('button.btn.sm', { class: s.id === d.activeSplitId ? 'mint' : 'primary', type: 'button', onclick: () => { mutate(x => { x.activeSplitId = s.id; }); closeTopModal(); refresh(); } }, [s.id === d.activeSplitId ? 'Active' : 'Use']),
  ])));
  openModal({ title: 'Switch split', body: list, actions: [{ label: 'Close', kind: 'ghost', onClick: () => true }] });
}

function editSplitDay(split, day, refresh) {
  const d = loadData();
  const kindSel = buildForm([
    { name: 'kind', label: 'Day type', type: 'select', value: day.kind, options: [{ value: 'training', label: 'Training' }, { value: 'active', label: 'Active recovery' }, { value: 'rest', label: 'Rest' }] },
    { name: 'label', label: 'Label', value: day.label || '', placeholder: 'Push / Pull / Legs / Upper…' },
    { name: 'location', label: 'Location', value: day.location || '', placeholder: 'IM Rec' },
    { name: 'durationMin', label: 'Duration (min)', type: 'number', value: day.durationMin || 60 },
    { name: 'focusMuscles', label: 'Focus muscles (comma-separated)', value: (day.focusMuscles || []).join(', ') },
  ]);

  // exercise picker
  const picked = new Set(day.exerciseIds || []);
  const picker = el('div', { style: { marginTop: '6px' } });
  picker.appendChild(el('div.field-label', { text: 'Exercises (tap to toggle)' }));
  const chips = el('div.row.wrap', { style: { gap: '6px', marginTop: '6px' } });
  [...d.exercises].sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup) || a.name.localeCompare(b.name)).forEach(ex => {
    const chip = el('button.chip', { type: 'button', class: picked.has(ex.id) ? 'pink' : '', text: ex.name });
    chip.addEventListener('click', () => { if (picked.has(ex.id)) { picked.delete(ex.id); chip.className = 'chip'; } else { picked.add(ex.id); chip.className = 'chip pink'; } });
    chips.appendChild(chip);
  });
  picker.appendChild(chips);

  const body = el('div', {}, [kindSel.form, picker]);
  openModal({ title: day.weekday, wide: true, body, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save day', kind: 'primary', onClick: () => {
      const v = kindSel.values();
      mutate(x => {
        const s = x.splits.find(z => z.id === split.id);
        let dd = s.days.find(z => z.weekday === day.weekday);
        if (!dd) { dd = { weekday: day.weekday }; s.days.push(dd); }
        dd.kind = v.kind; dd.label = v.label || (v.kind === 'rest' ? 'Rest' : v.kind === 'active' ? 'Active Recovery' : 'Training');
        dd.location = v.location; dd.durationMin = Number(v.durationMin) || 0;
        dd.focusMuscles = v.focusMuscles ? v.focusMuscles.split(',').map(s => s.trim()).filter(Boolean) : [];
        dd.exerciseIds = v.kind === 'training' ? [...picked] : [];
      });
      toast('Day updated', 'ok'); refresh();
    } },
  ] });
}

/* ============================ LIBRARY ============================ */
function renderLibrary(c, refresh) {
  const d = loadData();
  c.appendChild(el('div.row.between', { style: { marginBottom: '12px' } }, [
    el('p.muted.small', { text: `${d.exercises.length} exercises` }),
    el('button.btn.sm.primary', { type: 'button', onclick: () => editExercise(null, refresh) }, ['+ Add exercise']),
  ]));

  const groups = {};
  d.exercises.forEach(ex => { (groups[ex.muscleGroup] = groups[ex.muscleGroup] || []).push(ex); });
  Object.keys(groups).sort().forEach(mg => {
    c.appendChild(el('div.section-head', {}, [el('h2.section-title.accent', { text: mg })]));
    const list = el('div.card.list');
    groups[mg].forEach(ex => list.appendChild(el('div.item', {}, [
      el('div.grow', {}, [
        el('div.title', { text: ex.name }),
        el('div.meta', {}, [el('span.chip', { text: ex.equipment }), el('span', { text: `${ex.defaultSets}×${ex.repLow}-${ex.repHigh}` }), el('span', { text: `+${ex.increment}lb` }), ex._sample ? el('span.sample-badge', { text: 'sample' }) : null].filter(Boolean)),
      ]),
      el('div.actions', {}, [
        el('button.icon-btn', { type: 'button', title: 'Edit', onclick: () => editExercise(ex, refresh) }, ['✎']),
        el('button.icon-btn.danger', { type: 'button', title: 'Delete', onclick: async () => { if (await confirmDialog(`Delete ${ex.name}?`)) { deleteItem('exercises', ex.id); refresh(); } } }, ['🗑']),
      ]),
    ])));
    c.appendChild(list);
  });
}

function editExercise(ex, refresh) {
  const isNew = !ex;
  const { form, values, validate } = buildForm([
    { name: 'name', label: 'Name', value: ex?.name || '', required: true },
    { name: 'muscleGroup', label: 'Muscle group', type: 'select', value: ex?.muscleGroup || 'Chest', options: MUSCLE_GROUPS },
    { name: 'pattern', label: 'Movement pattern', type: 'select', value: ex?.pattern || 'Isolation', options: PATTERNS },
    { name: 'equipment', label: 'Equipment', type: 'select', value: ex?.equipment || 'Barbell', options: EQUIPMENT },
    { name: 'defaultSets', label: 'Default sets', type: 'number', value: ex?.defaultSets ?? 3, min: 1, max: 10 },
    { name: 'repLow', label: 'Rep range low', type: 'number', value: ex?.repLow ?? 8, min: 1 },
    { name: 'repHigh', label: 'Rep range high', type: 'number', value: ex?.repHigh ?? 12, min: 1 },
    { name: 'increment', label: 'Weight increment (lb)', type: 'number', value: ex?.increment ?? 5, min: 0, step: 0.5 },
    { name: 'restSec', label: 'Rest (sec)', type: 'number', value: ex?.restSec ?? 90, min: 0 },
    { name: 'cues', label: 'Form cues', type: 'textarea', value: ex?.cues || '' },
    { name: 'imageUrl', label: 'Image URL (optional)', value: ex?.imageUrl || '', hint: 'Leave blank for a styled placeholder.' },
  ]);
  openModal({ title: isNew ? 'New exercise' : ex.name, wide: true, body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: isNew ? 'Add' : 'Save', kind: 'primary', onClick: () => {
      if (!validate()) return false; const v = values();
      updateItem('exercises', { id: ex?.id || uid('ex'), replacements: ex?.replacements || [], ...v });
      toast('Saved', 'ok'); refresh();
    } },
  ] });
}

/* ============================ BODY & PHOTOS ============================ */
function renderBody(c, refresh) {
  const d = loadData();
  const entries = [...d.bodyWeightEntries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const last7 = entries.slice(-7);
  const latest = entries.at(-1);
  const goalLo = d.profile?.bodyWeightGoalLow, goalHi = d.profile?.bodyWeightGoalHigh;

  // bodyweight card
  const bw = el('div.card', {}, [
    el('div.row.between', {}, [
      el('div', {}, [
        el('div.label-cap', { text: 'Body weight' }),
        el('div.big-num', { text: latest ? latest.weight + ' lb' : '—' }),
        el('div.tiny.muted', { text: `Goal range ${goalLo}–${goalHi} lb` }),
      ]),
      el('button.btn.sm.primary', { type: 'button', onclick: () => logBodyWeight(latest, refresh) }, ['Log today']),
    ]),
  ]);
  if (last7.length >= 2) {
    const delta = +(last7.at(-1).weight - last7[0].weight).toFixed(1);
    bw.appendChild(el('div', { style: { marginTop: '12px' } }, [
      sparkline(last7.map(e => e.weight)),
      el('div.row.between', { style: { marginTop: '6px' } }, [
        el('span.tiny.faint', { text: fmtShort(last7[0].date) + ' → ' + fmtShort(last7.at(-1).date) }),
        el('span.tiny', { class: delta > 0 ? 'text-mint' : (delta < 0 ? 'text-amber' : 'muted'), text: (delta > 0 ? '+' : '') + delta + ' lb / 7d' }),
      ]),
    ]));
  }
  c.appendChild(bw);

  // recent entries
  if (entries.length) {
    c.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Recent entries' })]));
    const list = el('div.card.list');
    [...entries].reverse().slice(0, 8).forEach(e => list.appendChild(el('div.item', {}, [
      el('div.grow', {}, [el('div.title', { text: e.weight + ' lb' }), el('div.meta', {}, [el('span', { text: fmtShort(e.date) }), e.notes ? el('span', { text: e.notes }) : null].filter(Boolean))]),
      el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete this entry?')) { deleteItem('bodyWeightEntries', e.id); refresh(); } } }, ['🗑']),
    ])));
    c.appendChild(list);
  }

  // progress photos
  c.appendChild(el('div.section-head', {}, [el('h2.section-title.accent', { text: 'Progress photos' }), el('span.tiny.faint', { text: 'compressed thumbnails' })]));
  const info = storageInfo();
  if (info.near) c.appendChild(el('p.tiny.text-amber', { style: { marginBottom: '8px' }, text: '⚠ Storage ' + info.percent + '% full — delete older photos before adding more.' }));

  const addBtn = el('button.btn.block.ghost', { type: 'button', style: { marginBottom: '12px' } }, ['+ Add progress photo']);
  const fileInput = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    try {
      const thumb = await compressImage(f, { maxEdge: 400, quality: 0.6 });
      addPhotoMeta(thumb, latest?.weight, refresh);
    } catch (e) { toast('Could not process image', 'error'); }
    fileInput.value = '';
  });
  c.appendChild(addBtn); c.appendChild(fileInput);

  const photos = [...d.progressPhotos].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!photos.length) {
    c.appendChild(el('div.empty', {}, [el('p', { text: 'No photos yet. Photos are downscaled to ~400px to protect storage.' })]));
  } else {
    const grid = el('div.grid.grid-2');
    photos.forEach(p => {
      grid.appendChild(el('div.ex-card', {}, [
        el('div.ex-media', { style: { height: '160px' } }, [el('img', { src: p.thumb, alt: 'progress ' + p.date, loading: 'lazy' })]),
        el('div.ex-body', {}, [
          el('div.row.between', {}, [el('div.title', { text: fmtShort(p.date) }), p.weight ? el('span.chip.mint', { text: p.weight + ' lb' }) : null].filter(Boolean)),
          p.notes ? el('p.tiny.muted', { style: { marginTop: '4px' }, text: p.notes }) : null,
          el('button.btn.sm.danger', { type: 'button', style: { marginTop: '8px' }, onclick: async () => { if (await confirmDialog('Delete this photo?')) { deleteItem('progressPhotos', p.id); refresh(); } } }, ['Delete']),
        ].filter(Boolean)),
      ]));
    });
    c.appendChild(grid);
  }
}

function logBodyWeight(latest, refresh) {
  const t = todayKey();
  const existing = loadData().bodyWeightEntries.find(e => e.date === t);
  const { form, values, validate } = buildForm([
    { name: 'weight', label: 'Weight (lb)', type: 'number', value: existing?.weight ?? latest?.weight ?? '', required: true, step: 0.1 },
    { name: 'notes', label: 'Notes', value: existing?.notes || '', placeholder: 'fasted / post-workout…' },
  ]);
  openModal({ title: 'Log body weight', body: form, actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save', kind: 'primary', onClick: () => {
      if (!validate()) return false; const v = values();
      updateItem('bodyWeightEntries', { id: existing?.id || ('bw_' + t), date: t, weight: v.weight, notes: v.notes });
      toast('Weight logged', 'ok'); refresh();
    } },
  ] });
}

function addPhotoMeta(thumb, suggestWeight, refresh) {
  const { form, values } = buildForm([
    { name: 'weight', label: 'Weight (lb)', type: 'number', value: suggestWeight ?? '', step: 0.1 },
    { name: 'notes', label: 'Notes', value: '', placeholder: 'front / relaxed / lighting…' },
  ]);
  const preview = el('img', { src: thumb, alt: 'preview', style: { width: '120px', borderRadius: '12px', marginBottom: '12px' } });
  openModal({ title: 'New progress photo', body: el('div', {}, [preview, form]), actions: [
    { label: 'Cancel', kind: 'ghost', onClick: () => true },
    { label: 'Save photo', kind: 'primary', onClick: () => {
      const v = values();
      const res = updateItem('progressPhotos', { id: uid('photo'), date: todayKey(), weight: v.weight, notes: v.notes, thumb });
      if (!res.ok) toast('Storage full — could not save. Delete old photos.', 'error');
      else toast('Photo saved', 'ok');
      refresh();
    } },
  ] });
}

/* ============================ PROGRESS ============================ */
function renderProgress(c, refresh) {
  const d = loadData();
  const sum = summarizeWeeklyTraining(d);

  const kpis = el('div.grid.grid-3');
  kpis.appendChild(kpiTile('Sessions / 7d', String(sum.sessions), null, 'pink'));
  kpis.appendChild(kpiTile('Volume / 7d', (sum.volume / 1000).toFixed(1) + 'k', 'lb lifted', 'mint'));
  kpis.appendChild(kpiTile('Working sets', String(sum.setCount), null, 'amber'));
  c.appendChild(kpis);

  // ready to increase
  c.appendChild(el('div.section-head', {}, [el('h2.section-title.accent', { text: 'Ready to add weight' })]));
  if (!sum.ready.length) c.appendChild(el('p.muted.small', { text: 'Log a couple sessions and the coach will flag lifts ready to progress.' }));
  else {
    const list = el('div.card.list');
    sum.ready.forEach(r => list.appendChild(el('div.item', {}, [el('span.prog-flag.prog-increase', { text: '↑' }), el('div.grow', {}, [el('div.title', { text: r.name }), el('div.meta', {}, [el('span', { text: r.note })])])])));
    c.appendChild(list);
  }

  // stalled
  if (sum.stalled.length) {
    c.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Stalled lifts', style: { color: 'var(--danger)' } })]));
    const list = el('div.card.list');
    sum.stalled.forEach(r => list.appendChild(el('div.item', {}, [el('span.prog-flag.prog-stalled', { text: '!' }), el('div.grow', {}, [el('div.title', { text: r.name }), el('div.meta', {}, [el('span', { text: r.note })])])])));
    c.appendChild(list);
  }

  // PRs
  c.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Personal records' })]));
  const prs = [...d.personalRecords].sort((a, b) => (b.e1rm || 0) - (a.e1rm || 0));
  if (!prs.length) c.appendChild(el('p.muted.small', { text: 'No PRs logged yet.' }));
  else {
    const exMap = Object.fromEntries(d.exercises.map(e => [e.id, e]));
    const list = el('div.card.list');
    prs.forEach(p => list.appendChild(el('div.item', {}, [
      el('div.grow', {}, [el('div.title', { text: exMap[p.exerciseId]?.name || p.exerciseId }), el('div.meta', {}, [el('span', { text: p.weight + ' lb × ' + p.reps }), el('span', { text: fmtShort(p.date) })])]),
      el('div.center', {}, [el('div.kpi.text-mint', { text: p.e1rm }), el('div.tiny.faint', { text: 'est 1RM' })]),
    ])));
    c.appendChild(list);
  }

  // recent sessions
  c.appendChild(el('div.section-head', {}, [el('h2.section-title', { text: 'Recent sessions' })]));
  const sessions = [...d.workoutSessions].filter(s => s.completed).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  if (!sessions.length) c.appendChild(el('p.muted.small', { text: 'No sessions logged yet.' }));
  else sessions.forEach(s => {
    const totalSets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    c.appendChild(el('div.card.tight', { style: { marginBottom: '8px' } }, [
      el('div.row.between', {}, [
        el('div', {}, [el('div.title', { text: s.dayLabel + ' · ' + fmtShort(s.date) }), el('div.tiny.muted', { text: `${s.exercises.length} exercises · ${totalSets} sets` })]),
        el('button.icon-btn.danger', { type: 'button', onclick: async () => { if (await confirmDialog('Delete this session?')) { deleteItem('workoutSessions', s.id); refresh(); } } }, ['🗑']),
      ]),
    ]));
  });

  c.appendChild(el('div', { style: { marginTop: '16px' } }, [storageMeter()]));
}

/* ---- util ---- */
function closeTopModal() {
  const overlays = document.querySelectorAll('.modal-overlay');
  const top = overlays[overlays.length - 1];
  if (top) { top.classList.remove('show'); setTimeout(() => top.remove(), 180); }
}
