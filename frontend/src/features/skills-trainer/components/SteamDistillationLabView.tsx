import { Check, RotateCcw } from 'lucide-react';
import { Breadcrumb, type Crumb } from './Breadcrumb';
import { ActionLog } from './ActionLog';
import { SteamBench } from './steam/SteamBench';
import { SteamControls } from './steam/SteamControls';
import { useSteamDistillationLab, completedSteps } from '../hooks/useSteamDistillationLab';
import { useSteamStrings } from '../hooks/useSteamStrings';
import { WEEK_ONE_LAST_STEP, steamSteps } from '../data/steamDistillation';

export function SteamDistillationLabView({ crumbs }: { crumbs: Crumb[] }) {
  const t = useSteamStrings();
  const lab = useSteamDistillationLab();
  const done = completedSteps(lab);
  const finished = lab.step >= steamSteps.length;
  const g = (v: number | null, d = 2, unit = 'g') => (v === null ? '—' : `${v.toFixed(d)} ${unit}`);
  const loss = lab.mass1 !== null && lab.mass2 !== null ? lab.mass1 - lab.mass2 : null;

  const rows: [string, string][] = [
    [t.table.sampleMass, g(lab.massRecorded)],
    [t.table.water, lab.waterMl ? `${lab.waterMl} mL` : '—'],
    [t.table.firstDrop, g(lab.firstDropTemp, 1, '°C')],
    [t.table.endTemp, g(lab.endTemp, 1, '°C')],
    [t.table.distillate, lab.distillateMl > 0 ? `${lab.distillateMl.toFixed(1)} mL` : '—'],
    [t.table.flowRate, lab.distillateMl > 0 ? lab.flow : '—'],
    [t.table.emptyFlask, g(lab.emptyFlaskG)],
    [t.table.flaskOil, g(lab.mass1)],
    [t.table.flaskOilDry, g(lab.mass2)],
    [t.table.loss, g(loss)],
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={crumbs} compactParents />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{t.benchTitle}</h2>
              <button
                onClick={lab.reset}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-elevated px-3 py-1.5 text-sm transition hover:border-accent active:scale-95"
              >
                <RotateCcw size={14} /> {t.reset}
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-elevated">
              <SteamBench lab={lab} />
            </div>
            {!finished && lab.step < steamSteps.length && (
              <p className="mt-3 text-sm text-ink-muted">
                <span className="font-medium text-ink">{t.steps[steamSteps[lab.step]].title}.</span>{' '}
                {t.steps[steamSteps[lab.step]].desc} <span className="text-ink-subtle">{t.dragHint}</span>
              </p>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <SteamControls lab={lab} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold">{t.readingsTitle}</h3>
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line py-1 text-sm">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold">{t.stepsTitle}</h3>
            <ol className="space-y-1.5">
              {steamSteps.map((id, i) => {
                const isDone = done[i];
                const current = i === lab.step;
                return (
                  <li key={id}>
                    {(i === 0 || i === WEEK_ONE_LAST_STEP + 1) && (
                      <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                        {i === 0 ? t.week1 : t.week2}
                      </p>
                    )}
                    <div
                      aria-current={current ? 'step' : undefined}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${current ? 'bg-accent-soft font-medium' : ''} ${isDone ? 'text-ink-muted' : ''}`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${isDone ? 'bg-accent-gradient text-white' : 'border border-line-strong'}`}
                      >
                        {isDone ? <Check size={12} /> : i + 1}
                      </span>
                      {t.steps[id].title}
                    </div>
                  </li>
                );
              })}
            </ol>
            {finished && <p className="mt-3 text-sm font-medium text-accent">{t.allDone}</p>}
          </section>
          <ActionLog events={lab.events} />
        </aside>
      </div>
    </div>
  );
}
