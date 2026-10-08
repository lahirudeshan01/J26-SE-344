import React from 'react';
import type { NavItem } from '../../../shared/types/index';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarNavProps {
  items: NavItem[];
  activePath: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ items, activePath, collapsed, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Learning modules" className="px-3 pb-2 pt-0.5">
      <ul className="space-y-1.5">
        {items.map((item) =>
        <li key={item.id}>
            <SidebarNavItem
            item={item}
            collapsed={collapsed}
            active={activePath === item.path || activePath.startsWith(`${item.path}/`)}
            onNavigate={onNavigate} />
          
          </li>
        )}
      </ul>
    </nav>);

}