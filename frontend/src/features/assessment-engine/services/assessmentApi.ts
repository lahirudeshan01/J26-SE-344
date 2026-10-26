import type {
    AssessmentQuestion,
    AssessmentPaperSummary,
    AssessmentResults,
    AssessmentSession,
    AssessmentSubjectSummary,
    ChemistrySyllabusCategory,
    GradePredictionResponse,
    ProgressSummary,
    RevisionPriority,
} from '../../../shared/types';

const API_ROOT = (
    'http://localhost:4000'
).replace(/\/+$/, '');

async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${API_ROOT}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const body: { error?: { message?: string }; message?: string } | null = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            body?.error?.message ||
            body?.message ||
            `Assessment API request failed (${response.status}).`,
        );
    }

    return body as T;
}

export async function fetchAssessmentSubjects(): Promise<AssessmentSubjectSummary[]> {
    const result = await apiRequest<{
        subjects: AssessmentSubjectSummary[];
    }>('/api/assessment-engine/subjects');

    return result.subjects || [];
}

export async function fetchAssessmentProgress(
    studentId: string,
): Promise<ProgressSummary> {
    return apiRequest<ProgressSummary>(
        `/api/assessment-engine/progress/${encodeURIComponent(studentId)}`,
    );
}

export async function fetchSubjectTopics(
    subjectId: string,
): Promise<{
    subject: string;
    totalQuestions?: number;
    categories: ChemistrySyllabusCategory[];
}> {
    return apiRequest(
        `/api/assessment-engine/subjects/${encodeURIComponent(subjectId)}/topics`,
    );
}

export async function fetchSubjectPapers(
    subjectId: string,
): Promise<AssessmentPaperSummary[]> {
    const result = await apiRequest<{
        papers: AssessmentPaperSummary[];
    }>(`/api/assessment-engine/subjects/${encodeURIComponent(subjectId)}/papers`);
    return result.papers || [];
}

export async function createAssessmentSession(payload: {
    studentId: string;
    subject: string;
    consentAccepted: boolean;
    consentVersion: string;
    mainTopicId?: string | null;
    subtopicId?: string | null;
    paperId?: string | null;
    practiceMode?: 'adaptive' | 'paper' | 'subtopic';
    durationMinutes?: number;
}): Promise<AssessmentSession> {
    const result = await apiRequest<{
        session: AssessmentSession;
    }>('/api/assessment-engine/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    return result.session;
}

export async function fetchNextQuestion(sessionId: string): Promise<{
    status: string;
    session: AssessmentSession;
    question: AssessmentQuestion | null;
}> {
    return apiRequest(
        `/api/assessment-engine/questions/next?sessionId=${encodeURIComponent(sessionId)}`,
    );
}

export async function completeAssessmentSession(sessionId: string): Promise<AssessmentSession> {
    const result = await apiRequest<{ session: AssessmentSession }>(
        `/api/assessment-engine/sessions/${encodeURIComponent(sessionId)}/complete`,
        { method: 'POST' },
    );
    return result.session;
}

export async function submitAssessmentAttempt(payload: {
    sessionId: string;
    questionId: string;
    selectedAnswer: string;
    timeTakenSeconds: number;
}): Promise<{
    correct: boolean;
    score: number;
    maxMarks: number;
    correctAnswer: string | null;
    explanation: string | null;
    completed: boolean;
    session: AssessmentSession;
    nextQuestion: AssessmentQuestion | null;
    attempt?: Record<string, unknown>;
}> {
    return apiRequest('/api/assessment-engine/attempts', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function fetchAssessmentResults(
    sessionId: string,
): Promise<AssessmentResults> {
    return apiRequest(
        `/api/assessment-engine/sessions/${encodeURIComponent(sessionId)}/results`,
    );
}

export async function fetchGradePrediction(
    studentId: string,
): Promise<GradePredictionResponse> {
    return apiRequest(
        `/api/prediction/grade/${encodeURIComponent(studentId)}`,
    );
}

export async function fetchRevisionPriorities(
    studentId: string,
): Promise<{
    studentId?: string;
    status?: string;
    priorities: RevisionPriority[];
    message?: string;
}> {
    return apiRequest(
        `/api/revision/priorities/${encodeURIComponent(studentId)}`,
    );
}

