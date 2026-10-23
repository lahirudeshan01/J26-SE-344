import type { LucideIcon } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Language = 'si' | 'en';

export type Subject = 'chemistry' | 'physics' | 'biology';

export interface SubjectOption {
  id: Subject;
  label: string;
  icon: LucideIcon;
}

export interface NavItem {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export type ChatGroup = 'today' | 'yesterday' | 'previous7';
export type MessageRole = 'user' | 'assistant';
export type Feedback = 'up' | 'down' | null;

export interface Attachment {
  id: string;
  name: string;
  kind: 'image' | 'pdf';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  stopped?: boolean;
  feedback?: Feedback;
  saved?: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  group: ChatGroup;
  messages: Message[];
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
}

export interface UserProfile {
  name: string;
  plan: string;
  email: string;
  initials: string;
}

export type PopoverPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'right-end';
export type TooltipSide = 'right' | 'top' | 'bottom';
// Assessment Engine types
export interface AssessmentSubjectSummary {
    id: string;
    name: string;
    description?: string;
    questionCount: number;
    topicCount?: number;
    syllabusVersion?: string;
    [key: string]: unknown;
}

export interface QuestionOption {
    id?: string;
    value?: string;
    label?: string;
    text?: string;
    [key: string]: unknown;
}

export interface AssessmentQuestion {
    questionId: string;
    subject?: string;
    questionText?: string;
    question?: string;
    prompt?: string;
    options: QuestionOption[];
    maxMarks?: number;
    marks?: number;
    topicId?: string;
    topicName?: string;
    mainTopicName?: string;
    subtopicName?: string;
    imagePath?: string | null;
    expertDifficulty?: number;
    difficultyLevel?: string;
    [key: string]: unknown;
}

export interface AssessmentSession {
    sessionId: string;
    studentId?: string;
    subject?: string;
    status?: string;
    askedQuestionIds: string[];
    targetDifficulty: number;
    [key: string]: unknown;
}

export interface ChemistrySubtopic {
    id: string;
    name: string;
    questionCount: number;
    [key: string]: unknown;
}

export interface ChemistryTopic {
    id: string;
    name: string;
    questionCount: number;
    subtopics: ChemistrySubtopic[];
    [key: string]: unknown;
}

export interface ChemistrySyllabusCategory {
    id: string;
    name: string;
    description?: string;
    questionCount: number;
    topics: ChemistryTopic[];
    [key: string]: unknown;
}

export interface ProgressSummary {
    totalSessions: number;
    totalAttempts: number;
    completedSessions: number;
    [key: string]: unknown;
}

export interface TopicPerformance {
    topicId: string;
    topicName: string;
    correct: number;
    attempted: number;
    score: number;
    maxMarks: number;
    accuracy: number | null;
}

export interface AssessmentResults {
    session: AssessmentSession;
    summary: {
        totalScore?: number;
        maxScore?: number;
        attemptedCount?: number;
        correctCount?: number;
        accuracy?: number | null;
        abilityEstimate?: number;
        completed?: boolean;
        [key: string]: unknown;
    };
    attemptedQuestions?: unknown[];
    topicPerformance?: TopicPerformance[];
    message?: string;
    [key: string]: unknown;
}

export interface GradePredictionResponse {
    predictedGrade?: string | null;
    predictedMarks?: number | null;
    modelType?: string;
    status?: string;
    message?: string;
    metrics?: {
        mae?: number | null;
        rmse?: number | null;
        r2?: number | null;
    } | null;
    ruleBasedReadiness?: {
        readinessBadge?: string;
        readinessLevel?: string;
        summary?: string;
        topicCoveragePercent?: number;
        readinessScore?: number;
    } | null;
    [key: string]: unknown;
}

export interface RevisionPriority {
    topicId?: string;
    topicName?: string;
    accuracy?: number | null;
    attempted?: number;
    questionsSeen?: number;
    priorityScore?: number;
    recommendedAction?: string;
    [key: string]: unknown;
}

