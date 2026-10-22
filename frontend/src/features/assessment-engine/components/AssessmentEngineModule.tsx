import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  createAssessmentSession,
  fetchAssessmentProgress,
  fetchAssessmentResults,
  fetchAssessmentSubjects,
  fetchGradePrediction,
  fetchNextQuestion,
  fetchRevisionPriorities,
  fetchSubjectTopics,
  submitAssessmentAttempt,
} from '../services/assessmentApi';
import type {
  AssessmentQuestion,
  AssessmentResults,
  AssessmentSession,
  AssessmentSubjectSummary,
  ChemistrySyllabusCategory,
  ChemistrySubtopic,
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

type Step = 'subjects' | 'consent' | 'main-topics' | 'subtopics' | 'start' | 'quiz' | 'results';

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
  } catch (_e) {
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
  status = 'default',
  onClick,
  disabled,
}: {
  label: string;
  text: string;
  selected: boolean;
  status?: 'default' | 'correct' | 'incorrect' | 'missed-correct';
  onClick: () => void;
  disabled?: boolean;
}) {
  let borderClass = 'border-line bg-surface hover:border-line-strong hover:bg-ink/[0.02]';
  let badgeClass = 'border-line bg-ink/[0.03] text-ink-muted group-hover:border-accent/40 group-hover:text-ink';
  let badgeContent: React.ReactNode = label;

  if (status === 'correct') {
    borderClass = 'border-emerald-500 bg-emerald-500/10 text-ink shadow-sm ring-1 ring-emerald-500';
    badgeClass = 'border-emerald-500 bg-emerald-500 text-white font-bold';
    badgeContent = '✓';
  } else if (status === 'incorrect') {
    borderClass = 'border-rose-500 bg-rose-500/10 text-ink shadow-sm ring-1 ring-rose-500';
    badgeClass = 'border-rose-500 bg-rose-500 text-white font-bold';
    badgeContent = '✕';
  } else if (status === 'missed-correct') {
    borderClass = 'border-emerald-500/70 bg-emerald-500/5 text-ink ring-1 ring-emerald-500/50';
    badgeClass = 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold';
    badgeContent = '✓';
  } else if (selected) {
    borderClass = 'border-accent bg-accent-soft text-ink shadow-sm ring-1 ring-accent';
    badgeClass = 'border-accent bg-accent text-white';
    badgeContent = '✓';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150',
        borderClass,
        disabled && 'cursor-not-allowed opacity-90',
        focusRing
      )}>
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold transition-colors',
          badgeClass
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
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [prediction, setPrediction] = useState<GradePredictionResponse | null>(null);
  const [priorities, setPriorities] = useState<RevisionPriority[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Immediate post-submission feedback and transition state
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    isCorrect: boolean;
    score: number;
    maxMarks: number;
    correctAnswer?: string;
    explanation?: string | null;
    timeTakenSeconds: number;
    submittedAnswer: string;
    thetaBefore?: number | null;
    thetaAfter?: number | null;
  } | null>(null);
  const [pendingNextQuestion, setPendingNextQuestion] = useState<AssessmentQuestion | null>(null);
  const [pendingSession, setPendingSession] = useState<AssessmentSession | null>(null);
  const [isCompletedSession, setIsCompletedSession] = useState(false);

  // Chemistry Syllabus Hierarchy State
  const [categories, setCategories] = useState<ChemistrySyllabusCategory[]>([]);
  const [totalChemistryQuestions, setTotalChemistryQuestions] = useState<number>(50);
  const [selectedCategory, setSelectedCategory] = useState<ChemistrySyllabusCategory | null>(null);
  const [activeScopeLabel, setActiveScopeLabel] = useState<string>('');

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

    if (selectedSubject.id === 'chemistry') {
      try {
        setSubmitting(true);
        const topicsData = await fetchSubjectTopics('chemistry');
        if (!topicsData || !Array.isArray(topicsData.categories)) {
          throw new Error('Unable to retrieve syllabus categories from the assessment server.');
        }
        setCategories(topicsData.categories || []);
        setTotalChemistryQuestions(topicsData.totalQuestions || 50);
        setStep('main-topics');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chemistry topics.');
      } finally {
        setSubmitting(false);
      }
    } else {
      await startAssessmentSession({
        mainTopicId: null,
        subtopicId: null,
        scopeLabel: selectedSubject.name,
      });
    }
  };

  const startAssessmentSession = async ({
    mainTopicId = null,
    subtopicId = null,
    scopeLabel = '',
  }: {
    mainTopicId?: string | null;
    subtopicId?: string | null;
    scopeLabel?: string;
  }) => {
    if (!selectedSubject) return;
    try {
      setSubmitting(true);
      setError(null);
      setActiveScopeLabel(scopeLabel || selectedSubject.name);

      const nextSession = await createAssessmentSession({
        studentId,
        subject: selectedSubject.id,
        consentAccepted: true,
        consentVersion: CONSENT_VERSION,
        mainTopicId,
        subtopicId,
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
      setSubmissionFeedback(null);
      setPendingNextQuestion(null);
      setPendingSession(null);
      setIsCompletedSession(false);
      setStartedAt(Date.now());
      setStep('quiz');

      const updatedProgress = await fetchAssessmentProgress(studentId).catch(() => null);
      if (updatedProgress) setProgress(updatedProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the assessment session.');
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
      setSubmissionFeedback(null);
      setPendingNextQuestion(null);
      setPendingSession(null);
      setIsCompletedSession(false);
      setLastAction('Assessment completed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load assessment results.');
    }
  };

  const submitAnswer = async () => {
    if (!session || !question || submitting || submissionFeedback) return;
    if (!selectedAnswer) {
      setError('Select an answer before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const elapsed = Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 1000));
      const payload = await submitAssessmentAttempt({
        sessionId: session.sessionId,
        questionId: question.questionId,
        selectedAnswer,
        timeTakenSeconds: elapsed,
      });

      setSubmissionFeedback({
        isCorrect: payload.correct,
        score: payload.score,
        maxMarks: payload.maxMarks,
        correctAnswer: payload.correctAnswer,
        explanation: payload.explanation,
        timeTakenSeconds: elapsed,
        submittedAnswer: selectedAnswer,
        thetaBefore: payload.attempt?.thetaBefore,
        thetaAfter: payload.attempt?.thetaAfter,
      });

      setPendingNextQuestion(payload.nextQuestion);
      setPendingSession(payload.session);
      setIsCompletedSession(payload.completed || !payload.nextQuestion);

      const thetaDiff =
        typeof payload.attempt?.thetaAfter === 'number' && typeof payload.attempt?.thetaBefore === 'number'
          ? (payload.attempt.thetaAfter - payload.attempt.thetaBefore).toFixed(2)
          : null;

      setLastAction(
        payload.correct
          ? `Correct answer recorded (+target difficulty${thetaDiff ? `, θ: +${thetaDiff}` : ''}).`
          : `Incorrect answer recorded (-target difficulty${thetaDiff ? `, θ: ${thetaDiff}` : ''}).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit the answer.';
      if (msg.includes('duplicate_attempt') || msg.includes('already been submitted')) {
        setError('This question was already recorded for this session. Please proceed to the next question.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceQuestion = async () => {
    if (isCompletedSession || !pendingNextQuestion) {
      if (session) {
        await finishSession(session.sessionId);
      }
      setSubmissionFeedback(null);
      setPendingNextQuestion(null);
      setPendingSession(null);
      setIsCompletedSession(false);
      return;
    }

    if (pendingSession) setSession(pendingSession);
    setQuestion(pendingNextQuestion);
    setSelectedAnswer('');
    setSubmissionFeedback(null);
    setPendingNextQuestion(null);
    setPendingSession(null);
    setIsCompletedSession(false);
    setStartedAt(Date.now());
  };

  const resetModule = () => {
    setSelectedSubject(null);
    setSession(null);
    setQuestion(null);
    setSelectedAnswer('');
    setSubmissionFeedback(null);
    setPendingNextQuestion(null);
    setPendingSession(null);
    setIsCompletedSession(false);
    setResults(null);
    setPrediction(null);
    setPriorities([]);
    setLastAction(null);
    setSelectedCategory(null);
    setActiveScopeLabel('');
    setError(null);
    setConsentAccepted(false);
    setStep('subjects');
  };

  const questionNumber = (session?.askedQuestionIds.length || 0) + (question ? 1 : 0);
  const progressValue = Math.min(100, Math.round((questionNumber / PROGRESS_ESTIMATE) * 100));

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
              Rule-based adaptive assessment for Sri Lankan G.C.E. Advanced Level examinations. Real 2024 Paper 01
              questions for Chemistry, with syllabus branching and live difficulty calibration.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-2xl bg-ink/[0.04] px-3 py-2 text-right text-[12px] text-ink-muted">
              Pseudonymous student ID
              <div className="mt-1 font-mono text-[13px] text-ink">{studentId}</div>
            </div>
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

          {selectedSubject?.id === 'chemistry' && (
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
              3. Syllabus Scope
            </button>
          )}

          <span
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
              step === 'quiz' || step === 'start'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-ink/[0.05] text-ink-muted'
            )}>
            {selectedSubject?.id === 'chemistry' ? '4. Assessment' : '3. Assessment'}
          </span>

          <span
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all text-center',
              step === 'results'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-ink/[0.05] text-ink-muted'
            )}>
            {selectedSubject?.id === 'chemistry' ? '5. Results' : '4. Results'}
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
                      <strong>Adaptive Questioning:</strong> Question difficulty adjusts in real time (Level 2: Easy, Level 3: Medium, Level 4: Hard) based on your response accuracy.
                    </li>
                    <li>
                      <strong>Independent ML Prediction:</strong> Grade prediction models require sufficient historical data and will indicate prototype or insufficient status transparently.
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
                    disabled={submitting}
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

            {/* STEP 3A: CHEMISTRY MAIN TOPICS (BRANCHES) */}
            {step === 'main-topics' && selectedSubject?.id === 'chemistry' && (
              <section className="space-y-6">
                {/* Full paper practice banner */}
                <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-r from-accent/10 via-surface to-accent/5 p-6 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-accent">
                        <Sparkles size={14} /> Full 2024 Examination Simulation
                      </div>
                      <h2 className="mt-1 text-[22px] font-bold text-ink">
                        Comprehensive Chemistry Paper 01
                      </h2>
                      <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                        Practise the entire 50-question 2024 G.C.E. A/L Chemistry Paper across all 3 branches
                        (Physical, Inorganic, Organic) with continuous adaptive difficulty.
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[13px] text-ink-muted">
                        <span className="font-semibold text-ink">50 Verified Questions</span> · <span>Single Question Adaptive Arena</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        startAssessmentSession({
                          mainTopicId: null,
                          subtopicId: null,
                          scopeLabel: 'Chemistry (Full Paper 01)',
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-[15px] font-semibold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                      Practise Full Paper 01
                    </button>
                  </div>
                </div>

                {/* 3 Main Branches */}
                <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                  <div>
                    <h3 className="text-[20px] font-semibold text-ink">Choose a Specific Syllabus Branch</h3>
                    <p className="mt-1 text-[14px] leading-6 text-ink-muted">
                      Select one of the three core domains of Sri Lankan A/L Chemistry. You can practise all questions
                      within the branch or drill into individual subtopics.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-accent/40 hover:shadow-float">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-ink/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                              {category.id === 'physical-chemistry'
                                ? 'Branch A'
                                : category.id === 'inorganic-chemistry'
                                ? 'Branch B'
                                : 'Branch C'}
                            </span>
                            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[12px] font-semibold text-accent">
                              {category.questionCount} Questions
                            </span>
                          </div>
                          <h4 className="mt-3 text-[18px] font-semibold text-ink">{category.name}</h4>
                          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{category.description}</p>
                          <div className="mt-3 text-[12px] text-ink-subtle">
                            {(category.topics || []).length} Syllabus Units Included
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
                            <Play size={14} /> Practise Branch ({category.questionCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSelectedCategory(category);
                              setStep('subtopics');
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-ink/[0.03] active:scale-[0.98]">
                            <BookOpen size={14} /> Explore Units & Subtopics
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep('consent');
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-ink/[0.04] active:scale-[0.98]">
                      <ArrowLeft size={14} /> Back to Consent
                    </button>
                    <span className="text-[12px] text-ink-muted">
                      Total Paper 01 Questions: {totalChemistryQuestions}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3B: CHEMISTRY SUBTOPICS DRILLDOWN */}
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
                      <ArrowLeft size={14} /> Back to All Branches
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
                  {(selectedCategory.topics || []).map((topic) => (
                    <div key={topic.id} className="rounded-2xl border border-line/80 bg-ink/[0.015] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-accent" />
                          <h3 className="text-[16px] font-semibold text-ink">{topic.name}</h3>
                        </div>
                        <span className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[12px] font-medium text-ink-muted">
                          {topic.questionCount} {topic.questionCount === 1 ? 'question' : 'questions'}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {(topic.subtopics || []).map((subtopic) => (
                          <div
                            key={subtopic.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-strong">
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-medium text-ink truncate">{subtopic.name}</p>
                              <p className="text-[12px] text-ink-muted">
                                {subtopic.questionCount > 0 ? (
                                  <span className="text-accent font-semibold">
                                    {subtopic.questionCount} available in 2024 Paper
                                  </span>
                                ) : (
                                  <span className="text-ink-subtle">0 questions in 2024 Paper</span>
                                )}
                              </p>
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
                                  })
                                }
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:brightness-105 active:scale-[0.98]">
                                <Play size={12} /> Practise
                              </button>
                            ) : (
                              <span className="rounded-md bg-ink/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-subtle">
                                No questions yet
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
                      Target: <strong className="text-ink">Level {session.targetDifficulty}/5</strong> · Latent Ability: <strong className="text-accent">{typeof session.abilityEstimate === 'number' ? `θ = ${session.abilityEstimate >= 0 ? '+' : ''}${session.abilityEstimate.toFixed(2)}` : 'θ = 0.00'}</strong> · Question: <strong className="text-ink">Level {question.expertDifficulty}/5 ({question.difficultyLevel || 'Medium'})</strong>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="rounded-xl bg-ink/[0.04] px-3 py-1.5 text-[12px] text-ink-muted">
                      Session Progress: {questionNumber} questions attempted
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
                    let status: 'default' | 'correct' | 'incorrect' | 'missed-correct' = 'default';

                    if (submissionFeedback) {
                      const isOptionCorrect =
                        Boolean(submissionFeedback.correctAnswer) &&
                        (details.value === submissionFeedback.correctAnswer ||
                          details.label === submissionFeedback.correctAnswer ||
                          details.text.trim().toLowerCase() === String(submissionFeedback.correctAnswer).trim().toLowerCase());

                      if (isSelected) {
                        status = submissionFeedback.isCorrect ? 'correct' : 'incorrect';
                      } else if (isOptionCorrect) {
                        status = 'missed-correct';
                      }
                    }

                    return (
                      <OptionButton
                        key={idx}
                        label={details.label}
                        text={details.text}
                        selected={isSelected}
                        status={status}
                        disabled={submitting || submissionFeedback !== null}
                        onClick={() => setSelectedAnswer(details.value)}
                      />
                    );
                  })}
                </div>

                {/* Instant Post-Submission Feedback */}
                {submissionFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'mt-6 rounded-2xl border p-5 transition-all shadow-xs',
                      submissionFeedback.isCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-rose-500/30 bg-rose-500/5'
                    )}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {submissionFeedback.isCorrect ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                            <CheckCircle2 size={20} />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
                            <XCircle size={20} />
                          </div>
                        )}
                        <div>
                          <h4 className="text-[16px] font-semibold text-ink">
                            {submissionFeedback.isCorrect
                              ? 'Correct Answer! (+1 Mark)'
                              : 'Incorrect Answer (0 Marks)'}
                          </h4>
                          <p className="text-[12px] text-ink-muted">
                            Response recorded in {submissionFeedback.timeTakenSeconds} second{submissionFeedback.timeTakenSeconds === 1 ? '' : 's'}. Target difficulty calibrated.
                            {submissionFeedback.thetaAfter !== undefined && submissionFeedback.thetaAfter !== null && (
                              <span> · Latent Ability: <strong className="text-accent font-semibold">θ = {submissionFeedback.thetaAfter >= 0 ? '+' : ''}{submissionFeedback.thetaAfter.toFixed(2)}</strong></span>
                            )}
                          </p>
                        </div>
                      </div>

                      {submissionFeedback.correctAnswer && (
                        <div className="rounded-xl border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink shadow-2xs">
                          Correct Answer: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{submissionFeedback.correctAnswer}</strong>
                        </div>
                      )}
                    </div>

                    {submissionFeedback.explanation && (
                      <div className="mt-4 rounded-xl border border-line/80 bg-surface/90 p-4 text-[13px] leading-relaxed text-ink">
                        <div className="flex items-center gap-1.5 font-semibold text-accent mb-1">
                          <Lightbulb size={15} /> Explanation
                        </div>
                        <p className="text-ink-muted">{submissionFeedback.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Footer Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                    <Clock3 size={15} />
                    {submissionFeedback
                      ? `Response time: ${submissionFeedback.timeTakenSeconds}s recorded.`
                      : 'Time is recorded per question for response latency analysis.'}
                  </div>

                  {submissionFeedback === null ? (
                    <button
                      type="button"
                      onClick={submitAnswer}
                      disabled={submitting || !selectedAnswer}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Submit answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAdvanceQuestion}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]">
                      {isCompletedSession ? (
                        <>
                          <CheckCircle2 size={16} /> View Assessment Results
                        </>
                      ) : (
                        <>
                          <ArrowRight size={16} /> Next Question
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.section>
            )}

            {/* STEP 5: RESULTS & PREDICTION */}
            {step === 'results' && results && (
              <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-accent">
                      <CheckCircle2 size={16} /> Assessment Session Complete
                    </div>
                    <h2 className="mt-1 text-[24px] font-semibold text-ink">Assessment Results</h2>
                    <p className="mt-1 text-[14px] text-ink-muted">{results.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSubject?.id === 'chemistry') {
                          setError(null);
                          setStep('main-topics');
                        } else {
                          resetModule();
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:brightness-105 active:scale-[0.98]">
                      <Sparkles size={14} /> Practise weak subtopics again
                    </button>
                    <button
                      type="button"
                      onClick={resetModule}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-ink/[0.04] active:scale-[0.98]">
                      <RotateCcw size={14} /> New assessment
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
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
                    hint={`${results.summary.correctCount} correct answers`}
                  />
                  <StatCard
                    label="Latent Ability (θ)"
                    value={
                      typeof results.summary.abilityEstimate === 'number'
                        ? `${results.summary.abilityEstimate >= 0 ? '+' : ''}${results.summary.abilityEstimate.toFixed(2)}`
                        : '0.00'
                    }
                    hint="Rasch 1PL MAP estimate"
                  />
                  <StatCard
                    label="Predicted Grade"
                    value={prediction?.predictedGrade || '—'}
                    hint={
                      prediction?.status === 'evaluated'
                        ? 'Evaluated ML model'
                        : prediction?.message || 'Insufficient data'
                    }
                  />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Topic breakdown */}
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink">Topic-level performance</h3>
                    <div className="mt-3 space-y-3">
                      {(results.topicPerformance || []).map((topic) => (
                        <div key={topic.topicId} className="rounded-2xl border border-line p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-ink">{topic.topicName}</p>
                              <p className="mt-1 text-[13px] text-ink-muted">
                                {topic.correct}/{topic.attempted} correct ({topic.score}/{topic.maxMarks} marks)
                              </p>
                            </div>
                            <span className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[12px] font-medium text-ink">
                              {formatPercent(topic.accuracy)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!results.topicPerformance || results.topicPerformance.length === 0) && (
                        <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-[14px] text-ink-muted">
                          No topic breakdown is available for this session.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ML Prediction & Exam Readiness */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[16px] font-semibold text-ink">Exam Readiness & Grade Prediction</h3>
                      <div className="mt-3 rounded-2xl border border-line bg-ink/[0.02] p-5 text-[14px] leading-7 text-ink-muted">
                        {prediction ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-ink">
                                {prediction.modelType || 'Scikit-Learn ML Model'}
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
                            {prediction.metrics && (
                              <p className="mt-2 text-[12px] text-ink-subtle">
                                Model Evaluation: MAE {prediction.metrics.mae} · RMSE {prediction.metrics.rmse}{' '}
                                {prediction.metrics.r2 != null ? `· R² ${prediction.metrics.r2}` : ''}
                              </p>
                            )}

                            {prediction.ruleBasedReadiness && (
                              <div className="mt-3 border-t border-line/60 pt-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-[12px] font-semibold uppercase tracking-wider text-ink">
                                    Exam Readiness Indicator
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
                                  Topic Coverage: {prediction.ruleBasedReadiness.topicCoveragePercent}% · Readiness Score: {prediction.ruleBasedReadiness.readinessScore}/100
                                </p>
                              </div>
                            )}
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
              </section>
            )}
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
