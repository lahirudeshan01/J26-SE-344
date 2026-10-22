import { useCallback, useEffect, useRef, useState } from 'react';
import { useLabSession } from './useLabSession';

export type SampleId = 'cinnamon' | 'clove' | 'orange' | 'lemon';
export type PartId = 'flask' | 'thermometer' | 'condenser' | 'receiver';
export type FlowRate = 'slow' | 'medium' | 'fast';
export type HeatSource = 'steambath' | 'mantle' | 'bunsen';
export type FunnelState = 'empty' | 'loaded' | 'solvent' | 'shaken' | 'settled';
export type BusyKind = 'shake' | 'settle' | 'drain' | 'stand' | 'steam';

export const PARTS: PartId[] = ['flask', 'thermometer', 'condenser', 'receiver'];
export const SIM_SPEED = 30;
export const BOILING_C = 98;
export const AMBIENT_C = 25;
export const TARGET_DISTILLATE_ML = 30;
export const EXTRACTIONS_NEEDED = 3;
export const EXTRACT_ML = 10;
export const SCOOPS_NEEDED = 3;
export const EMPTY_FLASK_G = 48.62;

const TICK_S = 0.1;
const DROP_ML = 0.05;
const RESIDUAL_SOLVENT_G = 0.06;
const SOLVENT_ML_PER_S = 1.5;
const DCM_DENSITY = 1.33;
const BUSY_SECONDS: Record<BusyKind, number> = { shake: 1.6, settle: 2.5, drain: 2.2, stand: 6, steam: 6 };
// Hidden property of each sample (g of oil per 5 g); never shown directly.
const OIL_G_PER_5G: Record<SampleId, number> = { cinnamon: 0.12, clove: 0.35, orange: 0.1, lemon: 0.09 };

export interface LabState {
  week: 1 | 2;
  sample: SampleId | null;
  sampleG: number;
  massRecorded: number | null;
  grind: number;
  inFlask: boolean;
  cylinderMl: number;
  waterMl: number;
  parts: Record<PartId, boolean>;
  tap: boolean;
  flow: FlowRate;
  heating: boolean;
  power: number;
  temp: number;
  elapsedSim: number;
  dropsPerSec: number;
  distillateMl: number;
  firstDropTemp: number | null;
  endTemp: number | null;
  funnel: FunnelState;
  pressure: number;
  extractions: number;
  organicMl: number;
  scoops: number;
  stirred: number;
  stood: boolean;
  flaskOnBalance: boolean;
  emptyFlaskG: number | null;
  decanted: boolean;
  stillArranged: boolean;
  heatSource: HeatSource | null;
  bunsenBlocked: boolean;
  solventHeating: boolean;
  solventLeftMl: number;
  solventDone: boolean;
  outsideDried: boolean;
  mass1: number | null;
  steamed: boolean;
  mass2: number | null;
  busy: BusyKind | null;
  busyProgress: number;
}

const initialState = (): LabState => ({
  week: 1,
  sample: null,
  sampleG: 0,
  massRecorded: null,
  grind: 0,
  inFlask: false,
  cylinderMl: 0,
  waterMl: 0,
  parts: { flask: false, thermometer: false, condenser: false, receiver: false },
  tap: false,
  flow: 'slow',
  heating: false,
  power: 0,
  temp: AMBIENT_C,
  elapsedSim: 0,
  dropsPerSec: 0,
  distillateMl: 0,
  firstDropTemp: null,
  endTemp: null,
  funnel: 'empty',
  pressure: 0,
  extractions: 0,
  organicMl: 0,
  scoops: 0,
  stirred: 0,
  stood: false,
  flaskOnBalance: false,
  emptyFlaskG: null,
  decanted: false,
  stillArranged: false,
  heatSource: null,
  bunsenBlocked: false,
  solventHeating: false,
  solventLeftMl: 0,
  solventDone: false,
  outsideDried: false,
  mass1: null,
  steamed: false,
  mass2: null,
  busy: null,
  busyProgress: 0,
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

export function oilGrams(s: LabState): number {
  return round2(OIL_G_PER_5G[s.sample ?? 'cinnamon'] * ((s.massRecorded ?? 5) / 5));
}

export function balanceReading(s: LabState): number {
  if (!s.flaskOnBalance) return 0;
  if (s.emptyFlaskG === null) return EMPTY_FLASK_G;
  return round2(EMPTY_FLASK_G + (s.decanted ? s.organicMl * DCM_DENSITY + oilGrams(s) : 0));
}

export function completedSteps(s: LabState): boolean[] {
  return [
    s.massRecorded !== null,
    s.grind >= 100,
    s.inFlask && s.waterMl > 0,
    PARTS.every((p) => s.parts[p]),
    s.tap,
    s.distillateMl >= TARGET_DISTILLATE_ML && !s.heating && s.endTemp !== null,
    s.extractions >= EXTRACTIONS_NEEDED,
    s.stood,
    s.decanted,
    s.solventDone,
    s.mass2 !== null,
  ];
}

export function currentStep(s: LabState): number {
  const i = completedSteps(s).indexOf(false);
  return i === -1 ? completedSteps(s).length : i;
}

function finishBusy(s: LabState, kind: BusyKind): LabState {
  switch (kind) {
    case 'shake':
      return { ...s, funnel: 'shaken', pressure: s.pressure + 1 };
    case 'settle':
      return { ...s, funnel: 'settled' };
    case 'drain':
      return { ...s, funnel: 'loaded', extractions: s.extractions + 1, organicMl: s.organicMl + EXTRACT_ML };
    case 'stand':
      return { ...s, stood: true };
    case 'steam':
      return { ...s, steamed: true };
  }
}

function tick(s: LabState): LabState {
  const active = s.busy !== null || s.heating || s.solventHeating || s.temp > AMBIENT_C + 0.05;
  if (!active) return s;
  let n: LabState = { ...s };
  const dt = TICK_S;

  if (n.busy) {
    const p = n.busyProgress + dt / BUSY_SECONDS[n.busy];
    n = p >= 1 ? finishBusy({ ...n, busy: null, busyProgress: 0 }, n.busy) : { ...n, busyProgress: p };
  }

  if (n.heating) {
    const target = AMBIENT_C + n.power * 1.4;
    n.temp += (Math.min(target, BOILING_C) - n.temp) * Math.min(1, 0.5 * dt);
    n.elapsedSim += dt * SIM_SPEED;
    const boiling = n.temp >= BOILING_C - 0.5 && target > BOILING_C;
    if (boiling && n.tap) {
      const rate = (target - BOILING_C) * 0.016;
      n.dropsPerSec = rate;
      n.distillateMl = Math.min(n.waterMl * 0.8, n.distillateMl + rate * dt * SIM_SPEED * DROP_ML);
    } else {
      n.dropsPerSec = 0;
    }
  } else {
    n.dropsPerSec = 0;
    n.temp = n.temp - (n.temp - AMBIENT_C) * 0.1 * dt;
    if (n.temp < AMBIENT_C + 0.05) n.temp = AMBIENT_C;
  }

  if (n.solventHeating) {
    if (n.tap) n.solventLeftMl = Math.max(0, n.solventLeftMl - SOLVENT_ML_PER_S * dt);
    if (n.solventLeftMl <= 0) {
      n.solventHeating = false;
      n.solventDone = true;
    }
  }
  return n;
}

export function useSteamDistillationLab() {
  const { sessionId, events, emit } = useLabSession('chemistry-steam-distillation-42');
  const [s, setS] = useState<LabState>(initialState);
  const ref = useRef(s);
  ref.current = s;

  useEffect(() => {
    const id = window.setInterval(() => setS(tick), TICK_S * 1000);
    return () => window.clearInterval(id);
  }, []);

  // Milestones that happen inside the simulation clock are reported once.
  const prev = useRef({ busy: s.busy, drops: false, solventDone: false });
  useEffect(() => {
    if (prev.current.busy && !s.busy) emit('action', { name: `${prev.current.busy}_finished` });
    if (!prev.current.drops && s.distillateMl > 0) emit('action', { name: 'first_drop' });
    if (!prev.current.solventDone && s.solventDone) emit('action', { name: 'solvent_removed' });
    prev.current = { busy: s.busy, drops: s.distillateMl > 0, solventDone: s.solventDone };
  }, [s.busy, s.distillateMl, s.solventDone, emit]);

  const chooseSample = useCallback(
    (sample: SampleId) => {
      if (ref.current.massRecorded !== null) return;
      setS((p) => ({ ...p, sample, sampleG: p.sample === sample ? p.sampleG : 0 }));
      emit('drop', { item: `sample:${sample}`, target: 'balance' });
    },
    [emit]
  );

  const adjustSample = useCallback(
    (delta: number) => {
      const c = ref.current;
      if (!c.sample || c.massRecorded !== null) return;
      setS((p) => ({ ...p, sampleG: clamp(Math.round((p.sampleG + delta) * 10) / 10, 0, 12) }));
      emit('nudge', { item: 'sample', delta });
    },
    [emit]
  );

  const recordMass = useCallback(() => {
    const c = ref.current;
    if (!c.sample || c.sampleG <= 0 || c.massRecorded !== null) return;
    setS((p) => ({ ...p, massRecorded: p.sampleG }));
    emit('record', { what: 'sample_mass', value: c.sampleG, unit: 'g', sample: c.sample });
  }, [emit]);

  const grindStroke = useCallback(
    (distance: number) => {
      const c = ref.current;
      if (c.massRecorded === null || c.grind >= 100) return;
      const next = Math.min(100, c.grind + distance * 0.06);
      setS((p) => (p.massRecorded === null || p.grind >= 100 ? p : { ...p, grind: Math.min(100, p.grind + distance * 0.06) }));
      if (Math.floor(next / 25) !== Math.floor(c.grind / 25)) emit('action', { name: 'grind', progress: Math.floor(next) });
    },
    [emit]
  );

  const transferSample = useCallback(() => {
    const c = ref.current;
    if (c.grind < 100 || c.inFlask) return;
    setS((p) => ({ ...p, inFlask: true }));
    emit('drop', { item: 'ground_sample', target: 'flask' });
  }, [emit]);

  const adjustCylinder = useCallback(
    (delta: number) => {
      setS((p) => ({ ...p, cylinderMl: clamp(p.cylinderMl + delta, 0, 100) }));
      emit('nudge', { item: 'cylinder', delta });
    },
    [emit]
  );

  const pourWater = useCallback(() => {
    const c = ref.current;
    if (!c.inFlask || c.cylinderMl <= 0) return;
    setS((p) => ({ ...p, waterMl: p.waterMl + p.cylinderMl, cylinderMl: 0 }));
    emit('action', { name: 'pour_water', volumeMl: c.cylinderMl });
  }, [emit]);

  const placePart = useCallback(
    (part: PartId) => {
      if (ref.current.parts[part]) return;
      setS((p) => ({ ...p, parts: { ...p.parts, [part]: true } }));
      emit('drop', { item: part, placed: true });
    },
    [emit]
  );

  const toggleTap = useCallback(() => {
    setS((p) => ({ ...p, tap: !p.tap }));
    emit('action', { name: 'tap', open: !ref.current.tap });
  }, [emit]);

  const setFlow = useCallback(
    (flow: FlowRate) => {
      setS((p) => ({ ...p, flow }));
      emit('nudge', { item: 'flow', value: flow });
    },
    [emit]
  );

  const setPower = useCallback((power: number) => {
    setS((p) => ({ ...p, power: clamp(Math.round(power), 0, 100) }));
  }, []);

  const toggleHeat = useCallback(() => {
    const c = ref.current;
    const ready = PARTS.every((p) => c.parts[p]) && c.waterMl > 0 && c.inFlask;
    if (!c.heating && !ready) return;
    setS((p) => ({ ...p, heating: !p.heating }));
    emit('action', { name: 'heater', on: !c.heating, power: c.power });
  }, [emit]);

  const recordTemp = useCallback(
    (kind: 'first' | 'end') => {
      const c = ref.current;
      const value = Math.round(c.temp * 2) / 2;
      if (kind === 'first' && c.distillateMl > 0 && c.firstDropTemp === null) {
        setS((p) => ({ ...p, firstDropTemp: value }));
        emit('record', { what: 'temperature_first_drop', value, unit: 'C' });
      }
      if (kind === 'end' && c.distillateMl >= TARGET_DISTILLATE_ML && c.endTemp === null) {
        setS((p) => ({ ...p, endTemp: value }));
        emit('record', { what: 'temperature_end', value, unit: 'C', distillateMl: Math.round(c.distillateMl) });
      }
    },
    [emit]
  );

  const startWeek2 = useCallback(() => {
    const c = ref.current;
    if (!completedSteps(c).slice(0, 6).every(Boolean) || c.week === 2) return;
    setS((p) => ({ ...p, week: 2, heating: false }));
    emit('action', { name: 'start_week_2' });
  }, [emit]);

  const loadFunnel = useCallback(() => {
    const c = ref.current;
    if (c.week !== 2 || c.funnel !== 'empty' || c.distillateMl <= 0) return;
    setS((p) => ({ ...p, funnel: 'loaded' }));
    emit('drop', { item: 'distillate', target: 'separating_funnel' });
  }, [emit]);

  const addSolvent = useCallback(() => {
    const c = ref.current;
    if (c.funnel !== 'loaded' || c.extractions >= EXTRACTIONS_NEEDED || c.busy) return;
    setS((p) => ({ ...p, funnel: 'solvent' }));
    emit('drop', { item: 'dichloromethane', target: 'separating_funnel', volumeMl: EXTRACT_ML });
  }, [emit]);

  const startBusy = useCallback((kind: BusyKind) => setS((p) => (p.busy ? p : { ...p, busy: kind, busyProgress: 0 })), []);

  const shake = useCallback(() => {
    if (ref.current.funnel !== 'solvent' || ref.current.busy) return;
    startBusy('shake');
    emit('action', { name: 'shake' });
  }, [emit, startBusy]);

  const vent = useCallback(() => {
    if (ref.current.pressure === 0) return;
    setS((p) => ({ ...p, pressure: 0 }));
    emit('action', { name: 'vent' });
  }, [emit]);

  const settle = useCallback(() => {
    if (ref.current.funnel !== 'shaken' || ref.current.busy) return;
    startBusy('settle');
    emit('action', { name: 'settle' });
  }, [emit, startBusy]);

  const drain = useCallback(() => {
    if (ref.current.funnel !== 'settled' || ref.current.busy) return;
    startBusy('drain');
    emit('action', { name: 'drain_organic_layer' });
  }, [emit, startBusy]);

  const addDrying = useCallback(() => {
    const c = ref.current;
    if (c.extractions < EXTRACTIONS_NEEDED || c.stood || c.busy) return;
    setS((p) => ({ ...p, scoops: p.scoops + 1 }));
    emit('drop', { item: 'sodium_sulfate', scoops: c.scoops + 1 });
  }, [emit]);

  const swirl = useCallback(() => {
    const c = ref.current;
    if (c.scoops === 0 || c.stood) return;
    setS((p) => ({ ...p, stirred: p.stirred + 1 }));
    emit('action', { name: 'swirl' });
  }, [emit]);

  const stand = useCallback(() => {
    const c = ref.current;
    if (c.scoops === 0 || c.stood || c.busy) return;
    startBusy('stand');
    emit('action', { name: 'stand', scoops: c.scoops });
  }, [emit, startBusy]);

  const placeFlaskOnBalance = useCallback(() => {
    const c = ref.current;
    if (!c.stood || c.flaskOnBalance) return;
    setS((p) => ({ ...p, flaskOnBalance: true }));
    emit('drop', { item: 'empty_flask', target: 'balance' });
  }, [emit]);

  const recordEmptyFlask = useCallback(() => {
    const c = ref.current;
    if (!c.flaskOnBalance || c.emptyFlaskG !== null) return;
    setS((p) => ({ ...p, emptyFlaskG: EMPTY_FLASK_G }));
    emit('record', { what: 'empty_flask_mass', value: EMPTY_FLASK_G, unit: 'g' });
  }, [emit]);

  const decant = useCallback(() => {
    const c = ref.current;
    if (c.emptyFlaskG === null || c.decanted) return;
    setS((p) => ({ ...p, decanted: true, solventLeftMl: p.organicMl }));
    emit('drop', { item: 'dried_extract', target: 'round_bottom_flask' });
  }, [emit]);

  const arrangeStill = useCallback(() => {
    if (!ref.current.decanted || ref.current.stillArranged) return;
    setS((p) => ({ ...p, stillArranged: true }));
    emit('action', { name: 'arrange_still' });
  }, [emit]);

  const chooseHeatSource = useCallback(
    (source: HeatSource) => {
      if (!ref.current.decanted || ref.current.solventHeating) return;
      if (source === 'bunsen') {
        setS((p) => ({ ...p, bunsenBlocked: true }));
        emit('action', { name: 'unsafe_heat_source', source });
        return;
      }
      setS((p) => ({ ...p, heatSource: source, bunsenBlocked: false }));
      emit('action', { name: 'choose_heat_source', source });
    },
    [emit]
  );

  const toggleSolventHeat = useCallback(() => {
    const c = ref.current;
    if (!c.stillArranged || !c.heatSource || c.solventDone) return;
    setS((p) => ({ ...p, solventHeating: !p.solventHeating }));
    emit('action', { name: 'solvent_heater', on: !c.solventHeating, source: c.heatSource });
  }, [emit]);

  const dryOutside = useCallback(() => {
    if (!ref.current.solventDone || ref.current.outsideDried) return;
    setS((p) => ({ ...p, outsideDried: true }));
    emit('action', { name: 'dry_outside' });
  }, [emit]);

  const weighFlask = useCallback(() => {
    const c = ref.current;
    if (c.outsideDried && c.mass1 === null) {
      const value = round2(EMPTY_FLASK_G + oilGrams(c) + RESIDUAL_SOLVENT_G);
      setS((p) => ({ ...p, mass1: value }));
      emit('record', { what: 'flask_oil_before_warming', value, unit: 'g' });
    } else if (c.steamed && c.mass2 === null) {
      const value = round2(EMPTY_FLASK_G + oilGrams(c));
      setS((p) => ({ ...p, mass2: value }));
      emit('record', { what: 'flask_oil_after_warming', value, unit: 'g' });
    }
  }, [emit]);

  const warmOnSteamBath = useCallback(() => {
    const c = ref.current;
    if (c.mass1 === null || c.steamed || c.busy) return;
    startBusy('steam');
    emit('action', { name: 'warm_on_steam_bath' });
  }, [emit, startBusy]);

  const reset = useCallback(() => {
    emit('reset');
    setS(initialState());
  }, [emit]);

  return {
    ...s,
    sessionId,
    events,
    steps: completedSteps(s),
    step: currentStep(s),
    chooseSample,
    adjustSample,
    recordMass,
    grindStroke,
    transferSample,
    adjustCylinder,
    pourWater,
    placePart,
    toggleTap,
    setFlow,
    setPower,
    toggleHeat,
    recordTemp,
    startWeek2,
    loadFunnel,
    addSolvent,
    shake,
    vent,
    settle,
    drain,
    addDrying,
    swirl,
    stand,
    placeFlaskOnBalance,
    recordEmptyFlask,
    decant,
    arrangeStill,
    chooseHeatSource,
    toggleSolventHeat,
    dryOutside,
    weighFlask,
    warmOnSteamBath,
    reset,
  };
}

export type SteamLab = ReturnType<typeof useSteamDistillationLab>;
