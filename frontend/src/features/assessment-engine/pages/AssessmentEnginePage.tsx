import React from 'react';
import { Target } from 'lucide-react';
import { ModulePlaceholder } from '../../../shared/components/ModulePlaceholder';
import { navItems } from '../../../app/routing/navItems';

export default function AssessmentEnginePage() {
  const item = navItems.find((n) => n.id === 'exam-arena');

  // ─────────────────────────────────────────────────────────────
  // TODO: mount <ExamArenaModule /> here
  // Replace the placeholder below once the Exam Arena module is ready.
  // ─────────────────────────────────────────────────────────────
  return (
    <ModulePlaceholder
      icon={item?.icon ?? Target}
      title={item?.label ?? 'Exam Arena'}
      description={item?.description ?? 'Test and predict'} />);


}