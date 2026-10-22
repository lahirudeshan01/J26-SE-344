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

export type AssessmentSubjectId = 'physics' | 'chemistry' | 'biology';

export interface AssessmentSubjectSummary {
  id: AssessmentSubjectId;
  name: string;
  description: string;
  syllabusVersion: string;
  questionCount: number;
  topicCount: number;
}

export type QuestionOption = string | { label?: string; text: string };

export interface AssessmentQuestion {
  questionId: string;
  subject: AssessmentSubjectId;
  topicId: string;
  topicName: string;
  mainTopicId?: string | null;
  mainTopicName?: string | null;
  subtopicId?: string | null;
  subtopicName?: string | null;
  questionText: string;
  options: QuestionOption[];
  maxMarks: number;
  expertDifficulty: number;
  difficultyLevel?: string;
  sourceReference: string;
  syllabusVersion: string;
  imagePath?: string | null;
}

export interface AssessmentSession {
  sessionId: string;
  studentId: string;
  subject: AssessmentSubjectId;
  status: 'active' | 'completed';
  targetDifficulty: number;
  abilityEstimate?: number;
  currentQuestionId: string | null;
  askedQuestionIds: string[];
  startedAt: string;
  updatedAt: string;
  consentVersion: string;
  mainTopicId?: string | null;
  subtopicId?: string | null;
}

export interface ChemistrySubtopic {
  id: string;
  name: string;
  questionCount: number;
}

export interface ChemistryTopic {
  id: string;
  name: string;
  unitNumber: number;
  questionCount: number;
  subtopics: ChemistrySubtopic[];
}

export interface ChemistrySyllabusCategory {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  topics: ChemistryTopic[];
}

export interface ChemistryTopicsResponse {
  subject: string;
  totalQuestions: number;
  categories: ChemistrySyllabusCategory[];
}

export interface AssessmentAttempt {
  attemptId: string;
  sessionId: string;
  questionId: string;
  selectedAnswer: string;
  score: number;
  maxMarks: number;
  timeTakenSeconds: number;
  timestamp: string;
  isCorrect: boolean;
  thetaBefore?: number | null;
  thetaAfter?: number | null;
  duplicate?: boolean;
}

export interface TopicPerformanceItem {
  topicId: string;
  topicName: string;
  attempted: number;
  correct: number;
  accuracy: number | null;
  score: number;
  maxMarks: number;
  questionsSeen: number;
}

export interface AssessmentResults {
  session: AssessmentSession;
  summary: {
    totalScore: number;
    maxScore: number;
    attemptedCount: number;
    correctCount: number;
    accuracy: number | null;
    abilityEstimate?: number;
    completed: boolean;
  };
  attemptedQuestions: Array<{
    attemptId: string;
    questionId: string;
    topicId: string | null;
    topicName: string | null;
    selectedAnswer: string;
    score: number;
    maxMarks: number;
    isCorrect: boolean;
    timeTakenSeconds: number;
    timestamp: string;
    thetaBefore?: number | null;
    thetaAfter?: number | null;
  }>;
  topicPerformance: TopicPerformanceItem[];
  message: string;
}

export interface ProgressSummary {
  studentId: string;
  totalSessions: number;
  totalAttempts: number;
  completedSessions: number;
  sessionSummaries: Array<{
    sessionId: string;
    subject: AssessmentSubjectId;
    startedAt: string;
    status: string;
    score: number;
    maxScore: number;
    accuracy: number | null;
  }>;
  topicPerformance: TopicPerformanceItem[];
}

export interface GradePredictionResponse {
  studentId: string;
  status: 'insufficient_data' | 'prototype' | 'evaluated';
  predictedGrade: string | null;
  predictedMarks: number | null;
  baseline: { predictedMarks: number; mae: number; rmse: number } | null;
  metrics: { mae: number; rmse: number; samples: number; r2?: number } | null;
  modelType?: string;
  benchmarkDataset?: string;
  ruleBasedReadiness?: {
    readinessLevel: string;
    readinessBadge: 'GREEN' | 'AMBER' | 'RED';
    readinessScore: number;
    topicCoveragePercent: number;
    hardQuestionAccuracyPercent: number;
    summary: string;
    actionableRecommendations: string[];
  } | null;
  message: string;
}

export interface RevisionPriority {
  topicId: string;
  topicName: string;
  accuracy: number | null;
  attempted: number;
  questionsSeen: number;
  priorityScore: number;
  recommendedAction: string;
}

export type PopoverPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'right-end';
export type TooltipSide = 'right' | 'top' | 'bottom';