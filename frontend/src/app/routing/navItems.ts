import { FlaskConical, Sparkles, Target } from 'lucide-react';
import type { NavItem } from '../../shared/types/index';

// Primary navigation. Add, remove or rename tabs here — the sidebar renders this list.
export const navItems: NavItem[] = [
{
  id: 'lab-studio',
  label: 'Lab Studio',
  subtitle: 'Practice experiments',
  description: 'Run Chemistry, Physics and Biology practicals step by step in a safe virtual lab.',
  path: '/skills-trainer',
  icon: FlaskConical
},
{
  id: 'exam-arena',
  label: 'Exam Arena',
  subtitle: 'Test and predict',
  description: 'Timed past-paper practice with AI-predicted questions and instant marking.',
  path: '/assessment-engine',
  icon: Target
},
{
  id: 'learning-twin',
  label: 'My Learning Twin',
  subtitle: 'Your progress profile',
  description: 'A living profile of your strengths, gaps and the next best thing to study.',
  path: '/digital-twin',
  icon: Sparkles
}];