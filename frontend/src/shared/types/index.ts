import type { LucideIcon } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Language = 'si' | 'en';

export type Subject = 'chemistry' | 'physics' | 'biology';

export interface SubjectOption {
  id: Subject;
  label: string;
  icon: LucideIcon;
}

export interface NavItem {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export type ChatGroup = 'today' | 'yesterday' | 'previous7';
export type MessageRole = 'user' | 'assistant';
export type Feedback = 'up' | 'down' | null;

export interface Attachment {
  id: string;
  name: string;
  kind: 'image' | 'pdf';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  stopped?: boolean;
  feedback?: Feedback;
  saved?: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  group: ChatGroup;
  messages: Message[];
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
}

export interface UserProfile {
  name: string;
  plan: string;
  email: string;
  initials: string;
}

export type PopoverPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'right-end';
export type TooltipSide = 'right' | 'top' | 'bottom';