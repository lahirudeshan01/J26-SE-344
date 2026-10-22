import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../app/providers/LanguageContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { MomentsLabView } from '../components/MomentsLabView';
import { SteamDistillationLabView } from '../components/SteamDistillationLabView';
import { practicals, subjects, type LabSubject } from '../data/practicals';
import { useLabT } from '../hooks/useLabT';

const tile =
'group text-left rounded-2xl bg-surface border border-line shadow-soft p-5 transition hover:shadow-float hover:-translate-y-0.5 active:scale-[0.99]';

export default function SkillsTrainerPage() {
  const t = useLabT();
  const { language } = useLanguage();
  const [subject, setSubject] = useState<LabSubject | null>(null);
  const [practicalId, setPracticalId] = useState<string | null>(null);

  const list = practicals.filter((p) => p.subject === subject);
  const subjectLabel = subject ? t(subjects.find((s) => s.id === subject)!.labelKey) : '';
  const home = () => {setSubject(null);setPracticalId(null);};

  if (practicalId === 'moments') {
    return (
      <MomentsLabView
        crumbs={[
          { label: t('studioTitle'), onClick: home },
          { label: subjectLabel, onClick: () => setPracticalId(null) },
          { label: t('labTitle') },
        ]}
      />
    );
  }

  if (practicalId === 'steam-distillation') {
    return (
      <SteamDistillationLabView
        crumbs={[
          { label: t('studioTitle'), onClick: home },
          { label: subjectLabel, onClick: () => setPracticalId(null) },
          { label: 'Extraction of essential oils by steam distillation' },
        ]}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto scroll-quiet">
      <div className="max-w-3xl p-4 sm:p-8 space-y-6">
        <header>
          <Breadcrumb
            items={subject ?
            [{ label: t('studioTitle'), onClick: home }, { label: subjectLabel }] :
            [{ label: t('studioTitle') }]} />
        </header>

        <h2 className="text-sm font-semibold text-ink-muted">{subject ? t('selectPractical') : t('selectSubject')}</h2>

        {!subject &&
        <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((s) =>
          <button key={s.id} className={tile} onClick={() => setSubject(s.id)}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-gradient text-white">
                  <s.icon size={22} />
                </span>
                <p className="mt-4 text-lg font-semibold">{t(s.labelKey)}</p>
              </button>
          )}
          </div>
        }

        {subject &&
        <ol className="space-y-3">
            {list.map((p, i) =>
          <li key={p.id}>
                <button
              className={`${tile} flex w-full items-center gap-4 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-soft disabled:cursor-not-allowed`}
              disabled={!p.available}
              onClick={() => setPracticalId(p.id)}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-sm font-semibold text-ink-muted tabular-nums">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 font-medium">{p.title[language]}</p>
                  {p.available ?
              <ChevronRight size={18} className="text-ink-subtle group-hover:text-accent transition" /> :
              <span className="shrink-0 rounded-full bg-elevated px-2.5 py-1 text-xs text-ink-subtle">{t('comingSoon')}</span>
              }
                </button>
              </li>
          )}
          </ol>
        }
      </div>
    </div>);

}
