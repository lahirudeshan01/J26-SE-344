import { useCallback, useMemo, useState } from 'react';
import { useLabSession } from './useLabSession';

export type ItemId = 'ruler' | 'weight' | 'stone';
export interface ItemState {
  placed: boolean;
  d: number; // signed cm from the knife edge (+ right)
}
export interface Point {
  x: number;
  y: number;
}
export interface Reading {
  x: number;
  y: number;
}

export const PX_PER_CM = 8;
export const PIVOT: Point = { x: 450, y: 300 };
export const BENCH_Y = 420;
export const KNOWN_MASS_G = 50;
export const MAX_READINGS = 6;
// Hidden property of the stone; never shown or compared in the UI.
const UNKNOWN_MASS_G = 70;
const MASS: Record<'weight' | 'stone', number> = { weight: KNOWN_MASS_G, stone: UNKNOWN_MASS_G };

const initialItems = (): Record<ItemId, ItemState> => ({
  ruler: { placed: false, d: 0 },
  weight: { placed: false, d: 0 },
  stone: { placed: false, d: 0 }
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function resolveDrop(id: ItemId, pt: Point, rulerPlaced: boolean): ItemState {
  if (id === 'ruler') return { placed: Math.abs(pt.y - PIVOT.y) < 60, d: 0 };
  if (!rulerPlaced || pt.y > BENCH_Y - 10 || pt.y < PIVOT.y - 140) return { placed: false, d: 0 };
  let d = clamp(Math.round(((pt.x - PIVOT.x) / PX_PER_CM) * 2) / 2, -48, 48);
  if (Math.abs(d) < 1) d = pt.x >= PIVOT.x ? 1 : -1;
  return { placed: true, d };
}

export function useMomentsLab() {
  const { sessionId, events, emit } = useLabSession('physics-moments-01');
  const [items, setItems] = useState(initialItems);
  const [drag, setDrag] = useState<({ id: ItemId } & Point) | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [records, setRecords] = useState<Reading[]>([]);
  const [plotted, setPlotted] = useState<Reading[] | null>(null);
  const [submitted, setSubmitted] = useState({ gradient: false, mass: false });

  const effective = useMemo(() => {
    if (!drag) return items;
    return { ...items, [drag.id]: resolveDrop(drag.id, drag, items.ruler.placed) };
  }, [items, drag]);

  const tiltDeg = useMemo(() => {
    if (!effective.ruler.placed) return 0;
    let net = 0;
    (['weight', 'stone'] as const).forEach((k) => {
      if (effective[k].placed) net += MASS[k] * effective[k].d;
    });
    if (Math.abs(net) < 40) return 0;
    return clamp(net * 0.04, -8, 8);
  }, [effective]);

  const startDrag = useCallback(
    (id: ItemId, pt: Point) => {
      setDrag({ id, ...pt });
      emit('drag_start', { item: id });
    },
    [emit]
  );

  const moveDrag = useCallback((pt: Point) => {
    setDrag((d) => (d ? { ...d, ...pt } : d));
  }, []);

  const endDrag = useCallback(
    (pt: Point) => {
      if (!drag) return;
      const next = resolveDrop(drag.id, pt, items.ruler.placed);
      setItems((prev) => ({ ...prev, [drag.id]: next }));
      setDrag(null);
      emit('drop', { item: drag.id, placed: next.placed, positionCm: next.d });
    },
    [drag, items.ruler.placed, emit]
  );

  const nudge = useCallback(
    (id: 'weight' | 'stone', delta: number) => {
      const cur = items[id];
      if (!cur.placed) return;
      let d = clamp(cur.d + delta, -48, 48);
      if (Math.abs(d) < 1) d = cur.d > 0 ? 1 : -1;
      setItems((prev) => ({ ...prev, [id]: { placed: true, d } }));
      emit('nudge', { item: id, positionCm: d });
    },
    [items, emit]
  );

  const canRead = items.ruler.placed && items.weight.placed && items.stone.placed && !drag;

  const read = useCallback(() => {
    if (!canRead) return;
    const r = { x: Math.abs(items.stone.d), y: Math.abs(items.weight.d) };
    setReading(r);
    emit('read', { ...r, tiltDeg });
  }, [canRead, items, tiltDeg, emit]);

  const record = useCallback(() => {
    if (!reading || records.length >= MAX_READINGS) return;
    setRecords((prev) => [...prev, reading]);
    emit('record', { index: records.length + 1, ...reading });
    setReading(null);
  }, [reading, records.length, emit]);

  const plot = useCallback(() => {
    if (records.length === 0) return;
    setPlotted(records);
    emit('plot', { points: records });
  }, [records, emit]);

  const submitGradient = useCallback(
    (value: string) => {
      emit('submit_gradient', { value });
      setSubmitted((s) => ({ ...s, gradient: true }));
    },
    [emit]
  );

  const submitMass = useCallback(
    (value: string) => {
      emit('submit_mass', { value, unit: 'g' });
      setSubmitted((s) => ({ ...s, mass: true }));
    },
    [emit]
  );

  const reset = useCallback(() => {
    emit('reset');
    setItems(initialItems());
    setReading(null);
    setRecords([]);
    setPlotted(null);
    setSubmitted({ gradient: false, mass: false });
  }, [emit]);

  return {
    sessionId,
    events,
    items,
    effective,
    drag,
    tiltDeg,
    reading,
    records,
    plotted,
    submitted,
    canRead,
    startDrag,
    moveDrag,
    endDrag,
    nudge,
    read,
    record,
    plot,
    submitGradient,
    submitMass,
    reset
  };
}
