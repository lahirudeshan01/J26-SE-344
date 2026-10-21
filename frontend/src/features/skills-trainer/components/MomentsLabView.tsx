import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Breadcrumb, type Crumb } from './Breadcrumb';
import { MomentsBench } from './MomentsBench';
import { StepPanel, currentStep } from './StepPanel';
import { ReadingsTable } from './ReadingsTable';
import { GraphPanel } from './GraphPanel';
import { ActionLog } from './ActionLog';
import { useMomentsLab, MAX_READINGS } from '../hooks/useMomentsLab';
import { useLabT } from '../hooks/useLabT';
import type { LabStringKey } from '../../../shared/i18n/skillsTrainerStrings';

const NEXT_ITEM = ['ruler', 'weight', 'stone'] as const;

const card = 'rounded-2xl bg-surface border border-line shadow-soft p-4';
const primary =
'rounded-full bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-soft disabled:opacity-40 transition active:scale-95';
const input =
'w-28 rounded-lg border border-line-strong bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent';

export function MomentsLabView({ crumbs }: {crumbs: Crumb[];}) {
  const t = useLabT();
  const lab = useMomentsLab();
  const [gradient, setGradient] = useState('');
  const [mass, setMass] = useState('');
  const step = currentStep(lab.events);
  const hint = step < 8 ? t(`step${step + 1}Desc` as LabStringKey) : t('allDone');
  const hung = lab.items.ruler.placed && lab.items.weight.placed && lab.items.stone.placed;

  return (
    <div className="h-full overflow-y-auto scroll-quiet">
      <div className="w-full p-4 sm:p-6 space-y-4">
        <header className="mb-3">
          <Breadcrumb items={crumbs} compactParents />
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4 min-w-0">
            <section className={card}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">{t('benchTitle')}</h2>
                <button
                  onClick={lab.reset}
                  className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition">
                  <RotateCcw size={14} /> {t('reset')}
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-line bg-canvas">
                <MomentsBench
                  items={lab.items}
                  effective={lab.effective}
                  drag={lab.drag}
                  tiltDeg={lab.tiltDeg}
                  hint={hint}
                  nextItem={step < 3 ? NEXT_ITEM[step] : null}
                  onStartDrag={lab.startDrag}
                  onMoveDrag={lab.moveDrag}
                  onEndDrag={lab.endDrag}
                  onNudge={lab.nudge} />
              </div>
              <p className="text-xs text-ink-subtle mt-2">{t('benchHint')}</p>

              {hung &&
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="text-xs font-medium text-ink-muted">{t('adjustTitle')}</span>
                  {([['weight', 'y'], ['stone', 'x']] as const).map(([id, letter]) =>
                <div key={id} className="flex items-center gap-2">
                      <button aria-label={`${letter} ${t('decrease')}`} onClick={() => lab.nudge(id, -0.5 * Math.sign(lab.items[id].d))} className="h-8 w-8 rounded-full border border-line-strong bg-elevated text-base transition hover:border-accent active:scale-90">−</button>
                      <span className="w-24 text-center text-sm tabular-nums">{letter} = {Math.abs(lab.items[id].d).toFixed(1)} cm</span>
                      <button aria-label={`${letter} ${t('increase')}`} onClick={() => lab.nudge(id, 0.5 * Math.sign(lab.items[id].d))} className="h-8 w-8 rounded-full border border-line-strong bg-elevated text-base transition hover:border-accent active:scale-90">+</button>
                    </div>
                )}
                </div>
              }

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className={primary} onClick={lab.read} disabled={!lab.canRead}>{t('read')}</button>
                <button
                  className={primary}
                  onClick={lab.record}
                  disabled={!lab.reading || lab.records.length >= MAX_READINGS}>
                  {t('record')}
                </button>
                <p className="text-sm tabular-nums text-ink-muted" aria-live="polite">
                  {lab.reading ? `x = ${lab.reading.x} cm, y = ${lab.reading.y} cm` : t('readingEmpty')}
                </p>
              </div>
            </section>

            <ReadingsTable records={lab.records} />
            <div className="grid gap-4 md:grid-cols-2">
              <GraphPanel recordCount={lab.records.length} plotted={lab.plotted} onPlot={lab.plot} />
              <section className={card}>
                <h2 className="text-sm font-semibold mb-3">{t('resultTitle')}</h2>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {e.preventDefault();if (gradient.trim()) lab.submitGradient(gradient.trim());}}>
                  <label className="block text-xs text-ink-muted">{t('gradient')}</label>
                  <div className="flex items-center gap-2">
                    <input className={input} value={gradient} onChange={(e) => setGradient(e.target.value)} placeholder={t('gradientPlaceholder')} inputMode="decimal" />
                    <button className={primary} type="submit" disabled={!gradient.trim()}>{t('submit')}</button>
                    {lab.submitted.gradient && <span className="text-xs text-ink-subtle">{t('submitted')}</span>}
                  </div>
                </form>
                <form
                  className="space-y-3 mt-4"
                  onSubmit={(e) => {e.preventDefault();if (mass.trim()) lab.submitMass(mass.trim());}}>
                  <label className="block text-xs text-ink-muted">{t('massLabel')}</label>
                  <div className="flex items-center gap-2">
                    <input className={input} value={mass} onChange={(e) => setMass(e.target.value)} placeholder={t('massPlaceholder')} inputMode="decimal" />
                    <button className={primary} type="submit" disabled={!mass.trim()}>{t('submit')}</button>
                    {lab.submitted.mass && <span className="text-xs text-ink-subtle">{t('submitted')}</span>}
                  </div>
                </form>
              </section>
            </div>
          </div>

          <aside className="space-y-4">
            <StepPanel events={lab.events} />
            <ActionLog events={lab.events} />
          </aside>
        </div>
      </div>
    </div>);

}
