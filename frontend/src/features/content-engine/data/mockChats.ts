import type { Conversation } from '../../../shared/types/index';
import { mockResponses } from './mockResponses';

export const mockChats: Conversation[] = [
{
  id: 'chat-titration',
  title: 'ආම්ල-භස්ම අනුමාපනය',
  group: 'today',
  messages: [
  { id: 'm-t1', role: 'user', content: 'ආම්ල-භස්ම අනුමාපනය සරල සිංහලෙන් පැහැදිලි කරන්න', createdAt: 1 },
  { id: 'm-t2', role: 'assistant', content: mockResponses.titration, createdAt: 2, feedback: null }]

},
{
  id: 'chat-newton',
  title: "Newton's laws summary",
  group: 'today',
  messages: [
  { id: 'm-n1', role: 'user', content: "Summarize Newton's laws of motion with a worked example", createdAt: 1 },
  { id: 'm-n2', role: 'assistant', content: mockResponses.newton, createdAt: 2, feedback: null }]

},
{
  id: 'chat-photosynthesis',
  title: 'ප්‍රභාසංශ්ලේෂණය — කෙටි සටහන්',
  group: 'yesterday',
  messages: [
  { id: 'm-p1', role: 'user', content: 'ප්‍රභාසංශ්ලේෂණය ගැන කෙටි සටහන් දෙන්න', createdAt: 1 },
  { id: 'm-p2', role: 'assistant', content: mockResponses.photosynthesis, createdAt: 2, feedback: null }]

},
{
  id: 'chat-mole',
  title: 'Mole concept practice MCQs',
  group: 'yesterday',
  messages: [
  { id: 'm-m1', role: 'user', content: 'Give me practice MCQs on the mole concept', createdAt: 1 },
  { id: 'm-m2', role: 'assistant', content: mockResponses.practice, createdAt: 2, feedback: null }]

},
{
  id: 'chat-induction',
  title: 'විද්‍යුත් චුම්භක ප්‍රේරණය',
  group: 'previous7',
  messages: [
  { id: 'm-e1', role: 'user', content: 'විද්‍යුත් චුම්භක ප්‍රේරණය පාඩම revise කරන්නේ කොහොමද?', createdAt: 1 },
  { id: 'm-e2', role: 'assistant', content: mockResponses.general, createdAt: 2, feedback: null }]

},
{
  id: 'chat-organic',
  title: 'Organic reaction mechanisms',
  group: 'previous7',
  messages: [
  { id: 'm-o1', role: 'user', content: 'How should I study organic reaction mechanisms?', createdAt: 1 },
  { id: 'm-o2', role: 'assistant', content: mockResponses.general, createdAt: 2, feedback: null }]

},
{
  id: 'chat-cell',
  title: 'Mitosis vs meiosis',
  group: 'previous7',
  messages: [
  { id: 'm-c1', role: 'user', content: "What's the best way to revise mitosis vs meiosis?", createdAt: 1 },
  { id: 'm-c2', role: 'assistant', content: mockResponses.general, createdAt: 2, feedback: null }]

}];