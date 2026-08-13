import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import ViolationModal from '../../components/ViolationModal';
import { useProctoring } from '../../hooks/useProctoring';
import { 
  Clock, ShieldAlert, Award, FileText, CheckCircle2, 
  ChevronLeft, ChevronRight, X, Sparkles, XCircle, AlertTriangle,
  Play, Send, RefreshCw, Code, Terminal, Check, Lock
} from 'lucide-react';

const DIFFICULTY_BADGES = {
  EASY: 'bg-green-500/10 text-green-600 border border-green-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  HARD: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const PROCTOR_LIMITS = {
  tabSwitches: 5,
  fullscreenExits: 10,
};

const PROCTOR_STORAGE_PREFIX = 'coding-assessment-proctor';

const CodingTestInterface = () => {
  const { id } = useParams(); // codingAssessmentId
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [problems, setProblems] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Phase state: 'INSTRUCTIONS', 'TESTING', 'RESULTS'
  const [phase, setPhase] = useState('INSTRUCTIONS');

  // Testing workspace state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  
  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  
  // Test case run results (Public run)
  const [runResults, setRunResults] = useState(null);
  // Submission result for the current problem
  const [submissionResult, setSubmissionResult] = useState(null);

  // Completed status for each problem in this attempt
  const [solvedProblemIds, setSolvedProblemIds] = useState(new Set());
  const [problemScores, setProblemScores] = useState({}); // { problemId: score }
  const [tabSwitchesLeft, setTabSwitchesLeft] = useState(PROCTOR_LIMITS.tabSwitches);
  const [fullscreenExitsLeft, setFullscreenExitsLeft] = useState(PROCTOR_LIMITS.fullscreenExits);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctorNotice, setProctorNotice] = useState('');
  const [windowViolationTimerLeft, setWindowViolationTimerLeft] = useState(0);
  const [violationModal, setViolationModal] = useState(null);
  const [proctorWarning, setProctorWarning] = useState(null);

  const {
    status: pythonProctorStatus,
    errorMsg: pythonProctorError,
    startProctoring,
    stopProctoring
  } = useProctoring(
    attempt?.id,
    'CODING',
    (msg, eventType) => {
      setProctorWarning({ message: msg, type: eventType });
    }
  );

  const proctorStartedRef = useRef(false);

  useEffect(() => {
    if (phase === 'TESTING' && attempt?.id && !proctorStartedRef.current) {
      proctorStartedRef.current = true;
      startProctoring();
    }
  }, [phase, attempt?.id]);

  useEffect(() => {
    if (phase === 'RESULTS' && proctorStartedRef.current) {
      stopProctoring();
      proctorStartedRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (proctorStartedRef.current) {
        stopProctoring();
      }
    };
  }, []);

  const timerRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);
  const proctorCooldownRef = useRef(0);
  const autoSubmitLockRef = useRef(false);
  const currentAttemptIdRef = useRef(null);
  const windowViolationTimerRef = useRef(null);

  const getProctorStorageKey = (attemptId) => `${PROCTOR_STORAGE_PREFIX}:${attemptId}`;

  const persistProctorState = (attemptId, nextTabSwitches = tabSwitchesLeft, nextFullscreenExits = fullscreenExitsLeft) => {
    if (!attemptId || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(getProctorStorageKey(attemptId), JSON.stringify({
        tabSwitchesLeft: nextTabSwitches,
        fullscreenExitsLeft: nextFullscreenExits,
      }));
    } catch (error) {
      console.warn('Failed to persist proctor state', error);
    }
  };

  const clearProctorState = (attemptId) => {
    if (!attemptId || typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(getProctorStorageKey(attemptId));
    } catch (error) {
      console.warn('Failed to clear proctor state', error);
    }
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn('Unable to enter fullscreen mode', error);
    } finally {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  const clearWindowViolationTimer = () => {
    if (windowViolationTimerRef.current) {
      clearInterval(windowViolationTimerRef.current);
      windowViolationTimerRef.current = null;
    }
    setWindowViolationTimerLeft(0);
  };

  const terminateForViolation = async (reason) => {
    if (autoSubmitLockRef.current) return;
    setProctorNotice(reason);
    clearWindowViolationTimer();
    if (timerRef.current) clearInterval(timerRef.current);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    alert(reason);
    await autoSubmit(currentAttemptIdRef.current);
  };

  const startWindowViolationTimer = () => {
    if (windowViolationTimerRef.current) return;

    setWindowViolationTimerLeft(20);
    windowViolationTimerRef.current = setInterval(() => {
      setWindowViolationTimerLeft(prev => {
        if (prev <= 1) {
          clearWindowViolationTimer();
          terminateForViolation('Exam terminated due to repeated window switching.').catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleProctorViolation = async (kind) => {
    if (phase !== 'TESTING' || finalizing || autoSubmitLockRef.current) return;

    const now = Date.now();
    if (now - proctorCooldownRef.current < 650) return;
    proctorCooldownRef.current = now;

    let nextTabSwitches = tabSwitchesLeft;
    let nextFullscreenExits = fullscreenExitsLeft;
    let notice = '';

    if (kind === 'FULLSCREEN') {
      nextFullscreenExits = Math.max(0, nextFullscreenExits - 1);
      setFullscreenExitsLeft(nextFullscreenExits);
      notice = `Fullscreen exit detected. ${nextFullscreenExits} fullscreen warning${nextFullscreenExits === 1 ? '' : 's'} left.`;
      setIsFullscreen(false);
    } else {
      nextTabSwitches = Math.max(0, nextTabSwitches - 1);
      setTabSwitchesLeft(nextTabSwitches);
      notice = `Tab or window switch detected. ${nextTabSwitches} warning${nextTabSwitches === 1 ? '' : 's'} left.`;
    }

    setProctorNotice(notice);
    persistProctorState(currentAttemptIdRef.current, nextTabSwitches, nextFullscreenExits);

    if (kind === 'TAB' && nextTabSwitches <= 0) {
      setViolationModal({
        type: 'critical',
        title: 'Test Terminated - Tab Switch Violation',
        message: 'You have exceeded the maximum allowed tab/window switches. Your assessment will be automatically submitted.',
        isBlocking: true,
        strictMode: true,
        onAcknowledge: () => {
          autoSubmit(currentAttemptIdRef.current);
        }
      });
      return;
    }

    if (nextFullscreenExits <= 0) {
      setViolationModal({
        type: 'critical',
        title: 'Test Terminated - Fullscreen Violation Limit Reached',
        message: 'You have exceeded the maximum allowed fullscreen exits. Your assessment will be automatically submitted.',
        isBlocking: true,
        strictMode: true,
        onAcknowledge: () => {
          autoSubmit(currentAttemptIdRef.current);
        }
      });
      return;
    }

    clearWindowViolationTimer();
    window.focus();
    await requestFullscreen();
  };

  // Fetch assessment details
  useEffect(() => {
    api.get(`/student/coding-assessments/${id}`)
      .then(res => {
        setAssessment(res.data);
        setProblems(res.data.problems || []);
        
        // Find existing attempt if IN_PROGRESS
        const activeAttempt = res.data.attempts?.find(a => a.status === 'IN_PROGRESS');
        if (activeAttempt) {
          setAttempt(activeAttempt);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to fetch coding assessment details');
      })
      .finally(() => setLoading(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (!attempt?.id) return;

    currentAttemptIdRef.current = attempt.id;

    if (typeof window === 'undefined') return;

    try {
      const saved = window.localStorage.getItem(getProctorStorageKey(attempt.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        const nextTabSwitches = Number.isFinite(parsed.tabSwitchesLeft) ? parsed.tabSwitchesLeft : PROCTOR_LIMITS.tabSwitches;
        const nextFullscreenExits = Number.isFinite(parsed.fullscreenExitsLeft) ? parsed.fullscreenExitsLeft : PROCTOR_LIMITS.fullscreenExits;
        setTabSwitchesLeft(nextTabSwitches);
        setFullscreenExitsLeft(nextFullscreenExits);
      } else {
        setTabSwitchesLeft(PROCTOR_LIMITS.tabSwitches);
        setFullscreenExitsLeft(PROCTOR_LIMITS.fullscreenExits);
        persistProctorState(attempt.id, PROCTOR_LIMITS.tabSwitches, PROCTOR_LIMITS.fullscreenExits);
      }
    } catch (error) {
      console.warn('Failed to load proctor state', error);
      setTabSwitchesLeft(PROCTOR_LIMITS.tabSwitches);
      setFullscreenExitsLeft(PROCTOR_LIMITS.fullscreenExits);
    }
  }, [attempt?.id]);

  useEffect(() => {
    if (phase !== 'TESTING') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctorViolation('TAB');
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        handleProctorViolation('TAB');
      }
    };

    const handleFocus = () => {
      if (phase === 'TESTING') {
        setProctorNotice('Back in the assessment. Stay in fullscreen and keep this tab active.');
        clearWindowViolationTimer();
        requestFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) {
        handleProctorViolation('FULLSCREEN');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    requestFullscreen();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearWindowViolationTimer();
    };
  }, [phase, finalizing, tabSwitchesLeft, fullscreenExitsLeft]);

  // Load code draft when current problem or language changes
  useEffect(() => {
    if (phase === 'TESTING' && problems[currentIdx]) {
      const activeProb = problems[currentIdx];
      // Fetch draft code from backend
      api.get(`/student/coding-assessments/${id}/problems/${activeProb.id}/autosave`)
        .then(res => {
          if (res.data && res.data.code) {
            setSelectedLanguage(res.data.language || 'PYTHON');
            setCode(res.data.code);
          } else {
            // No draft saved, load default starter code
            const lang = selectedLanguage || 'PYTHON';
            const starter = lang === 'PYTHON' ? activeProb.pythonStarterCode : activeProb.javaStarterCode;
            setCode(starter || '');
          }
        })
        .catch(err => {
          console.error('Failed to load code draft', err);
          const lang = selectedLanguage || 'PYTHON';
          const starter = lang === 'PYTHON' ? activeProb.pythonStarterCode : activeProb.javaStarterCode;
          setCode(starter || '');
        });
      
      // Clear run outputs when shifting questions
      setRunResults(null);
      setSubmissionResult(null);
    }
  }, [currentIdx, phase]);

  // Start attempt session
  const startAssessment = async () => {
    setLoading(true);
    setError('');
    autoSubmitLockRef.current = false;
    clearWindowViolationTimer();
    await requestFullscreen();
    try {
      const { data } = await api.post(`/student/coding-assessments/${id}/start`);
      setAttempt(data);
      
      // Set initial duration countdown
      const elapsed = Math.round((new Date() - new Date(data.startedAt)) / 1000);
      const totalSeconds = assessment.duration * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);

      // Prepopulate default code for the first question
      if (problems[0]) {
        setSelectedLanguage('PYTHON');
        setCode(problems[0].pythonStarterCode || '');
      }

      setPhase('TESTING');
      startTimer(remaining, data.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize coding attempt');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  // Timer loop
  const startTimer = (duration, attemptId) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let time = duration;
    timerRef.current = setInterval(() => {
      time--;
      setTimeLeft(time);
      if (time <= 0) {
        clearInterval(timerRef.current);
        autoSubmit(attemptId);
      }
    }, 1000);
  };

  // Autosave code logic (debounced)
  const handleCodeChange = (newVal) => {
    setCode(newVal);
    
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    
    // Save draft after 1.5 seconds of inactivity
    autosaveTimeoutRef.current = setTimeout(async () => {
      if (!problems[currentIdx]) return;
      try {
        await api.post(`/student/coding-assessments/${id}/problems/${problems[currentIdx].id}/autosave`, {
          code: newVal,
          language: selectedLanguage
        });
      } catch (err) {
        console.error('Autosave failed', err);
      }
    }, 1500);
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    const activeProb = problems[currentIdx];
    if (activeProb) {
      const starter = newLang === 'PYTHON' ? activeProb.pythonStarterCode : activeProb.javaStarterCode;
      setCode(starter || '');
    }
  };

  const resetCode = () => {
    if (!window.confirm('Resetting will discard your current draft for this language. Proceed?')) return;
    const activeProb = problems[currentIdx];
    if (activeProb) {
      const starter = selectedLanguage === 'PYTHON' ? activeProb.pythonStarterCode : activeProb.javaStarterCode;
      setCode(starter || '');
    }
  };

  // Run Code against PUBLIC test cases
  const runCodeSample = async () => {
    if (running || !problems[currentIdx]) return;
    setRunning(true);
    setRunResults(null);
    setSubmissionResult(null);

    try {
      const { data } = await api.post(`/student/coding-assessments/${id}/problems/${problems[currentIdx].id}/run`, {
        code,
        language: selectedLanguage
      });
      setRunResults(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to execute code');
    } finally {
      setRunning(false);
    }
  };

  // Submit Solution for current problem (runs all tests)
  const submitSolution = async () => {
    if (submitting || !problems[currentIdx]) return;
    setSubmitting(true);
    setRunResults(null);
    setSubmissionResult(null);

    try {
      const { data } = await api.post(`/student/coding-assessments/${id}/problems/${problems[currentIdx].id}/submit`, {
        code,
        language: selectedLanguage,
        attemptId: attempt.id
      });
      setSubmissionResult(data);
      
      if (data.status === 'SUCCESS' || data.testsPassed > 0) {
        // Mark problem as completed/solved
        setSolvedProblemIds(prev => new Set([...prev, problems[currentIdx].id]));
        setProblemScores(prev => ({
          ...prev,
          [problems[currentIdx].id]: data.marksObtained
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  // Finalize Assessment
  const handleFinalSubmit = async () => {
    const unattempted = problems.filter(p => !solvedProblemIds.has(p.id));
    let msg = 'Are you sure you want to finalize and submit your coding assessment? You cannot make any more changes.';
    if (unattempted.length > 0) {
      msg = `You have ${unattempted.length} unsolved problems remaining. Are you sure you want to submit?`;
    }

    if (!window.confirm(msg)) return;

    finalizeAssessment();
  };

  const finalizeAssessment = async () => {
    setFinalizing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    clearWindowViolationTimer();

    try {
      const { data } = await api.post(`/student/coding-assessments/${id}/attempts/${attempt.id}/submit`);
      setAttempt(data);
      clearProctorState(attempt.id);
      setPhase('RESULTS');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to finalize assessment');
    } finally {
      setFinalizing(false);
    }
  };

  const autoSubmit = async (attemptId) => {
    if (!attemptId || autoSubmitLockRef.current) return;
    autoSubmitLockRef.current = true;
    setFinalizing(true);
    clearWindowViolationTimer();
    try {
      const { data } = await api.post(`/student/coding-assessments/${id}/attempts/${attemptId}/submit`, {
        autoSubmitted: true
      });
      setAttempt(data);
      clearProctorState(attemptId);
      setPhase('RESULTS');
      alert('Time expired! Your coding assessment has been automatically submitted.');
    } catch (err) {
      console.error('Auto submit failed', err);
    } finally {
      setFinalizing(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-3xl p-6 text-center space-y-4 shadow-md">
          <XCircle size={48} className="text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Denied / Error</h2>
          <p className="text-sm text-muted-foreground">{error || 'Assessment data unavailable.'}</p>
          <button onClick={() => navigate('/student/tests')} className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all hover:bg-primary/95">
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // 1. INSTRUCTIONS PHASE
  if (phase === 'INSTRUCTIONS') {
    const isResuming = attempt !== null;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 animate-in fade-in duration-300">
        <div className="max-w-2xl w-full bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Sparkles size={16} /> Coding Assessment
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">{assessment.name}</h1>
            {assessment.description && <p className="text-sm text-muted-foreground leading-relaxed">{assessment.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                <p className="text-base text-foreground mt-0.5">{assessment.duration} Minutes</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <Award className="text-primary" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Problems</p>
                <p className="text-base text-foreground mt-0.5">{problems.length} coding tasks</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <Lock className={isFullscreen ? 'text-green-600' : 'text-amber-600'} size={18} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Fullscreen</p>
                <p className={`text-base mt-0.5 ${isFullscreen ? 'text-green-600' : 'text-amber-600'}`}>
                  {isFullscreen ? 'Enabled' : 'Not active yet'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <ShieldAlert className="text-secondary" size={18} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Tab / Window Switches Left</p>
                <p className="text-base text-foreground mt-0.5">{tabSwitchesLeft}</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <AlertTriangle className="text-primary" size={18} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Fullscreen Exits Left</p>
                <p className="text-base text-foreground mt-0.5">{fullscreenExitsLeft}</p>
              </div>
            </div>
          </div>

          {windowViolationTimerLeft > 0 && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-center justify-between gap-3">
              <span>Window switch grace timer active. Return within {windowViolationTimerLeft}s or the exam will terminate.</span>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2"><FileText size={18} className="text-primary" /> Instructions</h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/15 p-5 rounded-2xl border border-border">
              {assessment.instructions || `1. Once started, the timer cannot be paused.
2. Closing the browser or refreshing will not pause the timer. You can resume code anytime while duration remains.
3. You can run code against public test cases to debug.
4. Your final marks for each problem are determined by private test cases upon clicking "Submit Solution".
5. The assessment runs in fullscreen. Tab switches and window changes are limited.
6. Clicking the final "Submit Assessment" at the bottom right will finish the test when you are done.`}
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-border/50">
            <button 
              onClick={() => navigate('/student/tests')} 
              className="px-6 py-3 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-all"
            >
              Go Back
            </button>
            <button 
              onClick={startAssessment} 
              className="px-8 py-3 bg-secondary text-secondary-foreground font-bold text-sm rounded-xl hover:bg-secondary/95 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {isResuming ? 'Resume Coding Assessment' : 'Start Coding Assessment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TESTING WORKBENCH
  if (phase === 'TESTING') {
    const activeProb = problems[currentIdx];
    const totalProblems = problems.length;
    const progressPercent = totalProblems > 0 ? (solvedProblemIds.size / totalProblems) * 100 : 0;

    return (
      <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-300">
        
        {/* Workspace Header */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-extrabold text-sm sm:text-base text-foreground truncate">{assessment.name}</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg border">
              <span className={`h-2 w-2 rounded-full ${
                pythonProctorStatus === 'active' 
                  ? 'bg-green-500 animate-pulse' 
                  : pythonProctorStatus === 'issue'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-muted-foreground'
              }`} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {pythonProctorStatus === 'active' 
                  ? 'Proctoring Active' 
                  : pythonProctorStatus === 'issue'
                  ? 'Proctoring Issue'
                  : 'Proctoring Offline'}
              </span>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="hidden md:flex flex-col items-center flex-1 max-w-xs px-6">
            <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground font-bold mb-1">
              <span>SOLVED TASKS</span>
              <span>{solvedProblemIds.size} / {totalProblems} ({Math.round(progressPercent)}%)</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border/30">
              <div className="bg-secondary h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Timer and Submit */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 font-bold px-4 py-2 bg-secondary/15 rounded-xl border border-secondary/20 text-secondary">
              <Clock size={16} className={timeLeft < 180 ? 'text-destructive animate-pulse' : ''} />
              <span className={timeLeft < 180 ? 'text-destructive' : ''}>{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={handleFinalSubmit}
              disabled={finalizing}
              className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm border border-secondary/20"
            >
              {finalizing ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </header>

        {proctorNotice && (
          <div className="px-6 py-3 border-b border-border bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{proctorNotice}</span>
          </div>
        )}

        {proctorWarning && (
          <div className="px-6 py-3 border-b border-border bg-amber-500/10 text-amber-600 text-sm font-semibold flex items-center justify-between gap-2 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <span><strong>Proctoring Alert:</strong> {proctorWarning.message}</span>
            </div>
            <button 
              onClick={() => setProctorWarning(null)} 
              className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {pythonProctorError && (
          <div className="px-6 py-3 border-b border-border bg-amber-500/10 text-amber-600 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span>{pythonProctorError}</span>
          </div>
        )}

        {violationModal && (
          <ViolationModal
            isOpen={true}
            title={violationModal.title}
            message={violationModal.message}
            type={violationModal.type}
            count={violationModal.count}
            maxCount={violationModal.maxCount}
            onAcknowledge={violationModal.onAcknowledge}
            isBlocking={violationModal.isBlocking}
            strictMode={violationModal.strictMode || false}
          />
        )}

        {/* Workbench Body */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden h-[calc(100vh-64px)]">
          
          {/* Left panel: Problems details and Palette navigation */}
          <aside className="w-full md:w-96 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col overflow-y-auto shrink-0 p-6 space-y-6">
            
            {/* Palette selection */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Tasks list</h3>
              <div className="flex flex-wrap gap-2">
                {problems.map((p, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isSolved = solvedProblemIds.has(p.id);
                  let style = 'bg-muted/50 text-muted-foreground border-transparent';
                  if (isSolved) {
                    style = 'bg-green-500/10 text-green-600 border border-green-500/30';
                  }

                  return (
                    <button
                      key={p.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border font-bold ${style} ${
                        isCurrent ? 'ring-2 ring-primary ring-offset-2 scale-102 font-extrabold text-foreground' : 'hover:scale-102'
                      }`}
                    >
                      {isSolved && <Check size={11} />}
                      Task {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Problem Details */}
            {activeProb && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${DIFFICULTY_BADGES[activeProb.difficulty]}`}>
                    {activeProb.difficulty}
                  </span>
                  <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-bold text-muted-foreground">
                    Max Score: {activeProb.marks} marks
                  </span>
                </div>
                
                <h1 className="text-xl font-bold leading-relaxed">{activeProb.title}</h1>
                
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {activeProb.statement}
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3 text-xs font-semibold">
                  <div>
                    <h4 className="text-foreground mb-1 uppercase tracking-wider text-[10px] font-bold">Input Format</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-xl border leading-relaxed font-medium">{activeProb.inputFormat || 'Not Specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-foreground mb-1 uppercase tracking-wider text-[10px] font-bold">Output Format</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-xl border leading-relaxed font-medium">{activeProb.outputFormat || 'Not Specified'}</p>
                  </div>
                  {activeProb.constraints && (
                    <div>
                      <h4 className="text-foreground mb-1 uppercase tracking-wider text-[10px] font-bold">Constraints</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-xl border leading-relaxed font-mono font-medium">{activeProb.constraints}</p>
                    </div>
                  )}
                </div>

                {/* Example cases */}
                {activeProb.examples && Array.isArray(activeProb.examples) && activeProb.examples.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Examples</h3>
                    {activeProb.examples.map((ex, exIdx) => (
                      <div key={exIdx} className="p-4 bg-muted/15 border rounded-2xl space-y-2 text-xs">
                        <p className="font-bold text-muted-foreground">Example #{exIdx + 1}</p>
                        <div>
                          <p className="text-muted-foreground font-semibold">Input:</p>
                          <pre className="p-2 bg-background border rounded-lg font-mono text-[11px] mt-1 whitespace-pre-wrap">{ex.input}</pre>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-semibold">Output:</p>
                          <pre className="p-2 bg-background border rounded-lg font-mono text-[11px] mt-1 whitespace-pre-wrap">{ex.output}</pre>
                        </div>
                        {ex.explanation && (
                          <p className="text-muted-foreground leading-relaxed mt-1 italic"><span className="font-bold">Explanation:</span> {ex.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* Right panel: Editor Workspace and Execution Logs */}
          <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
            
            {/* Editor settings bar */}
            <div className="h-12 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between shrink-0 text-zinc-300">
              <div className="flex items-center gap-3">
                <Code size={14} className="text-primary" />
                <span className="text-xs font-bold font-mono">Solution Workspace</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Language selection dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Lang:</span>
                  <select
                    value={selectedLanguage}
                    onChange={e => handleLanguageChange(e.target.value)}
                    className="bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 font-bold"
                  >
                    {activeProb?.supportedLanguages?.map(lang => (
                      <option key={lang} value={lang}>{lang === 'PYTHON' ? 'Python' : 'Java'}</option>
                    )) || (
                      <>
                        <option value="PYTHON">Python</option>
                        <option value="JAVA">Java</option>
                      </>
                    )}
                  </select>
                </div>

                <button 
                  onClick={resetCode}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded transition-colors text-xs font-bold flex items-center gap-1 border border-zinc-800 hover:border-zinc-700 px-2 py-1"
                  title="Reset starter code"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              </div>
            </div>

            {/* Source Code Editor */}
            <div className="flex-1 relative overflow-hidden">
              <textarea
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                spellCheck="false"
                className="absolute inset-0 w-full h-full p-6 bg-zinc-950 text-zinc-200 font-mono text-xs focus:outline-none leading-relaxed resize-none overflow-y-auto selection:bg-zinc-800"
                placeholder="# Write your program solution here"
              />
            </div>

            {/* Run Operations console */}
            <div className="bg-zinc-900 border-t border-zinc-800 flex items-center justify-between p-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={runCodeSample}
                  disabled={running || submitting}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs rounded-xl transition-all shadow-sm border border-zinc-700 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {running ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={submitSolution}
                  disabled={running || submitting}
                  className="px-5 py-2 bg-secondary text-secondary-foreground font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all shadow-sm disabled:opacity-40 flex items-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </button>
              </div>

              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {running || submitting ? 'Processing compilation...' : 'Auto-saved locally'}
              </div>
            </div>

            {/* Execution logs output terminal */}
            <div className="h-48 bg-black border-t border-zinc-800 flex flex-col overflow-hidden shrink-0 text-zinc-300 font-mono text-xs select-text">
              <div className="h-8 bg-zinc-950 px-4 border-b border-zinc-900 flex items-center gap-2 shrink-0 text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">
                <Terminal size={12} /> Execution Console
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. If Running/Submitting loading state */}
                {(running || submitting) && (
                  <div className="flex items-center gap-2 text-zinc-500 italic select-none">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border border-zinc-500 border-t-transparent" />
                    Executing on sandbox workspace...
                  </div>
                )}

                {/* 2. Public Run results */}
                {!running && runResults && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-bold select-none text-xs">
                      {runResults.allPassed ? (
                        <span className="text-green-500">✔ All public sample tests passed!</span>
                      ) : (
                        <span className="text-red-400">✗ Test case failure. review logic.</span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {runResults.results?.map((res, tcIdx) => (
                        <div key={res.id} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[11px] select-none font-bold">
                            <span className="text-zinc-400">Public Test #{tcIdx + 1}</span>
                            {res.passed ? (
                              <span className="text-green-500">Passed ({res.executionTime?.toFixed(3)}s)</span>
                            ) : (
                              <span className="text-red-400">{res.status.replace('_', ' ')}</span>
                            )}
                          </div>
                          
                          {res.error ? (
                            <div className="text-red-400 whitespace-pre-wrap bg-red-950/20 p-2.5 rounded-lg border border-red-900/40 text-[11px]">
                              {res.error}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <p className="text-zinc-500 font-semibold mb-0.5 select-none">Expected:</p>
                                <pre className="p-2 bg-black border border-zinc-800 rounded text-zinc-300 font-mono whitespace-pre-wrap">{res.expectedOutput}</pre>
                              </div>
                              <div>
                                <p className="text-zinc-500 font-semibold mb-0.5 select-none">Output:</p>
                                <pre className={`p-2 bg-black border rounded font-mono whitespace-pre-wrap ${res.passed ? 'border-green-900/50 text-green-400' : 'border-red-900/50 text-red-400'}`}>{res.output}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Solution Submission results */}
                {!submitting && submissionResult && (
                  <div className="space-y-3">
                    <div className="p-3 border rounded-xl flex items-center justify-between gap-4 font-bold select-none text-xs bg-zinc-900">
                      <div>
                        <span className="text-zinc-400">Tests Passed:</span> {submissionResult.testsPassed} / {submissionResult.totalTests}
                      </div>
                      <div className="text-green-500">
                        Score Obtained: {submissionResult.marksObtained} marks
                      </div>
                    </div>

                    {submissionResult.errorMessage && (
                      <div className="text-red-400 whitespace-pre-wrap bg-red-950/20 p-3 rounded-xl border border-red-900/40 text-[11px]">
                        <p className="font-bold select-none mb-1">Execution Log Error:</p>
                        {submissionResult.errorMessage}
                      </div>
                    )}

                    <div className="space-y-2">
                      {submissionResult.results?.map((res, tcIdx) => (
                        <div key={res.id} className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-bold select-none">Test Case #{tcIdx + 1}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded font-bold text-zinc-400">
                              {res.isPublic ? 'Public' : 'Hidden'}
                            </span>
                          </div>
                          <div>
                            {res.passed ? (
                              <span className="text-green-500 font-bold">Passed</span>
                            ) : (
                              <span className="text-red-400 font-bold">{res.status.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Default console message */}
                {!running && !submitting && !runResults && !submissionResult && (
                  <div className="text-zinc-600 italic select-none">
                    Console output will appear here. Click "Run Code" or "Submit Solution" to begin compilation.
                  </div>
                )}

              </div>
            </div>

          </main>
        </div>
      </div>
    );
  }

  // 3. RESULTS SUMMARY PHASE
  if (phase === 'RESULTS' && attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 animate-in fade-in duration-300">
        <div className="max-w-xl w-full bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6 text-center">
          
          <div className="space-y-3">
            <div className="w-16 h-16 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            
            <h1 className="text-3xl font-extrabold text-foreground">Assessment Completed!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your source code solutions have been securely compiled, executed against all grading private test suites, and evaluated.
            </p>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2">
            <div className="p-4 bg-muted/20 border rounded-2xl text-center">
              <p className="text-muted-foreground uppercase text-[10px] tracking-wider font-bold">Coding Score</p>
              <p className="text-2xl font-extrabold text-foreground mt-1.5">{attempt.score} marks</p>
            </div>
            <div className="p-4 bg-muted/20 border rounded-2xl text-center">
              <p className="text-muted-foreground uppercase text-[10px] tracking-wider font-bold">Total Time Taken</p>
              <p className="text-2xl font-extrabold text-foreground mt-1.5">
                {Math.round(attempt.timeTaken / 60) || 0}m {attempt.timeTaken % 60 || 0}s
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center border-t border-border/50">
            <button 
              onClick={() => navigate('/student/tests')} 
              className="px-8 py-3 bg-secondary text-secondary-foreground font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-sm"
            >
              Back to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CodingTestInterface;
