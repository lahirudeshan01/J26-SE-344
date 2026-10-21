import React from 'react';
import { useLabT } from '../hooks/useLabT';
import { MAX_READINGS, type Reading } from '../hooks/useMomentsLab';

export function ReadingsTable({ records }: {records: Reading[];}) {
  const t = useLabT();
  const cols = Array.from({ length: MAX_READINGS }, (_, i) => records[i]);
  const cell = 'border border-line px-2 py-1.5 text-center tabular-nums';
  return (
    <section className="rounded-2xl bg-surface border border-line shadow-soft p-4">
      <h2 className="text-sm font-semibold mb-3">{t('tableTitle')}</h2>
      <div className="overflow-x-auto scroll-quiet">
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <th scope="row" className={`${cell} bg-elevated font-medium text-left`}>{t('rowX')}</th>
              {cols.map((r, i) => <td key={i} className={cell}>{r ? r.x : ''}</td>)}
            </tr>
            <tr>
              <th scope="row" className={`${cell} bg-elevated font-medium text-left`}>{t('rowY')}</th>
              {cols.map((r, i) => <td key={i} className={cell}>{r ? r.y : ''}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>);

}
