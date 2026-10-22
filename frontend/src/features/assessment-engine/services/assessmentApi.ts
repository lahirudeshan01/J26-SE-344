import { getJson, postJson } from '../../../shared/api-client/http';
import type {
  AssessmentAttempt,
  AssessmentQuestion,
  AssessmentResults,
  AssessmentSession,
  AssessmentSubjectSummary,
  ChemistryTopicsResponse,
  GradePredictionResponse,
  ProgressSummary,
  RevisionPriority,
} from '../../../shared/types/index';

export interface AssessmentQuestionResponse {
  status: 'question' | 'complete';
  session: AssessmentSession;
  question: AssessmentQuestion | null;
}

export interface AssessmentAttemptResponse {
  attempt: AssessmentAttempt;
  correct: boolean;
  score: number;
  maxMarks: number;
  completed: boolean;
  session: AssessmentSession;
  nextQuestion: AssessmentQuestion | null;
  correctAnswer?: string;
  explanation?: string | null;
}

export async function fetchAssessmentSubjects() {
  const payload = await getJson<{ subjects: AssessmentSubjectSummary[] }>('/assessment/subjects');
  return payload.subjects;
}

export async function fetchSubjectTopics(subject: string = 'chemistry') {
  return getJson<ChemistryTopicsResponse>(`/assessment/topics?subject=${encodeURIComponent(subject)}`);
}

export async function createAssessmentSession(input: {
  studentId: string;
  subject: string;
  consentAccepted: boolean;
  consentVersion: string;
  mainTopicId?: string | null;
  subtopicId?: string | null;
}) {
  const payload = await postJson<{ session: AssessmentSession }>('/assessment/sessions', input);
  return payload.session;
}

export async function fetchNextQuestion(sessionId: string) {
  return getJson<AssessmentQuestionResponse>(`/assessment/questions/next?sessionId=${encodeURIComponent(sessionId)}`);
}

export async function submitAssessmentAttempt(input: {
  sessionId: string;
  questionId: string;
  selectedAnswer: string;
  timeTakenSeconds: number;
}) {
  return postJson<AssessmentAttemptResponse>('/assessment/attempts', input);
}

export async function fetchAssessmentResults(sessionId: string) {
  return getJson<AssessmentResults>(`/assessment/sessions/${encodeURIComponent(sessionId)}/results`);
}

export async function fetchAssessmentProgress(studentId: string) {
  return getJson<ProgressSummary>(`/assessment/progress/${encodeURIComponent(studentId)}`);
}

export async function fetchGradePrediction(studentId: string) {
  return getJson<GradePredictionResponse>(`/prediction/grade/${encodeURIComponent(studentId)}`);
}

export async function fetchRevisionPriorities(studentId: string) {
  return getJson<{ studentId: string; status: string; priorities: RevisionPriority[]; message: string }>(
    `/revision/priorities/${encodeURIComponent(studentId)}`
  );
}
