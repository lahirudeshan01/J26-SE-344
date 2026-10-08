import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image as ImageIcon } from 'lucide-react';
import type { Feedback, Message } from '../../../shared/types/index';
import { EASE_OUT } from '../../../shared/utils/motion';
import { Avatar } from '../../../shared/components/Avatar';
import { MarkdownContent } from './MarkdownContent';
import { MessageActions } from './MessageActions';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
  canRegenerate: boolean;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, feedback: Feedback) => void;
  onToggleSaved: (messageId: string) => void;
}

export function MessageBubble({ message, canRegenerate, onRegenerate, onFeedback, onToggleSaved }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <motion.li
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        className="flex flex-col items-end gap-2">
        
        {message.attachments &&
        <ul className="flex flex-wrap justify-end gap-2" aria-label="Attachments">
            {message.attachments.map((file) =>
          <li
            key={file.id}
            className="flex max-w-[220px] items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-ink">
            
                {file.kind === 'pdf' ?
            <FileText size={16} className="shrink-0 text-ink-muted" /> :

            <ImageIcon size={16} className="shrink-0 text-ink-muted" />
            }
                <span className="truncate">{file.name}</span>
              </li>
          )}
          </ul>
        }
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[22px] rounded-br-lg bg-accent-soft px-4 py-2.5 text-[15px] leading-[1.6] text-ink sm:max-w-[75%]">
          {message.content}
        </div>
      </motion.li>);

  }

  const waiting = message.isStreaming && !message.content;

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
      className="flex gap-3 sm:gap-4">
      
      <Avatar variant="ai" size={28} className="mt-0.5" />
      <div className="min-w-0 flex-1 pt-0.5">
        <span className="sr-only">NeuroLearn AI said:</span>
        {waiting ? <TypingIndicator /> : <MarkdownContent content={message.content} />}
        {message.stopped && <p className="mt-2 text-[12px] text-ink-subtle">Response stopped</p>}
        {!message.isStreaming && message.content &&
        <MessageActions
          content={message.content}
          feedback={message.feedback ?? null}
          saved={Boolean(message.saved)}
          canRegenerate={canRegenerate}
          onRegenerate={() => onRegenerate(message.id)}
          onFeedback={(fb) => onFeedback(message.id, fb)}
          onToggleSaved={() => onToggleSaved(message.id)} />

        }
      </div>
    </motion.li>);

}