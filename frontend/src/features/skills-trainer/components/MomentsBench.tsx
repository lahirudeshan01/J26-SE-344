import React, { useEffect, useRef, useState } from 'react';
import { useLabT } from '../hooks/useLabT';
import {
  BENCH_Y,
  PIVOT,
  PX_PER_CM,
  type ItemId,
  type ItemState,
  type Point } from
'../hooks/useMomentsLab';

interface Props {
  items: Record<ItemId, ItemState>;
  effective: Record<ItemId, ItemState>;
  drag: ({ id: ItemId } & Point) | null;
  tiltDeg: number;
  hint: string;
  nextItem: ItemId | null;
  onStartDrag: (id: ItemId, pt: Point) => void;
  onMoveDrag: (pt: Point) => void;
  onEndDrag: (pt: Point) => void;
  onNudge: (id: 'weight' | 'stone', delta: number) => void;
}

const TRAY_POS: Record<'weight' | 'stone', Point> = {
  weight: { x: 110, y: BENCH_Y - 22 },
  stone: { x: 790, y: BENCH_Y - 22 }
};
const STRING_LEN = 56;
const RULER_TRAY_DY = 162;
const EASE = 'transform 0.4s cubic-bezier(.2,.8,.2,1)';

// Damped spring so the ruler swings and settles like a real one.
function useSpring(target: number) {
  const [value, setValue] = useState(target);
  const s = useRef({ x: target, v: 0, t: target });
  s.current.t = target;
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const st = s.current;
      st.v += (-90 * (st.x - st.t) - 9 * st.v) * dt;
      st.x += st.v * dt;
      if (Math.abs(st.x - st.t) < 0.005 && Math.abs(st.v) < 0.01) {
        st.x = st.t;
        st.v = 0;
        setValue(st.x);
        return;
      }
      setValue(st.x);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function Body({ id }: {id: 'weight' | 'stone';}) {
  if (id === 'weight') {
    return (
      <g>
        <rect x={-17} y={-20} width={34} height={40} rx={7} fill="url(#metal)" stroke="rgba(0,0,0,.35)" />
        <rect x={-12} y={-17} width={6} height={34} rx={3} fill="rgba(255,255,255,.3)" />
        <text y={9} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1d1d1f" opacity={0.75}>50 g</text>
      </g>);

  }
  return (
    <g>
      <polygon
        points="-20,6 -14,-12 -2,-20 14,-15 21,-2 16,14 0,20 -14,16"
        fill="url(#stone)"
        stroke="rgba(0,0,0,.4)" />
      <polyline points="-10,-8 -2,-2 8,-6" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1.5} strokeLinecap="round" />
    </g>);

}

export function MomentsBench({ items, effective, drag, tiltDeg, hint, nextItem, onStartDrag, onMoveDrag, onEndDrag, onNudge }: Props) {
  const t = useLabT();
  const svgRef = useRef<SVGSVGElement>(null);
  const rulerPlaced = effective.ruler.placed;
  const angleDeg = useSpring(rulerPlaced ? tiltDeg : 0);
  const a = angleDeg * Math.PI / 180;
  const allHung = items.ruler.placed && items.weight.placed && items.stone.placed;
  const level = allHung && !drag && Math.abs(angleDeg) < 0.15 && tiltDeg === 0;

  const toSvg = (e: React.PointerEvent): Point => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const begin = (id: ItemId) => (e: React.PointerEvent) => {
    if (id === 'ruler' && items.ruler.placed) return;
    e.preventDefault();
    svgRef.current!.setPointerCapture(e.pointerId);
    onStartDrag(id, toSvg(e));
  };

  const onKey = (id: 'weight' | 'stone') => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {e.preventDefault();onNudge(id, -0.5);}
    if (e.key === 'ArrowRight') {e.preventDefault();onNudge(id, 0.5);}
  };

  const rulerDragging = drag?.id === 'ruler';
  const rulerTy = rulerDragging ? drag.y - PIVOT.y : items.ruler.placed ? 0 : RULER_TRAY_DY;
  const ticks = Array.from({ length: 101 }, (_, i) => i);

  const hangPoint = (d: number): Point => ({
    x: PIVOT.x + d * PX_PER_CM * Math.cos(a),
    y: PIVOT.y + d * PX_PER_CM * Math.sin(a)
  });

  const renderMass = (id: 'weight' | 'stone') => {
    const dragging = drag?.id === id;
    const eff = effective[id];
    const label = t(id);
    const hung = eff.placed && rulerPlaced;

    if (hung) {
      const p = hangPoint(eff.d);
      return (
        <g
          key={id}
          style={{ transform: `translate(${p.x}px, ${p.y}px)`, cursor: dragging ? 'grabbing' : 'grab', outline: 'none' }}
          tabIndex={0}
          role="slider"
          aria-label={label}
          aria-valuemin={-48}
          aria-valuemax={48}
          aria-valuenow={eff.d}
          onPointerDown={begin(id)}
          onKeyDown={onKey(id)}
          className="focus-visible:[&_.ring]:opacity-100">
          <line x1={0} y1={0} x2={0} y2={STRING_LEN} stroke="#6e6e73" strokeWidth={1.2} />
          <circle r={3.5} fill="#6e6e73" />
          <rect x={-30} y={STRING_LEN - 2} width={60} height={STRING_LEN + 12} fill="transparent" />
          <g
            transform={`translate(0 ${STRING_LEN + 20}) scale(${dragging ? 1.08 : 1})`}
            filter={dragging ? 'url(#lift)' : undefined}>
            <Body id={id} />
          </g>
          <rect className="ring opacity-0 transition-opacity" x={-26} y={STRING_LEN - 8} width={52} height={56} rx={12} fill="none" stroke="rgb(var(--color-accent))" strokeWidth={2} />
        </g>);

    }
    if (dragging) {
      return (
        <g key={id} style={{ transform: `translate(${drag.x}px, ${drag.y}px)`, cursor: 'grabbing' }} filter="url(#lift)">
          <g transform="scale(1.1)"><Body id={id} /></g>
        </g>);

    }
    const p = TRAY_POS[id];
    return (
      <g
        key={id}
        style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: EASE, cursor: 'grab', outline: 'none' }}
        onPointerDown={begin(id)}
        tabIndex={0}
        role="button"
        aria-label={label}>
        {nextItem === id && <circle r={36} fill="rgb(var(--color-accent) / 0.12)" stroke="rgb(var(--color-accent))" strokeWidth={2} className="animate-pulse" />}
        <ellipse cy={22} rx={22} ry={4} fill="rgba(0,0,0,.18)" />
        <Body id={id} />
      </g>);

  };

  const renderDim = (id: 'weight' | 'stone') => {
    const st = effective[id];
    if (!st.placed || !rulerPlaced) return null;
    const p = hangPoint(st.d);
    const yy = PIVOT.y - 46;
    const letter = id === 'weight' ? 'y' : 'x';
    const mid = (PIVOT.x + p.x) / 2;
    return (
      <g key={`dim-${id}`} stroke="rgb(var(--color-accent))" strokeOpacity={0.85} strokeWidth={1.2} fill="none" pointerEvents="none">
        <line x1={PIVOT.x} x2={PIVOT.x} y1={yy - 6} y2={PIVOT.y - 12} strokeDasharray="3 3" />
        <line x1={p.x} x2={p.x} y1={yy - 6} y2={p.y - 8} strokeDasharray="3 3" />
        <line x1={PIVOT.x} x2={p.x} y1={yy} y2={yy} />
        <text x={mid} y={yy - 7} textAnchor="middle" fontSize={12} fontWeight={600} stroke="none" fill="rgb(var(--color-accent))">
          {letter} = {Math.abs(st.d).toFixed(1)} {t('distanceCm')}
        </text>
      </g>);

  };

  const massDragging = drag && drag.id !== 'ruler';

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox="0 0 900 500"
        className="w-full h-auto max-h-[64vh] select-none touch-none"
        role="img"
        aria-label={t('benchTitle')}
        onPointerMove={(e) => drag && onMoveDrag(toSvg(e))}
        onPointerUp={(e) => drag && onEndDrag(toSvg(e))}
        onPointerCancel={(e) => drag && onEndDrag(toSvg(e))}>
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--color-canvas))" />
            <stop offset="1" stopColor="rgb(var(--color-elevated))" />
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3dca4" />
            <stop offset="0.6" stopColor="#e0b96e" />
            <stop offset="1" stopColor="#c99a50" />
          </linearGradient>
          <linearGradient id="block" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c9a46e" />
            <stop offset="0.5" stopColor="#dcbb86" />
            <stop offset="1" stopColor="#b88f57" />
          </linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9a9aa0" />
            <stop offset="0.5" stopColor="#e5e5ea" />
            <stop offset="1" stopColor="#8e8e93" />
          </linearGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d8d8dd" />
            <stop offset="1" stopColor="#8e8e93" />
          </linearGradient>
          <radialGradient id="stone" cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#c7c7cc" />
            <stop offset="1" stopColor="#6e6e73" />
          </radialGradient>
          <filter id="lift" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.28" />
          </filter>
          <filter id="soft" x="-10%" y="-100%" width="120%" height="400%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>

        <rect width={900} height={BENCH_Y} fill="url(#wall)" />
        <rect x={0} y={BENCH_Y} width={900} height={80} fill="rgb(var(--color-elevated))" />
        <rect x={0} y={BENCH_Y} width={900} height={6} fill="rgba(0,0,0,.08)" />
        <line x1={0} x2={900} y1={BENCH_Y} y2={BENCH_Y} stroke="var(--color-line-strong)" />
        <text x={16} y={BENCH_Y + 66} fontSize={12} fill="rgb(var(--color-ink-subtle))">{t('tray')}</text>

        {/* wooden block and knife edge */}
        <ellipse cx={PIVOT.x} cy={BENCH_Y + 2} rx={52} ry={5} fill="rgba(0,0,0,.2)" />
        <rect x={420} y={PIVOT.y + 30} width={60} height={BENCH_Y - PIVOT.y - 30} rx={3} fill="url(#block)" stroke="rgba(0,0,0,.25)" />
        <polygon points={`${PIVOT.x - 14},${PIVOT.y + 30} ${PIVOT.x},${PIVOT.y + 8} ${PIVOT.x + 14},${PIVOT.y + 30}`} fill="url(#steel)" stroke="rgba(0,0,0,.35)" />
        <text x={PIVOT.x} y={BENCH_Y + 20} textAnchor="middle" fontSize={11} fill="rgb(var(--color-ink-muted))">{t('knife')}</text>

        {/* drop-zone guides */}
        {rulerDragging &&
        <rect
          x={36} y={PIVOT.y - 26} width={828} height={52} rx={14}
          fill={effective.ruler.placed ? 'rgb(var(--color-accent) / 0.14)' : 'none'}
          stroke="rgb(var(--color-accent))" strokeWidth={2} strokeDasharray="8 6" />
        }
        {massDragging && rulerPlaced &&
        <rect
          x={50} y={PIVOT.y - 12} width={800} height={24} rx={12}
          fill={effective[drag.id].placed ? 'rgb(var(--color-accent) / 0.18)' : 'none'}
          stroke="rgb(var(--color-accent))" strokeWidth={2} strokeDasharray="6 5" />
        }
        {!items.ruler.placed && !rulerDragging && nextItem === 'ruler' &&
        <rect x={40} y={PIVOT.y + RULER_TRAY_DY - 14} width={820} height={28} rx={10} fill="rgb(var(--color-accent) / 0.1)" stroke="rgb(var(--color-accent))" strokeWidth={2} className="animate-pulse" pointerEvents="none" />
        }

        {/* ruler */}
        <g style={{ transform: `translateY(${rulerTy}px)`, transition: rulerDragging ? 'none' : EASE }}>
          <g
            transform={`rotate(${rulerPlaced ? angleDeg : 0} ${PIVOT.x} ${PIVOT.y})`}
            style={{ cursor: items.ruler.placed ? 'default' : rulerDragging ? 'grabbing' : 'grab' }}
            onPointerDown={begin('ruler')}
            filter={rulerDragging ? 'url(#lift)' : 'url(#soft)'}
            role="img"
            aria-label={t('ruler')}>
            <rect x={50} y={PIVOT.y - 8} width={800} height={16} rx={3} fill="url(#wood)" stroke="rgba(0,0,0,.35)" />
            {ticks.map((i) => {
              const x = 50 + i * PX_PER_CM;
              const len = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4;
              return <line key={i} x1={x} x2={x} y1={PIVOT.y - 8} y2={PIVOT.y - 8 + len} stroke="rgba(0,0,0,.65)" strokeWidth={i % 10 === 0 ? 1 : 0.7} />;
            })}
            {ticks.filter((i) => i % 10 === 0 && i > 0 && i < 100).map((i) =>
            <text key={i} x={50 + i * PX_PER_CM} y={PIVOT.y + 6} textAnchor="middle" fontSize={8} fontWeight={600} fill="rgba(0,0,0,.7)">{i}</text>
            )}
          </g>
        </g>

        {renderDim('weight')}
        {renderDim('stone')}
        {renderMass('weight')}
        {renderMass('stone')}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-2 px-3">
        <div className="max-w-full rounded-full bg-surface border border-line px-4 py-1.5 text-xs text-ink shadow-soft">
          {hint}
        </div>
        {level &&
        <div className="rounded-full bg-accent-gradient px-3 py-1 text-xs font-medium text-white shadow-soft">
            {t('level')}
          </div>
        }
      </div>
    </div>);

}
