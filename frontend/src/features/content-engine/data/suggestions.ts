import { Lightbulb, ListChecks, NotebookPen, ScrollText } from 'lucide-react';
import type { Suggestion } from '../../../shared/types/index';

export const suggestions: Suggestion[] = [
{
  id: 'explain',
  title: 'Explain a concept',
  description: 'Simple Sinhala explanation of any A/L topic',
  prompt: 'ආම්ල-භස්ම අනුමාපනය සරල සිංහලෙන් පැහැදිලි කරන්න',
  icon: Lightbulb
},
{
  id: 'notes',
  title: 'Make short notes',
  description: 'Revision notes from the syllabus',
  prompt: 'Make short revision notes on photosynthesis for A/L Biology',
  icon: NotebookPen
},
{
  id: 'practice',
  title: 'Create practice questions',
  description: 'MCQ and structured, with answers',
  prompt: 'Create practice MCQs with answers on the mole concept',
  icon: ListChecks
},
{
  id: 'summarize',
  title: 'Summarize a lesson',
  description: 'Key points in minutes',
  prompt: "Summarize Newton's laws of motion with a worked example",
  icon: ScrollText
}];