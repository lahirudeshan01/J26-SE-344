import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode } from
'react';
import { mockChats } from '../data/mockChats';
import { streamChatResponse } from '../services/chatService';
import type { Attachment, Conversation, Feedback, Message, Subject } from '../../../shared/types/index';
import { createId, deriveTitle } from '../utils/chat';

interface ChatContextValue {
  conversations: Conversation[];
  activeChatId: string | null;
  activeConversation: Conversation | null;
  isGenerating: boolean;
  subject: Subject | null;
  setSubject: (subject: Subject | null) => void;
  sendMessage: (text: string, attachments?: Attachment[]) => void;
  stopGeneration: () => void;
  regenerate: (messageId: string) => void;
  newChat: () => void;
  selectChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
  setFeedback: (messageId: string, feedback: Feedback) => void;
  toggleSaved: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: {children: ReactNode;}) {
  const [conversations, setConversations] = useState<Conversation[]>(mockChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState<Subject | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);
  const streamingRef = useRef<{chatId: string;messageId: string;} | null>(null);

  const updateMessage = useCallback(
    (chatId: string, messageId: string, updater: (m: Message) => Message) => {
      setConversations((prev) =>
      prev.map((c) =>
      c.id !== chatId ?
      c :
      { ...c, messages: c.messages.map((m) => m.id === messageId ? updater(m) : m) }
      )
      );
    },
    []
  );

  const finishStream = useCallback(
    (stopped: boolean) => {
      const current = streamingRef.current;
      if (current) {
        updateMessage(current.chatId, current.messageId, (m) => ({
          ...m,
          isStreaming: false,
          stopped: stopped || undefined
        }));
      }
      streamingRef.current = null;
      cancelRef.current = null;
      setIsGenerating(false);
    },
    [updateMessage]
  );

  const stopGeneration = useCallback(() => {
    if (!cancelRef.current) return;
    cancelRef.current();
    finishStream(true);
  }, [finishStream]);

  const startStream = useCallback(
    (chatId: string, prompt: string, history: Message[]) => {
      const messageId = createId('msg');
      const assistant: Message = {
        id: messageId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true,
        feedback: null
      };
      setConversations((prev) =>
      prev.map((c) => c.id === chatId ? { ...c, messages: [...c.messages, assistant] } : c)
      );
      streamingRef.current = { chatId, messageId };
      setIsGenerating(true);

      cancelRef.current = streamChatResponse(
        { prompt, subject, history },
        {
          onToken: (token) =>
          updateMessage(chatId, messageId, (m) => ({ ...m, content: m.content + token })),
          onDone: () => finishStream(false),
          onError: () => {
            updateMessage(chatId, messageId, (m) => ({
              ...m,
              content: m.content || 'Something went wrong while generating. Please try again.'
            }));
            finishStream(false);
          }
        }
      );
    },
    [subject, updateMessage, finishStream]
  );

  const sendMessage = useCallback(
    (text: string, attachments: Attachment[] = []) => {
      const content = text.trim();
      if (!content || isGenerating) return;

      const existing = activeChatId ? conversations.find((c) => c.id === activeChatId) : undefined;
      const chatId = existing?.id ?? createId('chat');
      const userMessage: Message = {
        id: createId('msg'),
        role: 'user',
        content,
        createdAt: Date.now(),
        attachments: attachments.length > 0 ? attachments : undefined
      };

      setConversations((prev) => {
        const current = prev.find((c) => c.id === chatId);
        const updated: Conversation = current ?
        { ...current, group: 'today', messages: [...current.messages, userMessage] } :
        { id: chatId, title: deriveTitle(content), group: 'today', messages: [userMessage] };
        return [updated, ...prev.filter((c) => c.id !== chatId)];
      });
      setActiveChatId(chatId);
      startStream(chatId, content, [...(existing?.messages ?? []), userMessage]);
    },
    [activeChatId, conversations, isGenerating, startStream]
  );

  const regenerate = useCallback(
    (messageId: string) => {
      if (isGenerating || !activeChatId) return;
      const conversation = conversations.find((c) => c.id === activeChatId);
      if (!conversation) return;
      const index = conversation.messages.findIndex((m) => m.id === messageId);
      if (index < 1) return;
      const history = conversation.messages.slice(0, index);
      const lastUser = [...history].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;

      setConversations((prev) =>
      prev.map((c) => c.id === conversation.id ? { ...c, messages: history } : c)
      );
      startStream(conversation.id, lastUser.content, history);
    },
    [activeChatId, conversations, isGenerating, startStream]
  );

  const newChat = useCallback(() => {
    stopGeneration();
    setActiveChatId(null);
  }, [stopGeneration]);

  const selectChat = useCallback(
    (chatId: string) => {
      if (chatId === activeChatId) return;
      stopGeneration();
      setActiveChatId(chatId);
    },
    [activeChatId, stopGeneration]
  );

  const renameChat = useCallback((chatId: string, title: string) => {
    const next = title.trim();
    if (!next) return;
    setConversations((prev) => prev.map((c) => c.id === chatId ? { ...c, title: next } : c));
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      if (streamingRef.current?.chatId === chatId) stopGeneration();
      setConversations((prev) => prev.filter((c) => c.id !== chatId));
      setActiveChatId((current) => current === chatId ? null : current);
    },
    [stopGeneration]
  );

  const setFeedback = useCallback(
    (messageId: string, feedback: Feedback) => {
      if (!activeChatId) return;
      updateMessage(activeChatId, messageId, (m) => ({
        ...m,
        feedback: m.feedback === feedback ? null : feedback
      }));
    },
    [activeChatId, updateMessage]
  );

  const toggleSaved = useCallback(
    (messageId: string) => {
      if (!activeChatId) return;
      updateMessage(activeChatId, messageId, (m) => ({ ...m, saved: !m.saved }));
    },
    [activeChatId, updateMessage]
  );

  useEffect(() => () => cancelRef.current?.(), []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeChatId) ?? null,
    [conversations, activeChatId]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      activeChatId,
      activeConversation,
      isGenerating,
      subject,
      setSubject,
      sendMessage,
      stopGeneration,
      regenerate,
      newChat,
      selectChat,
      renameChat,
      deleteChat,
      setFeedback,
      toggleSaved
    }),
    [
    conversations,
    activeChatId,
    activeConversation,
    isGenerating,
    subject,
    sendMessage,
    stopGeneration,
    regenerate,
    newChat,
    selectChat,
    renameChat,
    deleteChat,
    setFeedback,
    toggleSaved]

  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}