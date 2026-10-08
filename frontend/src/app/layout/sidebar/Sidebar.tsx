import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SquarePen } from 'lucide-react';
import { useChat } from '../../../features/content-engine/hooks/ChatContext';
import { useSidebar } from '../../providers/SidebarContext';
import { navItems } from '../../routing/navItems';
import { ChatHistoryList } from './ChatHistoryList';
import { SidebarActionItem } from './SidebarActionItem';
import { SidebarFooter } from './SidebarFooter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';

interface SidebarProps {
  collapsed: boolean;
  activePath: string;
  variant: 'rail' | 'drawer';
  onToggleCollapse: () => void;
  onRequestClose?: () => void;
}

export function Sidebar({ collapsed, activePath, variant, onToggleCollapse, onRequestClose }: SidebarProps) {
  const navigate = useNavigate();
  const { openSearch } = useSidebar();
  const { conversations, activeChatId, newChat, selectChat, renameChat, deleteChat } = useChat();
  const isChatRoute = activePath === '/content-engine';

  const handleNewChat = () => {
    newChat();
    navigate('/content-engine');
    onRequestClose?.();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    navigate('/content-engine');
    onRequestClose?.();
  };

  return (
    <div className="flex h-full w-full flex-col">
      <SidebarHeader
        collapsed={collapsed}
        variant={variant}
        onToggleCollapse={onToggleCollapse}
        onRequestClose={onRequestClose}
        onSearch={openSearch} />
      

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <ul className="space-y-0.5 px-3 pt-1">
        <li>
          <SidebarActionItem
            icon={SquarePen}
            label="New chat"
            collapsed={collapsed}
            active={isChatRoute && !activeChatId}
            onClick={handleNewChat} />
          
        </li>
        {collapsed &&
        <li>
            <SidebarActionItem icon={Search} label="Search chats" collapsed onClick={openSearch} />
          </li>
        }
      </ul>

      <SidebarNav items={navItems} activePath={activePath} collapsed={collapsed} onNavigate={onRequestClose} />

      {!collapsed && <div className="h-4" aria-hidden="true" />}

      {!collapsed &&
      <ChatHistoryList
        conversations={conversations}
        activeChatId={isChatRoute ? activeChatId : null}
        onSelect={handleSelectChat}
        onRename={renameChat}
        onDelete={deleteChat} />

      }
      </div>

      <SidebarFooter collapsed={collapsed} idPrefix={variant} />
    </div>);

}