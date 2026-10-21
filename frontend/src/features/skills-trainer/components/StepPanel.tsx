import React from 'react';
import { Check } from 'lucide-react';
import { useLabT } from '../hooks/useLabT';
import type { LabActionEvent } from '../services/labEventBus';
import type { LabStringKey } from '../../../shared/i18n/skillsTrainerStrings';
import { MAX_READINGS } from '../hooks/useMomentsLab';

const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// Completion only means "the student performed this action", not that it was correct.
function completedSteps(events: LabActionEvent[]): boolean[] {
  const lastReset = events.map((e) => e.type).lastIndexOf('reset');
  const ev = events.slice(lastReset + 1);
  const placed = (item: string) => ev.some((e) => e.type === 'drop' && e.payload.item === item && e.payload.placed === true);
  const count = (type: string) => ev.filter((e) => e.type === type).length;
  return [
  placed('ruler'),
  placed('weight'),
  placed('stone'),
  count('read') > 0,
  count('record') >= MAX_READINGS,
  count('plot') > 0,
  count('submit_gradient') > 0,
  count('submit_mass') > 0];

}

export function currentStep(events: LabActionEvent[]): number {
  const i = completedSteps(events).indexOf(false);
  return i === -1 ? STEP_IDS.length : i;
}

export function StepPanel({ events }: {events: LabActionEvent[];}) {
  const t = useLabT();
  const done = completedSteps(events);
  const current = done.indexOf(false);
  const records = events.slice(events.map((e) => e.type).lastIndexOf('reset') + 1).filter((e) => e.type === 'record').length;

  return (
    <section className="rounded-2xl bg-surface border border-line shadow-soft p-4">
      <h2 className="text-sm font-semibold mb-3">{t('stepsTitle')}</h2>
      <ol className="space-y-1">
        {STEP_IDS.map((n, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          return (
            <li
              key={n}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex gap-3 rounded-xl p-2.5 transition-colors ${isCurrent ? 'bg-accent-soft' : ''}`}>
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isDone ? 'bg-accent-gradient text-white' : isCurrent ? 'border border-accent text-accent' : 'border border-line-strong text-ink-subtle'}`
                }>
                {isDone ? <Check size={14} aria-label={t('done')} /> : n}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${isDone ? 'text-ink-muted' : ''}`}>
                  {t(`step${n}Title` as LabStringKey)}
                  {n === 5 && <span className="ml-2 text-xs text-ink-subtle">{Math.min(records, MAX_READINGS)}/{MAX_READINGS}</span>}
                </p>
                {isCurrent && <p className="text-xs text-ink-muted mt-0.5">{t(`step${n}Desc` as LabStringKey)}</p>}
              </div>
            </li>);

        })}
      </ol>
    </section>);

}
