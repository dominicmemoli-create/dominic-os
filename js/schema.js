// schema.js — data version, default shape, and first-load demo seed.
// Everything the app stores lives under ONE localStorage key (see store.js).
// All sample records carry _sample:true so reset/import logic can reason about them.

import { todayKey, addDays, lastNDays } from './dates.js';

export const DATA_VERSION = 1;

const T = todayKey();
const yesterday = todayKey(addDays(new Date(), -1));
const twoAgo = todayKey(addDays(new Date(), -2));

// ---- Exercise library (sample) -------------------------------------------
const EX = {
  // id, name, muscleGroup, pattern, equipment, sets, reps, increment(lbs), rest, cues, replacements, imageUrl
  benchPress: {
    id: 'benchPress', name: 'Barbell Bench Press', muscleGroup: 'Chest', pattern: 'Horizontal Push',
    equipment: 'Barbell', defaultSets: 4, repLow: 6, repHigh: 9, increment: 5, restSec: 150,
    cues: 'Retract shoulder blades, bar to lower chest, drive feet.', replacements: ['dbBench', 'inclinePress'], imageUrl: ''
  },
  inclinePress: {
    id: 'inclinePress', name: 'Incline DB Press', muscleGroup: 'Chest', pattern: 'Incline Push',
    equipment: 'Dumbbell', defaultSets: 3, repLow: 8, repHigh: 12, increment: 5, restSec: 120,
    cues: '30-45° bench, control the stretch, no bouncing.', replacements: ['benchPress', 'dbBench'], imageUrl: ''
  },
  dbBench: {
    id: 'dbBench', name: 'Flat DB Press', muscleGroup: 'Chest', pattern: 'Horizontal Push',
    equipment: 'Dumbbell', defaultSets: 3, repLow: 8, repHigh: 12, increment: 5, restSec: 120,
    cues: 'Neutral wrists, deep stretch, squeeze at top.', replacements: ['benchPress', 'inclinePress'], imageUrl: ''
  },
  ohp: {
    id: 'ohp', name: 'Overhead Press', muscleGroup: 'Shoulders', pattern: 'Vertical Push',
    equipment: 'Barbell', defaultSets: 3, repLow: 6, repHigh: 10, increment: 5, restSec: 150,
    cues: 'Brace core, bar over mid-foot, full lockout.', replacements: ['dbShoulderPress'], imageUrl: ''
  },
  dbShoulderPress: {
    id: 'dbShoulderPress', name: 'Seated DB Shoulder Press', muscleGroup: 'Shoulders', pattern: 'Vertical Push',
    equipment: 'Dumbbell', defaultSets: 3, repLow: 8, repHigh: 12, increment: 5, restSec: 120,
    cues: 'Slight back support, press in a slight arc.', replacements: ['ohp'], imageUrl: ''
  },
  lateralRaise: {
    id: 'lateralRaise', name: 'Lateral Raise', muscleGroup: 'Shoulders', pattern: 'Isolation',
    equipment: 'Dumbbell', defaultSets: 3, repLow: 12, repHigh: 18, increment: 5, restSec: 75,
    cues: 'Lead with elbows, no swing, pause at top.', replacements: [], imageUrl: ''
  },
  tricepPushdown: {
    id: 'tricepPushdown', name: 'Triceps Pushdown', muscleGroup: 'Triceps', pattern: 'Isolation',
    equipment: 'Cable', defaultSets: 3, repLow: 10, repHigh: 15, increment: 5, restSec: 75,
    cues: 'Elbows pinned, full lockout, slow negative.', replacements: ['overheadExt'], imageUrl: ''
  },
  overheadExt: {
    id: 'overheadExt', name: 'Overhead Cable Extension', muscleGroup: 'Triceps', pattern: 'Isolation',
    equipment: 'Cable', defaultSets: 3, repLow: 10, repHigh: 15, increment: 5, restSec: 75,
    cues: 'Long head stretch, keep elbows tight.', replacements: ['tricepPushdown'], imageUrl: ''
  },
  deadlift: {
    id: 'deadlift', name: 'Conventional Deadlift', muscleGroup: 'Back', pattern: 'Hinge',
    equipment: 'Barbell', defaultSets: 3, repLow: 4, repHigh: 6, increment: 10, restSec: 210,
    cues: 'Brace, bar over mid-foot, push the floor away.', replacements: ['rdl'], imageUrl: ''
  },
  pullup: {
    id: 'pullup', name: 'Weighted Pull-Up', muscleGroup: 'Back', pattern: 'Vertical Pull',
    equipment: 'Bodyweight', defaultSets: 4, repLow: 6, repHigh: 10, increment: 5, restSec: 150,
    cues: 'Full hang, chest to bar, control the descent.', replacements: ['latPulldown'], imageUrl: ''
  },
  latPulldown: {
    id: 'latPulldown', name: 'Lat Pulldown', muscleGroup: 'Back', pattern: 'Vertical Pull',
    equipment: 'Cable', defaultSets: 3, repLow: 8, repHigh: 12, increment: 5, restSec: 120,
    cues: 'Drive elbows down, slight lean, no momentum.', replacements: ['pullup'], imageUrl: ''
  },
  barbellRow: {
    id: 'barbellRow', name: 'Barbell Row', muscleGroup: 'Back', pattern: 'Horizontal Pull',
    equipment: 'Barbell', defaultSets: 4, repLow: 6, repHigh: 10, increment: 5, restSec: 150,
    cues: 'Hinge ~45°, pull to lower ribs, no jerking.', replacements: ['cableRow'], imageUrl: ''
  },
  cableRow: {
    id: 'cableRow', name: 'Seated Cable Row', muscleGroup: 'Back', pattern: 'Horizontal Pull',
    equipment: 'Cable', defaultSets: 3, repLow: 10, repHigh: 14, increment: 5, restSec: 105,
    cues: 'Proud chest, squeeze shoulder blades, control.', replacements: ['barbellRow'], imageUrl: ''
  },
  facePull: {
    id: 'facePull', name: 'Face Pull', muscleGroup: 'Rear Delts', pattern: 'Isolation',
    equipment: 'Cable', defaultSets: 3, repLow: 14, repHigh: 20, increment: 5, restSec: 60,
    cues: 'Pull to forehead, external rotation, high elbows.', replacements: [], imageUrl: ''
  },
  bicepCurl: {
    id: 'bicepCurl', name: 'DB Biceps Curl', muscleGroup: 'Biceps', pattern: 'Isolation',
    equipment: 'Dumbbell', defaultSets: 3, repLow: 10, repHigh: 14, increment: 5, restSec: 75,
    cues: 'No swing, supinate, squeeze at the top.', replacements: ['hammerCurl'], imageUrl: ''
  },
  hammerCurl: {
    id: 'hammerCurl', name: 'Hammer Curl', muscleGroup: 'Biceps', pattern: 'Isolation',
    equipment: 'Dumbbell', defaultSets: 3, repLow: 10, repHigh: 14, increment: 5, restSec: 75,
    cues: 'Neutral grip, controlled, brachialis focus.', replacements: ['bicepCurl'], imageUrl: ''
  },
  squat: {
    id: 'squat', name: 'Back Squat', muscleGroup: 'Quads', pattern: 'Squat',
    equipment: 'Barbell', defaultSets: 4, repLow: 5, repHigh: 8, increment: 10, restSec: 180,
    cues: 'Brace, knees track toes, hit depth, drive up.', replacements: ['legPress'], imageUrl: ''
  },
  legPress: {
    id: 'legPress', name: 'Leg Press', muscleGroup: 'Quads', pattern: 'Squat',
    equipment: 'Machine', defaultSets: 3, repLow: 10, repHigh: 15, increment: 10, restSec: 120,
    cues: 'Full ROM, no lower-back rounding, controlled.', replacements: ['squat'], imageUrl: ''
  },
  rdl: {
    id: 'rdl', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', pattern: 'Hinge',
    equipment: 'Barbell', defaultSets: 3, repLow: 8, repHigh: 12, increment: 5, restSec: 150,
    cues: 'Soft knees, push hips back, feel the stretch.', replacements: ['legCurl', 'deadlift'], imageUrl: ''
  },
  legCurl: {
    id: 'legCurl', name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', pattern: 'Isolation',
    equipment: 'Machine', defaultSets: 3, repLow: 10, repHigh: 15, increment: 5, restSec: 90,
    cues: 'Full squeeze, slow eccentric, hips planted.', replacements: ['rdl'], imageUrl: ''
  },
  legExt: {
    id: 'legExt', name: 'Leg Extension', muscleGroup: 'Quads', pattern: 'Isolation',
    equipment: 'Machine', defaultSets: 3, repLow: 12, repHigh: 18, increment: 5, restSec: 75,
    cues: 'Pause at top, controlled negative.', replacements: [], imageUrl: ''
  },
  calfRaise: {
    id: 'calfRaise', name: 'Standing Calf Raise', muscleGroup: 'Calves', pattern: 'Isolation',
    equipment: 'Machine', defaultSets: 4, repLow: 10, repHigh: 15, increment: 5, restSec: 60,
    cues: 'Full stretch, pause at top, no bouncing.', replacements: [], imageUrl: ''
  },
  hangingLegRaise: {
    id: 'hangingLegRaise', name: 'Hanging Leg Raise', muscleGroup: 'Core', pattern: 'Isolation',
    equipment: 'Bodyweight', defaultSets: 3, repLow: 8, repHigh: 15, increment: 0, restSec: 75,
    cues: 'No swing, posterior pelvic tilt, controlled.', replacements: [], imageUrl: ''
  },
};

function exList() {
  return Object.values(EX).map(e => ({ ...e, _sample: true }));
}

// ---- Push / Pull / Legs split (sample) -----------------------------------
function sampleSplit() {
  return {
    id: 'split_ppl',
    name: 'Push / Pull / Legs (Lean Bulk)',
    type: 'PPL',
    _sample: true,
    days: [
      { weekday: 'Monday', kind: 'training', label: 'Push', location: 'IM Rec', durationMin: 70, focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseIds: ['benchPress', 'inclinePress', 'dbShoulderPress', 'lateralRaise', 'tricepPushdown'] },
      { weekday: 'Tuesday', kind: 'training', label: 'Pull', location: 'IM Rec', durationMin: 70, focusMuscles: ['Back', 'Biceps', 'Rear Delts'], exerciseIds: ['pullup', 'barbellRow', 'latPulldown', 'facePull', 'bicepCurl'] },
      { weekday: 'Wednesday', kind: 'training', label: 'Legs', location: 'IM Rec', durationMin: 75, focusMuscles: ['Quads', 'Hamstrings', 'Calves'], exerciseIds: ['squat', 'rdl', 'legExt', 'legCurl', 'calfRaise'] },
      { weekday: 'Thursday', kind: 'active', label: 'Active Recovery', location: 'Outdoors', durationMin: 40, focusMuscles: [], exerciseIds: [] },
      { weekday: 'Friday', kind: 'training', label: 'Push', location: 'IM Rec', durationMin: 70, focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseIds: ['inclinePress', 'dbBench', 'ohp', 'lateralRaise', 'overheadExt'] },
      { weekday: 'Saturday', kind: 'training', label: 'Pull', location: 'IM Rec', durationMin: 70, focusMuscles: ['Back', 'Biceps'], exerciseIds: ['deadlift', 'cableRow', 'latPulldown', 'facePull', 'hammerCurl'] },
      { weekday: 'Sunday', kind: 'rest', label: 'Rest', location: '', durationMin: 0, focusMuscles: [], exerciseIds: [] },
    ],
  };
}

// ---- Supplements (sample default stack) ----------------------------------
function sampleSupplements() {
  return [
    { id: 'sup_creatine', name: 'Creatine Monohydrate', dose: '5g', timing: 'anytime', runningLow: false, _sample: true },
    { id: 'sup_vitd', name: 'Vitamin D3 + K2', dose: '5000 IU', timing: 'morning', runningLow: false, _sample: true },
    { id: 'sup_omega', name: 'Omega-3 Fish Oil', dose: '2g', timing: 'morning', runningLow: false, _sample: true },
    { id: 'sup_multi', name: 'Multivitamin', dose: '1 cap', timing: 'morning', runningLow: false, _sample: true },
    { id: 'sup_mag', name: 'Magnesium Glycinate', dose: '400mg', timing: 'evening', runningLow: true, _sample: true },
    { id: 'sup_whey', name: 'Whey Protein', dose: '1 scoop', timing: 'lunch', runningLow: false, _sample: true },
  ];
}

// ---- Full default data object --------------------------------------------
export function emptyData() {
  return {
    meta: { version: DATA_VERSION, seeded: false, createdAt: T },
    profile: {
      name: 'Dominic',
      bodyWeightGoalLow: 178,
      bodyWeightGoalHigh: 185,
    },
    settings: {
      water: { weightLbs: 175, age: 21, activity: 'high', caffeineMg: 200, bottleOz: 32, manualTargetOz: null },
    },
    dailyLogs: {},        // keyed by date
    tasks: [],
    // gym
    exercises: [],
    splits: [],
    activeSplitId: null,
    workoutTemplates: [],
    plannedWeek: null,    // { weekStart, days:[...] }
    workoutSessions: [],
    personalRecords: [],
    bodyWeightEntries: [],
    progressPhotos: [],
    // health
    supplements: [],
    supplementLog: {},    // { date: { supId: true } }
    waterLogs: {},        // { date: { targetOz, intakeOz, entries:[] } }
    sleepRecoveryLogs: [],
    // afterglow
    afterglow: {
      stage: 'Prototype & Validation',
      stages: ['Idea', 'Prototype & Validation', 'Co-Packer & Funding', 'Pilot Production', 'Launch'],
      weeklyPriorities: [],
      coPackers: [],
      regulatory: [],
      launchTasks: [],
      productTests: [],
      funding: [],
      queue7day: [],
    },
    // school
    classes: [],
    assignments: [],
    exams: [],
    studyBlocks: [],
    // admin
    adminReminders: [],
    contacts: [],
    subscriptions: [],
    // review
    weeklyReviews: [],
    monthlyReviews: [],
  };
}

// ---- Demo seed (clearly-labeled sample data) -----------------------------
export function seedData() {
  const d = emptyData();
  d.meta.seeded = true;

  // Today's log
  d.dailyLogs[T] = {
    date: T,
    mode: 'Deep Work',
    priorities: [
      { id: 'p1', track: 'startup', text: 'Email 3 co-packers a tightened spec sheet', done: false, _sample: true },
      { id: 'p2', track: 'body', text: 'Push day — bench progression set', done: false, _sample: true },
      { id: 'p3', track: 'school', text: 'Outline FI 311 case write-up', done: true, _sample: true },
    ],
    scorecard: { focus: 0, body: 0, founder: 0, recovery: 0 },
    reflection: { moved: '', avoided: '', firstMove: '' },
    _sample: true,
  };

  // Tasks
  d.tasks = [
    { id: 't1', title: 'Finalize 2oz shot formulation brief', category: 'AFTERGLOW', priority: 'high', due: T, done: false, _sample: true },
    { id: 't2', title: 'Confirm Burgess mentor meeting time', category: 'AFTERGLOW', priority: 'med', due: T, done: false, _sample: true },
    { id: 't3', title: 'Grocery run — chicken, rice, eggs', category: 'Admin', priority: 'low', due: T, done: false, _sample: true },
    { id: 't4', title: 'FI 414 problem set 6', category: 'School', priority: 'med', due: todayKey(addDays(new Date(), 2)), done: false, _sample: true },
    { id: 't5', title: 'Post AFTERGLOW teaser on IG', category: 'AFTERGLOW', priority: 'med', due: yesterday, done: true, _sample: true },
  ];

  // Gym
  d.exercises = exList();
  const split = sampleSplit();
  d.splits = [split];
  d.activeSplitId = split.id;

  // Body weight trend (sample, last 7 days)
  const bwDays = lastNDays(7);
  const bwStart = 176.4;
  d.bodyWeightEntries = bwDays.map((dk, i) => ({
    id: 'bw_' + dk, date: dk, weight: +(bwStart + i * 0.18 + (i % 2 ? -0.3 : 0.2)).toFixed(1),
    notes: i === 0 ? 'Lean bulk baseline' : '', _sample: true,
  }));

  // A couple of completed sessions so progression has history
  d.workoutSessions = [
    {
      id: 'sess_1', date: twoAgo, dayLabel: 'Push', completed: true, notes: 'Solid session',
      exercises: [
        { exerciseId: 'benchPress', sets: [{ weight: 165, reps: 8, done: true }, { weight: 165, reps: 8, done: true }, { weight: 165, reps: 7, done: true }, { weight: 165, reps: 7, done: true }], notes: '' },
        { exerciseId: 'inclinePress', sets: [{ weight: 60, reps: 11, done: true }, { weight: 60, reps: 10, done: true }, { weight: 60, reps: 9, done: true }], notes: '' },
      ],
      _sample: true,
    },
    {
      id: 'sess_2', date: yesterday, dayLabel: 'Pull', completed: true, notes: '',
      exercises: [
        { exerciseId: 'barbellRow', sets: [{ weight: 155, reps: 9, done: true }, { weight: 155, reps: 9, done: true }, { weight: 155, reps: 8, done: true }, { weight: 155, reps: 8, done: true }], notes: '' },
        { exerciseId: 'bicepCurl', sets: [{ weight: 35, reps: 13, done: true }, { weight: 35, reps: 12, done: true }, { weight: 35, reps: 11, done: true }], notes: '' },
      ],
      _sample: true,
    },
  ];

  d.personalRecords = [
    { id: 'pr_1', exerciseId: 'benchPress', weight: 185, reps: 5, date: twoAgo, e1rm: 216, _sample: true },
    { id: 'pr_2', exerciseId: 'deadlift', weight: 315, reps: 3, date: yesterday, e1rm: 347, _sample: true },
  ];

  d.progressPhotos = []; // user adds their own (compressed); none sampled

  // Health
  d.supplements = sampleSupplements();
  d.supplementLog[T] = { sup_vitd: true, sup_omega: true };

  // Sleep / recovery (last 3 days)
  d.sleepRecoveryLogs = [
    { id: 'sr_1', date: twoAgo, durationH: 7.5, quality: 4, rhr: 54, hrv: 78, steps: 9100, soreness: 2, mood: 4, readiness: 0, call: '', _sample: true },
    { id: 'sr_2', date: yesterday, durationH: 6.8, quality: 3, rhr: 57, hrv: 65, steps: 7400, soreness: 3, mood: 3, readiness: 0, call: '', _sample: true },
  ];

  // AFTERGLOW
  d.afterglow.weeklyPriorities = [
    { id: 'awp1', text: 'Lock co-packer shortlist to 3', done: false, _sample: true },
    { id: 'awp2', text: 'Draft seed funding one-pager', done: false, _sample: true },
    { id: 'awp3', text: 'Test batch #2 of hangover shot', done: true, _sample: true },
  ];
  d.afterglow.coPackers = [
    { id: 'cp1', name: 'Great Lakes Canning Co.', contact: 'sales@glcanning.example', stage: 'Intro call done', moq: '5,000 cans', notes: 'Malt-base friendly; wants formula sheet.', _sample: true },
    { id: 'cp2', name: 'Midwest Beverage Partners', contact: 'hello@mbp.example', stage: 'Awaiting reply', moq: '10,000 cans', notes: 'Higher MOQ, lower per-unit.', _sample: true },
    { id: 'cp3', name: 'Craft RTD Fillers', contact: 'ops@craftrtd.example', stage: 'Researching', moq: 'TBD', notes: 'Does combo packs in-house.', _sample: true },
  ];
  d.afterglow.regulatory = [
    { id: 'rg1', item: 'TTB Brewer\'s Notice (malt base)', status: 'Not started', notes: 'Required before interstate sale.', _sample: true },
    { id: 'rg2', item: 'COLA label approval', status: 'Not started', notes: 'Depends on final label art.', _sample: true },
    { id: 'rg3', item: 'MI state liquor licensing', status: 'Researching', notes: 'Confirm small-producer path.', _sample: true },
    { id: 'rg4', item: 'Shot = dietary supplement vs. beverage?', status: 'Open question', notes: 'FDA classification affects claims.', _sample: true },
  ];
  d.afterglow.launchTasks = [
    { id: 'lt1', text: 'Burgess Institute office hours sign-up', done: false, _sample: true },
    { id: 'lt2', text: 'Launch Program milestone deck', done: false, _sample: true },
    { id: 'lt3', text: 'Recruit 10 beta tasters', done: false, _sample: true },
  ];
  d.afterglow.productTests = [
    { id: 'pt1', name: 'Cocktail base v3', result: 'Too sweet — cut syrup 15%', date: twoAgo, _sample: true },
    { id: 'pt2', name: 'Hangover shot batch #2', result: 'Electrolyte profile good; flavor masking needs work', date: yesterday, _sample: true },
  ];
  d.afterglow.funding = [
    { id: 'fn1', item: 'Pitch deck', status: 'In progress', _sample: true },
    { id: 'fn2', item: 'Financial model (unit economics)', status: 'Not started', _sample: true },
    { id: 'fn3', item: 'Cap table', status: 'Not started', _sample: true },
    { id: 'fn4', item: 'MSU Launch demo day application', status: 'Not started', _sample: true },
  ];
  d.afterglow.queue7day = [
    { id: 'q1', day: 'Mon', text: 'Co-packer emails out', done: false, _sample: true },
    { id: 'q2', day: 'Tue', text: 'Funding one-pager draft', done: false, _sample: true },
    { id: 'q3', day: 'Wed', text: 'Shot batch #3 taste test', done: false, _sample: true },
    { id: 'q4', day: 'Thu', text: 'Burgess mentor sync', done: false, _sample: true },
    { id: 'q5', day: 'Fri', text: 'Update financial model', done: false, _sample: true },
  ];

  // School
  d.classes = [
    { id: 'cl1', name: 'FI 311 — Financial Management', code: 'FI 311', professor: 'Dr. Adams', room: 'Eppley 110', schedule: 'MWF 10:20', _sample: true },
    { id: 'cl2', name: 'FI 414 — Advanced Business Finance', code: 'FI 414', professor: 'Dr. Ortiz', room: 'Bus Col N130', schedule: 'TR 12:40', _sample: true },
    { id: 'cl3', name: 'ENT 275 — Entrepreneurship', code: 'ENT 275', professor: 'Prof. Lee', room: 'Minskoff', schedule: 'TR 3:00', _sample: true },
  ];
  d.assignments = [
    { id: 'as1', classId: 'cl1', title: 'Case write-up: WACC', due: todayKey(addDays(new Date(), 3)), done: false, _sample: true },
    { id: 'as2', classId: 'cl2', title: 'Problem set 6', due: todayKey(addDays(new Date(), 2)), done: false, _sample: true },
    { id: 'as3', classId: 'cl3', title: 'Venture pitch draft', due: todayKey(addDays(new Date(), 6)), done: false, _sample: true },
  ];
  d.exams = [
    { id: 'ex1', classId: 'cl2', title: 'Midterm 2', date: todayKey(addDays(new Date(), 9)), _sample: true },
  ];
  d.studyBlocks = [
    { id: 'sb1', classId: 'cl2', day: 'Sunday', time: '4:00 PM', durationMin: 90, _sample: true },
  ];

  // Admin
  d.adminReminders = [
    { id: 'ad1', text: 'Renew car registration', due: todayKey(addDays(new Date(), 12)), done: false, _sample: true },
    { id: 'ad2', text: 'Call landlord re: lease renewal', due: todayKey(addDays(new Date(), 4)), done: false, _sample: true },
  ];
  d.contacts = [
    { id: 'co1', name: 'Prof. Burgess (mentor)', role: 'MSU Launch mentor', contact: 'burgess@msu.example', _sample: true },
    { id: 'co2', name: 'Great Lakes Canning', role: 'Co-packer lead', contact: 'sales@glcanning.example', _sample: true },
  ];
  d.subscriptions = [
    { id: 'su1', name: 'Adobe Creative Cloud', cost: 22.99, cycle: 'monthly', renews: todayKey(addDays(new Date(), 8)), _sample: true },
    { id: 'su2', name: 'Notion', cost: 0, cycle: 'monthly', renews: '', _sample: true },
    { id: 'su3', name: 'Gym (IM Rec)', cost: 0, cycle: 'monthly', renews: '', _sample: true },
  ];

  // Review (empty templates; Review page auto-pulls live stats)
  d.weeklyReviews = [];
  d.monthlyReviews = [];

  return d;
}
