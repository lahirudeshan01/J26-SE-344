import React from 'react';
import { FlaskConical } from 'lucide-react';
import { ModulePlaceholder } from '../../../shared/components/ModulePlaceholder';
import { navItems } from '../../../app/routing/navItems';

export default function SkillsTrainerPage() {
  const item = navItems.find((n) => n.id === 'lab-studio');

  // ─────────────────────────────────────────────────────────────
  // TODO: mount <VirtualLabModule /> here
  // Replace the placeholder below once the Lab Studio module is ready.
  // ─────────────────────────────────────────────────────────────
  return (
    <ModulePlaceholder
      icon={item?.icon ?? FlaskConical}
      title={item?.label ?? 'Lab Studio'}
      description={item?.description ?? 'Practice experiments'} />);


}