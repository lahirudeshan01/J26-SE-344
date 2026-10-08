import React, {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent } from
'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, FileText, Image as ImageIcon, Plus, Square, X } from 'lucide-react';
import { subjects } from '../data/subjects';
import type { Attachment, Subject } from '../../../shared/types/index';
import { createId } from '../utils/chat';
import { cn, focusRing } from '../../../shared/utils/cn';
import { EASE_OUT } from '../../../shared/utils/motion';
import { IconButton } from '../../../shared/components/IconButton';
import { MenuItem } from '../../../shared/components/MenuItem';
import { Popover } from '../../../shared/components/Popover';
import { SubjectChips } from './SubjectChips';

export interface ComposerHandle {
  focus: () => void;
  setText: (text: string) => void;
}

interface ComposerProps {
  onSubmit: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  isGenerating: boolean;
  subject: Subject | null;
  onSubjectChange: (subject: Subject | null) => void;
  placeholder: string;
  variant?: 'hero' | 'docked';
  autoFocus?: boolean;
}

const LINE_HEIGHT = 24;
const MAX_LINES = 6;
const VERTICAL_PADDING = 16;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + VERTICAL_PADDING;

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
{
  onSubmit,
  onStop,
  isGenerating,
  subject,
  onSubjectChange,
  placeholder,
  variant = 'docked',
  autoFocus = false
},
ref)
{
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [value, setValue] = useState('');

  const canSend = value.trim().length > 0 && !isGenerating;
  const closeAttach = useCallback(() => setAttachOpen(false), []);

  const focusAtEnd = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: focusAtEnd,
      setText: (text: string) => {
        setValue(text);
        requestAnimationFrame(focusAtEnd);
      }
    }),
    [focusAtEnd]
  );

  // Clicking empty space inside the composer focuses the text field
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, [role="menu"]')) return;
    e.preventDefault();
    focusAtEnd();
  };

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  const submit = () => {
    if (!canSend) return;
    onSubmit(value, attachments);
    setValue('');
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const handleFiles = (kind: Attachment['kind']) => (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files.map((f) => ({ id: createId('file'), name: f.name, kind }))]);
    e.target.value = '';
    textareaRef.current?.focus();
  };

  const pickFile = (input: HTMLInputElement | null) => {
    setAttachOpen(false);
    input?.click();
  };

  const active = isGenerating || canSend;

  return (
    <div
      onMouseDown={handleContainerMouseDown}
      className={cn(
        'relative z-10 cursor-text rounded-[28px] border border-line bg-surface/75 backdrop-blur-xl transition-[box-shadow,border-color] duration-200 focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/10',
        variant === 'hero' ? 'shadow-float' : 'shadow-soft'
      )}>
      
      <div className="px-4 pt-3">
        <SubjectChips options={subjects} value={subject} onChange={onSubjectChange} />
      </div>

      {attachments.length > 0 &&
      <ul className="flex flex-wrap gap-2 px-4 pt-3" aria-label="Attached files">
          {attachments.map((file) =>
        <li
          key={file.id}
          className="flex max-w-[240px] items-center gap-2 rounded-xl bg-ink/[0.05] py-1.5 pl-3 pr-1.5 text-[13px] text-ink">
          
              {file.kind === 'pdf' ?
          <FileText size={15} className="shrink-0 text-ink-muted" /> :

          <ImageIcon size={15} className="shrink-0 text-ink-muted" />
          }
              <span className="truncate">{file.name}</span>
              <button
            type="button"
            aria-label={`Remove ${file.name}`}
            onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== file.id))}
            className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-ink/[0.08] hover:text-ink', focusRing)}>
            
                <X size={13} />
              </button>
            </li>
        )}
        </ul>
      }

      <div className="flex items-end gap-1.5 p-2">
        <IconButton
          ref={attachRef}
          size="lg"
          label="Add photos or files"
          tooltipSide="top"
          aria-haspopup="menu"
          aria-expanded={attachOpen}
          active={attachOpen}
          icon={<Plus size={20} strokeWidth={1.75} />}
          onClick={() => setAttachOpen((o) => !o)} />
        
        <label htmlFor={textareaId} className="sr-only">
          Message NeuroLearn AI
        </label>
        <textarea
          id={textareaId}
          ref={textareaRef}
          rows={1}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="scroll-quiet min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-ink-subtle" />
        
        <motion.button
          type="button"
          whileTap={active ? { scale: 0.92 } : undefined}
          transition={{ duration: 0.12 }}
          onClick={isGenerating ? onStop : submit}
          disabled={!active}
          aria-label={isGenerating ? 'Stop generating' : 'Send message'}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-200',
            active ?
            'bg-accent-gradient text-white shadow-[0_4px_14px_rgba(10,132,255,0.35)]' :
            'cursor-not-allowed bg-ink/[0.08] text-ink-subtle',
            focusRing
          )}>
          
          <AnimatePresence mode="wait" initial={false}>
            {isGenerating ?
            <motion.span
              key="stop"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}>
              
                <Square size={13} fill="currentColor" strokeWidth={0} />
              </motion.span> :

            <motion.span
              key="send"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}>
              
                <ArrowUp size={20} strokeWidth={2.25} />
              </motion.span>
            }
          </AnimatePresence>
        </motion.button>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles('image')} />
      <input ref={pdfInputRef} type="file" accept="application/pdf" multiple hidden onChange={handleFiles('pdf')} />

      <Popover open={attachOpen} onClose={closeAttach} anchorRef={attachRef} placement="top-start" label="Attach">
        <MenuItem icon={<ImageIcon size={16} />} onClick={() => pickFile(imageInputRef.current)}>
          Upload image
        </MenuItem>
        <MenuItem icon={<FileText size={16} />} onClick={() => pickFile(pdfInputRef.current)}>
          Upload PDF
        </MenuItem>
      </Popover>
    </div>);

});