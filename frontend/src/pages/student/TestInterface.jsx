import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  Clock, ShieldAlert, Award, FileText, CheckCircle2, 
  ChevronLeft, ChevronRight, X, Sparkles, XCircle, AlertTriangle,
  ClipboardList
} from 'lucide-react';
import ViolationModal from '../../components/ViolationModal';
import { useProctoring } from '../../hooks/useProctoring';
import { useHardwareMonitor } from '../../hooks/useHardwareMonitor';

const PROCTOR_LIMITS = {
  tabSwitches: 5,
  fullscreenExits: 10,
};

const PROCTOR_STORAGE_PREFIX = 'aptitude-test-proctor';

const TestInterface = () => {
  const { id } = useParams(); // testId
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interface phases: 'INSTRUCTIONS', 'TESTING', 'RESULTS'
  const [phase, setPhase] = useState('INSTRUCTIONS');

  // Testing workspace state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]); // [{ questionId, selectedOption, isFlaggedForReview }]
  const [visitedIndices, setVisitedIndices] = useState(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [tabSwitchesLeft, setTabSwitchesLeft] = useState(PROCTOR_LIMITS.tabSwitches);
  const [fullscreenExitsLeft, setFullscreenExitsLeft] = useState(PROCTOR_LIMITS.fullscreenExits);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctorNotice, setProctorNotice] = useState('');
  const [windowViolationTimerLeft, setWindowViolationTimerLeft] = useState(0);
  const [violationModal, setViolationModal] = useState(null);
  const [violationCounts, setViolationCounts] = useState({ tab: 0, fullscreen: 0 });
  const [proctorWarning, setProctorWarning] = useState(null);

  const {
    status: pythonProctorStatus,
    errorMsg: pythonProctorError,
    startProctoring,
    stopProctoring
  } = useProctoring(
    attempt?.id,
    'APTITUDE',
    (msg, eventType) => {
      setProctorWarning({ message: msg, type: eventType });
    }
  );

  const {
    hasPermissions: hardwarePermissions,
    hardwareError,
    isHardwareLost,
    requestPermissions,
    stream: hardwareStream
  } = useHardwareMonitor(phase === 'TESTING');

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
      console.warn('Failed to persist aptitude proctor state', error);
    }
  };

  const clearProctorState = (attemptId) => {
    if (!attemptId || typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(getProctorStorageKey(attemptId));
    } catch (error) {
      console.warn('Failed to clear aptitude proctor state', error);
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

  const closeViolationModal = () => {
    setViolationModal(null);
  };

  const getViolationInfo = () => ({
    tabViolations: violationCounts.tab,
    fullscreenViolations: violationCounts.fullscreen
  });

  const terminateForViolation = async (reason) => {
    if (autoSubmitLockRef.current) return;
    setProctorNotice(reason);
    clearWindowViolationTimer();
    if (timerRef.current) clearInterval(timerRef.current);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    const violationInfo = getViolationInfo();
    setViolationModal({
      type: 'critical',
      title: 'Test Terminated - Violation Limit Exceeded',
      message: `${reason}\n\nYour assessment will be automatically submitted and closed.`,
      isBlocking: false,
      strictMode: false,
      autoCloseSeconds: 5,
      onClose: closeViolationModal,
      onAcknowledge: async () => {
        closeViolationModal();
        await autoSubmit(currentAttemptIdRef.current, selectedAnswers, violationInfo);
      }
    });
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

  const handleAcknowledgeViolation = () => {
    clearWindowViolationTimer();
    if (typeof window !== 'undefined') {
      window.focus();
    }
    requestFullscreen();
    closeViolationModal();
  };

  const handleProctorViolation = async (kind) => {
    if (phase !== 'TESTING' || submitting || autoSubmitLockRef.current) return;

    const now = Date.now();
    if (now - proctorCooldownRef.current < 650) return;
    proctorCooldownRef.current = now;

    let nextTabSwitches = tabSwitchesLeft;
    let nextFullscreenExits = fullscreenExitsLeft;
    let notice = '';
    let violationType = 'TAB';

    if (kind === 'FULLSCREEN') {
      nextFullscreenExits = Math.max(0, nextFullscreenExits - 1);
      setFullscreenExitsLeft(nextFullscreenExits);
      notice = `Fullscreen exit detected. ${nextFullscreenExits} fullscreen warning${nextFullscreenExits === 1 ? '' : 's'} left.`;
      setIsFullscreen(false);
      violationType = 'FULLSCREEN';
      setViolationCounts(prev => ({ ...prev, fullscreen: prev.fullscreen + 1 }));
    } else {
      nextTabSwitches = Math.max(0, nextTabSwitches - 1);
      setTabSwitchesLeft(nextTabSwitches);
      notice = `Tab or window switch detected. ${nextTabSwitches} warning${nextTabSwitches === 1 ? '' : 's'} left.`;
      violationType = 'TAB';
      setViolationCounts(prev => ({ ...prev, tab: prev.tab + 1 }));
    }

    setProctorNotice(notice);
    persistProctorState(currentAttemptIdRef.current, nextTabSwitches, nextFullscreenExits);

    const currentViolationCount = violationType === 'FULLSCREEN' 
      ? violationCounts.fullscreen + 1 
      : violationCounts.tab + 1;
    const maxViolations = violationType === 'FULLSCREEN' 
      ? PROCTOR_LIMITS.fullscreenExits 
      : PROCTOR_LIMITS.tabSwitches;

    if (nextTabSwitches <= 0) {
      setViolationModal({
        type: 'critical',
        title: 'Test Terminated - Tab Switch Violation',
        message: 'You have exceeded the maximum allowed tab/window switches. Your assessment will be automatically submitted and closed.',
        isBlocking: false,
        strictMode: false,
        autoCloseSeconds: 5,
        onClose: closeViolationModal,
        onAcknowledge: async () => {
          closeViolationModal();
          await autoSubmit(currentAttemptIdRef.current, selectedAnswers);
        }
      });
      return;
    }

    if (nextFullscreenExits <= 0) {
      setViolationModal({
        type: 'critical',
        title: 'Test Terminated - Fullscreen Violation Limit Reached',
        message: 'You have exceeded the maximum allowed fullscreen exits. Your assessment will be automatically submitted and closed.',
        isBlocking: false,
        strictMode: false,
        autoCloseSeconds: 5,
        onClose: closeViolationModal,
        onAcknowledge: async () => {
          closeViolationModal();
          await autoSubmit(currentAttemptIdRef.current, selectedAnswers);
        }
      });
      return;
    }

    // Show warning modal for non-terminal violations
    setViolationModal({
      type: 'warning',
      title: violationType === 'FULLSCREEN' ? 'Fullscreen Exit Detected' : 'Tab/Window Switch Detected',
      message: notice,
      count: currentViolationCount,
      maxCount: maxViolations,
      isBlocking: false,
      strictMode: false,
      onClose: closeViolationModal,
      onAcknowledge: handleAcknowledgeViolation
    });
  };

  useEffect(() => {
    // Fetch test details for instructions phase
    api.get(`/student/tests/${id}`)
      .then(res => {
        setTest(res.data);
        // Check if there is an active IN_PROGRESS attempt
        const activeAttempt = res.data.attempts?.find(a => a.status === 'IN_PROGRESS');
        if (activeAttempt) {
          // pre-resume if needed, but we let them click "Resume" in instructions
          setAttempt(activeAttempt);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to fetch test details');
      })
      .finally(() => setLoading(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
      console.warn('Failed to load aptitude proctor state', error);
      setTabSwitchesLeft(PROCTOR_LIMITS.tabSwitches);
      setFullscreenExitsLeft(PROCTOR_LIMITS.fullscreenExits);
    }
  }, [attempt?.id]);

  useEffect(() => {
    if (phase !== 'TESTING') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctorViolation('TAB');
        startWindowViolationTimer();
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        handleProctorViolation('TAB');
        startWindowViolationTimer();
      }
    };

    const handleFocus = () => {
      if (phase === 'TESTING') {
        setProctorNotice('Back in the assessment. Stay on this page and keep fullscreen active.');
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
  }, [phase, submitting, tabSwitchesLeft, fullscreenExitsLeft]);

  const startTest = async () => {
    setLoading(true);
    setError('');
    autoSubmitLockRef.current = false;
    clearWindowViolationTimer();
    await requestFullscreen();
    try {
      const { data } = await api.post(`/student/tests/${id}/start`);
      setAttempt(data.attempt);
      setQuestions(data.questions);
      
      // Map existing answers if resuming
      const answersMap = data.attempt.answers || [];
      const preppedAnswers = data.questions.map(q => {
        const found = answersMap.find(a => a.questionId === q.id);
        return {
          questionId: q.id,
          selectedOption: found ? found.selectedOption : null,
          isFlaggedForReview: found ? found.isFlaggedForReview || false : false
        };
      });
      setSelectedAnswers(preppedAnswers);

      // Set timer (duration in mins)
      const elapsed = Math.round((new Date() - new Date(data.attempt.startedAt)) / 1000);
      const totalSeconds = test.duration * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);

      // Prepopulate visited questions
      const visited = new Set([0]);
      preppedAnswers.forEach((ans, idx) => {
        if (ans.selectedOption !== null) visited.add(idx);
      });
      setVisitedIndices(visited);

      setPhase('TESTING');
      
      // Start Countdown Timer
      startTimer(remaining, data.attempt.id, preppedAnswers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start test attempt');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (duration, attemptId, currentAnswers) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let time = duration;
    timerRef.current = setInterval(async () => {
      time--;
      setTimeLeft(time);
      
      if (time <= 0) {
        clearInterval(timerRef.current);
        // Auto-submit when time expires
        autoSubmit(attemptId, currentAnswers);
      }
    }, 1000);
  };

  const selectOption = async (option) => {
    const updated = selectedAnswers.map((ans, idx) => {
      if (idx === currentIdx) {
        return { ...ans, selectedOption: option };
      }
      return ans;
    });
    setSelectedAnswers(updated);
    
    // Auto Save to backend immediately
    try {
      await api.post(`/student/tests/${id}/attempts/${attempt.id}/save`, { answers: updated });
    } catch (err) {
      console.error('Auto save failed', err);
    }
  };

  const toggleReview = async () => {
    const updated = selectedAnswers.map((ans, idx) => {
      if (idx === currentIdx) {
        return { ...ans, isFlaggedForReview: !ans.isFlaggedForReview };
      }
      return ans;
    });
    setSelectedAnswers(updated);
    
    // Auto Save
    try {
      await api.post(`/student/tests/${id}/attempts/${attempt.id}/save`, { answers: updated });
    } catch (err) {
      console.error('Auto save failed', err);
    }
  };

  const clearResponse = async () => {
    const updated = selectedAnswers.map((ans, idx) => {
      if (idx === currentIdx) {
        return { ...ans, selectedOption: null };
      }
      return ans;
    });
    setSelectedAnswers(updated);
    
    // Auto Save
    try {
      await api.post(`/student/tests/${id}/attempts/${attempt.id}/save`, { answers: updated });
    } catch (err) {
      console.error('Auto save failed', err);
    }
  };

  const navigateQuestion = (dir) => {
    const nextIdx = dir === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      setVisitedIndices(prev => new Set([...prev, nextIdx]));
    }
  };

  const jumpToQuestion = (idx) => {
    setCurrentIdx(idx);
    setVisitedIndices(prev => new Set([...prev, idx]));
  };

  const submitTest = async () => {
    if (!window.confirm('Are you sure you want to submit your assessment? You cannot make changes after submitting.')) return;
    
    setSubmitting(true);
    clearWindowViolationTimer();

    try {
      const { data } = await api.post(`/student/tests/${id}/attempts/${attempt.id}/submit`, {
        answers: selectedAnswers,
        violationCounts: violationCounts
      });
      setResult(data);
      clearProctorState(attempt.id);
      setPhase('RESULTS');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmit = async (attemptId, answersToSubmit) => {
    if (!attemptId || autoSubmitLockRef.current) return;
    autoSubmitLockRef.current = true;
    setSubmitting(true);
    clearWindowViolationTimer();
    try {
      const { data } = await api.post(`/student/tests/${id}/attempts/${attemptId}/submit`, {
        answers: answersToSubmit,
        autoSubmitted: true,
        violationCounts: getViolationInfo()
      });
      setResult(data);
      clearProctorState(attemptId);
      setPhase('RESULTS');
      alert('Time expired! Your assessment has been automatically submitted.');
    } catch (err) {
      console.error('Auto submit failed', err);
    } finally {
      setSubmitting(false);
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

  if (error || !test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-3xl p-6 text-center space-y-4 shadow-md">
          <XCircle size={48} className="text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Denied / Error</h2>
          <p className="text-sm text-muted-foreground">{error || 'Test data unavailable.'}</p>
          <button onClick={() => navigate('/student/tests')} className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all hover:bg-primary/95">
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // 1. Instructions Phase UI
  if (phase === 'INSTRUCTIONS') {
    const isResuming = attempt !== null;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 animate-in fade-in duration-300">
        <div className="max-w-2xl w-full bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Sparkles size={16} /> Online Assessment
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">{test.name}</h1>
            {test.description && <p className="text-sm text-muted-foreground leading-relaxed">{test.description}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-semibold">
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                <p className="text-base text-foreground mt-0.5">{test.duration} Minutes</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <Award className="text-primary" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Passing Score</p>
                <p className="text-base text-foreground mt-0.5">{test.passingPercentage}%</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
              <ShieldAlert className="text-primary" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Negative Marking</p>
                <p className="text-base text-foreground mt-0.5">{test.negativeMarking ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
            <div className="p-4 bg-muted/30 border rounded-2xl flex items-center gap-3">
              <ClipboardList className={isFullscreen ? 'text-green-600' : 'text-amber-600'} size={18} />
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
              {test.instructions || `1. Once started, the timer cannot be paused.
2. Navigating away or closing the page will not stop the timer; you can resume as long as time remains.
3. The test will auto-submit when the timer expires.
4. The test runs in fullscreen. Tab switches and window changes are limited.
5. Each correct answer carries points, while incorrect answers may deduct points if negative marking is enabled.`}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4 border-t border-border/50">
            {/* Hardware Check UI */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/20 border rounded-2xl">
              <div className="space-y-1 text-sm">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert size={16} className="text-primary" /> Proctoring Hardware Check
                </p>
                <p className="text-muted-foreground text-xs">Camera and microphone access is required before starting the test.</p>
                {hardwareError && <p className="text-destructive font-semibold text-xs mt-1">{hardwareError}</p>}
              </div>
              <div className="mt-3 sm:mt-0 flex shrink-0 gap-2">
                {!hardwarePermissions ? (
                  <button
                    onClick={requestPermissions}
                    className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-all border border-primary/20"
                  >
                    Grant Access
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-green-500/10 text-green-600 font-bold text-xs rounded-xl border border-green-500/20 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Access Granted
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => navigate('/student/tests')} 
                className="px-6 py-3 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={startTest}
                disabled={!hardwarePermissions}
                className="px-8 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!hardwarePermissions ? "Please grant hardware access first" : ""}
              >
                {isResuming ? 'Resume Assessment' : 'Start Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Testing Workbench Phase UI
  if (phase === 'TESTING') {
    const currentQ = questions[currentIdx];
    const totalQuestions = questions.length;
    const answeredCount = selectedAnswers.filter(ans => ans.selectedOption !== null).length;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const currentAnsState = selectedAnswers[currentIdx] || { selectedOption: null, isFlaggedForReview: false };

    return (
      <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-300 select-none">
        
        {isHardwareLost && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-card border-2 border-destructive max-w-md w-full rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <ShieldAlert size={48} className="text-destructive mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Proctoring Interrupted</h2>
              <p className="text-muted-foreground text-sm">
                Camera or microphone access has been lost. The test is paused, but the timer is still ticking. Please restore access to continue.
              </p>
              <button 
                onClick={requestPermissions}
                className="px-6 py-3 bg-destructive text-destructive-foreground font-bold rounded-xl hover:bg-destructive/90 transition-all w-full mt-4"
              >
                Reconnect Hardware
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Testing Header */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="font-extrabold text-sm sm:text-base text-foreground truncate">{test.name}</h2>
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

          {/* Progress bar in center */}
          <div className="hidden md:flex flex-col items-center flex-1 max-w-sm px-6">
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground font-semibold mb-1">
              <span>Progress</span>
              <span>{answeredCount} / {totalQuestions} Answered ({Math.round(progress)}%)</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border/30">
              <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Timer element */}
          <div className="flex items-center gap-2 font-bold px-4 py-2 bg-secondary/15 rounded-xl border border-secondary/20 text-secondary shrink-0">
            <Clock size={16} className={timeLeft < 60 ? 'text-destructive animate-pulse' : ''} />
            <span className={timeLeft < 60 ? 'text-destructive' : ''}>{formatTime(timeLeft)}</span>
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
            onClose={violationModal.onClose || closeViolationModal}
            onAcknowledge={violationModal.onAcknowledge}
            isBlocking={violationModal.isBlocking}
            strictMode={violationModal.strictMode || false}
            autoCloseSeconds={violationModal.autoCloseSeconds}
          />
        )}

        {/* Workspace */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Question workspace (left) */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
            <div className="max-w-3xl w-full mx-auto space-y-8">
              
              {/* Question Statement */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-primary text-primary-foreground font-extrabold text-xs rounded-lg">
                    Question {currentIdx + 1} of {totalQuestions}
                  </span>
                  {currentQ?.marks && (
                    <span className="text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-md">
                      Marks: {currentQ.marks} {test.negativeMarking && `| Neg Marks: ${currentQ.negativeMarks}`}
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-bold leading-relaxed text-foreground whitespace-pre-line">
                  {currentQ?.statement}
                </h1>
              </div>

              {/* Option cards */}
              <div className="grid gap-3">
                {currentQ?.options?.map((opt, idx) => {
                  const label = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = currentAnsState.selectedOption === opt;

                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(opt)}
                      className={`flex gap-4 items-center w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all hover:bg-muted/40 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary' 
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {label}
                      </span>
                      <span className="leading-relaxed flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Navigation Actions */}
            <div className="max-w-3xl w-full mx-auto border-t border-border pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={toggleReview}
                  className={`flex-1 sm:flex-none px-4 py-2.5 border rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    currentAnsState.isFlaggedForReview 
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-600' 
                      : 'border-input hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Mark for Review
                </button>
                {currentAnsState.selectedOption !== null && (
                  <button
                    type="button"
                    onClick={clearResponse}
                    className="px-4 py-2.5 border border-input rounded-xl hover:bg-muted font-bold text-xs text-muted-foreground transition-all"
                  >
                    Clear Response
                  </button>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigateQuestion('prev')}
                  disabled={currentIdx === 0}
                  className="flex-1 sm:flex-none px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-semibold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => navigateQuestion('next')}
                  disabled={currentIdx === totalQuestions - 1}
                  className="flex-1 sm:flex-none px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-semibold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </main>

          {/* Right question palette sidebar (desktop) */}
          <aside className="w-full md:w-80 bg-card border-t md:border-t-0 md:border-l border-border flex flex-col justify-between shrink-0 p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                Question Palette
              </h3>
              
              {/* Grid of numbers */}
              <div className="grid grid-cols-5 gap-2.5 overflow-y-auto max-h-[40vh] md:max-h-none py-1">
                {questions.map((q, idx) => {
                  const ansState = selectedAnswers[idx] || { selectedOption: null, isFlaggedForReview: false };
                  const isCurrent = idx === currentIdx;
                  const isVisited = visitedIndices.has(idx);
                  const isAnswered = ansState.selectedOption !== null;
                  const isFlagged = ansState.isFlaggedForReview;

                  let style = 'bg-muted/50 text-muted-foreground border-transparent';
                  if (isAnswered && isFlagged) {
                    // Answered & Flagged
                    style = 'bg-purple-500/10 text-purple-600 border border-purple-500/30 font-semibold';
                  } else if (isFlagged) {
                    // Flagged
                    style = 'bg-purple-500/10 text-purple-600 border border-purple-500/30 font-semibold';
                  } else if (isAnswered) {
                    // Answered
                    style = 'bg-green-500/10 text-green-600 border border-green-500/30 font-semibold';
                  } else if (isVisited) {
                    // Visited but unanswered
                    style = 'bg-red-500/10 text-red-500 border border-red-500/30 font-semibold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(idx)}
                      className={`h-9 w-9 text-xs rounded-xl flex items-center justify-center transition-all ${style} ${
                        isCurrent ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'hover:scale-102'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Status legend indicators */}
              <div className="border-t border-border pt-4 grid grid-cols-2 gap-x-2 gap-y-3.5 text-[11px] font-semibold text-muted-foreground select-none">
                <div className="flex items-center gap-2">
                  <span className="h-4.5 w-4.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/30 flex items-center justify-center font-bold">✓</span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4.5 w-4.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center font-bold">!</span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4.5 w-4.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/30 flex items-center justify-center font-bold">★</span>
                  <span>Review Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4.5 w-4.5 rounded-lg bg-muted/50 border border-transparent flex items-center justify-center font-bold">•</span>
                  <span>Unvisited</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="border-t border-border pt-6">
              <button
                type="button"
                onClick={submitTest}
                disabled={submitting}
                className="w-full py-3 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                Submit Assessment
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // 3. Results Summary Phase UI — no score revealed, recruiter decides threshold later
  if (phase === 'RESULTS' && result) {
    const submittedTime = result.completedAt || result.submittedAt || new Date().toISOString();
    const fmtTime = (iso) => {
      try {
        return new Date(iso).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        });
      } catch { return 'N/A'; }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 animate-in fade-in duration-300">
        <div className="max-w-lg w-full bg-card border border-border rounded-3xl p-10 shadow-sm space-y-7 text-center">

          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-foreground">Assessment Submitted!</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thank you for completing the assessment. Your responses have been successfully recorded.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-muted/40 border border-border rounded-2xl p-5 text-left space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Submitted at</span>
              <span className="font-semibold">{fmtTime(submittedTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">Results Pending</span>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-5 py-4 text-sm text-blue-700 leading-relaxed">
            <p className="font-semibold mb-1">📬 What happens next?</p>
            <p>The recruiting team will review all submissions and set the qualifying threshold. You will receive an <strong>email notification</strong> once the results are declared — with full details on whether you have been shortlisted for the next round.</p>
          </div>

          <button
            onClick={() => navigate('/student/tests')}
            className="w-full px-8 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-sm"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TestInterface;
