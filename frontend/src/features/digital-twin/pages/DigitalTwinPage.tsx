import React from 'react';
import { Sparkles } from 'lucide-react';
import { ModulePlaceholder } from '../../../shared/components/ModulePlaceholder';
import { navItems } from '../../../app/routing/navItems';

export default function DigitalTwinPage() {
  const item = navItems.find((n) => n.id === 'learning-twin');

  // ─────────────────────────────────────────────────────────────
  // TODO: mount <LearningTwinModule /> here
  // Replace the placeholder below once the My Learning Twin module is ready.
  // ─────────────────────────────────────────────────────────────
  return (
    <ModulePlaceholder
      icon={item?.icon ?? Sparkles}
      title={item?.label ?? 'My Learning Twin'}
      description={item?.description ?? 'Your progress profile'} />);


}