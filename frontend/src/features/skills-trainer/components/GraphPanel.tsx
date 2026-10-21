import React from 'react';
import { useLabT } from '../hooks/useLabT';
import type { Reading } from '../hooks/useMomentsLab';

const W = 360;
const H = 260;
const M = { l: 40, r: 16, t: 14, b: 36 };
const MAX = 50;

interface Props {
  recordCount: number;
  plotted: Reading[] | null;
  onPlot: () => void;
}

export function GraphPanel({ recordCount, plotted, onPlot }: Props) {
  const t = useLabT();
  const sx = (v: number) => M.l + v / MAX * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - v / MAX * (H - M.t - M.b);
  const ticks = [0, 10, 20, 30, 40, 50];

  return (
    <section className="rounded-2xl bg-surface border border-line shadow-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{t('graphTitle')}</h2>
        <button
          onClick={onPlot}
          disabled={recordCount === 0}
          className="rounded-full bg-accent-gradient px-4 py-1.5 text-xs font-medium text-white shadow-soft disabled:opacity-40 transition active:scale-95">
          {t('plot')}
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={t('graphTitle')}>
        {ticks.map((v) =>
        <g key={v}>
            <line x1={sx(v)} x2={sx(v)} y1={M.t} y2={H - M.b} stroke="var(--color-line)" />
            <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} stroke="var(--color-line)" />
            <text x={sx(v)} y={H - M.b + 14} textAnchor="middle" fontSize={10} fill="rgb(var(--color-ink-subtle))">{v}</text>
            <text x={M.l - 6} y={sy(v) + 3} textAnchor="end" fontSize={10} fill="rgb(var(--color-ink-subtle))">{v}</text>
          </g>
        )}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="rgb(var(--color-ink-muted))" />
        <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke="rgb(var(--color-ink-muted))" />
        <text x={W - M.r} y={H - 6} textAnchor="end" fontSize={11} fill="rgb(var(--color-ink-muted))">x (cm)</text>
        <text x={M.l + 6} y={M.t + 8} fontSize={11} fill="rgb(var(--color-ink-muted))">y (cm)</text>
        {plotted?.map((p, i) =>
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill="rgb(var(--color-accent))" stroke="rgb(var(--color-surface))" strokeWidth={1.5} />
        )}
      </svg>
      {!plotted && <p className="text-xs text-ink-subtle mt-2">{t('graphEmpty')}</p>}
    </section>);

}
