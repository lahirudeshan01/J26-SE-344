import { Atom, Leaf, TestTube } from 'lucide-react';
import type { SubjectOption } from '../../../shared/types/index';

export const subjects: SubjectOption[] = [
{ id: 'chemistry', label: 'Chemistry', icon: TestTube },
{ id: 'physics', label: 'Physics', icon: Atom },
{ id: 'biology', label: 'Biology', icon: Leaf }];