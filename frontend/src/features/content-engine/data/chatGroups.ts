import type { ChatGroup } from '../../../shared/types/index';

export const chatGroups: {id: ChatGroup;label: string;}[] = [
{ id: 'today', label: 'Today' },
{ id: 'yesterday', label: 'Yesterday' },
{ id: 'previous7', label: 'Previous 7 days' }];