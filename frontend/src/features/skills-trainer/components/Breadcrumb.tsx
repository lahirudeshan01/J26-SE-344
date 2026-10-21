import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  onClick?: () => void;
}

export function Breadcrumb({ items, compactParents = false }: {items: Crumb[];compactParents?: boolean;}) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-xl font-medium">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={compactParents ? 14 : 16} className="shrink-0 text-ink-subtle" aria-hidden />}
              <li className={`${last ? 'min-w-0 truncate font-semibold text-ink' : 'shrink-0'} ${compactParents && !last ? 'text-sm' : ''}`} aria-current={last ? 'page' : undefined}>
                {last || !c.onClick ?
                c.label :
                <button onClick={c.onClick} className="text-ink-subtle hover:text-ink transition">{c.label}</button>
                }
              </li>
            </React.Fragment>);

        })}
      </ol>
    </nav>);

}
