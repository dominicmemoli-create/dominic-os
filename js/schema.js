// schema.js — data version, default shape, and first-load demo seed.
// One localStorage key (see store.js). Sample records carry _sample:true.
//
// v2: AFTERGLOW removed and replaced by a general Productivity section.
//     Exercise library expanded to 70+ machine/cable-first movements with
//     full metadata + image fields. See EXERCISE_LIBRARY_NOTES.md.

import { todayKey, addDays, lastNDays } from './dates.js';

export const DATA_VERSION = 4;

const T = todayKey();
const yesterday = todayKey(addDays(new Date(), -1));
const twoAgo = todayKey(addDays(new Date(), -2));

const LIC = 'Local generated instruction placeholder. Real photos can be added via imageUrl — safe sources: free-exercise-db / wger (see EXERCISE_LIBRARY_NOTES.md).';

// Real, public-domain exercise photos from Free Exercise DB (primary source,
// Unlicense). Mapped only for verified core machine/cable lifts; everything else
// keeps the instructional placeholder. The exercise card's onerror handler swaps
// any failed/missing load back to the placeholder, so a broken image is impossible.
const FEDB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const FEDB_PD = 'Public domain (Unlicense) — github.com/yuhonas/free-exercise-db';
const FEDB_IMG = {
  machineChestPress: 'Machine_Bench_Press', pecDeck: 'Butterfly', cableFly: 'Cable_Crossover',
  lateralRaiseMachine: 'Side_Lateral_Raise', cablePushdown: 'Triceps_Pushdown',
  latPulldown: 'Wide-Grip_Lat_Pulldown', seatedCableRow: 'Seated_Cable_Rows',
  highRow: 'Leverage_High_Row', facePull: 'Face_Pull', legPress: 'Leg_Press',
  hackSquat: 'Hack_Squat', legExtension: 'Leg_Extensions', seatedLegCurl: 'Seated_Leg_Curl',
  calfRaiseMachine: 'Standing_Calf_Raises', ezBarCurl: 'EZ-Bar_Curl',
};
function applyFedbImages(list) {
  for (const ex of list) {
    const folder = FEDB_IMG[ex.id];
    if (!folder) continue;
    ex.imageUrl = FEDB_BASE + folder + '/0.jpg';
    ex.imageSource = 'free-exercise-db';
    ex.imageLicenseNotes = FEDB_PD;
  }
}

// Compact exercise builder — keeps the 70-item library readable & consistent.
// classification: 'machine' | 'cable' | 'free weight' | 'bodyweight' | 'functional'
function mk(id, name, category, primaryMuscle, equipment, classification, o = {}) {
  const isMach = classification === 'machine' || classification === 'cable';
  return {
    id, name, category, primaryMuscle,
    secondaryMuscles: o.sec || [],
    equipment, classification,
    defaultSets: o.sets ?? 3,
    repLow: o.lo ?? (classification === 'free weight' ? 6 : 10),
    repHigh: o.hi ?? (classification === 'free weight' ? 10 : 15),
    restSec: o.rest ?? (classification === 'free weight' ? 150 : (classification === 'functional' ? 60 : 90)),
    increment: o.inc ?? (classification === 'machine' ? 10 : (classification === 'bodyweight' ? 0 : 5)),
    difficulty: o.diff || 'Beginner',
    cues: o.cues || '',
    commonMistakes: o.miss || '',
    substitutions: o.subs || [],
    imageUrl: o.img || '',
    imageSource: o.img ? (o.imgSrc || 'user') : 'placeholder',
    imageLicenseNotes: o.img ? (o.imgLic || '') : LIC,
    _sample: true,
  };
}

// ---- Exercise library (70+, machine/cable-first for a commercial gym) -----
function exList() {
  const list = [
    // ---------------- CHEST ----------------
    mk('machineChestPress', 'Machine Chest Press', 'Chest', 'Pectorals', 'Selectorized Machine', 'machine', { lo: 8, hi: 12, sec: ['Triceps', 'Front Delts'], cues: 'Handles at mid-chest, press smooth, full stretch back.', miss: 'Flaring elbows; bouncing off the stack.', subs: ['seatedChestPress', 'plateLoadedChestPress', 'machineInclinePress'] }),
    mk('machineInclinePress', 'Incline Machine Press', 'Chest', 'Upper Pectorals', 'Selectorized Machine', 'machine', { lo: 8, hi: 12, sec: ['Front Delts', 'Triceps'], cues: 'Seat low, drive up and slightly in.', miss: 'Seat too high turns it into a shoulder press.', subs: ['inclineDbPress', 'machineChestPress'] }),
    mk('pecDeck', 'Pec Deck', 'Chest', 'Pectorals', 'Selectorized Machine', 'machine', { lo: 12, hi: 15, sec: ['Front Delts'], cues: 'Soft elbows, squeeze pads together, slow return.', miss: 'Using too much weight and shrugging.', subs: ['cableFly', 'lowHighCableFly'] }),
    mk('cableFly', 'Cable Fly', 'Chest', 'Pectorals', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: ['Front Delts'], cues: 'Slight forward lean, hug a barrel, meet in front.', miss: 'Pressing instead of arcing.', subs: ['pecDeck', 'lowHighCableFly'] }),
    mk('lowHighCableFly', 'Low-to-High Cable Fly', 'Chest', 'Upper Pectorals', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: ['Front Delts'], cues: 'Pulleys low, sweep up to eye line.', miss: 'Shrugging at the top.', subs: ['cableFly', 'inclineDbPress'] }),
    mk('seatedChestPress', 'Seated Chest Press', 'Chest', 'Pectorals', 'Selectorized Machine', 'machine', { lo: 8, hi: 12, sec: ['Triceps'], cues: 'Back flat to pad, controlled tempo.', miss: 'Half reps.', subs: ['machineChestPress', 'plateLoadedChestPress'] }),
    mk('plateLoadedChestPress', 'Plate-Loaded Chest Press', 'Chest', 'Pectorals', 'Plate-Loaded Machine', 'machine', { lo: 8, hi: 12, sec: ['Triceps', 'Front Delts'], cues: 'Even load both sides, press together.', miss: 'Uneven loading.', subs: ['machineChestPress'] }),
    mk('assistedDip', 'Assisted Dip Machine', 'Chest', 'Lower Pectorals', 'Assisted Machine', 'machine', { lo: 8, hi: 12, sec: ['Triceps', 'Front Delts'], cues: 'Lean forward for chest, deep but pain-free.', miss: 'Shrugging shoulders to ears.', subs: ['machineChestPress', 'closeGripMachinePress'] }),
    mk('pushUp', 'Push-Up', 'Chest', 'Pectorals', 'Bodyweight', 'bodyweight', { lo: 8, hi: 20, sec: ['Triceps', 'Core'], inc: 0, cues: 'Rigid plank, chest to floor, full lockout.', miss: 'Sagging hips.', subs: ['machineChestPress', 'pushUp'] }),
    mk('inclineDbPress', 'Incline Dumbbell Press', 'Chest', 'Upper Pectorals', 'Dumbbells', 'free weight', { lo: 8, hi: 12, sec: ['Front Delts', 'Triceps'], cues: '30°, control the stretch.', miss: 'Bench too steep.', subs: ['machineInclinePress', 'dbBench'] }),
    mk('dbBench', 'Flat Dumbbell Press', 'Chest', 'Pectorals', 'Dumbbells', 'free weight', { lo: 8, hi: 12, sec: ['Triceps'], cues: 'Neutral wrists, deep stretch, squeeze.', miss: 'Bouncing at the bottom.', subs: ['machineChestPress', 'inclineDbPress'] }),

    // ---------------- BACK ----------------
    mk('latPulldown', 'Lat Pulldown', 'Back', 'Lats', 'Cable Station', 'cable', { lo: 10, hi: 14, sec: ['Biceps', 'Rear Delts'], cues: 'Drive elbows down, bar to upper chest, slight lean.', miss: 'Yanking with momentum.', subs: ['assistedPullup', 'straightArmPulldown'] }),
    mk('assistedPullup', 'Assisted Pull-Up Machine', 'Back', 'Lats', 'Assisted Machine', 'machine', { lo: 8, hi: 12, sec: ['Biceps'], cues: 'Full hang, pull chest to bar, control down.', miss: 'Too much assist = no work.', subs: ['latPulldown', 'highRow'] }),
    mk('seatedCableRow', 'Seated Cable Row', 'Back', 'Mid-Back', 'Cable Station', 'cable', { lo: 10, hi: 14, sec: ['Biceps', 'Rear Delts'], cues: 'Proud chest, pull to navel, squeeze blades.', miss: 'Rowing with the lower back.', subs: ['chestSupportedRow', 'highRow'] }),
    mk('chestSupportedRow', 'Chest-Supported Row Machine', 'Back', 'Mid-Back', 'Plate-Loaded Machine', 'machine', { lo: 10, hi: 14, sec: ['Biceps', 'Rear Delts'], cues: 'Chest on pad, drive elbows back.', miss: 'Lifting chest off the pad.', subs: ['seatedCableRow', 'highRow'] }),
    mk('highRow', 'High Row Machine', 'Back', 'Lats', 'Plate-Loaded Machine', 'machine', { lo: 10, hi: 14, sec: ['Rear Delts', 'Biceps'], cues: 'Pull down and back, lats do the work.', miss: 'Leaning back to cheat.', subs: ['latPulldown', 'chestSupportedRow'] }),
    mk('machinePullover', 'Machine Pullover', 'Back', 'Lats', 'Selectorized Machine', 'machine', { lo: 12, hi: 15, sec: ['Chest'], cues: 'Long arc, feel the lat stretch.', miss: 'Bending the arms.', subs: ['straightArmPulldown', 'latPulldown'] }),
    mk('rearDeltRow', 'Rear Delt Row', 'Back', 'Rear Delts', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: ['Mid-Back'], cues: 'High elbows, pull to chest line.', miss: 'Turning it into a biceps pull.', subs: ['reversePecDeck', 'facePull'] }),
    mk('singleArmCableRow', 'Single-Arm Cable Row', 'Back', 'Lats', 'Cable Station', 'cable', { lo: 10, hi: 14, sec: ['Biceps'], cues: 'Reach and stretch, row to hip, no twist.', miss: 'Rotating the torso.', subs: ['seatedCableRow', 'chestSupportedRow'] }),
    mk('straightArmPulldown', 'Straight-Arm Pulldown', 'Back', 'Lats', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: [], cues: 'Soft elbows fixed, sweep bar to thighs.', miss: 'Bending elbows into a pushdown.', subs: ['machinePullover', 'latPulldown'] }),
    mk('reversePecDeck', 'Reverse Pec Deck', 'Back', 'Rear Delts', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: ['Mid-Back'], cues: 'Lead with pinkies, squeeze rear delts.', miss: 'Using the traps.', subs: ['rearDeltMachine', 'facePull'] }),

    // ---------------- SHOULDERS ----------------
    mk('machineShoulderPress', 'Machine Shoulder Press', 'Shoulders', 'Front Delts', 'Selectorized Machine', 'machine', { lo: 8, hi: 12, sec: ['Triceps'], cues: 'Press straight up, no shrug at top.', miss: 'Arching the lower back.', subs: ['dbShoulderPress', 'plateLoadedChestPress'] }),
    mk('lateralRaiseMachine', 'Lateral Raise Machine', 'Shoulders', 'Side Delts', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: [], cues: 'Pads on outer arms, lead with elbows.', miss: 'Heaving the weight up.', subs: ['cableLateralRaise', 'dbShoulderPress'] }),
    mk('cableLateralRaise', 'Cable Lateral Raise', 'Shoulders', 'Side Delts', 'Cable Station', 'cable', { lo: 12, hi: 18, sec: [], cues: 'Cable behind back, raise to shoulder height.', miss: 'Swinging.', subs: ['lateralRaiseMachine'] }),
    mk('rearDeltMachine', 'Rear Delt Machine', 'Shoulders', 'Rear Delts', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: ['Mid-Back'], cues: 'Squeeze rear delts, controlled return.', miss: 'Using momentum.', subs: ['reversePecDeck', 'facePull'] }),
    mk('facePull', 'Face Pull', 'Shoulders', 'Rear Delts', 'Cable Station', 'cable', { lo: 14, hi: 20, sec: ['Mid-Back'], cues: 'Rope to forehead, external rotation, high elbows.', miss: 'Too heavy, losing the rotation.', subs: ['reversePecDeck', 'rearDeltMachine'] }),
    mk('frontRaiseCable', 'Cable Front Raise', 'Shoulders', 'Front Delts', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: [], cues: 'Raise to eye line, no swing.', miss: 'Going above shoulder height with momentum.', subs: ['machineShoulderPress'] }),
    mk('dbShoulderPress', 'Seated DB Shoulder Press', 'Shoulders', 'Front Delts', 'Dumbbells', 'free weight', { lo: 8, hi: 12, sec: ['Triceps'], cues: 'Slight back support, press in an arc.', miss: 'Flaring at the bottom.', subs: ['machineShoulderPress'] }),
    mk('uprightRowCable', 'Cable Upright Row', 'Shoulders', 'Side Delts', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: ['Traps'], cues: 'Elbows lead, pull to chest, keep close.', miss: 'Pulling too high and pinching shoulders.', subs: ['lateralRaiseMachine', 'shrugMachine'] }),
    mk('reverseCableFly', 'Reverse Cable Fly', 'Shoulders', 'Rear Delts', 'Cable Station', 'cable', { lo: 14, hi: 18, sec: ['Mid-Back'], cues: 'Cross cables, sweep arms wide and back.', miss: 'Bending elbows.', subs: ['reversePecDeck', 'facePull'] }),
    mk('shrugMachine', 'Shrug Machine', 'Shoulders', 'Traps', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: [], cues: 'Straight up, pause, no rolling.', miss: 'Rolling the shoulders.', subs: ['uprightRowCable'] }),

    // ---------------- BICEPS ----------------
    mk('bicepCurlMachine', 'Biceps Curl Machine', 'Biceps', 'Biceps', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: ['Forearms'], cues: 'Arms on pad, full squeeze, slow negative.', miss: 'Lifting elbows off the pad.', subs: ['preacherCurlMachine', 'cableCurl'] }),
    mk('preacherCurlMachine', 'Preacher Curl Machine', 'Biceps', 'Biceps', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: ['Forearms'], cues: 'Full stretch at bottom, no swing.', miss: 'Cutting the bottom range.', subs: ['bicepCurlMachine', 'inclineDbCurl'] }),
    mk('cableCurl', 'Cable Curl', 'Biceps', 'Biceps', 'Cable Station', 'cable', { lo: 10, hi: 15, sec: ['Forearms'], cues: 'Elbows pinned, curl and squeeze.', miss: 'Elbows drifting forward.', subs: ['bicepCurlMachine', 'ezBarCurl'] }),
    mk('ropeHammerCurl', 'Rope Hammer Curl', 'Biceps', 'Brachialis', 'Cable Station', 'cable', { lo: 10, hi: 15, sec: ['Forearms'], cues: 'Neutral grip, drive thumbs up.', miss: 'Swinging the torso.', subs: ['cableCurl', 'bicepCurlMachine'] }),
    mk('singleArmCableCurl', 'Single-Arm Cable Curl', 'Biceps', 'Biceps', 'Cable Station', 'cable', { lo: 10, hi: 15, sec: [], cues: 'Constant tension, peak squeeze.', miss: 'Body english.', subs: ['cableCurl', 'concentrationCurl'] }),
    mk('inclineDbCurl', 'Incline Dumbbell Curl', 'Biceps', 'Biceps', 'Dumbbells', 'free weight', { lo: 10, hi: 14, sec: [], cues: 'Arms hang back, deep stretch.', miss: 'Swinging up.', subs: ['preacherCurlMachine', 'cableCurl'] }),
    mk('ezBarCurl', 'EZ-Bar Curl', 'Biceps', 'Biceps', 'EZ Bar', 'free weight', { lo: 8, hi: 12, sec: ['Forearms'], cues: 'Elbows still, controlled.', miss: 'Using the back.', subs: ['cableCurl', 'bicepCurlMachine'] }),
    mk('concentrationCurl', 'Concentration Curl', 'Biceps', 'Biceps', 'Dumbbell', 'free weight', { lo: 10, hi: 15, sec: [], cues: 'Elbow on thigh, full peak squeeze.', miss: 'Rushing reps.', subs: ['singleArmCableCurl', 'cableCurl'] }),

    // ---------------- TRICEPS ----------------
    mk('tricepExtMachine', 'Triceps Extension Machine', 'Triceps', 'Triceps', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: [], cues: 'Elbows fixed, full lockout, slow back.', miss: 'Half reps.', subs: ['cablePushdown', 'closeGripMachinePress'] }),
    mk('cablePushdown', 'Cable Triceps Pushdown', 'Triceps', 'Triceps', 'Cable Station', 'cable', { lo: 10, hi: 15, sec: [], cues: 'Elbows pinned to sides, full extension.', miss: 'Leaning and using bodyweight.', subs: ['ropePushdown', 'tricepExtMachine'] }),
    mk('ropePushdown', 'Rope Triceps Pushdown', 'Triceps', 'Triceps', 'Cable Station', 'cable', { lo: 10, hi: 15, sec: [], cues: 'Split the rope at the bottom.', miss: 'Flaring elbows out.', subs: ['cablePushdown', 'overheadCableExt'] }),
    mk('overheadCableExt', 'Overhead Cable Extension', 'Triceps', 'Long Head', 'Cable Station', 'cable', { lo: 10, hi: 15, sec: [], cues: 'Lean in, stretch the long head, extend fully.', miss: 'Elbows drifting wide.', subs: ['tricepExtMachine', 'ropePushdown'] }),
    mk('singleArmCableExt', 'Single-Arm Cable Extension', 'Triceps', 'Triceps', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: [], cues: 'Reverse grip, lock out fully.', miss: 'Wrist wobble.', subs: ['cablePushdown'] }),
    mk('closeGripMachinePress', 'Close-Grip Machine Press', 'Triceps', 'Triceps', 'Selectorized Machine', 'machine', { lo: 8, hi: 12, sec: ['Chest'], cues: 'Narrow grip, elbows tight, press.', miss: 'Elbows flaring.', subs: ['assistedDip', 'tricepExtMachine'] }),
    mk('tricepKickbackCable', 'Cable Triceps Kickback', 'Triceps', 'Triceps', 'Cable Station', 'cable', { lo: 12, hi: 15, sec: [], cues: 'Hinge, upper arm still, extend back.', miss: 'Dropping the elbow.', subs: ['ropePushdown', 'cablePushdown'] }),

    // ---------------- LEGS ----------------
    mk('legPress', 'Leg Press', 'Legs', 'Quads', 'Plate-Loaded Machine', 'machine', { lo: 10, hi: 15, sec: ['Glutes', 'Hamstrings'], cues: 'Full ROM, knees track toes, no lockout slam.', miss: 'Rounding the lower back at the bottom.', subs: ['hackSquat', 'smithSquat'] }),
    mk('hackSquat', 'Hack Squat Machine', 'Legs', 'Quads', 'Plate-Loaded Machine', 'machine', { lo: 8, hi: 12, sec: ['Glutes'], cues: 'Feet mid-platform, sit deep, drive up.', miss: 'Heels lifting.', subs: ['legPress', 'smithSquat'] }),
    mk('legExtension', 'Leg Extension', 'Legs', 'Quads', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: [], cues: 'Pause at top, squeeze quads, slow down.', miss: 'Swinging the weight up.', subs: ['legPress'] }),
    mk('seatedLegCurl', 'Seated Leg Curl', 'Legs', 'Hamstrings', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: ['Calves'], cues: 'Hips planted, full squeeze, slow eccentric.', miss: 'Hips popping off the seat.', subs: ['lyingLegCurl'] }),
    mk('lyingLegCurl', 'Lying Leg Curl', 'Legs', 'Hamstrings', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: [], cues: 'Curl heels to glutes, no hip rise.', miss: 'Jerking.', subs: ['seatedLegCurl'] }),
    mk('hipThrustMachine', 'Hip Thrust Machine', 'Legs', 'Glutes', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: ['Hamstrings'], cues: 'Full lockout, squeeze glutes, ribs down.', miss: 'Overarching the back.', subs: ['gluteDriveMachine', 'cableGluteKickback'] }),
    mk('gluteDriveMachine', 'Glute Drive Machine', 'Legs', 'Glutes', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: ['Hamstrings'], cues: 'Drive through heels, pause at top.', miss: 'Short range of motion.', subs: ['hipThrustMachine'] }),
    mk('hipAbductor', 'Hip Abductor Machine', 'Legs', 'Glute Medius', 'Selectorized Machine', 'machine', { lo: 12, hi: 20, sec: [], cues: 'Slight forward lean, push knees out, control.', miss: 'Bouncing the stack.', subs: ['cableGluteKickback'] }),
    mk('hipAdductor', 'Hip Adductor Machine', 'Legs', 'Adductors', 'Selectorized Machine', 'machine', { lo: 12, hi: 20, sec: [], cues: 'Controlled squeeze in, slow open.', miss: 'Slamming the pads.', subs: ['legPress'] }),
    mk('calfRaiseMachine', 'Standing Calf Raise Machine', 'Legs', 'Calves', 'Selectorized Machine', 'machine', { lo: 10, hi: 15, sec: [], cues: 'Full stretch, pause at top.', miss: 'Bouncing.', subs: ['seatedCalf'] }),
    mk('seatedCalf', 'Seated Calf Raise', 'Legs', 'Soleus', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: [], cues: 'Deep stretch, squeeze the top.', miss: 'Partial reps.', subs: ['calfRaiseMachine'] }),
    mk('smithSquat', 'Smith Machine Squat', 'Legs', 'Quads', 'Smith Machine', 'machine', { lo: 8, hi: 12, inc: 10, sec: ['Glutes'], cues: 'Feet slightly forward, brace, hit depth.', miss: 'Knees caving in.', subs: ['hackSquat', 'legPress'] }),
    mk('cableGluteKickback', 'Cable Glute Kickback', 'Legs', 'Glutes', 'Cable Station', 'cable', { lo: 12, hi: 18, sec: ['Hamstrings'], cues: 'Hinge slightly, drive heel back, squeeze.', miss: 'Arching the lower back.', subs: ['gluteDriveMachine', 'hipThrustMachine'] }),

    // ---------------- CORE ----------------
    mk('abCrunchMachine', 'Ab Crunch Machine', 'Core', 'Abs', 'Selectorized Machine', 'machine', { lo: 12, hi: 20, sec: [], cues: 'Crunch through the abs, not the hip flexors.', miss: 'Pulling with the arms.', subs: ['cableCrunch', 'declineSitup'] }),
    mk('cableCrunch', 'Cable Crunch', 'Core', 'Abs', 'Cable Station', 'cable', { lo: 12, hi: 20, sec: [], cues: 'Kneel, round the spine down, hips fixed.', miss: 'Hinging at the hips instead of crunching.', subs: ['abCrunchMachine'] }),
    mk('torsoRotationMachine', 'Torso Rotation Machine', 'Core', 'Obliques', 'Selectorized Machine', 'machine', { lo: 12, hi: 18, sec: [], cues: 'Rotate from the trunk, controlled both ways.', miss: 'Yanking with the arms.', subs: ['cableCrunch'] }),
    mk('captainsChairLegRaise', "Captain's Chair Leg Raise", 'Core', 'Lower Abs', 'Captain\'s Chair', 'bodyweight', { lo: 8, hi: 15, inc: 0, sec: ['Hip Flexors'], cues: 'No swing, posterior pelvic tilt.', miss: 'Using momentum.', subs: ['declineSitup', 'plank'] }),
    mk('plank', 'Plank', 'Core', 'Abs', 'Bodyweight', 'bodyweight', { lo: 30, hi: 90, inc: 0, rest: 45, sec: ['Core'], cues: 'Seconds, not reps. Rigid line, brace hard.', miss: 'Sagging or piking hips.', subs: ['abCrunchMachine'] }),
    mk('declineSitup', 'Decline Sit-Up', 'Core', 'Abs', 'Decline Bench', 'bodyweight', { lo: 10, hi: 20, inc: 0, sec: ['Hip Flexors'], cues: 'Controlled down, no yanking the neck.', miss: 'Pulling the head.', subs: ['abCrunchMachine', 'cableCrunch'] }),

    // ---------------- FUNCTIONAL / TURF ----------------
    mk('sledPush', 'Sled Push', 'Functional', 'Full Body', 'Sled / Turf', 'functional', { lo: 1, hi: 1, rest: 90, inc: 10, sec: ['Quads', 'Glutes'], cues: 'Low body angle, drive in a straight line. Log a length as 1 rep.', miss: 'Standing too upright.', subs: ['farmersCarry', 'legPress'] }),
    mk('battleRopes', 'Battle Ropes', 'Functional', 'Conditioning', 'Battle Ropes', 'functional', { lo: 20, hi: 40, rest: 60, inc: 0, sec: ['Shoulders', 'Core'], cues: 'Seconds of waves. Athletic stance, brace.', miss: 'Going limp-armed.', subs: ['medBallSlam'] }),
    mk('kettlebellSwing', 'Kettlebell Swing', 'Functional', 'Posterior Chain', 'Kettlebell', 'functional', { lo: 12, hi: 20, rest: 60, sec: ['Glutes', 'Hamstrings'], cues: 'Hip snap, not a squat. Float to chest height.', miss: 'Squatting the swing.', subs: ['hipThrustMachine'] }),
    mk('medBallSlam', 'Medicine Ball Slam', 'Functional', 'Core', 'Medicine Ball', 'functional', { lo: 10, hi: 15, rest: 60, inc: 0, sec: ['Shoulders'], cues: 'Full overhead reach, slam through the floor.', miss: 'Half-hearted reach.', subs: ['battleRopes'] }),
    mk('farmersCarry', "Farmer's Carry", 'Functional', 'Grip / Core', 'Dumbbells / Handles', 'functional', { lo: 1, hi: 1, rest: 90, sec: ['Traps', 'Forearms'], cues: 'Tall posture, brace, walk a length = 1 rep.', miss: 'Leaning or shrugging.', subs: ['sledPush'] }),
  ];
  applyFedbImages(list);
  return list;
}

// ---- Machine/cable-first PPL split (sample) -------------------------------
function sampleSplit() {
  return {
    id: 'split_ppl', name: 'Push / Pull / Legs (Machine Focus)', type: 'PPL', _sample: true,
    days: [
      { weekday: 'Monday', kind: 'training', label: 'Push', location: 'OneLife Fitness', durationMin: 65, focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseIds: ['machineChestPress', 'machineInclinePress', 'pecDeck', 'machineShoulderPress', 'lateralRaiseMachine', 'cablePushdown'] },
      { weekday: 'Tuesday', kind: 'training', label: 'Pull', location: 'OneLife Fitness', durationMin: 65, focusMuscles: ['Back', 'Biceps', 'Rear Delts'], exerciseIds: ['latPulldown', 'seatedCableRow', 'chestSupportedRow', 'reversePecDeck', 'bicepCurlMachine', 'cableCurl'] },
      { weekday: 'Wednesday', kind: 'training', label: 'Legs', location: 'OneLife Fitness', durationMin: 70, focusMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'], exerciseIds: ['legPress', 'hackSquat', 'legExtension', 'seatedLegCurl', 'hipAbductor', 'calfRaiseMachine'] },
      { weekday: 'Thursday', kind: 'active', label: 'Active Recovery', location: 'Turf / Outdoors', durationMin: 35, focusMuscles: [], exerciseIds: [] },
      { weekday: 'Friday', kind: 'training', label: 'Push', location: 'OneLife Fitness', durationMin: 65, focusMuscles: ['Chest', 'Shoulders', 'Triceps'], exerciseIds: ['seatedChestPress', 'cableFly', 'machineShoulderPress', 'cableLateralRaise', 'overheadCableExt', 'tricepExtMachine'] },
      { weekday: 'Saturday', kind: 'training', label: 'Pull', location: 'OneLife Fitness', durationMin: 65, focusMuscles: ['Back', 'Biceps'], exerciseIds: ['assistedPullup', 'highRow', 'singleArmCableRow', 'rearDeltMachine', 'preacherCurlMachine', 'ropeHammerCurl'] },
      { weekday: 'Sunday', kind: 'rest', label: 'Rest', location: '', durationMin: 0, focusMuscles: [], exerciseIds: [] },
    ],
  };
}

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
    meta: { version: DATA_VERSION, seeded: false, demoMode: false, createdAt: T },
    profile: { name: 'Dominic', bodyWeightGoalLow: 178, bodyWeightGoalHigh: 185 },
    settings: { water: { weightLbs: 175, age: 21, activity: 'high', caffeineMg: 200, bottleOz: 32, manualTargetOz: null } },
    dailyLogs: {},
    tasks: [],
    // gym
    exercises: [],
    splits: [],
    activeSplitId: null,
    workoutTemplates: [],
    plannedWeek: null,
    workoutSessions: [],
    personalRecords: [],
    bodyWeightEntries: [],
    progressPhotos: [],
    // health
    supplements: [],
    supplementLog: {},
    waterLogs: {},
    sleepRecoveryLogs: [],
    // productivity (replaces the old AFTERGLOW founder dashboard)
    productivity: {
      weeklyGoals: [],
      deepWorkBlocks: [],
      priorityBacklog: [],
      followUps: [],
      lifeAdmin: [],
      habits: [],
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

// ---- Real-user starter state ---------------------------------------------
// First load should feel premium and personal, not fake. Keep the gym engine
// ready with the exercise library and a machine-first split, but leave the rest
// of the life OS empty until the user adds real data.
export function starterData() {
  const d = emptyData();
  d.exercises = exList();
  const split = sampleSplit();
  d.splits = [split];
  d.activeSplitId = split.id;
  return d;
}

// ---- Demo seed (clearly-labeled sample data) -----------------------------
export function seedData() {
  const d = emptyData();
  d.meta.seeded = true;
  d.meta.demoMode = true;

  d.dailyLogs[T] = {
    date: T, mode: 'Deep Work',
    priorities: [
      { id: 'p1', track: 'work', text: 'Ship the weekly report draft', done: false, _sample: true },
      { id: 'p2', track: 'body', text: 'Push day — chest press progression', done: false, _sample: true },
      { id: 'p3', track: 'school', text: 'Outline FI 311 case write-up', done: true, _sample: true },
    ],
    scorecard: { focus: 0, body: 0, mind: 0, recovery: 0 },
    reflection: { win: '', avoided: '', firstMove: '' },
    _sample: true,
  };

  d.tasks = [
    { id: 't1', title: 'Reply to 3 outstanding emails', category: 'Work', priority: 'high', due: T, done: false, _sample: true },
    { id: 't2', title: 'Meal prep — chicken, rice, eggs', category: 'Body', priority: 'med', due: T, done: false, _sample: true },
    { id: 't3', title: 'Pick up dry cleaning', category: 'Errand', priority: 'low', due: T, done: false, _sample: true },
    { id: 't4', title: 'FI 414 problem set 6', category: 'School', priority: 'med', due: todayKey(addDays(new Date(), 2)), done: false, _sample: true },
    { id: 't5', title: 'Book dentist appointment', category: 'Admin', priority: 'med', due: yesterday, done: true, _sample: true },
  ];

  // Gym
  d.exercises = exList();
  const split = sampleSplit();
  d.splits = [split];
  d.activeSplitId = split.id;

  const bwDays = lastNDays(7);
  const bwStart = 176.4;
  d.bodyWeightEntries = bwDays.map((dk, i) => ({
    id: 'bw_' + dk, date: dk, weight: +(bwStart + i * 0.18 + (i % 2 ? -0.3 : 0.2)).toFixed(1),
    notes: i === 0 ? 'Lean bulk baseline' : '', _sample: true,
  }));

  d.workoutSessions = [
    {
      id: 'sess_1', date: twoAgo, dayLabel: 'Push', completed: true, notes: 'Solid session',
      exercises: [
        { exerciseId: 'machineChestPress', sets: [{ weight: 150, reps: 10, done: true }, { weight: 150, reps: 10, done: true }, { weight: 150, reps: 9, done: true }, { weight: 150, reps: 9, done: true }], notes: '' },
        { exerciseId: 'machineInclinePress', sets: [{ weight: 110, reps: 11, done: true }, { weight: 110, reps: 10, done: true }, { weight: 110, reps: 9, done: true }], notes: '' },
      ],
      _sample: true,
    },
    {
      id: 'sess_2', date: yesterday, dayLabel: 'Pull', completed: true, notes: '',
      exercises: [
        { exerciseId: 'latPulldown', sets: [{ weight: 130, reps: 12, done: true }, { weight: 130, reps: 12, done: true }, { weight: 130, reps: 11, done: true }], notes: '' },
        { exerciseId: 'seatedCableRow', sets: [{ weight: 140, reps: 12, done: true }, { weight: 140, reps: 11, done: true }, { weight: 140, reps: 11, done: true }], notes: '' },
      ],
      _sample: true,
    },
  ];

  d.personalRecords = [
    { id: 'pr_1', exerciseId: 'legPress', weight: 360, reps: 12, date: twoAgo, e1rm: 504, _sample: true },
    { id: 'pr_2', exerciseId: 'latPulldown', weight: 130, reps: 12, date: yesterday, e1rm: 182, _sample: true },
  ];

  d.progressPhotos = [];

  // Health
  d.supplements = sampleSupplements();
  d.supplementLog[T] = { sup_vitd: true, sup_omega: true };
  d.sleepRecoveryLogs = [
    { id: 'sr_1', date: twoAgo, durationH: 7.5, quality: 4, rhr: 54, hrv: 78, steps: 9100, soreness: 2, mood: 4, readiness: 0, call: '', _sample: true },
    { id: 'sr_2', date: yesterday, durationH: 6.8, quality: 3, rhr: 57, hrv: 65, steps: 7400, soreness: 3, mood: 3, readiness: 0, call: '', _sample: true },
  ];

  // Productivity (general life execution — clearly-labeled samples)
  d.productivity.weeklyGoals = [
    { id: 'wg1', title: 'Lock in a consistent 6-day training week', category: 'Body', priority: 'high', status: 'In progress', due: todayKey(addDays(new Date(), 4)), nextAction: 'Pre-log Mon–Wed workouts', _sample: true },
    { id: 'wg2', title: 'Get ahead on FI 414 before the midterm', category: 'School', priority: 'high', status: 'Not started', due: todayKey(addDays(new Date(), 6)), nextAction: 'Block 2 study sessions', _sample: true },
    { id: 'wg3', title: 'Inbox to zero by Friday', category: 'Work', priority: 'med', status: 'In progress', due: todayKey(addDays(new Date(), 3)), nextAction: 'Clear the 3 flagged threads', _sample: true },
  ];
  d.productivity.deepWorkBlocks = [
    { id: 'dw1', title: 'Case write-up deep work', date: T, time: '9:00 AM', focus: 'School', status: 'Planned', notes: 'Phone in another room', _sample: true },
    { id: 'dw2', title: 'Weekly planning + review', date: todayKey(addDays(new Date(), 1)), time: '8:00 AM', focus: 'Admin', status: 'Planned', notes: '', _sample: true },
  ];
  d.productivity.priorityBacklog = [
    { id: 'pb1', title: 'Update résumé with spring internship', category: 'Work', priority: 'med', energy: 'medium', nextAction: 'Add bullet points', done: false, _sample: true },
    { id: 'pb2', title: 'Research summer sublease options', category: 'Personal', priority: 'low', energy: 'low', nextAction: 'List 3 listings', done: false, _sample: true },
    { id: 'pb3', title: 'Fix squeaky bike brakes', category: 'Errand', priority: 'low', energy: 'low', nextAction: 'Buy pads', done: false, _sample: true },
  ];
  d.productivity.followUps = [
    { id: 'fu1', person: 'Prof. Adams', action: 'Ask about case extension', due: todayKey(addDays(new Date(), 1)), status: 'Open', notes: 'After Friday lecture', _sample: true },
    { id: 'fu2', person: 'Landlord', action: 'Confirm lease renewal terms', due: todayKey(addDays(new Date(), 4)), status: 'Open', notes: '', _sample: true },
  ];
  d.productivity.lifeAdmin = [
    { id: 'la1', text: 'Renew car registration', type: 'Form', due: todayKey(addDays(new Date(), 12)), done: false, _sample: true },
    { id: 'la2', text: 'Return Amazon package', type: 'Errand', due: todayKey(addDays(new Date(), 2)), done: false, _sample: true },
    { id: 'la3', text: 'Dentist cleaning', type: 'Appointment', due: todayKey(addDays(new Date(), 9)), done: false, _sample: true },
  ];
  d.productivity.habits = [
    { id: 'hb1', name: 'In bed by 11:30', log: {}, _sample: true },
    { id: 'hb2', name: '10k steps', log: {}, _sample: true },
    { id: 'hb3', name: 'No phone first hour', log: {}, _sample: true },
    { id: 'hb4', name: 'Read 20 min', log: {}, _sample: true },
  ];
  // pre-tick a couple of today's habits so the weekly grid isn't empty
  d.productivity.habits[0].log[yesterday] = true;
  d.productivity.habits[1].log[yesterday] = true;
  d.productivity.habits[1].log[T] = true;

  // School
  d.classes = [
    { id: 'cl1', name: 'FI 311 — Financial Management', code: 'FI 311', professor: 'Dr. Adams', room: 'Eppley 110', schedule: 'MWF 10:20', _sample: true },
    { id: 'cl2', name: 'FI 414 — Advanced Business Finance', code: 'FI 414', professor: 'Dr. Ortiz', room: 'Bus Col N130', schedule: 'TR 12:40', _sample: true },
    { id: 'cl3', name: 'EC 302 — Intermediate Macro', code: 'EC 302', professor: 'Prof. Lee', room: 'Wells Hall', schedule: 'TR 3:00', _sample: true },
  ];
  d.assignments = [
    { id: 'as1', classId: 'cl1', title: 'Case write-up: WACC', due: todayKey(addDays(new Date(), 3)), done: false, _sample: true },
    { id: 'as2', classId: 'cl2', title: 'Problem set 6', due: todayKey(addDays(new Date(), 2)), done: false, _sample: true },
    { id: 'as3', classId: 'cl3', title: 'Reading response 4', due: todayKey(addDays(new Date(), 6)), done: false, _sample: true },
  ];
  d.exams = [{ id: 'ex1', classId: 'cl2', title: 'Midterm 2', date: todayKey(addDays(new Date(), 9)), _sample: true }];
  d.studyBlocks = [{ id: 'sb1', classId: 'cl2', day: 'Sunday', time: '4:00 PM', durationMin: 90, _sample: true }];

  // Admin
  d.adminReminders = [
    { id: 'ad1', text: 'Renew car registration', due: todayKey(addDays(new Date(), 12)), done: false, _sample: true },
    { id: 'ad2', text: 'Call landlord re: lease renewal', due: todayKey(addDays(new Date(), 4)), done: false, _sample: true },
  ];
  d.contacts = [
    { id: 'co1', name: 'Dr. Adams', role: 'FI 311 professor', contact: 'adams@msu.example', _sample: true },
    { id: 'co2', name: 'Mom', role: 'Family', contact: '—', _sample: true },
  ];
  d.subscriptions = [
    { id: 'su1', name: 'Spotify', cost: 11.99, cycle: 'monthly', renews: todayKey(addDays(new Date(), 8)), _sample: true },
    { id: 'su2', name: 'OneLife Fitness', cost: 49.99, cycle: 'monthly', renews: todayKey(addDays(new Date(), 15)), _sample: true },
    { id: 'su3', name: 'iCloud+', cost: 2.99, cycle: 'monthly', renews: '', _sample: true },
  ];

  d.weeklyReviews = [];
  d.monthlyReviews = [];
  return d;
}
