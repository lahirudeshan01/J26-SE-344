import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { SampleId } from '../../hooks/useSteamDistillationLab';

export interface Point {
  x: number;
  y: number;
}
export interface DragState extends Point {
  id: string;
}
export type StartDrag = (id: string) => (e: PointerEvent<SVGElement>) => void;

export const INK = 'rgb(var(--color-ink-muted))';
export const INK_SUBTLE = 'rgb(var(--color-ink-subtle))';
export const GLASS_FILL = 'rgb(var(--color-accent) / 0.07)';
export const SURFACE = 'rgb(var(--color-elevated))';
export const WATER = 'rgb(10 132 255 / 0.4)';
export const SOLVENT = 'rgb(94 92 230 / 0.35)';

export const SAMPLE_COLOR: Record<SampleId, string> = {
  cinnamon: '#a0522d',
  clove: '#4a2c1a',
  orange: '#f59e0b',
  lemon: '#eab308',
};

export function BenchSurface() {
  return (
    <g pointerEvents="none">
      <rect x={0} y={428} width={900} height={32} fill={SURFACE} />
      <line x1={0} y1={428} x2={900} y2={428} stroke="rgb(var(--color-ink) / 0.15)" />
    </g>
  );
}

interface DraggableProps {
  id: string;
  home: Point;
  drag: DragState | null;
  start: StartDrag;
  label: string;
  scale?: number;
  enabled?: boolean;
  onActivate?: () => void;
  children: ReactNode;
}

export function Draggable({ id, home, drag, start, label, scale = 1, enabled = true, onActivate, children }: DraggableProps) {
  const active = drag?.id === id;
  const pos = active && drag ? drag : home;
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (enabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onActivate?.();
    }
  };
  return (
    <g
      role="button"
      tabIndex={enabled ? 0 : -1}
      aria-label={label}
      aria-disabled={!enabled}
      transform={`translate(${pos.x} ${pos.y}) scale(${active ? 1 : scale})`}
      onPointerDown={enabled ? start(id) : undefined}
      onKeyDown={onKeyDown}
      style={{ cursor: enabled ? (active ? 'grabbing' : 'grab') : 'default', opacity: enabled ? 1 : 0.45, touchAction: 'none' }}
    >
      {children}
    </g>
  );
}

export function DropGuide({ x, y, r = 46, active }: { x: number; y: number; r?: number; active?: boolean }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill="rgb(var(--color-accent) / 0.06)"
      stroke="rgb(var(--color-accent))"
      strokeWidth={active ? 2.5 : 1.5}
      strokeDasharray="6 5"
      pointerEvents="none"
    />
  );
}

interface FlaskProps {
  cx: number;
  cy: number;
  id: string;
  r?: number;
  level?: number;
  liquid?: string;
  boiling?: boolean;
  children?: ReactNode;
}

export function RoundFlask({ cx, cy, id, r = 52, level = 0, liquid = WATER, boiling = false, children }: FlaskProps) {
  const top = cy - r - 62;
  const dy = Math.sqrt(r * r - 13 * 13);
  const outline = `M ${cx - 13} ${top} V ${cy - dy} A ${r} ${r} 0 1 0 ${cx + 13} ${cy - dy} V ${top}`;
  const h = 2 * r * level;
  return (
    <g>
      <clipPath id={id}>
        <circle cx={cx} cy={cy} r={r - 1.5} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r} fill={GLASS_FILL} />
      <rect x={cx - 13} y={top} width={26} height={cy - dy - top + 2} fill={GLASS_FILL} />
      {level > 0 && <rect x={cx - r} y={cy + r - h} width={2 * r} height={h} fill={liquid} clipPath={`url(#${id})`} />}
      <g clipPath={`url(#${id})`}>{children}</g>
      {boiling &&
        [-22, 0, 20].map((dx, i) => (
          <circle key={dx} cx={cx + dx} cy={cy + r - 10} r={3} fill="white" fillOpacity={0.8} clipPath={`url(#${id})`}>
            <animate attributeName="cy" from={cy + r - 10} to={cy + r - h + 4} dur={`${0.9 + i * 0.25}s`} repeatCount="indefinite" />
          </circle>
        ))}
      <path d={outline} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

interface ErlenmeyerProps {
  cx: number;
  baseY: number;
  id: string;
  level?: number;
  liquid?: string;
  children?: ReactNode;
}

export function ErlenmeyerFlask({ cx, baseY, id, level = 0, liquid = SOLVENT, children }: ErlenmeyerProps) {
  const top = baseY - 100;
  const outline = `M ${cx - 12} ${top} V ${baseY - 70} L ${cx - 45} ${baseY} H ${cx + 45} L ${cx + 12} ${baseY - 70} V ${top}`;
  const h = 100 * level;
  return (
    <g>
      <clipPath id={id}>
        <path d={`${outline} Z`} />
      </clipPath>
      <path d={`${outline} Z`} fill={GLASS_FILL} />
      {level > 0 && <rect x={cx - 50} y={baseY - h} width={100} height={h} fill={liquid} clipPath={`url(#${id})`} />}
      <g clipPath={`url(#${id})`}>{children}</g>
      <path d={outline} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

export function BeakerGlass({ cx, baseY, w = 90, h = 80, level = 0, liquid = WATER }: { cx: number; baseY: number; w?: number; h?: number; level?: number; liquid?: string }) {
  const lh = (h - 6) * level;
  return (
    <g>
      <rect x={cx - w / 2} y={baseY - h} width={w} height={h} rx={4} fill={GLASS_FILL} />
      {level > 0 && <rect x={cx - w / 2 + 2} y={baseY - lh - 2} width={w - 4} height={lh} fill={liquid} />}
      <path d={`M ${cx - w / 2 - 4} ${baseY - h} H ${cx - w / 2} V ${baseY - 4} Q ${cx - w / 2} ${baseY} ${cx - w / 2 + 4} ${baseY} H ${cx + w / 2 - 4} Q ${cx + w / 2} ${baseY} ${cx + w / 2} ${baseY - 4} V ${baseY - h} H ${cx + w / 2 + 4}`} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

export function Balance({ cx, baseY, reading, children }: { cx: number; baseY: number; reading: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={cx - 105} y={baseY - 46} width={210} height={46} rx={10} fill={SURFACE} stroke={INK} strokeWidth={2} />
      <rect x={cx - 58} y={baseY - 36} width={116} height={24} rx={5} fill="#0b1f14" />
      <text x={cx} y={baseY - 19} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={16} fill="#4ade80">
        {reading} g
      </text>
      <rect x={cx - 5} y={baseY - 62} width={10} height={17} fill={INK} />
      <ellipse cx={cx} cy={baseY - 64} rx={64} ry={8} fill={SURFACE} stroke={INK} strokeWidth={2} />
      <g transform={`translate(${cx} ${baseY - 72})`}>{children}</g>
    </g>
  );
}

export function SvgLabel({ x, y, children, anchor = 'start', fill = INK_SUBTLE }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={13} fill={fill} pointerEvents="none">
      {children}
    </text>
  );
}
