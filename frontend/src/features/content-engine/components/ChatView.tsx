import React, { useRef } from 'react';
import { useChat } from '../hooks/ChatContext';
import { useLanguage } from '../../../app/providers/LanguageContext';
import { suggestions } from '../data/suggestions';
import { disclaimer, uiStrings } from '../../../shared/i18n/uiStrings';
import type { Suggestion } from '../../../shared/types/index';
import { ChatEmptyState } from './ChatEmptyState';
import { Composer, type ComposerHandle } from './Composer';
import { MessageList } from './MessageList';

export function ChatView() {
  const {
    activeConversation,
    isGenerating,
    subject,
    setSubject,
    sendMessage,
    stopGeneration,
    regenerate,
    setFeedback,
    toggleSaved
  } = useChat();
  const { language } = useLanguage();
  const strings = uiStrings[language];
  const composerRef = useRef<ComposerHandle>(null);
  const messages = activeConversation?.messages ?? [];

  const handleSuggestion = (suggestion: Suggestion) => {
    composerRef.current?.setText(suggestion.prompt);
  };

  const renderComposer = (variant: 'hero' | 'docked') =>
  <Composer
    ref={composerRef}
    variant={variant}
    onSubmit={(text, attachments) => sendMessage(text, attachments)}
    onStop={stopGeneration}
    isGenerating={isGenerating}
    subject={subject}
    onSubjectChange={setSubject}
    placeholder={strings.composerPlaceholder}
    autoFocus />;



  if (!activeConversation || messages.length === 0) {
    return (
      <ChatEmptyState
        greeting={strings.greeting}
        composer={renderComposer('hero')}
        suggestions={suggestions}
        onSelectSuggestion={handleSuggestion}
        disclaimer={disclaimer} />);


  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList
        key={activeConversation.id}
        messages={messages}
        isGenerating={isGenerating}
        onRegenerate={regenerate}
        onFeedback={setFeedback}
        onToggleSaved={toggleSaved} />
      
      <div className="shrink-0 px-4 pb-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {renderComposer('docked')}
          <p className="mt-2 text-center text-[12px] text-ink-subtle">{disclaimer}</p>
        </div>
      </div>
    </div>);

}