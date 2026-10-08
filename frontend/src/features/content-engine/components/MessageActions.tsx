import React from 'react';
import { BookmarkCheck, BookmarkPlus, Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCopyToClipboard } from '../../../shared/hooks/useCopyToClipboard';
import type { Feedback } from '../../../shared/types/index';
import { IconButton } from '../../../shared/components/IconButton';

interface MessageActionsProps {
  content: string;
  feedback: Feedback;
  saved: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onFeedback: (feedback: Feedback) => void;
  onToggleSaved: () => void;
}

export function MessageActions({
  content,
  feedback,
  saved,
  canRegenerate,
  onRegenerate,
  onFeedback,
  onToggleSaved
}: MessageActionsProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div role="toolbar" aria-label="Message actions" className="-ml-1.5 mt-3 flex items-center gap-0.5">
      <IconButton
        size="sm"
        tooltipSide="top"
        label={copied ? 'Copied' : 'Copy'}
        icon={copied ? <Check size={16} /> : <Copy size={16} />}
        onClick={() => copy(content)} />
      
      {canRegenerate &&
      <IconButton
        size="sm"
        tooltipSide="top"
        label="Regenerate"
        icon={<RotateCcw size={16} />}
        onClick={onRegenerate} />

      }
      <IconButton
        size="sm"
        tooltipSide="top"
        label="Good response"
        aria-pressed={feedback === 'up'}
        active={feedback === 'up'}
        icon={<ThumbsUp size={16} fill={feedback === 'up' ? 'currentColor' : 'none'} />}
        onClick={() => onFeedback('up')} />
      
      <IconButton
        size="sm"
        tooltipSide="top"
        label="Bad response"
        aria-pressed={feedback === 'down'}
        active={feedback === 'down'}
        icon={<ThumbsDown size={16} fill={feedback === 'down' ? 'currentColor' : 'none'} />}
        onClick={() => onFeedback('down')} />
      
      <IconButton
        size="sm"
        tooltipSide="top"
        label={saved ? 'Saved to notes' : 'Save to notes'}
        aria-pressed={saved}
        className={saved ? 'text-accent hover:text-accent' : undefined}
        icon={saved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
        onClick={onToggleSaved} />
      
    </div>);

}