import React from 'react';
import { useLabT } from '../hooks/useLabT';
import type { LabActionEvent } from '../services/labEventBus';

export function ActionLog({ events }: {events: LabActionEvent[];}) {
  const t = useLabT();
  const recent = events.slice(-8).reverse();
  return (
    <section className="rounded-2xl bg-surface border border-line shadow-soft p-4">
      <h2 className="text-sm font-semibold mb-2">{t('activityTitle')}</h2>
      {recent.length === 0 ?
      <p className="text-xs text-ink-subtle">{t('activityEmpty')}</p> :

      <ul className="space-y-1 font-mono text-[11px] text-ink-muted">
          {recent.map((e) =>
        <li key={e.id} className="truncate">
              <span className="text-accent">{e.type}</span> {JSON.stringify(e.payload)}
            </li>
        )}
        </ul>
      }
    </section>);

}
