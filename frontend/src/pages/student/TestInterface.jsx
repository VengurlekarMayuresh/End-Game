import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  Clock, ShieldAlert, Award, FileText, CheckCircle2, 
  ChevronLeft, ChevronRight, X, Sparkles, XCircle, AlertTriangle,
  ClipboardList
} from 'lucide-react';

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

  const timerRef = useRef(null);

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

  const startTest = async () => {
    setLoading(true);
    setError('');
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
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const { data } = await api.post(`/student/tests/${id}/attempts/${attempt.id}/submit`, {
        answers: selectedAnswers
      });
      setResult(data);
      setPhase('RESULTS');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmit = async (attemptId, answersToSubmit) => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/student/tests/${id}/attempts/${attemptId}/submit`, {
        answers: answersToSubmit,
        autoSubmitted: true
      });
      setResult(data);
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

          <div className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2"><FileText size={18} className="text-primary" /> Instructions</h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/15 p-5 rounded-2xl border border-border">
              {test.instructions || `1. Once started, the timer cannot be paused.
2. Navigating away or closing the page will not stop the timer; you can resume as long as time remains.
3. The test will auto-submit when the timer expires.
4. Each correct answer carries points, while incorrect answers may deduct points if negative marking is enabled.`}
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
              onClick={startTest} 
              className="px-8 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {isResuming ? 'Resume Assessment' : 'Start Assessment'}
            </button>
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
        
        {/* Fullscreen Testing Header */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <ClipboardList size={18} />
            </div>
            <h2 className="font-extrabold text-sm sm:text-base text-foreground truncate">{test.name}</h2>
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

  // 3. Results Summary Phase UI
  if (phase === 'RESULTS' && result) {
    const passed = result.passed;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 animate-in fade-in duration-300 select-text">
        <div className="max-w-2xl w-full bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6 text-center">
          
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-muted/20">
              {passed ? (
                <div className="w-16 h-16 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-500/15 text-red-500 rounded-full flex items-center justify-center">
                  <XCircle size={40} />
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold text-foreground">Assessment Submitted</h1>
            <p className="text-sm text-muted-foreground">
              Your test has been successfully recorded and evaluated. Below is your performance summary.
            </p>
          </div>

          {/* Pass/Fail Status Banner */}
          <div className={`p-4 rounded-2xl border text-center font-bold text-base ${
            passed 
              ? 'bg-green-500/10 border-green-500/20 text-green-600' 
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {passed ? 'Congratulations, you passed! 🎉' : 'Passing score not achieved.'}
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="p-3 bg-muted/20 border rounded-xl">
              <p className="text-muted-foreground">Total Score</p>
              <p className="text-lg font-bold text-foreground mt-1">{result.score} marks</p>
            </div>
            <div className="p-3 bg-muted/20 border rounded-xl">
              <p className="text-muted-foreground">Percentage</p>
              <p className="text-lg font-bold text-foreground mt-1">{result.percentage}%</p>
            </div>
            <div className="p-3 bg-muted/20 border rounded-xl">
              <p className="text-muted-foreground">Correct Answers</p>
              <p className="text-lg font-bold text-green-600 mt-1">{result.correctAnswersCount}</p>
            </div>
            <div className="p-3 bg-muted/20 border rounded-xl">
              <p className="text-muted-foreground">Time Taken</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {Math.round(result.timeTaken / 60) || 0}m {result.timeTaken % 60 || 0}s
              </p>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
            {/* Category breakdown */}
            {result.categoryBreakdown && Object.keys(result.categoryBreakdown).length > 0 && (
              <div className="bg-muted/10 p-5 rounded-2xl space-y-3 border">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Category Performance</h4>
                <div className="space-y-2.5">
                  {Object.keys(result.categoryBreakdown).map(cat => {
                    const data = result.categoryBreakdown[cat];
                    const percent = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0;
                    return (
                      <div key={cat} className="text-xs">
                        <div className="flex justify-between font-semibold mb-0.5 capitalize">
                          <span>{cat}</span>
                          <span>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Difficulty breakdown */}
            {result.difficultyBreakdown && Object.keys(result.difficultyBreakdown).length > 0 && (
              <div className="bg-muted/10 p-5 rounded-2xl space-y-3 border">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Difficulty Performance</h4>
                <div className="space-y-2.5">
                  {Object.keys(result.difficultyBreakdown).map(diff => {
                    const data = result.difficultyBreakdown[diff];
                    const percent = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0;
                    return (
                      <div key={diff} className="text-xs">
                        <div className="flex justify-between font-semibold mb-0.5">
                          <span>{diff}</span>
                          <span>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-center border-t border-border/50">
            <button 
              onClick={() => navigate('/student/tests')} 
              className="px-8 py-3 bg-secondary text-secondary-foreground font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-sm"
            >
              Back to Tests List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TestInterface;
