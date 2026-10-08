// Mock streaming chat API for the Content Generation Engine.
// Keep the same signature when swapping in the real backend / RAG pipeline:
// call onToken for each chunk, onDone at the end, and return a cancel function.

import { mockResponses, type MockResponseKey } from '../data/mockResponses';
import type { Message, Subject } from '../../../shared/types/index';

export interface StreamRequest {
  prompt: string;
  subject: Subject | null;
  history: Message[];
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

const THINKING_DELAY_MS = 650;

export function streamChatResponse(request: StreamRequest, handlers: StreamHandlers): () => void {
  let cancelled = false;
  const timers: number[] = [];

  try {
    const response = mockResponses[pickResponseKey(request.prompt, request.subject)];
    const tokens = response.split(/(\s+)/).filter((t) => t.length > 0);
    let index = 0;

    const tick = () => {
      if (cancelled) return;
      if (index >= tokens.length) {
        handlers.onDone();
        return;
      }
      // Emit a word together with its trailing whitespace.
      let chunk = tokens[index++];
      while (index < tokens.length && /^\s+$/.test(tokens[index])) {
        chunk += tokens[index++];
      }
      handlers.onToken(chunk);
      timers.push(window.setTimeout(tick, 14 + Math.random() * 26));
    };

    timers.push(window.setTimeout(tick, THINKING_DELAY_MS));
  } catch (error) {
    handlers.onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }

  return () => {
    cancelled = true;
    timers.forEach((t) => window.clearTimeout(t));
  };
}

function pickResponseKey(prompt: string, subject: Subject | null): MockResponseKey {
  const p = prompt.toLowerCase();
  if (/mcq|practice|question|ප්‍රශ්න/.test(p)) return 'practice';
  if (/titrat|acid|base|අනුමාපන|ආම්ල|භස්ම/.test(p)) return 'titration';
  if (/newton|force|motion|බලය|චලිත/.test(p)) return 'newton';
  if (/photosynth|chlorophyll|ප්‍රභාසංශ්ලේෂ/.test(p)) return 'photosynthesis';
  if (subject === 'chemistry') return 'titration';
  if (subject === 'physics') return 'newton';
  if (subject === 'biology') return 'photosynthesis';
  return 'general';
}