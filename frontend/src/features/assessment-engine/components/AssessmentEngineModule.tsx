import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock3,
    Compass,
    Layers,
    Lightbulb,
    Loader2,
    Play,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Zap,
} from 'lucide-react';
import {
    createAssessmentSession,
    completeAssessmentSession,
    fetchAssessmentProgress,
    fetchAssessmentResults,
    fetchAssessmentSubjects,
    fetchGradePrediction,
    fetchNextQuestion,
    fetchRevisionPriorities,
    fetchSubjectTopics,
    fetchSubjectPapers,
    submitAssessmentAttempt,
} from '../services/assessmentApi';
import type {
    AssessmentQuestion,
    AssessmentPaperSummary,
    AssessmentResults,
    AssessmentSession,
    AssessmentSubjectSummary,
    ChemistrySyllabusCategory,
    GradePredictionResponse,
    ProgressSummary,
    QuestionOption,
    RevisionPriority,
} from '../../../shared/types/index';
import { cn, focusRing } from '../../../shared/utils/cn';
import { EASE_OUT } from '../../../shared/utils/motion';

const CONSENT_VERSION = '2026-10-research-consent-draft';
const PROGRESS_ESTIMATE = 8;
const STUDENT_KEY = 'neurolearn-assessment-student-id';

type Step = 'subjects' | 'consent' | 'papers' | 'main-topics' | 'subtopics' | 'start' | 'quiz' | 'results';

function getPilotStudentId(): string {
    if (typeof window === 'undefined') return `pilot-${Date.now().toString(36)}`;
    try {
        const existing = window.localStorage.getItem(STUDENT_KEY);
        if (existing) return existing;
        const uuid =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
        const generated = `pilot-${uuid}`;
        window.localStorage.setItem(STUDENT_KEY, generated);
        return generated;
    } catch {
        return `pilot-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    }
}

function formatPercent(value: number | null | undefined) {
    if (value === null || value === undefined) return '—';
    return `${Math.round(value * 100)}%`;
}

function getOptionDetails(option: QuestionOption, index: number) {
    if (typeof option === 'string') {
        return {
            value: option,
            label: String(index + 1),
            text: option,
        };
    }
    const label = option.label || String(index + 1);
    const text = option.text || option.label || '';
    return {
        value: label,
        label,
        text,
    };
}

function SubjectCard({ subject, onSelect }: { subject: AssessmentSubjectSummary; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float hover:border-accent/40 active:scale-[0.99]',
                focusRing
            )}>
            <div>
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[18px] font-semibold text-ink group-hover:text-accent transition-colors">
                        {subject.name}
                    </h3>
                    <ShieldCheck size={20} className="shrink-0 text-accent" />
                </div>
                <p className="mt-2 text-[13px] leading-5 text-ink-muted">{subject.description}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-[12px] text-ink-muted">
                <span className="rounded-full bg-accent-soft text-accent font-medium px-2.5 py-1">
                    {subject.questionCount} questions
                </span>
                <span className="rounded-full bg-ink/[0.05] px-2.5 py-1">{subject.topicCount} topics</span>
                <span className="rounded-full bg-ink/[0.05] px-2.5 py-1">{subject.syllabusVersion}</span>
            </div>
        </button>
    );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <p className="text-[12px] uppercase tracking-[0.08em] text-ink-muted">{label}</p>
            <p className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-ink">{value}</p>
            {hint && <p className="mt-1 text-[12px] text-ink-subtle">{hint}</p>}
        </div>
    );
}

function OptionButton({
    label,
    text,
    selected,
    onClick,
    disabled,
    variant = 'default',
}: {
    label: string;
    text: string;
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'correct' | 'incorrect';
}) {
    let containerStyle = 'border-line bg-surface hover:border-line-strong hover:bg-ink/[0.02]';
    let badgeStyle = 'border-line bg-ink/[0.03] text-ink-muted group-hover:border-accent/40 group-hover:text-ink';
    let badgeContent = label;

    if (variant === 'correct') {
        containerStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-500';
        badgeStyle = 'border-emerald-600 bg-emerald-600 text-white font-bold';
        badgeContent = '✓';
    } else if (variant === 'incorrect') {
        containerStyle = 'border-rose-400 bg-rose-50/80 text-rose-950 shadow-sm ring-1 ring-rose-400';
        badgeStyle = 'border-rose-500 bg-rose-500 text-white font-bold';
        badgeContent = '✗';
    } else if (selected) {
        containerStyle = 'border-accent bg-accent-soft text-ink shadow-sm ring-1 ring-accent';
        badgeStyle = 'border-accent bg-accent text-white';
        badgeContent = '✓';
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150',
                containerStyle,
                disabled && (variant === 'default' ? 'cursor-not-allowed opacity-60' : 'cursor-default'),
                focusRing
            )}>
            <span
                className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold transition-colors',
                    badgeStyle
                )}>
                {badgeContent}
            </span>
            <span className="min-w-0 flex-1 pt-0.5 text-[15px] leading-relaxed text-ink">{text}</span>
        </button>
    );
}

export function AssessmentEngineModule() {
    const studentId = useMemo(getPilotStudentId, []);
    const [step, setStep] = useState<Step>('subjects');
    const [subjects, setSubjects] = useState<AssessmentSubjectSummary[]>([]);
    const [progress, setProgress] = useState<ProgressSummary | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<AssessmentSubjectSummary | null>(null);
    const [papers, setPapers] = useState<AssessmentPaperSummary[]>([]);
    const [session, setSession] = useState<AssessmentSession | null>(null);
    const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [pendingAttempt, setPendingAttempt] =
        useState<Awaited<ReturnType<typeof submitAssessmentAttempt>> | null>(null);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
    const [clockNow, setClockNow] = useState(Date.now());
    const [paperDurationMinutes, setPaperDurationMinutes] = useState<number>(120);
    const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
    const expiryHandled = useRef(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [results, setResults] = useState<AssessmentResults | null>(null);
    const [prediction, setPrediction] = useState<GradePredictionResponse | null>(null);
    const [priorities, setPriorities] = useState<RevisionPriority[]>([]);
    const [lastAction, setLastAction] = useState<string | null>(null);

    // Syllabus Hierarchy & Topic Practice State
    const [categories, setCategories] = useState<ChemistrySyllabusCategory[]>([]);
    const [totalChemistryQuestions, setTotalChemistryQuestions] = useState<number>(50);
    const [selectedCategory, setSelectedCategory] = useState<ChemistrySyllabusCategory | null>(null);
    const [activeScopeLabel, setActiveScopeLabel] = useState<string>('');

    // Syllabus Topic Practice section state (below past papers)
    const [topicSubjectId, setTopicSubjectId] = useState<string>('chemistry');
    const [topicCategories, setTopicCategories] = useState<ChemistrySyllabusCategory[]>([]);
    const [topicLoading, setTopicLoading] = useState<boolean>(false);
    const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
    const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(120);
    const [sessionTargetQuestionCount, setSessionTargetQuestionCount] = useState<number | null>(null);

    const loadTopicCategories = async (subjectId: string) => {
        try {
            setTopicLoading(true);
            const data = await fetchSubjectTopics(subjectId);
            if (data && Array.isArray(data.categories)) {
                setTopicCategories(data.categories);
            } else {
                setTopicCategories([]);
            }
        } catch {
            setTopicCategories([]);
        } finally {
            setTopicLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const [subjectList, studentProgress] = await Promise.all([
                    fetchAssessmentSubjects(),
                    fetchAssessmentProgress(studentId).catch(() => null),
                ]);
                if (!active) return;
                setSubjects(subjectList);
                setProgress(studentProgress);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'Failed to load assessment module.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [studentId]);

    const selectSubject = (subject: AssessmentSubjectSummary) => {
        setSelectedSubject(subject);
        setTopicSubjectId(subject.id);
        void loadTopicCategories(subject.id);
        setConsentAccepted(false);
        setError(null);
        setStep('consent');
    };

    const handleConsentContinue = async () => {
        if (!selectedSubject) return;

        if (!consentAccepted) {
            setError('Please indicate your consent by ticking the agreement box before continuing.');
            return;
        }

        setError(null);

        try {
            setSubmitting(true);
            const [subjectPapers] = await Promise.all([
                fetchSubjectPapers(selectedSubject.id),
                loadTopicCategories(selectedSubject.id),
            ]);
            setPapers(subjectPapers);
            setStep('papers');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load available papers.');
        } finally {
            setSubmitting(false);
        }
    };

    const startAssessmentSession = async ({
        subjectId,
        mainTopicId = null,
        subtopicId = null,
        scopeLabel = '',
        paperId = null,
        practiceMode = 'adaptive',
        durationMinutes,
        targetQuestionCount,
    }: {
        subjectId?: string;
        mainTopicId?: string | null;
        subtopicId?: string | null;
        scopeLabel?: string;
        paperId?: string | null;
        practiceMode?: 'adaptive' | 'paper' | 'subtopic';
        durationMinutes?: number;
        targetQuestionCount?: number;
    }) => {
        const targetSubject = (subjectId && subjects.find((s) => s.id === subjectId)) || selectedSubject;
        if (!targetSubject) return;
        if (subjectId && targetSubject.id !== selectedSubject?.id) {
            setSelectedSubject(targetSubject);
        }

        try {
            setSubmitting(true);
            setError(null);
            setActiveScopeLabel(scopeLabel || targetSubject.name);

            if (practiceMode === 'paper') {
                setSessionDurationMinutes(paperDurationMinutes);
            } else if (practiceMode === 'subtopic') {
                setSessionDurationMinutes(durationMinutes || 20);
            }
            setSessionTargetQuestionCount(targetQuestionCount || null);

            const nextSession = await createAssessmentSession({
                studentId,
                subject: targetSubject.id,
                consentAccepted: true,
                consentVersion: CONSENT_VERSION,
                mainTopicId,
                subtopicId,
                paperId,
                practiceMode,
                durationMinutes,
            });
            setSession(nextSession);
            setLastAction('Assessment session initialized.');

            const payload = await fetchNextQuestion(nextSession.sessionId);
            if (payload.status === 'complete' || !payload.question) {
                await finishSession(nextSession.sessionId);
                return;
            }
            setQuestion(payload.question);
            setSession(payload.session);
            setSelectedAnswer('');
            const now = Date.now();
            setStartedAt(now);
            setSessionStartedAt(now);
            expiryHandled.current = false;
            setStep('quiz');

            const updatedProgress = await fetchAssessmentProgress(studentId).catch(() => null);
            if (updatedProgress) setProgress(updatedProgress);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start the assessment session.');
        } finally {
            setSubmitting(false);
        }
    };

    const startAdaptivePractice = async () => {
        if (!selectedSubject) return;
        try {
            setSubmitting(true);
            setError(null);
            const topicsData = await fetchSubjectTopics(selectedSubject.id);
            if (!topicsData || !Array.isArray(topicsData.categories)) {
                throw new Error(`Unable to retrieve syllabus categories for ${selectedSubject.name}.`);
            }
            setCategories(topicsData.categories);
            setTotalChemistryQuestions(topicsData.totalQuestions || 50);
            setStep('main-topics');
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to load ${selectedSubject.name} topics.`);
        } finally {
            setSubmitting(false);
        }
    };

    const finishSession = async (sessionId: string) => {
        try {
            const [resultPayload, predictionPayload, revisionPayload, updatedProgress] = await Promise.all([
                fetchAssessmentResults(sessionId),
                fetchGradePrediction(studentId).catch(() => null),
                fetchRevisionPriorities(studentId).catch(() => null),
                fetchAssessmentProgress(studentId).catch(() => null),
            ]);
            setResults(resultPayload);
            setPrediction(predictionPayload);
            setPriorities(revisionPayload?.priorities || []);
            if (updatedProgress) setProgress(updatedProgress);
            setStep('results');
            setQuestion(null);
            setSession(resultPayload.session);
            setStartedAt(null);
            setSessionStartedAt(null);
            setLastAction('Assessment completed.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load assessment results.');
        }
    };

    const isPaperSession = session?.practiceMode === 'paper';
    const isSubtopicSession = session?.practiceMode === 'subtopic';
    const isTimedSession = isPaperSession || isSubtopicSession;
    const totalSessionDurationSeconds = sessionDurationMinutes * 60;
    const questionElapsedSeconds = startedAt ? Math.max(0, Math.floor((clockNow - startedAt) / 1000)) : 0;
    const sessionElapsedSeconds = sessionStartedAt
        ? Math.max(0, Math.floor((clockNow - sessionStartedAt) / 1000))
        : 0;
    const remainingSeconds = isTimedSession
        ? Math.max(0, totalSessionDurationSeconds - sessionElapsedSeconds)
        : null;
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;
        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (step !== 'quiz' || !session) return;
        const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, [step, session?.sessionId]);

    useEffect(() => {
        if (remainingSeconds === null || remainingSeconds > 0 || !session || !isTimedSession || expiryHandled.current) return;
        expiryHandled.current = true;
        (async () => {
            try {
                setSubmitting(true);
                setError(
                    isPaperSession
                        ? 'Examination time has expired. Finalizing and submitting your paper...'
                        : 'Practice time has expired. Finalizing and submitting your subtopic practice...'
                );
                await completeAssessmentSession(session.sessionId);
                await finishSession(session.sessionId);
            } catch (err) {
                expiryHandled.current = false;
                setError(err instanceof Error ? err.message : 'The session time expired, but results could not be loaded.');
            } finally {
                setSubmitting(false);
            }
        })();
    }, [remainingSeconds, session?.sessionId, isTimedSession, isPaperSession]);


    const submitAnswer = async () => {
        if (!session || !question || pendingAttempt || submitting || expiryHandled.current) return;

        if (!selectedAnswer) {
            setError('Select an answer before submitting.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const elapsed = Math.max(
                1,
                Math.round((Date.now() - (startedAt || Date.now())) / 1000)
            );

            const payload = await submitAssessmentAttempt({
                sessionId: session.sessionId,
                questionId: question.questionId,
                selectedAnswer,
                timeTakenSeconds: elapsed,
            });

            setLastAction(
                payload.correct ? 'Correct answer!' : 'Incorrect answer.'
            );

            // Show feedback first. Do not advance automatically.
            setPendingAttempt(payload);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Could not submit the answer.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const continueAfterFeedback = async () => {
        if (!session || !pendingAttempt) return;

        try {
            setSubmitting(true);
            setError(null);

            if (pendingAttempt.completed || !pendingAttempt.nextQuestion) {
                setPendingAttempt(null);
                await finishSession(session.sessionId);
                return;
            }

            setSession(pendingAttempt.session);
            setQuestion(pendingAttempt.nextQuestion);
            setSelectedAnswer('');
            setPendingAttempt(null);
            setLastAction(null);
            const now = Date.now();
            setStartedAt(now);
            setClockNow(now);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Could not continue assessment.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const resetModule = () => {
        setSelectedSubject(null);
        setPapers([]);
        setSession(null);
        setQuestion(null);
        setSelectedAnswer('');
        setPendingAttempt(null);
        setResults(null);
        setPrediction(null);
        setPriorities([]);
        setLastAction(null);
        setSelectedCategory(null);
        setActiveScopeLabel('');
        setError(null);
        setConsentAccepted(false);
        setExpandedTopicId(null);
        setSessionTargetQuestionCount(null);
        setStep('subjects');
    };

    const questionNumber = (session?.askedQuestionIds.length || 0) + (question ? 1 : 0);
    const progressTotal = isPaperSession
        ? (papers.find((paper) => paper.paperId === session?.paperId)?.questionCount || 50)
        : sessionTargetQuestionCount
            ? sessionTargetQuestionCount
            : PROGRESS_ESTIMATE;
    const progressValue = Math.min(100, Math.round((questionNumber / progressTotal) * 100));

    return (
        <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 scroll-quiet">
            {/* Header */}
            <header className="rounded-3xl border border-line bg-surface p-5 shadow-soft shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] text-accent font-semibold">
                            <BarChart3 size={14} /> Adaptive Assessment & Exam Prediction Engine
                        </div>
                        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink sm:text-[34px]">
                            Exam Arena
                        </h1>
                        <p className="mt-1 max-w-3xl text-[14px] leading-6 text-ink-muted">
                            Practise verified Sri Lankan G.C.E. Advanced Level questions, build confidence and see what to revise next.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {lastAction && <div className="text-[12px] font-medium text-accent">{lastAction}</div>}
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            setStep('subjects');
                        }}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
                            step === 'subjects'
                                ? 'bg-accent text-white shadow-sm'
                                : 'bg-ink/[0.05] text-ink-muted hover:bg-ink/[0.09] hover:text-ink cursor-pointer'
                        )}>
                        1. Subject
                    </button>

                    <button
                        type="button"
                        disabled={!selectedSubject}
                        onClick={() => {
                            if (selectedSubject) {
                                setError(null);
                                setStep('consent');
                            }
                        }}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
                            step === 'consent'
                                ? 'bg-accent text-white shadow-sm'
                                : selectedSubject
                                    ? 'bg-ink/[0.05] text-ink-muted hover:bg-ink/[0.09] hover:text-ink cursor-pointer'
                                    : 'bg-ink/[0.02] text-ink-muted/50 cursor-not-allowed'
                        )}>
                        2. Consent
                    </button>

                    <span
                        className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
                            step === 'papers'
                                ? 'bg-accent text-white shadow-sm'
                                : 'bg-ink/[0.05] text-ink-muted'
                        )}>
                        3. Practice
                    </span>

                    <button
                        type="button"
                        disabled={categories.length === 0}
                        onClick={() => {
                            if (categories.length > 0) {
                                setError(null);
                                setStep('main-topics');
                            }
                        }}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
                            step === 'main-topics' || step === 'subtopics'
                                ? 'bg-accent text-white shadow-sm'
                                : categories.length > 0
                                    ? 'bg-ink/[0.05] text-ink-muted hover:bg-ink/[0.09] hover:text-ink cursor-pointer'
                                    : 'bg-ink/[0.02] text-ink-muted/50 cursor-not-allowed'
                        )}>
                        4. Syllabus Scope
                    </button>

                    <span
                        className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
                            step === 'quiz' || step === 'start'
                                ? 'bg-accent text-white shadow-sm'
                                : 'bg-ink/[0.05] text-ink-muted'
                        )}>
                        5. Assessment
                    </span>

                    <span
                        className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
                            step === 'results'
                                ? 'bg-accent text-white shadow-sm'
                                : 'bg-ink/[0.05] text-ink-muted'
                        )}>
                        6. Results
                    </span>
                </div>
            </header>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-line bg-surface p-10 text-ink-muted shadow-soft">
                    <Loader2 className="mr-3 animate-spin text-accent" size={20} /> Loading assessment engine…
                </div>
            ) : (
                <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] pb-6">
                    <section className="min-w-0 space-y-6">
                        {error && (
                            <div className="rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-[14px] text-danger shadow-sm">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <div>{error}</div>
                                </div>
                            </div>
                        )}

                        {/* STEP 1: SUBJECT SELECTION */}
                        {step === 'subjects' && (
                            <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-[20px] font-semibold text-ink">Choose your subject</h2>
                                        <p className="mt-1 text-[14px] leading-6 text-ink-muted">
                                            Select Sri Lankan G.C.E. A/L Chemistry to experience the full 50-question 2024 Paper 01
                                            with topic-level adaptive testing, or practice Physics and Biology.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    {subjects.map((subject) => (
                                        <SubjectCard key={subject.id} subject={subject} onSelect={() => selectSubject(subject)} />
                                    ))}
                                </div>

                                {subjects.length === 0 && (
                                    <div className="mt-5 rounded-2xl border border-line bg-ink/[0.03] p-4 text-[14px] text-ink-muted">
                                        No subject metadata is available. Check server connection.
                                    </div>
                                )}
                            </section>
                        )}

                        {/* STEP 2: CONSENT */}
                        {step === 'consent' && selectedSubject && (
                            <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-accent font-semibold">
                                    <ShieldCheck size={16} /> Research Protocol & Privacy
                                </div>
                                <h2 className="mt-2 text-[22px] font-semibold text-ink">
                                    Research Information and Participant Consent
                                </h2>
                                <p className="mt-2 text-[14px] leading-7 text-ink-muted">
                                    You are participating in the research evaluation of the <strong>NeuroLearn AI Adaptive Assessment Engine</strong> for Sri Lankan G.C.E. Advanced Level candidates.
                                </p>

                                <div className="mt-4 space-y-3 rounded-2xl border border-line bg-ink/[0.02] p-5 text-[14px] leading-6 text-ink-muted">
                                    <p className="font-semibold text-ink">Research Terms & Data Safeguards:</p>
                                    <ul className="list-disc space-y-1.5 pl-5">
                                        <li>
                                            <strong>Pseudonymous Identity:</strong> Your assessment attempts are tied solely to your pilot ID (<code>{studentId}</code>). No names, contact details, or school credentials are recorded.
                                        </li>
                                        <li>
                                            <strong>Personalised practice:</strong> Adaptive practice adjusts question selection based on your answers.
                                        </li>
                                        <li>
                                            <strong>Learning support:</strong> Your answers are used to show feedback and revision suggestions.
                                        </li>
                                        <li>
                                            <strong>Consent Audit Trail:</strong> Your consent is recorded under version <code>{CONSENT_VERSION}</code> with session timestamps.
                                        </li>
                                    </ul>
                                </div>

                                {/* Consent Checkbox */}
                                <label
                                    htmlFor="research-consent-checkbox"
                                    className={cn(
                                        'mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-[14px] text-ink transition-all',
                                        consentAccepted
                                            ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                                            : 'border-line bg-surface hover:bg-ink/[0.02]'
                                    )}>
                                    <input
                                        type="checkbox"
                                        id="research-consent-checkbox"
                                        checked={consentAccepted}
                                        onChange={(event) => {
                                            setError(null);
                                            setConsentAccepted(event.target.checked);
                                        }}
                                        className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border border-line bg-surface accent-accent transition-transform active:scale-95 focus:ring-2 focus:ring-accent/40"
                                    />
                                    <span className="leading-relaxed select-none">
                                        I confirm that I understand the research nature of this prototype and consent to recording my
                                        pseudonymous responses for <strong>{selectedSubject.name}</strong> under protocol version{' '}
                                        <span className="font-mono text-accent font-semibold">{CONSENT_VERSION}</span>.
                                    </span>
                                </label>

                                {error && (
                                    <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={15} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            setStep('subjects');
                                        }}
                                        className="rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink-muted transition-colors hover:bg-ink/[0.04] active:scale-[0.98]">
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConsentContinue}
                                        disabled={submitting || !!pendingAttempt}
                                        className={cn(
                                            'inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold text-white transition-all shadow-sm',
                                            submitting
                                                ? 'bg-accent/70 cursor-wait'
                                                : consentAccepted
                                                    ? 'bg-accent hover:brightness-105 active:scale-[0.98]'
                                                    : 'bg-accent/80 hover:bg-accent'
                                        )}>
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                        Record consent and continue
                                    </button>
                                </div>
                            </section>
                        )}

                        {step === 'papers' && selectedSubject && (
                            <div className="space-y-6">
                                {/* EXISTING SECTION - PRESERVED EXACTLY AS IT IS */}
                                <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                    <h2 className="text-[20px] font-semibold text-ink">Choose how you want to practise</h2>
                                    <p className="mt-1 text-[14px] leading-6 text-ink-muted">
                                        Use adaptive practice for targeted learning, or select an available past paper to follow its original order.
                                    </p>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={startAdaptivePractice}
                                            disabled={submitting}
                                            className="rounded-2xl border border-accent/30 bg-accent-soft p-4 text-left transition hover:border-accent">
                                            <strong className="block text-[15px] text-ink">Adaptive practice</strong>
                                            <span className="mt-1 block text-[13px] leading-5 text-ink-muted">
                                                Questions adjust to your answers and focus on your learning needs.
                                            </span>
                                        </button>
                                        {papers.map((paper) => (
                                            <button
                                                key={paper.paperId}
                                                type="button"
                                                onClick={() => startAssessmentSession({
                                                    paperId: paper.paperId,
                                                    practiceMode: 'paper',
                                                    scopeLabel: `${selectedSubject.name} ${paper.examYear} Paper ${String(paper.paperNumber).padStart(2, '0')}`,
                                                })}
                                                disabled={submitting}
                                                className="rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent/50 hover:bg-ink/[0.02]">
                                                <strong className="block text-[15px] text-ink">
                                                    {paper.examYear} Paper {String(paper.paperNumber).padStart(2, '0')}
                                                </strong>
                                                <span className="mt-1 block text-[13px] text-ink-muted">
                                                    {paper.questionCount} questions · original paper order
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    {papers.length > 0 && (
                                        <div className="mt-5 border-t border-line/60 pt-4">
                                            <label className="block text-[13px] font-medium text-ink">
                                                Examination Timer Duration:
                                            </label>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {[
                                                    { mins: 120, label: '120 Minutes (Official A/L Exam)' },
                                                    { mins: 60, label: '60 Minutes (Standard Practice)' },
                                                    { mins: 30, label: '30 Minutes (Rapid Practice)' },
                                                ].map((option) => (
                                                    <button
                                                        key={option.mins}
                                                        type="button"
                                                        onClick={() => setPaperDurationMinutes(option.mins)}
                                                        className={cn(
                                                            'rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer',
                                                            paperDurationMinutes === option.mins
                                                                ? 'bg-accent text-white shadow-sm'
                                                                : 'border border-line bg-surface text-ink-muted hover:bg-ink/[0.04]'
                                                        )}>
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {papers.length === 0 && (
                                        <p className="mt-4 rounded-xl bg-ink/[0.03] p-3 text-[13px] text-ink-muted">
                                            No verified past papers are available for this subject yet.
                                        </p>
                                    )}
                                </section>

                                {/* NEW SECTION - PRACTISE BY SYLLABUS TOPIC */}
                                <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-accent">
                                                <Compass size={15} /> Topic & Subtopic Practice
                                            </div>
                                            <h2 className="mt-1 text-[20px] font-semibold text-ink">
                                                Practise by Syllabus Topic
                                            </h2>
                                            <p className="mt-1 text-[14px] leading-6 text-ink-muted">
                                                Choose a subject, select a topic or subtopic, and practise questions focused on that area.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-ink/[0.02] p-1.5">
                                            {[
                                                { id: 'biology', label: 'Biology' },
                                                { id: 'chemistry', label: 'Chemistry' },
                                                { id: 'physics', label: 'Physics' },
                                            ].map((subj) => (
                                                <button
                                                    key={subj.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setTopicSubjectId(subj.id);
                                                        setExpandedTopicId(null);
                                                        void loadTopicCategories(subj.id);
                                                    }}
                                                    className={cn(
                                                        'rounded-xl px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer',
                                                        topicSubjectId === subj.id
                                                            ? 'bg-accent text-white shadow-sm'
                                                            : 'text-ink-muted hover:text-ink hover:bg-ink/[0.04]'
                                                    )}>
                                                    {subj.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {topicLoading ? (
                                        <div className="mt-6 flex items-center justify-center rounded-2xl border border-line bg-ink/[0.015] p-8 text-ink-muted">
                                            <Loader2 className="mr-2 animate-spin text-accent" size={18} /> Loading syllabus topics...
                                        </div>
                                    ) : topicCategories.length === 0 ? (
                                        <div className="mt-6 rounded-2xl border border-line bg-ink/[0.02] p-6 text-center text-[14px] text-ink-muted">
                                            No syllabus topics found for this subject.
                                        </div>
                                    ) : (
                                        <div className="mt-6 space-y-4">
                                            {topicCategories.map((category, catIdx) => {
                                                const isExpanded = expandedTopicId === category.id;
                                                const allSubtopics = (category.topics || []).flatMap((t) => t.subtopics || []);
                                                const totalSubtopicCount = allSubtopics.length;
                                                const activeSubjectObj = subjects.find((s) => s.id === topicSubjectId) || selectedSubject;

                                                return (
                                                    <div
                                                        key={category.id}
                                                        className={cn(
                                                            'rounded-2xl border transition-all duration-200',
                                                            isExpanded
                                                                ? 'border-accent/40 bg-accent/[0.015] shadow-sm'
                                                                : 'border-line bg-surface hover:border-line-strong'
                                                        )}>
                                                        {/* Main topic header */}
                                                        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                                                        Topic {catIdx + 1}
                                                                    </span>
                                                                    <h3 className="text-[17px] font-semibold text-ink">{category.name}</h3>
                                                                </div>
                                                                {category.description && (
                                                                    <p className="mt-1 text-[13px] text-ink-muted line-clamp-2">
                                                                        {category.description}
                                                                    </p>
                                                                )}
                                                                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px] text-ink-subtle">
                                                                    <span className="font-semibold text-accent">
                                                                        {category.questionCount} {category.questionCount === 1 ? 'Question' : 'Questions'}
                                                                    </span>
                                                                    <span>·</span>
                                                                    <span>{totalSubtopicCount} Subtopics</span>
                                                                    <span>·</span>
                                                                    <span>Standard 2 min / question</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {category.questionCount > 0 ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled={submitting}
                                                                        onClick={() =>
                                                                            startAssessmentSession({
                                                                                subjectId: topicSubjectId,
                                                                                mainTopicId: category.id,
                                                                                subtopicId: null,
                                                                                scopeLabel: `${activeSubjectObj?.name || topicSubjectId} > ${category.name}`,
                                                                                practiceMode: 'subtopic',
                                                                                durationMinutes: Math.max(2, Math.ceil(category.questionCount * 2)),
                                                                                targetQuestionCount: category.questionCount,
                                                                            })
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50">
                                                                        <Play size={14} /> Practise Topic ({category.questionCount})
                                                                    </button>
                                                                ) : (
                                                                    <span className="rounded-xl bg-ink/[0.05] px-3 py-2 text-[12px] font-medium text-ink-muted/70">
                                                                        Questions not yet available
                                                                    </span>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExpandedTopicId(isExpanded ? null : category.id)}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink-muted transition hover:bg-ink/[0.03] active:scale-[0.98]">
                                                                    <span>Subtopics</span>
                                                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded subtopic list */}
                                                        {isExpanded && (
                                                            <div className="border-t border-line/60 bg-ink/[0.01] p-5">
                                                                <div className="mb-3 flex items-center justify-between">
                                                                    <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                                                                        Subtopics in {category.name}
                                                                    </span>
                                                                    <span className="text-[12px] text-ink-subtle">
                                                                        Default timer: 2 minutes per question
                                                                    </span>
                                                                </div>

                                                                <div className="grid gap-3 sm:grid-cols-2">
                                                                    {allSubtopics.map((subtopic) => {
                                                                        const subDuration = Math.max(2, Math.ceil(subtopic.questionCount * 2));
                                                                        return (
                                                                            <div
                                                                                key={subtopic.id}
                                                                                className="flex flex-col justify-between rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong">
                                                                                <div>
                                                                                    <h4 className="text-[14px] font-semibold text-ink">
                                                                                        {subtopic.name}
                                                                                    </h4>
                                                                                    <div className="mt-1 flex items-center gap-2 text-[12px]">
                                                                                        {subtopic.questionCount > 0 ? (
                                                                                            <>
                                                                                                <span className="font-semibold text-accent">
                                                                                                    {subtopic.questionCount} {subtopic.questionCount === 1 ? 'question' : 'questions'}
                                                                                                </span>
                                                                                                <span className="text-ink-subtle">·</span>
                                                                                                <span className="text-ink-muted">
                                                                                                    {subDuration} mins ({subtopic.questionCount * 2}m total)
                                                                                                </span>
                                                             </>
                                                                                        ) : (
                                                                                            <span className="text-ink-subtle">0 questions in database</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mt-3 flex items-center justify-end">
                                                                                    {subtopic.questionCount > 0 ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            disabled={submitting}
                                                                                            onClick={() =>
                                                                                                startAssessmentSession({
                                                                                                    subjectId: topicSubjectId,
                                                                                                    mainTopicId: category.id,
                                                                                                    subtopicId: subtopic.id,
                                                                                                    scopeLabel: `${activeSubjectObj?.name || topicSubjectId} > ${category.name} > ${subtopic.name}`,
                                                                                                    practiceMode: 'subtopic',
                                                                                                    durationMinutes: subDuration,
                                                                                                    targetQuestionCount: subtopic.questionCount,
                                                                                                })
                                                                                            }
                                                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50">
                                                                                            <Play size={12} /> Practise ({subtopic.questionCount} Qs · {subDuration}m)
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className="rounded-lg bg-ink/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-muted/70">
                                                                                            Questions not yet available
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {/* STEP 3A: MAIN TOPICS */}
                        {step === 'main-topics' && selectedSubject && (
                            <section className="space-y-6">
                                {/* Full subject adaptive practice banner */}
                                <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-r from-accent/10 via-surface to-accent/5 p-6 shadow-soft">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="max-w-xl">
                                            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-accent">
                                                <Sparkles size={14} /> {selectedSubject.id === 'chemistry' ? 'Full 2024 Examination Simulation' : `Full ${selectedSubject.name} Adaptive Assessment`}
                                            </div>
                                            <h2 className="mt-1 text-[22px] font-bold text-ink">
                                                {selectedSubject.id === 'chemistry'
                                                    ? 'Comprehensive Chemistry Paper 01'
                                                    : `Comprehensive ${selectedSubject.name} Adaptive Arena`}
                                            </h2>
                                            <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                                                {selectedSubject.id === 'chemistry'
                                                    ? 'Practise the entire 50-question 2024 G.C.E. A/L Chemistry Paper across all 3 branches (Physical, Inorganic, Organic) with continuous adaptive difficulty.'
                                                    : `Practise across all ${categories.length} syllabus topics of Sri Lankan G.C.E. A/L ${selectedSubject.name} with continuous adaptive difficulty.`}
                                            </p>
                                            <div className="mt-3 flex items-center gap-3 text-[13px] text-ink-muted">
                                                <span className="font-semibold text-ink">
                                                    {totalChemistryQuestions} Verified Questions
                                                </span>{' '}
                                                · <span>Single Question Adaptive Arena</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() =>
                                                startAssessmentSession({
                                                    mainTopicId: null,
                                                    subtopicId: null,
                                                    scopeLabel: `${selectedSubject.name} (All Topics)`,
                                                })
                                            }
                                            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-[15px] font-semibold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60">
                                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                                            {selectedSubject.id === 'chemistry' ? 'Practise Full Paper 01' : `Practise All ${selectedSubject.name} Topics`}
                                        </button>
                                    </div>
                                </div>

                                {/* Main Topics Grid */}
                                <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                    <div>
                                        <h3 className="text-[20px] font-semibold text-ink">
                                            {selectedSubject.id === 'chemistry' ? 'Choose a Specific Syllabus Branch' : 'Choose a Syllabus Topic'}
                                        </h3>
                                        <p className="mt-1 text-[14px] leading-6 text-ink-muted">
                                            {selectedSubject.id === 'chemistry'
                                                ? 'Select one of the three core domains of Sri Lankan A/L Chemistry. You can practise all questions within the branch or drill into individual subtopics.'
                                                : `Select a syllabus domain of Sri Lankan A/L ${selectedSubject.name}. You can practise all questions within the topic or drill down into individual subtopics.`}
                                        </p>
                                    </div>

                                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                                        {categories.map((category, idx) => {
                                            const subtopicCount = (category.topics || []).flatMap((t) => t.subtopics || []).filter((st) => st.questionCount > 0).length || (category.topics || []).length;
                                            return (
                                                <div
                                                    key={category.id}
                                                    className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-accent/40 hover:shadow-float">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="rounded-full bg-ink/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                                                {selectedSubject.id === 'chemistry'
                                                                    ? category.id === 'physical-chemistry'
                                                                        ? 'Branch A'
                                                                        : category.id === 'inorganic-chemistry'
                                                                            ? 'Branch B'
                                                                            : 'Branch C'
                                                                    : `Topic ${idx + 1}`}
                                                            </span>
                                                            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[12px] font-semibold text-accent">
                                                                {category.questionCount} Questions
                                                            </span>
                                                        </div>
                                                        <h4 className="mt-3 text-[18px] font-semibold text-ink">{category.name}</h4>
                                                        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{category.description}</p>
                                                        <div className="mt-3 text-[12px] text-ink-subtle">
                                                            {subtopicCount} Subtopics Available
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex flex-col gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={submitting || category.questionCount === 0}
                                                            onClick={() =>
                                                                startAssessmentSession({
                                                                    mainTopicId: category.id,
                                                                    subtopicId: null,
                                                                    scopeLabel: category.name,
                                                                })
                                                            }
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:brightness-105 active:scale-[0.98] disabled:opacity-50">
                                                            <Play size={14} /> Practise Topic ({category.questionCount})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setError(null);
                                                                setSelectedCategory(category);
                                                                setStep('subtopics');
                                                            }}
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-ink/[0.03] active:scale-[0.98]">
                                                            <BookOpen size={14} /> Explore Subtopics
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError(null);
                                                setStep('papers');
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-ink/[0.04] active:scale-[0.98]">
                                            <ArrowLeft size={14} /> Back to Practice Options
                                        </button>
                                        <span className="text-[12px] text-ink-muted">
                                            Total Questions: {totalChemistryQuestions}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* STEP 3B: SUBTOPICS DRILLDOWN */}
                        {step === 'subtopics' && selectedCategory && (
                            <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError(null);
                                                setStep('main-topics');
                                            }}
                                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline mb-1 cursor-pointer">
                                            <ArrowLeft size={14} /> Back to All Topics
                                        </button>
                                        <h2 className="text-[22px] font-semibold text-ink">{selectedCategory.name}</h2>
                                        <p className="mt-1 text-[14px] text-ink-muted">{selectedCategory.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={submitting || selectedCategory.questionCount === 0}
                                        onClick={() =>
                                            startAssessmentSession({
                                                mainTopicId: selectedCategory.id,
                                                subtopicId: null,
                                                scopeLabel: selectedCategory.name,
                                            })
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[14px] font-semibold text-white hover:brightness-105 active:scale-[0.98] disabled:opacity-50">
                                        <Play size={16} /> Practise Entire {selectedCategory.name} ({selectedCategory.questionCount})
                                    </button>
                                </div>

                                <div className="mt-6 space-y-6">
                                    {(selectedCategory.topics || []).map((topic) => {
                                        const allSubtopics = topic.subtopics || [];
                                        return (
                                            <div key={topic.id} className="rounded-2xl border border-line/80 bg-ink/[0.015] p-5">
                                                {topic.name !== selectedCategory.name && (
                                                    <div className="flex items-center justify-between gap-3 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Layers size={18} className="text-accent" />
                                                            <h3 className="text-[16px] font-semibold text-ink">{topic.name}</h3>
                                                        </div>
                                                        <span className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[12px] font-medium text-ink-muted">
                                                            {topic.questionCount} {topic.questionCount === 1 ? 'question' : 'questions'}
                                                        </span>
                                                    </div>
                                                )}

                                                {allSubtopics.length === 0 ? (
                                                    <p className="text-[13px] text-ink-muted py-2">
                                                        No individual subtopics are configured under this section.
                                                    </p>
                                                ) : (
                                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                        {allSubtopics.map((subtopic) => {
                                                            const subDuration = Math.max(2, Math.ceil(subtopic.questionCount * 2));
                                                            return (
                                                                <div
                                                                    key={subtopic.id}
                                                                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-strong">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[14px] font-medium text-ink truncate">{subtopic.name}</p>
                                                                        <div className="mt-0.5 flex items-center gap-1.5 text-[12px]">
                                                                            {subtopic.questionCount > 0 ? (
                                                                                <>
                                                                                    <span className="text-accent font-semibold">
                                                                                        {subtopic.questionCount} {subtopic.questionCount === 1 ? 'question' : 'questions'}
                                                                                    </span>
                                                                                    <span className="text-ink-subtle">·</span>
                                                                                    <span className="text-ink-muted">
                                                                                        {subDuration} mins
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <span className="text-ink-muted/70">0 questions</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {subtopic.questionCount > 0 ? (
                                                                        <button
                                                                            type="button"
                                                                            disabled={submitting}
                                                                            onClick={() =>
                                                                                startAssessmentSession({
                                                                                    mainTopicId: selectedCategory.id,
                                                                                    subtopicId: subtopic.id,
                                                                                    scopeLabel: `${selectedCategory.name} > ${subtopic.name}`,
                                                                                    practiceMode: 'subtopic',
                                                                                    durationMinutes: subDuration,
                                                                                    targetQuestionCount: subtopic.questionCount,
                                                                                })
                                                                            }
                                                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white hover:brightness-105 active:scale-[0.98]">
                                                                            <Play size={12} /> Practise ({subDuration}m)
                                                                        </button>
                                                                    ) : (
                                                                        <span className="shrink-0 rounded-lg bg-ink/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-muted/70">
                                                                            Questions not yet available
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* STEP 4: QUIZ (ONE QUESTION AT A TIME) */}
                        {step === 'quiz' && question && session && selectedSubject && (
                            <motion.section
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, ease: EASE_OUT }}
                                className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                {/* Quiz header & difficulty badges */}
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-accent font-semibold">
                                            <Target size={14} /> {selectedSubject.name} · {activeScopeLabel || question.mainTopicName || question.topicName}
                                        </div>
                                        <h2 className="mt-1 text-[22px] font-semibold text-ink">
                                            Question {questionNumber}
                                        </h2>
                                        <p className="mt-1 text-[13px] text-ink-muted">
                                            Answer each question carefully. You will receive feedback after submitting.
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-xl bg-ink/[0.04] px-3 py-1 text-[12px] font-medium text-ink-muted">
                                                Question {questionNumber} of {progressTotal}
                                            </div>
                                            {remainingSeconds !== null && (
                                                <div className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[12px] font-semibold',
                                                    remainingSeconds <= 300
                                                        ? 'bg-danger/10 text-danger animate-pulse'
                                                        : 'bg-accent/10 text-accent'
                                                )}>
                                                    <Clock3 size={13} />
                                                    <span>Time remaining: {formatDuration(remainingSeconds)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                                            <span>Question time: {formatDuration(questionElapsedSeconds)}</span>
                                            <span>·</span>
                                            <span>Session: {formatDuration(sessionElapsedSeconds)}</span>
                                        </div>
                                        {question.subtopicName && (
                                            <span className="text-[12px] text-ink-subtle">{question.subtopicName}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                                    <div
                                        className="h-full rounded-full bg-accent transition-all duration-300"
                                        style={{ width: `${progressValue}%` }}
                                    />
                                </div>

                                {/* Question Text */}
                                <div className="mt-6 rounded-2xl bg-ink/[0.015] border border-line/60 p-5">
                                    <p className="text-[17px] font-medium leading-relaxed text-ink whitespace-pre-line">
                                        {question.questionText}
                                    </p>
                                </div>

                                {/* Question Diagram / Image if available */}
                                {question.imagePath && (
                                    <div className="mt-4 flex flex-col items-center rounded-2xl border border-line bg-surface p-4 shadow-sm">
                                        <span className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                            Question Reference Diagram
                                        </span>
                                        <img
                                            src={question.imagePath}
                                            alt={`Reference diagram for Question ${questionNumber}`}
                                            className="max-h-80 max-w-full rounded-xl bg-white p-2 object-contain"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                if (!target.src.includes('/api/')) {
                                                    target.src = `/api${question.imagePath}`;
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Options List */}
                                <div className="mt-6 space-y-3">
                                    {(question.options || []).map((option, idx) => {
                                        const details = getOptionDetails(option, idx);
                                        const isSelected = selectedAnswer === details.value || selectedAnswer === details.text;

                                        let variant: 'default' | 'correct' | 'incorrect' = 'default';
                                        if (pendingAttempt) {
                                            const isCorrectOption = Boolean(
                                                pendingAttempt.correctAnswer && (
                                                    details.value === pendingAttempt.correctAnswer ||
                                                    details.text === pendingAttempt.correctAnswer ||
                                                    details.label === pendingAttempt.correctAnswer ||
                                                    (typeof pendingAttempt.correctAnswer === 'string' &&
                                                        pendingAttempt.correctAnswer.toLowerCase().includes('all options accepted'))
                                                )
                                            );

                                            if (isSelected) {
                                                variant = pendingAttempt.correct ? 'correct' : 'incorrect';
                                            } else if (isCorrectOption) {
                                                variant = 'correct';
                                            }
                                        }

                                        return (
                                            <OptionButton
                                                key={idx}
                                                label={details.label}
                                                text={details.text}
                                                selected={isSelected}
                                                variant={variant}
                                                disabled={submitting || !!pendingAttempt}
                                                onClick={() => {
                                                    if (!pendingAttempt && !submitting) {
                                                        setSelectedAnswer(details.value);
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </div>


                                {pendingAttempt && (
                                    <div
                                        className={`mt-5 rounded-2xl border p-5 shadow-sm transition-all ${
                                            pendingAttempt.correct
                                                ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                                                : 'border-rose-300 bg-rose-50/90 text-rose-950'
                                        }`}
                                        role="status"
                                    >
                                        <div className="flex items-center gap-2 text-[16px] font-bold">
                                            {pendingAttempt.correct ? (
                                                <>
                                                    <CheckCircle2 size={20} className="text-emerald-600" />
                                                    <span>✓ Correct Answer!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[12px] font-bold">✗</span>
                                                    <span>✗ Incorrect Answer</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="mt-2 text-[14px]">
                                            <strong className="font-semibold">Score:</strong> {pendingAttempt.score} / {pendingAttempt.maxMarks} mark{pendingAttempt.maxMarks === 1 ? '' : 's'}
                                        </p>
                                        <p className="mt-1 text-[14px]">
                                            {pendingAttempt.correct
                                                ? 'Well done! You selected the correct answer.'
                                                : 'Your selected answer was not correct.'}
                                        </p>
                                        {!pendingAttempt.correct && pendingAttempt.correctAnswer && (
                                            <div className="mt-3 rounded-xl bg-white/70 border border-rose-200/80 p-3 text-[14px]">
                                                <strong className="font-semibold text-rose-900">Correct Answer:</strong>{' '}
                                                <span className="font-medium text-ink">{pendingAttempt.correctAnswer}</span>
                                            </div>
                                        )}
                                        {pendingAttempt.explanation && (
                                            <div className="mt-3 rounded-xl bg-white/70 border border-ink/10 p-3 text-[13px] leading-relaxed text-ink-muted">
                                                <strong className="font-semibold text-ink">Explanation:</strong>{' '}
                                                <span>{pendingAttempt.explanation}</span>
                                            </div>
                                        )}
                                    </div>
                                )}




                                {/* Footer Actions */}
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                                    <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                                        <Clock3 size={15} />
                                        Time is recorded per question for response latency analysis.
                                    </div>

                                    {!pendingAttempt ? (
                                        <button
                                            type="button"
                                            onClick={submitAnswer}
                                            disabled={submitting || !selectedAnswer || !!pendingAttempt}
                                            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {submitting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={16} />
                                            )}
                                            Submit answer
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={continueAfterFeedback}
                                            disabled={submitting}
                                            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {submitting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={16} />
                                            )}
                                            {pendingAttempt.completed || !pendingAttempt.nextQuestion
                                                ? 'View Results'
                                                : 'Next Question'}
                                        </button>
                                    )}
                                </div>

                            </motion.section>
                        )}

                        {/* STEP 5: RESULTS & PREDICTION */}
                        {/* STEP 5: RESULTS & PREDICTION */}
                        {step === 'results' && results && (() => {
                            const attemptedList = (results.attemptedQuestions || []) as Array<{
                                attemptId?: string;
                                questionId?: string;
                                topicId?: string | null;
                                topicName?: string | null;
                                subtopicName?: string | null;
                                selectedAnswer?: string;
                                score?: number;
                                maxMarks?: number;
                                isCorrect?: boolean;
                                timeTakenSeconds?: number;
                            }>;
                            const totalTimeSeconds = attemptedList.reduce((acc, q) => acc + (q.timeTakenSeconds || 0), 0);
                            const avgTimeSeconds = attemptedList.length > 0 ? Math.round(totalTimeSeconds / attemptedList.length) : 0;
                            const strongTopics = (results.topicPerformance || []).filter((t) => (t.accuracy ?? 0) >= 0.7);
                            const weakTopics = (results.topicPerformance || []).filter((t) => (t.accuracy ?? 0) < 0.7);

                            const recommendedSubtopics = (topicCategories.length > 0 ? topicCategories : categories)
                                .flatMap((cat) => (cat.topics || []).flatMap((top) => (top.subtopics || []).map((sub) => ({ ...sub, mainTopicId: cat.id, mainTopicName: cat.name }))))
                                .filter((sub) => sub.questionCount > 0)
                                .slice(0, 3);

                            const accuracyVal = results.summary.accuracy ?? 0;

                            return (
                                <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-accent">
                                                <CheckCircle2 size={16} /> Assessment Session Complete
                                            </div>
                                            <h2 className="mt-1 text-[24px] font-semibold text-ink">Assessment Results</h2>
                                            <p className="mt-1 text-[14px] text-ink-muted">{results.message}</p>
                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                                                <span className="rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent">
                                                    {session?.subject ? session.subject.toUpperCase() : selectedSubject?.name}
                                                </span>
                                                <span className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-ink-muted font-medium">
                                                    {session?.practiceMode === 'subtopic'
                                                        ? 'Subtopic Practice'
                                                        : session?.practiceMode === 'paper'
                                                            ? 'Past Paper Simulation'
                                                            : 'Adaptive Assessment'}
                                                </span>
                                                {activeScopeLabel && (
                                                    <span className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-ink font-medium">
                                                        {activeScopeLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (selectedSubject) {
                                                        setError(null);
                                                        setStep('papers');
                                                    } else {
                                                        resetModule();
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:brightness-105 active:scale-[0.98]">
                                                <Sparkles size={14} /> Practise more subtopics
                                            </button>
                                            <button
                                                type="button"
                                                onClick={resetModule}
                                                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-ink/[0.04] active:scale-[0.98]">
                                                <RotateCcw size={14} /> New assessment
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Stats Row */}
                                    <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                                        <StatCard
                                            label="Score"
                                            value={`${results.summary.totalScore} / ${results.summary.maxScore || '—'}`}
                                            hint="Marks earned"
                                        />
                                        <StatCard
                                            label="Attempted"
                                            value={`${results.summary.attemptedCount}`}
                                            hint="Questions answered"
                                        />
                                        <StatCard
                                            label="Accuracy"
                                            value={formatPercent(results.summary.accuracy)}
                                            hint={`${results.summary.correctCount} correct`}
                                        />
                                        <StatCard
                                            label="Time Taken"
                                            value={`${Math.floor(totalTimeSeconds / 60)}m ${totalTimeSeconds % 60}s`}
                                            hint={`Avg ${avgTimeSeconds}s / question`}
                                        />
                                        <StatCard
                                            label="Predicted Grade"
                                            value={prediction?.predictedGrade || '—'}
                                            hint={
                                                prediction?.status === 'evaluated'
                                                    ? 'Evaluated ML model'
                                                    : prediction?.message || 'Diagnostic guidance'
                                            }
                                        />
                                    </div>

                                    {/* Actionable Study Recommendation Callout */}
                                    <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/[0.03] p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-accent-soft p-2 text-accent shrink-0">
                                                <Lightbulb size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-semibold text-ink">
                                                    Actionable Study Recommendation
                                                </h4>
                                                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                                                    {accuracyVal >= 0.8
                                                        ? 'Outstanding mastery! You have shown solid command over this area. To maintain high exam readiness, try full-length timed papers or tackle adjacent advanced subtopics.'
                                                        : accuracyVal >= 0.5
                                                            ? 'Solid foundation! You understand the core principles, but missed specific multi-step application questions. Review your question breakdown below, check standard formulas, and re-attempt to solidify your score.'
                                                            : 'Targeted revision recommended. Review foundational textbook theory and standard examples for this topic before your next practice run. Focus on definition accuracy and step-by-step problem solving.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance-Based Improvement Section */}
                                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                                        {/* Left Column: Strong and Weak Areas */}
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp size={16} className="text-accent" />
                                                    <h3 className="text-[16px] font-semibold text-ink">Performance Analysis</h3>
                                                </div>

                                                {/* Strong Areas */}
                                                <div className="mt-3">
                                                    <span className="text-[12px] font-semibold uppercase tracking-wider text-emerald-600">
                                                        Strong Areas (Accuracy ≥ 70%)
                                                    </span>
                                                    {strongTopics.length > 0 ? (
                                                        <div className="mt-2 space-y-2">
                                                            {strongTopics.map((topic) => (
                                                                <div key={topic.topicId} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                                                    <div>
                                                                        <p className="text-[13px] font-medium text-emerald-950">{topic.topicName}</p>
                                                                        <p className="text-[11px] text-emerald-700">{topic.correct}/{topic.attempted} correct ({topic.score}/{topic.maxMarks} marks)</p>
                                                                    </div>
                                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                                                        {formatPercent(topic.accuracy)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="mt-2 rounded-xl border border-dashed border-line p-3 text-[12px] text-ink-muted">
                                                            No topics reached the 70% proficiency threshold yet. Continued practice will raise proficiency.
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Weak Areas */}
                                                <div className="mt-4">
                                                    <span className="text-[12px] font-semibold uppercase tracking-wider text-amber-600">
                                                        Areas to Improve (Accuracy &lt; 70%)
                                                    </span>
                                                    {weakTopics.length > 0 ? (
                                                        <div className="mt-2 space-y-2">
                                                            {weakTopics.map((topic) => (
                                                                <div key={topic.topicId} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                                                                    <div>
                                                                        <p className="text-[13px] font-medium text-amber-950">{topic.topicName}</p>
                                                                        <p className="text-[11px] text-amber-700">{topic.correct}/{topic.attempted} correct ({topic.score}/{topic.maxMarks} marks)</p>
                                                                    </div>
                                                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                                                        {formatPercent(topic.accuracy)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="mt-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-3 text-[12px] text-emerald-800">
                                                            ✓ Excellent work! All attempted topics scored 70% or above.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Topic-level performance full list */}
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-ink">Topic Breakdown</h3>
                                                <div className="mt-3 space-y-2">
                                                    {(results.topicPerformance || []).map((topic) => (
                                                        <div key={topic.topicId} className="rounded-2xl border border-line p-3.5">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-medium text-ink text-[13px]">{topic.topicName}</p>
                                                                    <p className="mt-0.5 text-[12px] text-ink-muted">
                                                                        {topic.correct}/{topic.attempted} correct ({topic.score}/{topic.maxMarks} marks)
                                                                    </p>
                                                                </div>
                                                                <span className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                                                                    {formatPercent(topic.accuracy)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!results.topicPerformance || results.topicPerformance.length === 0) && (
                                                        <p className="rounded-2xl border border-dashed border-line px-4 py-4 text-[13px] text-ink-muted">
                                                            No topic breakdown is available for this session.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Recommended Next Subtopics & Readiness */}
                                        <div className="space-y-6">
                                            {/* Recommended Next Subtopics */}
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-ink">Recommended Next Subtopics</h3>
                                                <div className="mt-3 space-y-2.5">
                                                    {recommendedSubtopics.map((rec) => {
                                                        const subDuration = Math.max(2, Math.ceil(rec.questionCount * 2));
                                                        return (
                                                            <div
                                                                key={rec.id}
                                                                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 transition hover:border-accent/40 hover:shadow-sm">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-[13px] font-semibold text-ink truncate">{rec.name}</p>
                                                                    <p className="text-[11px] text-ink-muted">
                                                                        {rec.mainTopicName} · {rec.questionCount} Qs · {subDuration}m
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    disabled={submitting}
                                                                    onClick={() =>
                                                                        startAssessmentSession({
                                                                            mainTopicId: rec.mainTopicId,
                                                                            subtopicId: rec.id,
                                                                            scopeLabel: `${selectedSubject?.name || 'Syllabus'} > ${rec.mainTopicName} > ${rec.name}`,
                                                                            practiceMode: 'subtopic',
                                                                            durationMinutes: subDuration,
                                                                            targetQuestionCount: rec.questionCount,
                                                                        })
                                                                    }
                                                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition hover:brightness-105 active:scale-[0.98]">
                                                                    <Play size={11} /> Practise Now
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Exam Readiness & Grade Prediction */}
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-ink">Exam Readiness & Grade Prediction</h3>
                                                <div className="mt-3 rounded-2xl border border-line bg-ink/[0.02] p-5 text-[14px] leading-7 text-ink-muted">
                                                    {prediction ? (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-ink">
                                                                    {prediction.status === 'insufficient_data' ? 'More practice needed' : 'Learning progress summary'}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase',
                                                                        prediction.status === 'evaluated'
                                                                            ? 'bg-success/15 text-success'
                                                                            : 'bg-ink/[0.08] text-ink-muted'
                                                                    )}>
                                                                    {prediction.status}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-[13px]">{prediction.message}</p>
                                                            <div className="mt-3 grid grid-cols-2 gap-2 text-ink">
                                                                <div className="rounded-xl border border-line/60 bg-surface p-3">
                                                                    <p className="text-[11px] text-ink-muted">Predicted A/L Grade</p>
                                                                    <p className="text-[22px] font-bold text-accent">
                                                                        {prediction.predictedGrade || '—'}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-xl border border-line/60 bg-surface p-3">
                                                                    <p className="text-[11px] text-ink-muted">Predicted Score</p>
                                                                    <p className="text-[22px] font-bold">
                                                                        {prediction.predictedMarks != null ? `${prediction.predictedMarks}%` : '—'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {prediction.ruleBasedReadiness && (
                                                                <div className="mt-3 border-t border-line/60 pt-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-[12px] font-semibold uppercase tracking-wider text-ink">
                                                                            Readiness guidance
                                                                        </p>
                                                                        <span
                                                                            className={cn(
                                                                                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                                                                                prediction.ruleBasedReadiness.readinessBadge === 'GREEN'
                                                                                    ? 'bg-success/15 text-success'
                                                                                    : prediction.ruleBasedReadiness.readinessBadge === 'AMBER'
                                                                                        ? 'bg-amber-500/15 text-amber-600'
                                                                                        : 'bg-danger/15 text-danger'
                                                                            )}>
                                                                            {prediction.ruleBasedReadiness.readinessLevel}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-1 text-[13px] leading-5 text-ink-muted">
                                                                        {prediction.ruleBasedReadiness.summary}
                                                                    </p>
                                                                    <p className="mt-1 text-[12px] text-ink-subtle">
                                                                        Based on the questions attempted in this assessment. This is diagnostic guidance to support your revision, not an official examination result.
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Research & Developer Model Diagnostics Disclosure */}
                                                            <div className="mt-4 border-t border-line/60 pt-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowDiagnostics((prev) => !prev)}
                                                                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline cursor-pointer">
                                                                    {showDiagnostics ? '▲ Hide Research & Model Diagnostics' : '▼ View Research & Model Diagnostics'}
                                                                </button>
                                                                {showDiagnostics && (
                                                                    <div className="mt-2.5 space-y-2 rounded-2xl bg-ink/[0.03] p-4 text-[12px] text-ink-muted border border-line/60">
                                                                        <div>
                                                                            <span className="font-semibold text-ink">Model Architecture:</span>{' '}
                                                                            <span>{prediction.modelType || 'RandomForestRegressor (scikit-learn)'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold text-ink">Benchmark Dataset:</span>{' '}
                                                                            <span>{prediction.benchmarkDataset || 'UCI Secondary Education Student Performance'}</span>
                                                                        </div>
                                                                        {prediction.metrics && (
                                                                            <div>
                                                                                <span className="font-semibold text-ink">Held-out Evaluation:</span>{' '}
                                                                                <span>
                                                                                    MAE {prediction.metrics.mae} · RMSE {prediction.metrics.rmse}
                                                                                    {prediction.metrics.r2 != null ? ` · R² ${prediction.metrics.r2}` : ''}
                                                                                    {prediction.metrics.samples ? ` · Test samples: ${prediction.metrics.samples}` : ''}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {prediction.baseline && (
                                                                            <div>
                                                                                <span className="font-semibold text-ink">Baseline Comparison (Mean):</span>{' '}
                                                                                <span>
                                                                                    MAE {prediction.baseline.mae} · RMSE {prediction.baseline.rmse}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="text-[11px] text-ink-subtle border-t border-line/40 pt-2 leading-relaxed">
                                                                            <em>Research Scope Disclosure:</em> Model evaluated on empirical secondary academic benchmark records for research methodology validation. G.C.E. A/L exam predictions are diagnostic proxies subject to official cohort standardization.
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p>Prediction data has not been computed yet.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Revision Priorities */}
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-ink">Revision Priorities</h3>
                                                <div className="mt-3 space-y-3">
                                                    {(priorities || []).slice(0, 4).map((priority) => (
                                                        <div key={priority.topicId} className="rounded-2xl border border-line p-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-medium text-ink">{priority.topicName}</p>
                                                                    <p className="mt-1 text-[13px] text-ink-muted">{priority.recommendedAction}</p>
                                                                </div>
                                                                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent">
                                                                    Priority {priority.priorityScore}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!priorities || priorities.length === 0) && (
                                                        <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-[14px] text-ink-muted">
                                                            Revision priorities will appear once you have completed assessment attempts.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Review Section */}
                                    {attemptedList.length > 0 && (
                                        <div className="mt-8 border-t border-line pt-6">
                                            <h3 className="text-[18px] font-semibold text-ink">Question Review</h3>
                                            <p className="mt-1 text-[13px] text-ink-muted">
                                                Review your responses, accuracy, and time spent on each question.
                                            </p>
                                            <div className="mt-4 space-y-2.5">
                                                {attemptedList.map((att, idx) => (
                                                    <div
                                                        key={att.attemptId || idx}
                                                        className={cn(
                                                            'flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition-all',
                                                            att.isCorrect
                                                                ? 'border-emerald-200/80 bg-emerald-50/30'
                                                                : 'border-rose-200/80 bg-rose-50/30'
                                                        )}>
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={cn(
                                                                    'flex h-7 w-7 items-center justify-center rounded-xl text-[12px] font-bold text-white',
                                                                    att.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                                                                )}>
                                                                {att.isCorrect ? '✓' : '✗'}
                                                            </span>
                                                            <div>
                                                                <p className="text-[14px] font-semibold text-ink">
                                                                    Question {idx + 1}
                                                                    {att.subtopicName && (
                                                                        <span className="ml-2 font-normal text-ink-muted text-[12px]">
                                                                            · {att.subtopicName}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[12px] text-ink-subtle">
                                                                    Selected answer: <span className="font-semibold text-ink">{att.selectedAnswer || '—'}</span>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-[12px]">
                                                            <span className="rounded-lg bg-ink/[0.04] px-2.5 py-1 text-ink-muted">
                                                                {att.timeTakenSeconds ? `${att.timeTakenSeconds}s` : '—'}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'font-semibold',
                                                                    att.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                                                )}>
                                                                {att.score || 0} / {att.maxMarks || 1} mark
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            );
                        })()}
                    </section>

                    {/* ASIDE INFO */}
                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
                            <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                                <Compass size={16} className="text-accent" /> Syllabus Architecture
                            </div>
                            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-ink-muted">
                                <li>• <strong>General & Physical:</strong> Units 01–04, 07–08, 11 (29 questions).</li>
                                <li>• <strong>Inorganic:</strong> Unit 05 s, p, d blocks & periodicity (5 questions).</li>
                                <li>• <strong>Organic:</strong> Units 06, 09, 10 reaction mechanisms (16 questions).</li>
                                <li>• <strong>Total Paper:</strong> 50 questions from Sri Lankan G.C.E. A/L 2024.</li>
                            </ul>
                        </div>

                        <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
                            <h3 className="text-[16px] font-semibold text-ink">Your Learning Progress</h3>
                            {progress ? (
                                <div className="mt-3 space-y-3 text-[13px] text-ink-muted">
                                    <div className="flex justify-between">
                                        <span>Total sessions</span>
                                        <span className="font-semibold text-ink">{progress.totalSessions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total attempts</span>
                                        <span className="font-semibold text-ink">{progress.totalAttempts}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Completed sessions</span>
                                        <span className="font-semibold text-ink">{progress.completedSessions}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 text-[13px] text-ink-muted">No progress recorded yet.</div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
                            <h3 className="text-[16px] font-semibold text-ink">Adaptive Engine Rules</h3>
                            <ol className="mt-3 space-y-2 text-[13px] leading-6 text-ink-muted">
                                <li>1. Starts at target difficulty Level 3 (Medium).</li>
                                <li>2. Increases target difficulty (+1) on correct response.</li>
                                <li>3. Lowers target difficulty (-1) on incorrect response.</li>
                                <li>4. Keeps responses scoped to your selected topic or branch.</li>
                            </ol>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
