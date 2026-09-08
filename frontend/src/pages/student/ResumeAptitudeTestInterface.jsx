import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import {
  Clock, AlertTriangle, CheckCircle2, Play, Send, ChevronRight, ChevronLeft,
  Sparkles, Database, Code, Cpu, BookOpen, Layers, Lock, ShieldAlert, Award,
  Terminal, CheckCheck, XCircle, RotateCcw
} from 'lucide-react';
import ViolationModal from '../../components/ViolationModal';

const MAX_VIOLATIONS = 5;

const ResumeAptitudeTestInterface = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [visibleQuestions, setVisibleQuestions] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(2700);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Form & Autosave states
  const [answersMap, setAnswersMap] = useState({});
  const [submittingQ, setSubmittingQ] = useState(null);
  const [saveStatusMap, setSaveStatusMap] = useState({});
  const autosaveTimerRef = useRef({});

  // SQL Sandbox state
  const [sqlDraft, setSqlDraft] = useState('');
  const [sqlExecResult, setSqlExecResult] = useState(null);
  const [executingSql, setExecutingSql] = useState(false);

  // DSA Code state per questionId
  const [codeMap, setCodeMap] = useState({});         // { [qId]: code string }
  const [runResults, setRunResults] = useState({});   // { [qId]: { sampleResults, samplePassed, sampleTotal } }
  const [submitResults, setSubmitResults] = useState({}); // { [qId]: { testCasesResult, isCorrect, sampleResults } }
  const [runningCode, setRunningCode] = useState(null);
  const [submittingCode, setSubmittingCode] = useState(null);

  // Proctoring states
  const [tabViolations, setTabViolations] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  // Fetch session data
  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        setLoading(true);
        let res;
        if (!attemptId || attemptId === 'start' || attemptId.length > 20) {
          res = await api.get(`/student/resume-aptitude/session/${attemptId}`);
        } else {
          res = await api.post('/student/resume-aptitude/start', { jobId: attemptId });
        }

        if (!mounted) return;
        const data = res.data;
        setAttempt(data.attempt);
        setVisibleQuestions(data.visibleQuestions || data.attempt?.questions || []);
        setRemainingSeconds(data.remainingSeconds || 2700);

        // Pre-fill answers map
        const initialAnswers = {};
        const initialStatus = {};
        const initialCodes = {};
        const initialSubmitResults = {};

        (data.attempt?.answers || []).forEach(a => {
          if (!a.questionId) return;
          initialAnswers[a.questionId] = a.studentAnswer || '';
          if (a.studentAnswer) initialStatus[a.questionId] = 'saved';
          // Restore code for DSA_CODE answers
          const q = (data.attempt?.questions || []).find(q => q.id === a.questionId);
          if (q?.category === 'DSA_CODE') {
            initialCodes[a.questionId] = a.studentAnswer || q.starterCode || '';
            if (a.testCasesResult) {
              initialSubmitResults[a.questionId] = { testCasesResult: a.testCasesResult, isCorrect: a.isCorrect };
            }
          }
        });

        // Set starter code for DSA questions not yet answered
        (data.attempt?.questions || []).forEach(q => {
          if (q.category === 'DSA_CODE' && !initialCodes[q.id]) {
            initialCodes[q.id] = q.starterCode || '';
          }
        });

        setAnswersMap(initialAnswers);
        setSaveStatusMap(initialStatus);
        setCodeMap(initialCodes);
        setSubmitResults(initialSubmitResults);
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to initialize aptitude session');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSession();
    return () => { mounted = false; };
  }, [attemptId]);

  // Save answer to server (for short-answer & SQL autosave)
  const saveAnswerToServer = async (q, textValue) => {
    if (!attempt?.id || !q) return;
    if (q.category === 'DSA_CODE') return; // DSA handled separately
    const answerToSave = textValue !== undefined ? textValue : (q.category === 'SQL' ? sqlDraft : (answersMap[q.id] || ''));
    if (!answerToSave.trim()) return;

    setSaveStatusMap(prev => ({ ...prev, [q.id]: 'saving' }));
    setSubmittingQ(q.id);

    try {
      await api.post(`/student/resume-aptitude/session/${attempt.id}/submit-answer`, {
        questionId: q.id,
        studentAnswer: answerToSave
      });

      setSaveStatusMap(prev => ({ ...prev, [q.id]: 'saved' }));
      setAnswersMap(prev => ({ ...prev, [q.id]: answerToSave }));

      // Refresh visible questions to update unlocked ladder levels
      const res = await api.get(`/student/resume-aptitude/session/${attempt.id}`);
      setVisibleQuestions(res.data.visibleQuestions || []);
      setAttempt(res.data.attempt);
    } catch (err) {
      console.error('Autosave error', err);
      setSaveStatusMap(prev => ({ ...prev, [q.id]: 'unsaved' }));
    } finally {
      setSubmittingQ(null);
    }
  };

  // Real-time typing handler with 600ms debounced autosave
  const handleInputChange = (q, value) => {
    setAnswersMap(prev => ({ ...prev, [q.id]: value }));
    setSaveStatusMap(prev => ({ ...prev, [q.id]: 'typing' }));

    if (autosaveTimerRef.current[q.id]) clearTimeout(autosaveTimerRef.current[q.id]);
    autosaveTimerRef.current[q.id] = setTimeout(() => {
      saveAnswerToServer(q, value);
    }, 600);
  };

  const handleSqlDraftChange = (q, value) => {
    setSqlDraft(value);
    setAnswersMap(prev => ({ ...prev, [q.id]: value }));
    setSaveStatusMap(prev => ({ ...prev, [q.id]: 'typing' }));

    if (autosaveTimerRef.current[q.id]) clearTimeout(autosaveTimerRef.current[q.id]);
    autosaveTimerRef.current[q.id] = setTimeout(() => {
      saveAnswerToServer(q, value);
    }, 800);
  };

  const handleSubmitAnswer = async (q) => {
    if (autosaveTimerRef.current[q.id]) clearTimeout(autosaveTimerRef.current[q.id]);
    const studentAnswer = q.category === 'SQL' ? sqlDraft : (answersMap[q.id] || '');
    await saveAnswerToServer(q, studentAnswer);
  };

  // DSA Code: autosave draft to server (without running)
  const handleCodeChange = (q, value) => {
    setCodeMap(prev => ({ ...prev, [q.id]: value }));
    setSaveStatusMap(prev => ({ ...prev, [q.id]: 'typing' }));

    if (autosaveTimerRef.current[q.id]) clearTimeout(autosaveTimerRef.current[q.id]);
    autosaveTimerRef.current[q.id] = setTimeout(async () => {
      try {
        setSaveStatusMap(prev => ({ ...prev, [q.id]: 'saving' }));
        await api.post(`/student/resume-aptitude/session/${attempt.id}/submit-answer`, {
          questionId: q.id,
          studentAnswer: value
        });
        setSaveStatusMap(prev => ({ ...prev, [q.id]: 'saved' }));
      } catch (e) {
        setSaveStatusMap(prev => ({ ...prev, [q.id]: 'unsaved' }));
      }
    }, 1200);
  };

  // DSA Code: Run against sample test cases
  const handleRunCode = async (q) => {
    const code = codeMap[q.id] || '';
    if (!code.trim()) return;
    setRunningCode(q.id);
    setRunResults(prev => ({ ...prev, [q.id]: null }));
    try {
      const { data } = await api.post(`/student/resume-aptitude/session/${attempt.id}/run-code`, {
        questionId: q.id,
        code
      });
      setRunResults(prev => ({ ...prev, [q.id]: data }));
    } catch (err) {
      setRunResults(prev => ({
        ...prev,
        [q.id]: { error: err.response?.data?.message || 'Execution failed' }
      }));
    } finally {
      setRunningCode(null);
    }
  };

  // DSA Code: Submit final code — evaluates hidden test cases
  const handleSubmitCode = async (q) => {
    const code = codeMap[q.id] || '';
    if (!code.trim()) return;
    setSubmittingCode(q.id);
    try {
      const { data } = await api.post(`/student/resume-aptitude/session/${attempt.id}/submit-code`, {
        questionId: q.id,
        code
      });
      setSubmitResults(prev => ({ ...prev, [q.id]: data }));
      setSaveStatusMap(prev => ({ ...prev, [q.id]: 'saved' }));
      setRunResults(prev => ({ ...prev, [q.id]: { sampleResults: data.sampleResults } }));
    } catch (err) {
      alert(err.response?.data?.message || 'Code submission failed');
    } finally {
      setSubmittingCode(null);
    }
  };

  // Server-authoritative countdown timer
  useEffect(() => {
    if (loading || isFinished || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, remainingSeconds]);

  // Proctoring: Tab switch detection
  useEffect(() => {
    if (isFinished || loading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations(prev => {
          const updated = prev + 1;
          setShowViolationModal(true);
          if (updated >= MAX_VIOLATIONS) handleAutoSubmit('Disqualified: Max tab violations exceeded.');
          return updated;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isFinished, loading]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRunSqlSandbox = async (qId) => {
    setExecutingSql(true);
    setSqlExecResult(null);
    try {
      const { data } = await api.post(`/student/resume-aptitude/session/${attempt?.id}/execute-sql`, {
        questionId: qId,
        sqlQuery: sqlDraft
      });
      setSqlExecResult(data);
    } catch (err) {
      setSqlExecResult({ success: false, error: err.response?.data?.message || 'SQL execution failed' });
    } finally {
      setExecutingSql(false);
    }
  };

  const handleFinishTest = async () => {
    setIsSubmittingTest(true);
    try {
      await api.post(`/student/resume-aptitude/session/${attempt?.id}/submit`);
      setIsFinished(true);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleAutoSubmit = async (reason = 'Timer expired') => {
    setIsFinished(true);
    try { await api.post(`/student/resume-aptitude/session/${attempt?.id}/submit`); } catch (e) {}
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-6">
        <div className="h-16 bg-muted rounded-2xl animate-pulse" />
        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-card border rounded-2xl p-8 text-center space-y-4 my-10">
        <AlertTriangle size={36} className="text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Aptitude Session Error</h2>
        <p className="text-muted-foreground text-sm">{error}</p>
        <button onClick={() => navigate('/student/tests')} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
          Back to Tests
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto bg-card border rounded-2xl p-10 text-center space-y-6 my-10 shadow-lg">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <Award size={36} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Role-Specific Aptitude Round Complete!</h2>
          <p className="text-muted-foreground text-sm mt-1">Your responses have been recorded and graded automatically.</p>
        </div>

        <div className="p-4 bg-muted/40 rounded-xl text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session Status:</span>
            <span className="font-semibold text-emerald-600">COMPLETED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Round Duration:</span>
            <span className="font-semibold">45 Minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Questions:</span>
            <span className="font-semibold">15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Evaluation Status:</span>
            <span className="font-semibold text-primary">Submitted to Evaluation Engine</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate('/student/interview')}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Start AI Voice Interview
          </button>
          <button onClick={() => navigate('/student/tests')} className="w-full px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm hover:bg-secondary/90 transition-all">
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = visibleQuestions[currentIdx] || visibleQuestions[0];
  const skillExtraction = attempt?.skillExtraction || {};

  // Helper: save status badge
  const SaveStatusBadge = ({ qId }) => {
    const status = saveStatusMap[qId];
    if (status === 'saved') return <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={13} /> Saved</span>;
    if (status === 'saving') return <span className="text-primary text-xs font-semibold flex items-center gap-1 animate-pulse"><Sparkles size={13} /> Saving...</span>;
    if (status === 'typing') return <span className="text-amber-600 text-xs font-semibold flex items-center gap-1"><Clock size={13} /> Typing...</span>;
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 lg:p-6">
      {/* Violation Modal */}
      {showViolationModal && (
        <ViolationModal
          violations={tabViolations}
          maxViolations={MAX_VIOLATIONS}
          onClose={() => setShowViolationModal(false)}
        />
      )}

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-4 sticky top-4 z-20 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Role-Specific Aptitude Round
          </h1>
          <p className="text-xs text-muted-foreground">
            15 Questions · 2 DSA Code + 3 SQL + 2 Theory + 8 Project Ladder · 45 minutes
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold ${remainingSeconds < 300 ? 'bg-destructive/10 text-destructive border border-destructive/20 animate-pulse' : 'bg-primary/10 text-primary'}`}>
            <Clock size={16} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={handleFinishTest}
            disabled={isSubmittingTest}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSubmittingTest ? 'Submitting...' : 'Finish & Submit'}
          </button>
        </div>
      </div>

      {/* Skill Gap Overview */}
      {skillExtraction && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
            <Layers size={14} className="text-primary" /> Candidate Skill Gap & Project Topic Analysis
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-1.5 font-medium">Matched Skills (JD & Resume):</p>
              <div className="flex flex-wrap gap-1">
                {(skillExtraction.matchedSkills || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1.5 font-medium">Claimed Unverified Skills:</p>
              <div className="flex flex-wrap gap-1">
                {(skillExtraction.claimedUnverifiedSkills || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1.5 font-medium">Core Project Topics (Ladder):</p>
              <div className="flex flex-wrap gap-1">
                {(skillExtraction.coreTopics || []).map(t => (
                  <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {visibleQuestions.map((q, idx) => {
          const isAnswered = Boolean(answersMap[q.id] || (q.category === 'DSA_CODE' && submitResults[q.id]));
          const isCurrent = idx === currentIdx;
          const isLocked = q.isStopped || !q.isUnlocked;
          const catColor = q.category === 'DSA_CODE' ? 'text-violet-600'
            : q.category === 'SQL' ? 'text-blue-600'
            : q.category === 'CORE_CS' ? 'text-orange-600'
            : 'text-emerald-600';

          return (
            <button
              key={q.id}
              onClick={() => {
                if (!isLocked) {
                  setCurrentIdx(idx);
                  if (q.category === 'SQL') setSqlDraft(answersMap[q.id] || '');
                }
              }}
              disabled={isLocked}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isAnswered
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : isLocked
                  ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                  : 'bg-card border text-foreground hover:bg-muted'
              }`}
            >
              {isLocked ? <Lock size={12} /> : <span>Q{idx + 1}</span>}
              <span className={`text-[10px] opacity-80 ${isCurrent ? 'text-primary-foreground' : catColor}`}>
                ({q.category === 'DSA_CODE' ? 'CODE' : q.category === 'PROJECT_LADDER' ? 'LADDER' : q.category})
              </span>
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                currentQ.category === 'DSA_CODE' ? 'bg-violet-500/10 text-violet-600'
                : currentQ.category === 'SQL' ? 'bg-blue-500/10 text-blue-600'
                : currentQ.category === 'CORE_CS' ? 'bg-orange-500/10 text-orange-600'
                : 'bg-emerald-500/10 text-emerald-600'
              }`}>
                {currentQ.category === 'DSA_CODE' ? '💻 Code Challenge' : currentQ.category}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Topic: {currentQ.topic}</span>
              {currentQ.language && (
                <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs font-bold rounded-full uppercase">
                  {currentQ.language}
                </span>
              )}
              {currentQ.level && (
                <span className="px-2 py-0.5 bg-violet-500/10 text-violet-600 text-xs font-bold rounded-full">
                  Level {currentQ.level} {currentQ.level === 1 ? '· Basic' : currentQ.level === 2 ? '· Intermediate' : '· Advanced'}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-medium">Marks: {currentQ.marks}</span>
          </div>

          {/* Statement */}
          <div>
            {currentQ.title && <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{currentQ.title}</p>}
            <h3 className="text-base font-semibold leading-relaxed text-foreground">{currentQ.statement}</h3>
            {currentQ.constraints && (
              <div className="mt-3 p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                {currentQ.constraints}
              </div>
            )}
          </div>

          {/* ── DSA CODE QUESTION ── */}
          {currentQ.category === 'DSA_CODE' ? (
            <div className="space-y-4">
              {/* Sample Test Cases */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sample Test Cases (Visible)</p>
                {(currentQ.sampleTestCases || []).map((tc, i) => {
                  const runR = (runResults[currentQ.id]?.sampleResults || [])[i];
                  return (
                    <div key={i} className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                      runR ? (runR.passed ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-destructive/8 border-destructive/20') : 'bg-muted/30 border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Test Case {i + 1}{tc.description ? ` – ${tc.description}` : ''}</span>
                        {runR && (runR.passed
                          ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCheck size={12} /> Passed</span>
                          : <span className="text-destructive font-bold flex items-center gap-1"><XCircle size={12} /> Failed</span>
                        )}
                      </div>
                      <div><span className="text-muted-foreground">Input: </span><span>{tc.input || '(empty)'}</span></div>
                      <div><span className="text-muted-foreground">Expected: </span><span className="text-emerald-600">{tc.expectedOutput}</span></div>
                      {runR && <div><span className="text-muted-foreground">Got: </span><span className={runR.passed ? 'text-emerald-600' : 'text-destructive'}>{runR.actualOutput || runR.error || '(no output)'}</span></div>}
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground italic">+ 5 hidden test cases evaluated on submission.</p>
              </div>

              {/* Hidden Test Case Results (after submit) */}
              {submitResults[currentQ.id] && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${submitResults[currentQ.id].isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {submitResults[currentQ.id].isCorrect
                      ? <span className="text-emerald-600 flex items-center gap-1"><CheckCheck size={15} /> All Hidden Tests Passed!</span>
                      : <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={15} /> Partial / Incomplete</span>
                    }
                  </p>
                  <div className="flex gap-6 text-muted-foreground">
                    <span>Visible: <strong className="text-foreground">{submitResults[currentQ.id].testCasesResult?.samplePassed}/{submitResults[currentQ.id].testCasesResult?.sampleTotal}</strong> passed</span>
                    <span>Hidden: <strong className="text-foreground">{submitResults[currentQ.id].testCasesResult?.hiddenPassed}/{submitResults[currentQ.id].testCasesResult?.hiddenTotal}</strong> passed</span>
                  </div>
                </div>
              )}

              {/* Code Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Code size={13} /> Your Solution ({(currentQ.language || 'python').toUpperCase()})
                  </label>
                  <div className="flex items-center gap-2">
                    <SaveStatusBadge qId={currentQ.id} />
                    <button
                      onClick={() => setCodeMap(prev => ({ ...prev, [currentQ.id]: currentQ.starterCode || '' }))}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      title="Reset to starter code"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  </div>
                </div>
                <textarea
                  rows={14}
                  value={codeMap[currentQ.id] || ''}
                  onChange={e => handleCodeChange(currentQ, e.target.value)}
                  className="w-full p-3 font-mono text-sm rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                  placeholder="Write your solution here..."
                  spellCheck={false}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleRunCode(currentQ)}
                  disabled={runningCode === currentQ.id || !(codeMap[currentQ.id] || '').trim()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Play size={13} />
                  {runningCode === currentQ.id ? 'Running...' : 'Run Code (Sample Tests)'}
                </button>

                <button
                  onClick={() => handleSubmitCode(currentQ)}
                  disabled={submittingCode === currentQ.id || !(codeMap[currentQ.id] || '').trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Terminal size={13} />
                  {submittingCode === currentQ.id ? 'Evaluating...' : 'Submit Code & Evaluate (All Tests)'}
                </button>
              </div>
            </div>

          ) : currentQ.category === 'SQL' ? (
            /* SQL Sandbox */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    SQL Query Input (Sandbox Execution Engine)
                  </label>
                  <SaveStatusBadge qId={currentQ.id} />
                </div>
                <textarea
                  rows={5}
                  value={sqlDraft}
                  onChange={e => handleSqlDraftChange(currentQ, e.target.value)}
                  onBlur={() => handleSubmitAnswer(currentQ)}
                  placeholder="SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department..."
                  className="w-full p-3 font-mono text-sm rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleRunSqlSandbox(currentQ.id)}
                  disabled={executingSql || !sqlDraft.trim()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Play size={14} /> {executingSql ? 'Executing Sandbox...' : 'Run Draft Query'}
                </button>
                <button
                  onClick={() => handleSubmitAnswer(currentQ)}
                  disabled={submittingQ === currentQ.id || !sqlDraft.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} /> {submittingQ === currentQ.id ? 'Saving...' : 'Save Answer'}
                </button>
              </div>

              {sqlExecResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${sqlExecResult.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {sqlExecResult.isCorrect
                      ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16} /> Output Matches Reference!</span>
                      : <span className="text-destructive flex items-center gap-1"><AlertTriangle size={16} /> Output Mismatch or Error</span>
                    }
                  </p>
                  {sqlExecResult.error
                    ? <p className="font-mono text-destructive">{sqlExecResult.error}</p>
                    : <div>
                        <p className="text-muted-foreground font-semibold mb-1">Returned Rows ({sqlExecResult.rowCount}):</p>
                        <pre className="font-mono bg-background p-2.5 rounded-lg overflow-x-auto">{JSON.stringify(sqlExecResult.actualOutput, null, 2)}</pre>
                      </div>
                  }
                </div>
              )}
            </div>

          ) : (
            /* Short-Answer (Core CS + Project Ladder) */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Short-Answer (1–4 words)
                  </label>
                  <SaveStatusBadge qId={currentQ.id} />
                </div>
                <div className="relative max-w-lg">
                  <input
                    type="text"
                    value={answersMap[currentQ.id] || ''}
                    onChange={e => handleInputChange(currentQ, e.target.value)}
                    onBlur={() => handleSubmitAnswer(currentQ)}
                    placeholder="e.g. O(log n) or Hash Map or Shared Memory"
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 pr-20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    {((answersMap[currentQ.id] || '').trim().split(/\s+/).filter(Boolean)).length}/4 words
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Auto-saved as you type. Flexible matching: "hash map" = "hashmap" = "hash-map". Case-insensitive.
                </p>
              </div>

              <button
                onClick={() => handleSubmitAnswer(currentQ)}
                disabled={submittingQ === currentQ.id || !(answersMap[currentQ.id] || '').trim()}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Send size={14} /> {submittingQ === currentQ.id ? 'Saving...' : 'Save Answer'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl border text-xs font-medium flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span className="text-xs text-muted-foreground">
              {currentIdx + 1} / {visibleQuestions.length}
            </span>

            <button
              onClick={() => setCurrentIdx(Math.min(visibleQuestions.length - 1, currentIdx + 1))}
              disabled={currentIdx >= visibleQuestions.length - 1}
              className="px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-medium flex items-center gap-1 disabled:opacity-40"
            >
              Next Question <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAptitudeTestInterface;
