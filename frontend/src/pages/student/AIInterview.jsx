import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProctoring } from '../../hooks/useProctoring';
import axios from 'axios';
import api from '../../lib/axios';
import {
  Mic, MicOff, Volume2, Sparkles, AlertCircle, ArrowLeft, RefreshCw,
  CheckCircle2, Play, Send, Bot, User, Clock, Award, ShieldCheck, ShieldAlert,
  Video, Eye, FileText, ChevronRight, CheckCheck, Loader2, ExternalLink,
  Download, Sparkle, Laptop, Settings, ArrowUpRight, Lock, Maximize2, AlertTriangle,
  Smartphone, Users, Home, Trophy, XCircle, CheckSquare
} from 'lucide-react';

const INTERVIEW_BASE_URL = 'http://localhost:3000';
const MAX_SCREEN_VIOLATIONS = 3;

const AIInterview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const { user } = useAuth();

  // Mode: 'EMBEDDED' (Interactive Web Canvas) vs 'CONFIG' (Candidate Details & Launch) vs 'COMPLETED' (post-interview)
  const [viewMode, setViewMode] = useState('CONFIG');
  const [serverOnline, setServerOnline] = useState(null);
  const [serverMeta, setServerMeta] = useState(null);

  // Candidate and Session state
  const [candidateName, setCandidateName] = useState(user?.fullName || 'Student Candidate');
  const [candidateEmail, setCandidateEmail] = useState(user?.email || 'candidate@hiresense.ai');
  const [jobTitle, setJobTitle] = useState('Software Development Engineer');
  const [skills, setSkills] = useState('React, Node.js, Python, SQL, Data Structures, Algorithms, System Design');
  const [jobDescription, setJobDescription] = useState(
    'Full Stack Software Development Engineer. Required skills: Data Structures & Algorithms, React, Node.js, RESTful APIs, System Architecture, Database Design (SQL/PostgreSQL).'
  );

  const [candidateId, setCandidateId] = useState(null);
  const [activeFrameUrl, setActiveFrameUrl] = useState(`${INTERVIEW_BASE_URL}/intake.html`);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [proctorWarning, setProctorWarning] = useState('');

  // Interview completion state
  const [interviewReport, setInterviewReport] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Strict Proctoring & Anti-Cheating States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenViolations, setScreenViolations] = useState(0);
  const [showScreenSwitchModal, setShowScreenSwitchModal] = useState(false);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

  // Hardware / Webcam preview
  const videoRef = useRef(null);
  const embeddedVideoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [micActive, setMicActive] = useState(false);

  // Reliable Session & Attempt Identifier
  const effectiveAttemptId = candidateId || (user?.id ? `interview-${user.id}` : 'interview-session-active');

  // Companion Python Proctoring Hook
  const {
    status: pythonProctorStatus,
    errorMsg: pythonProctorError,
    sessionId,
    startProctoring,
    stopProctoring
  } = useProctoring(
    effectiveAttemptId,
    'INTERVIEW',
    (warningMsg) => {
      setProctorWarning(warningMsg);
      setTimeout(() => setProctorWarning(''), 6000);
    }
  );

  // ── CHECK IF STUDENT HAS ALREADY COMPLETED AN INTERVIEW ──
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        if (!applicationId) {
          setAlreadyCompleted(false);
          setExistingReport(null);
          return;
        }
        const res = await api.get('/student/interview/status', { params: { applicationId } });
        if (res.data.hasCompleted) {
          setAlreadyCompleted(true);
          setExistingReport(res.data.report);
        } else {
          // Explicitly reset — backend is the only source of truth
          setAlreadyCompleted(false);
          setExistingReport(null);
        }
      } catch (err) {
        // API failed — default to NOT completed (avoid false positives)
        setAlreadyCompleted(false);
        setExistingReport(null);
        console.log('[AIInterview] Status check error:', err.message);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [user?.id, applicationId]);

  // Start proctoring when entering EMBEDDED live interview mode
  useEffect(() => {
    if (viewMode === 'EMBEDDED') {
      startProctoring();
    } else {
      stopProctoring();
    }
    return () => {
      stopProctoring();
    };
  }, [viewMode, effectiveAttemptId]);

  // ── LISTEN FOR INTERVIEW COMPLETION postMessage FROM IFRAME ──
  // Use a ref to avoid stale closure on submitReportToBackend
  const submitReportRef = useRef(null);
  const screenViolationsRef = useRef(screenViolations);
  useEffect(() => { screenViolationsRef.current = screenViolations; }, [screenViolations]);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'AI_INTERVIEW_COMPLETE') {
        const payload = event.data.payload;
        console.log('[AIInterview] ✅ Received completion postMessage:', payload);

        stopProctoring();
        try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}

        setInterviewReport(payload);
        setViewMode('COMPLETED');

        // Use ref version to avoid stale closure
        if (submitReportRef.current) {
          submitReportRef.current(payload);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Submit report to our backend for recruiter review
  const submitReportToBackend = async (reportPayload) => {
    try {
      setIsSubmittingReport(true);
      console.log('[AIInterview] Submitting report to backend...', reportPayload);
      const res = await api.post('/student/interview/submit-report', {
        candidateName: reportPayload.candidateName || candidateName,
        candidateEmail: reportPayload.candidateEmail || candidateEmail,
        jobTitle: reportPayload.jobTitle || jobTitle,
        applicationId,
        interviewSessionId: reportPayload.sessionId || null,
        percentage: reportPayload.percentage || 0,
        selected: reportPayload.selected || false,
        highestLevel: reportPayload.highestLevel || 1,
        endedEarly: reportPayload.endedEarly || false,
        turns: reportPayload.turns || [],
        screenViolations: screenViolationsRef.current || 0
      });
      console.log('[AIInterview] ✅ Report submitted to backend:', res.data);
      setReportSubmitted(true);
      setAlreadyCompleted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        // Already submitted — treat as success
        setReportSubmitted(true);
        setAlreadyCompleted(true);
      } else {
        console.error('[AIInterview] ❌ Submit report error:', err.response?.data || err.message);
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Keep submitReportRef up to date
  useEffect(() => {
    submitReportRef.current = submitReportToBackend;
  });

  // Enter Fullscreen Helper
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(Boolean(document.fullscreenElement));
    } catch (err) {
      console.warn('Fullscreen entry failed', err);
    }
  };

  // Strict Screen Change & Tab Switch Detection
  useEffect(() => {
    if (viewMode !== 'EMBEDDED') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setScreenViolations(prev => {
          const nextVal = prev + 1;
          const msg = `SCREEN CHANGE DETECTED: Warning (${nextVal}/${MAX_SCREEN_VIOLATIONS}). You must remain on this tab throughout the interview.`;
          setProctorWarning(msg);
          setShowScreenSwitchModal(true);

          if (sessionId) {
            api.post(`/student/proctoring/session/${sessionId}/event`, {
              eventType: 'TAB_SWITCH',
              severity: 'CRITICAL',
              metadata: `Candidate left interview screen / changed tab (Violation ${nextVal}/${MAX_SCREEN_VIOLATIONS})`
            }).catch(() => {});
          }
          return nextVal;
        });
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) return;
      // Ignore blur when focus moved to the embedded interview iframe (Start/Next buttons, etc.)
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'IFRAME') return;
      setScreenViolations(prev => {
        const nextVal = prev + 1;
        const msg = `WINDOW FOCUS LOST: Warning (${nextVal}/${MAX_SCREEN_VIOLATIONS}). Do not click away to other apps.`;
        setProctorWarning(msg);
        setShowScreenSwitchModal(true);

        if (sessionId) {
          api.post(`/student/proctoring/session/${sessionId}/event`, {
            eventType: 'WINDOW_BLUR',
            severity: 'WARNING',
            metadata: `Window lost focus (Violation ${nextVal}/${MAX_SCREEN_VIOLATIONS})`
          }).catch(() => {});
        }
        return nextVal;
      });
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [viewMode, sessionId]);

  // 1. Health check for Node.js Interview server
  const checkServerHealth = async () => {
    try {
      const res = await axios.get(`${INTERVIEW_BASE_URL}/api/health`, { timeout: 3500 });
      setServerOnline(true);
      setServerMeta(res.data);
      setErrorMsg('');
    } catch (err) {
      setServerOnline(false);
      setServerMeta(null);
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync user profile when loaded
  useEffect(() => {
    if (user?.fullName && candidateName === 'Student Candidate') {
      setCandidateName(user.fullName);
    }
    if (user?.email && candidateEmail === 'candidate@hiresense.ai') {
      setCandidateEmail(user.email);
    }
  }, [user]);

  // 2. Initialize Hardware Webcam Preview in CONFIG view mode
  useEffect(() => {
    if (viewMode !== 'CONFIG') {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      return;
    }

    let streamInstance = null;
    const enableWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamInstance = stream;
        setMediaStream(stream);
        setMicActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Webcam/mic access declined or unavailable', err);
        setMicActive(false);
      }
    };

    enableWebcam();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
      }
    };
  }, [viewMode]);

  // Polling frame for proctoring camera feed in embedded view
  const [proctorFrameTs, setProctorFrameTs] = useState(Date.now());
  useEffect(() => {
    if (viewMode !== 'EMBEDDED') return;
    const interval = setInterval(() => {
      setProctorFrameTs(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [viewMode]);

  // 3. Quick Launch Candidate Session directly into the AI Interview Room
  const handleDirectLaunch = async () => {
    if (!agreedToGuidelines) {
      setErrorMsg('Please read and agree to all strict proctoring guidelines before launching the interview.');
      return;
    }

    setIsLaunching(true);
    setErrorMsg('');
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await axios.post(`${INTERVIEW_BASE_URL}/api/candidates`, {
        consent: 'true',
        name: candidateName,
        email: candidateEmail,
        role: jobTitle,
        skills: skillsArray,
        resumeText: `Candidate: ${candidateName}\nEmail: ${candidateEmail}\nTarget Role: ${jobTitle}\nSkills: ${skillsArray.join(', ')}`,
        jdText: jobDescription
      });

      const data = res.data;
      if (data && data.candidateId) {
        setCandidateId(data.candidateId);
        const roomUrl = `${INTERVIEW_BASE_URL}/index.html?candidate=${data.candidateId}`;
        setActiveFrameUrl(roomUrl);
        setViewMode('EMBEDDED');
        enterFullscreen();
      } else {
        throw new Error('Could not initialize interview candidate session');
      }
    } catch (err) {
      console.error('Launch failed', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to start interview. Ensure the interview service is running.');
    } finally {
      setIsLaunching(false);
    }
  };

  const isProctorConnected = pythonProctorStatus === 'active';
  const scoreColor = interviewReport
    ? interviewReport.percentage >= 70 ? 'text-emerald-500' : interviewReport.percentage >= 50 ? 'text-amber-500' : 'text-destructive'
    : '';

  // ── LOADING STATE ──
  if (checkingStatus) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm font-medium">Checking interview status...</p>
        </div>
      </div>
    );
  }

  // ── ALREADY COMPLETED STATE ──
  if (alreadyCompleted && viewMode !== 'COMPLETED') {
    const canRetake = existingReport?.status !== 'SELECTED' && existingReport?.status !== 'REJECTED';
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground">Interview Submitted</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Your AI interview has been submitted for recruiter review.</p>
            </div>
          </div>

          {existingReport && (
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-muted/40 rounded-2xl p-4 border border-border text-center">
                <p className="text-3xl font-extrabold text-foreground">{existingReport.percentage}<span className="text-base font-semibold text-muted-foreground">/100</span></p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Overall Score</p>
              </div>
              <div className={`rounded-2xl p-4 border text-center ${existingReport.selected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className={`text-lg font-extrabold ${existingReport.selected ? 'text-emerald-600' : 'text-red-500'}`}>
                  {existingReport.selected ? '✓ AI Pass' : '✕ Below Threshold'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">AI Recommendation</p>
              </div>
              <div className={`rounded-2xl p-4 border text-center ${
                existingReport.status === 'SELECTED' ? 'bg-emerald-500/10 border-emerald-500/20' :
                existingReport.status === 'REJECTED' ? 'bg-destructive/10 border-destructive/20' :
                'bg-amber-500/10 border-amber-500/20'
              }`}>
                <p className={`text-base font-extrabold ${
                  existingReport.status === 'SELECTED' ? 'text-emerald-600' :
                  existingReport.status === 'REJECTED' ? 'text-destructive' :
                  'text-amber-600'
                }`}>
                  {existingReport.status === 'PENDING_REVIEW' ? '⏳ Awaiting Review' :
                   existingReport.status === 'SELECTED' ? '🎉 Selected!' :
                   '✕ Rejected'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Recruiter Decision</p>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs text-muted-foreground leading-relaxed">
            <p className="font-bold text-primary mb-1 flex items-center gap-1.5"><ShieldCheck size={13} /> What happens next?</p>
            Your interview transcript and scores have been sent to the recruiter panel for human review. The recruiter will evaluate your performance and make a final hiring decision.
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/student')}
              className="flex-1 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home size={16} /> Go to Dashboard
            </button>
            {canRetake && (
              <button
                onClick={() => {
                  setAlreadyCompleted(false);
                  setExistingReport(null);
                  setViewMode('CONFIG');
                }}
                className="flex-1 py-3 bg-violet-600/10 border border-violet-500/30 text-violet-600 font-semibold text-sm rounded-2xl hover:bg-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic size={16} /> Take Interview Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── INTERVIEW COMPLETED STATE (right after finishing) ──
  if (viewMode === 'COMPLETED' && interviewReport) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">

        {/* Hero Completion Card */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-primary text-white rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border-4 border-white/30 shadow-inner">
              {interviewReport.selected
                ? <Trophy size={36} className="text-yellow-300" />
                : <CheckCircle2 size={36} className="text-white" />}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Interview Complete!</h1>
              <p className="text-white/80 text-sm mt-1">Your responses have been recorded and submitted for recruiter review.</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-extrabold">{interviewReport.percentage}</span>
              <span className="text-white/70 text-xl font-semibold">/ 100</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              interviewReport.selected
                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                : 'bg-white/10 text-white/80 border border-white/20'
            }`}>
              {interviewReport.selected ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              AI Recommendation: {interviewReport.selected ? 'Selected ✓' : 'Not Selected'}
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <Award size={18} className="text-primary" /> Assessment Summary
          </h2>

          <div className="grid sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border">
              <p className="text-2xl font-extrabold text-foreground">{interviewReport.percentage}<span className="text-xs text-muted-foreground">/100</span></p>
              <p className="text-muted-foreground font-medium mt-1">Score</p>
            </div>
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border">
              <p className="text-2xl font-extrabold text-foreground">{interviewReport.highestLevel}<span className="text-xs text-muted-foreground">/5</span></p>
              <p className="text-muted-foreground font-medium mt-1">Highest Level</p>
            </div>
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border">
              <p className="text-2xl font-extrabold text-foreground">{Array.isArray(interviewReport.turns) ? interviewReport.turns.length : '—'}</p>
              <p className="text-muted-foreground font-medium mt-1">Questions</p>
            </div>
          </div>

          {/* Submission status */}
          <div className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold border ${
            isSubmittingReport ? 'bg-primary/5 border-primary/20 text-primary' :
            reportSubmitted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
            'bg-amber-500/10 border-amber-500/20 text-amber-600'
          }`}>
            {isSubmittingReport ? (
              <><Loader2 size={14} className="animate-spin shrink-0" /> Sending report to recruiter panel...</>
            ) : reportSubmitted ? (
              <><CheckSquare size={14} className="shrink-0" /> Report successfully submitted to recruiter panel for review.</>
            ) : (
              <><AlertCircle size={14} className="shrink-0" /> Report submission pending...</>
            )}
          </div>

          {/* Proctor summary */}
          {screenViolations > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-semibold flex items-center gap-2">
              <ShieldAlert size={14} />
              <span>{screenViolations} screen violation(s) recorded and included in your report.</span>
            </div>
          )}
        </div>

        {/* What Happens Next */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-foreground">What happens next?</h2>
          <div className="space-y-2.5 text-xs text-muted-foreground">
            {[
              { icon: '📊', text: 'Your full transcript and AI-graded scores have been submitted to the recruiter.' },
              { icon: '👤', text: 'A human recruiter will review your performance and make the final decision.' },
              { icon: '📧', text: 'You will be notified about the outcome via your registered email.' },
              { icon: '🔒', text: 'Your session has been locked. You cannot retake this interview.' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-base shrink-0">{item.icon}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/student')}
            className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-sm rounded-2xl hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Home size={18} /> Go to Home Dashboard
          </button>
          <button
            onClick={() => navigate('/student/tests')}
            className="py-4 px-6 bg-card border border-border text-foreground font-semibold text-sm rounded-2xl hover:bg-muted transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} /> Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 p-2 md:p-6">

      {/* ── FULLSCREEN LOCK REQUIRED MODAL (DURING LIVE INTERVIEW) ── */}
      {viewMode === 'EMBEDDED' && !isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary/40 max-w-md w-full p-6 rounded-3xl shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Fullscreen Proctoring Required</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This technical AI interview round strictly requires fullscreen mode. Leaving fullscreen triggers violation flags sent to your hiring team.
            </p>
            {screenViolations > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-bold">
                Warning: Screen change detected {screenViolations}/{MAX_SCREEN_VIOLATIONS} times.
              </div>
            )}
            <button
              onClick={enterFullscreen}
              className="w-full py-3.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 size={16} /> Enter Fullscreen & Continue Interview
            </button>
          </div>
        </div>
      )}

      {/* ── TAB SWITCH / SCREEN CHANGE DETECTED MODAL ── */}
      {showScreenSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-destructive/40 max-w-md w-full p-6 rounded-3xl shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-destructive">Screen Change Detected!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You navigated away or switched tabs during this proctored evaluation. Switching screens or opening auxiliary windows is strictly prohibited.
            </p>
            <div className="p-3 bg-destructive/10 rounded-xl text-xs font-bold text-destructive">
              Violation Count: {screenViolations} of {MAX_SCREEN_VIOLATIONS}
            </div>
            <button
              onClick={() => setShowScreenSwitchModal(false)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              I Understand & Return to Interview
            </button>
          </div>
        </div>
      )}

      {/* ── TOP NAV HEADER BAR ── */}
      <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} /> AI Voice & Video Interview Suite
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
              serverOnline ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              {serverOnline ? `Interview Engine Online (Port 3000 · ${serverMeta?.gen || 'Active'})` : 'Connecting to Engine (Port 3000)...'}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
              isProctorConnected
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              <ShieldCheck size={12} className={isProctorConnected ? 'text-emerald-500' : 'text-primary'} />
              <span>{isProctorConnected ? 'AI Proctor Active (Port 8765)' : 'Proctor Companion Ready'}</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            Conversational AI Technical Evaluation & Voice Room
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {viewMode === 'EMBEDDED' && (
            <div className="bg-muted p-1 rounded-xl flex gap-1 border border-border text-xs font-semibold">
              <button
                onClick={() => setViewMode('CONFIG')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'CONFIG' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ⚙️ Candidate Setup
              </button>
              <button
                onClick={() => {
                  setViewMode('EMBEDDED');
                  enterFullscreen();
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'EMBEDDED' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🖥️ Live Canvas Studio
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/student/tests')}
            className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {/* Proctoring Warning Banner */}
      {proctorWarning && (
        <div className="p-3.5 bg-destructive/15 border border-destructive/30 rounded-2xl text-destructive text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <ShieldAlert size={16} className="shrink-0" />
          <span>Proctor Alert: {proctorWarning}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── EMBEDDED IFRAME MODE ── */}
      {viewMode === 'EMBEDDED' ? (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg space-y-0 relative">
          <div className="bg-muted/40 border-b border-border px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Mic size={16} />
              </div>
              <div>
                <h2 className="font-bold text-xs md:text-sm text-foreground">Interactive AI Voice Interview Suite</h2>
                <p className="text-[11px] text-muted-foreground">Running on port 3000 • Voice TTS & Speech Recognition Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary font-mono font-bold rounded-lg">
                ID: {(effectiveAttemptId || '').slice(0, 18)}
              </span>
              {candidateId && (
                <a
                  href={`${INTERVIEW_BASE_URL}/api/interview/${candidateId}/download?format=txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Download size={13} /> Download Report
                </a>
              )}
              <button
                onClick={checkServerHealth}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground font-semibold text-xs rounded-lg hover:bg-secondary/80 flex items-center gap-1 transition-all"
              >
                <RefreshCw size={12} /> Status
              </button>
            </div>
          </div>

          {/* Floating Real-Time Proctoring Alert Toast */}
          {proctorWarning && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="p-4 bg-destructive text-destructive-foreground rounded-2xl shadow-2xl flex items-center justify-between gap-3 border-2 border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl shrink-0">
                    <ShieldAlert size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs uppercase tracking-wider">AI Proctoring Alert</div>
                    <div className="text-xs font-semibold">{proctorWarning}</div>
                  </div>
                </div>
                <button onClick={() => setProctorWarning('')} className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0">
                  <XCircle size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="relative min-h-[820px] w-full bg-slate-950">
            <iframe
              id="ai-interview-frame"
              src={activeFrameUrl}
              title="HireSense AI Voice Interview"
              allow="camera; microphone; display-capture; autoplay"
              className="w-full h-[820px] border-0"
            />
          </div>

          {/* Floating Camera Proctoring Picture-in-Picture Feed */}
          <div className="fixed bottom-5 right-5 z-40 bg-zinc-950/90 border-2 border-primary/40 rounded-2xl p-2 shadow-2xl backdrop-blur-md w-44 md:w-52">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={`http://localhost:8765/frame?t=${proctorFrameTs}`}
                alt="Live AI Proctor Feed"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => { e.target.style.display = 'none'; }}
                onLoad={(e) => { e.target.style.display = 'block'; }}
              />
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">REC</span>
              </div>
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-primary/80 text-[9px] font-mono font-bold text-white">
                PROCTOR AI
              </div>
            </div>
            <div className="mt-1.5 text-center">
              <p className="text-[10px] font-medium text-zinc-400 flex items-center justify-center gap-1">
                <ShieldCheck size={11} className="text-primary" /> Camera Proctoring Active
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── CONFIG / SETUP MODE ── */
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Webcam & Device Readiness */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Video size={16} className="text-primary" /> Hardware Check & Video Preview
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    mediaStream ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {mediaStream ? 'Camera Ready' : 'Permission Required'}
                  </span>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-border flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1] rounded-2xl"
                  />
                  {!mediaStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                      <Video size={32} className="opacity-40 text-primary" />
                      <p className="text-xs">Camera stream will initialize here</p>
                    </div>
                  )}
                  {mediaStream && (
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Feed OK</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-2">
                    <Mic size={16} className={micActive ? 'text-emerald-500' : 'text-amber-500'} />
                    <div>
                      <p className="font-bold text-foreground">Microphone</p>
                      <p className="text-[10px] text-muted-foreground">{micActive ? 'Ready for Voice STT' : 'Check Permissions'}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-2">
                    <Volume2 size={16} className="text-primary" />
                    <div>
                      <p className="font-bold text-foreground">AI Voice</p>
                      <p className="text-[10px] text-muted-foreground">Natural TTS Active</p>
                    </div>
                  </div>
                </div>

                {/* Companion Proctoring Info */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-primary flex items-center gap-1.5">
                    <ShieldCheck size={14} /> AI Proctor Companion Status
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Local companion server: <strong className="text-foreground">http://localhost:8765</strong>. Analyzes multi-face presence, gaze direction, and unauthorized devices during the interview.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[11px] font-bold">
                    <span className={`w-2 h-2 rounded-full ${isProctorConnected ? 'bg-emerald-500 animate-ping' : 'bg-primary'}`} />
                    <span className={isProctorConnected ? 'text-emerald-600' : 'text-primary'}>
                      {isProctorConnected ? 'Companion Connected & Armed' : 'Companion Server Ready'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Candidate Profile & Start Actions */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" /> Candidate Profile & Role Details
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    The AI interviewer adaptively tailors technical questions based on your verified credentials.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5 block">
                        Candidate Full Name
                      </label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={e => setCandidateName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5 block">
                        Candidate Email
                      </label>
                      <input
                        type="email"
                        value={candidateEmail}
                        onChange={e => setCandidateEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5 block">
                      Target Job Designation / Role
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5 block">
                      Verified Skill Keywords (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={e => setSkills(e.target.value)}
                      placeholder="React, Node.js, Python, SQL, DSA..."
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5 block">
                      Job Description & Role Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                      className="w-full p-3 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-xs leading-relaxed"
                    />
                  </div>
                </div>

                {/* ── STRICT PROCTORING GUIDELINES CARD ── */}
                <div className="bg-destructive/5 border-2 border-destructive/20 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-destructive" />
                    <h3 className="font-extrabold text-sm text-foreground">Strict Proctoring & Anti-Cheating Guidelines</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2 bg-background/60 p-2.5 rounded-xl border border-border">
                      <Lock size={15} className="text-destructive shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Zero Screen Switching</strong>
                        Tab changes, window minimizes, or secondary apps trigger violation flags.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/60 p-2.5 rounded-xl border border-border">
                      <Maximize2 size={15} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Enforced Fullscreen</strong>
                        Interview room requires uninterrupted fullscreen mode throughout.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/60 p-2.5 rounded-xl border border-border">
                      <Eye size={15} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Continuous Gaze Tracking</strong>
                        Face must remain centered. Prolonged looking away is flagged.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/60 p-2.5 rounded-xl border border-border">
                      <Users size={15} className="text-destructive shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Single Person Only</strong>
                        Secondary people detected on camera will trigger integrity alerts.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/60 p-2.5 rounded-xl border border-border">
                      <Smartphone size={15} className="text-destructive shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">No Mobile Phones</strong>
                        Object vision flags mobile devices, books, or notes in the feed.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/60 p-2.5 rounded-xl border border-border">
                      <Mic size={15} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">Voice Stream Captured</strong>
                        Spoken audio is transcribed and checked for conversational fluency.
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Checkbox Agreement */}
                  <label className="flex items-start gap-2.5 pt-1 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToGuidelines}
                      onChange={e => setAgreedToGuidelines(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-primary border-input focus:ring-primary/40 cursor-pointer"
                    />
                    <span className="font-bold text-foreground">
                      I understand and agree to comply with all strict proctoring guidelines, fullscreen locking, and zero-screen-switching policies.
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-3">
                  <button
                    onClick={handleDirectLaunch}
                    disabled={isLaunching || !serverOnline || !agreedToGuidelines}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white font-extrabold text-sm rounded-2xl hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Preparing AI Voice Interview Session...
                      </>
                    ) : (
                      <>
                        <Play size={18} fill="currentColor" /> Launch Adaptive AI Voice Interview Room
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Adaptive Difficulty: Levels 1–5</span>
                  <span>Spoken Voice TTS (Avery & Arjun)</span>
                  <span>Auto-Graded Report</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterview;
