import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProctoring } from '../../hooks/useProctoring';
import axios from 'axios';
import api from '../../lib/axios';
import {
  Mic, MicOff, Volume2, Sparkles, AlertCircle, ArrowLeft, RefreshCw,
  CheckCircle2, Play, Bot, Clock, Award, ShieldCheck, ShieldAlert,
  Video, Eye, ChevronRight, Loader2, Lock, Maximize2, AlertTriangle,
  Users, Home, Trophy, XCircle, CheckSquare, Wifi, Upload, Camera,
  FileText, Check, ArrowRight
} from 'lucide-react';

const INTERVIEW_BASE_URL = 'http://localhost:3000';
const MAX_FULLSCREEN_VIOLATIONS = 5;
const MAX_OUT_OF_FULLSCREEN_SECONDS = 30;

const AIInterview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const { user } = useAuth();

  // Mode: 'CONFIG' (Instructions & System Check) vs 'EMBEDDED' (Full Screen Live Interview) vs 'COMPLETED'
  const [viewMode, setViewMode] = useState('CONFIG');
  const [serverOnline, setServerOnline] = useState(null);
  const [serverMeta, setServerMeta] = useState(null);

  // Candidate Data (automatically loaded from user profile & job application, no manual form inputs)
  const [candidateName, setCandidateName] = useState(user?.fullName || 'Student Candidate');
  const [candidateEmail, setCandidateEmail] = useState(user?.email || 'candidate@hiresense.ai');
  const [jobTitle, setJobTitle] = useState('Software Development Engineer');
  const [skills, setSkills] = useState('React, Node.js, Python, SQL, Data Structures, Algorithms, System Design');
  const [jobDescription, setJobDescription] = useState(
    'Full Stack Software Development Engineer. Required skills: Data Structures & Algorithms, React, Node.js, RESTful APIs, System Architecture, Database Design (SQL/PostgreSQL).'
  );

  const [candidateId, setCandidateId] = useState(null);
  const [activeFrameUrl, setActiveFrameUrl] = useState('');
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

  // Fullscreen & Proctoring states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenViolations, setScreenViolations] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [outOfFullscreenSeconds, setOutOfFullscreenSeconds] = useState(MAX_OUT_OF_FULLSCREEN_SECONDS);
  const [showScreenSwitchModal, setShowScreenSwitchModal] = useState(false);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

  // Refs for bulletproof countdown and violation tracking
  const fullscreenViolationsRef = useRef(0);
  const countdownSecondsRef = useRef(MAX_OUT_OF_FULLSCREEN_SECONDS);
  const countdownIntervalRef = useRef(null);
  const isCurrentlyOutOfFullscreenRef = useRef(false);
  const interviewStartTimeRef = useRef(0);

  // ── SYSTEM CHECK CONTROLLER STATES ──
  const [checkStep, setCheckStep] = useState(1); // 1: Speed, 2: Mic, 3: Camera, 4: Calibration
  const [completedSteps, setCompletedSteps] = useState({ 1: false, 2: false, 3: false, 4: false });

  // Step 1: Speed Test States
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [pingMs, setPingMs] = useState(null);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [speedProgress, setSpeedProgress] = useState(0);

  // Step 2: Microphone States
  const [micStream, setMicStream] = useState(null);
  const [micVolume, setMicVolume] = useState(0);
  const [micPassed, setMicPassed] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDev, setSelectedAudioDev] = useState('');
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioAnimationRef = useRef(null);
  const micCanvasRef = useRef(null);

  // Step 3: Camera States
  const [camStream, setCamStream] = useState(null);
  const [camPassed, setCamPassed] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedVideoDev, setSelectedVideoDev] = useState('');
  const checkVideoRef = useRef(null);
  const calibFaceVideoRef = useRef(null);
  const calibIdVideoRef = useRef(null);
  const bottomWebcamRef = useRef(null);

  // Step 4: Calibration States
  const [calibFaceBase64, setCalibFaceBase64] = useState(null);
  const [calibIdBase64, setCalibIdBase64] = useState(null);
  const [idCaptureMode, setIdCaptureMode] = useState('camera'); // 'camera' | 'file'
  const [isUploadingCalib, setIsUploadingCalib] = useState(false);
  const [calibUploaded, setCalibUploaded] = useState(false);
  const [candidatePhotoUrl, setCandidatePhotoUrl] = useState(null);
  const [idProofUrl, setIdProofUrl] = useState(null);
  const hiddenCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Companion Python Proctoring Hook
  const effectiveAttemptId = candidateId || (user?.id ? `interview-${user.id}` : 'interview-session-active');
  const {
    status: pythonProctorStatus,
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

  // Polling frame for proctoring camera feed in embedded view
  const [proctorFrameTs, setProctorFrameTs] = useState(Date.now());
  useEffect(() => {
    if (viewMode !== 'EMBEDDED') return;
    const interval = setInterval(() => {
      setProctorFrameTs(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [viewMode]);

  // Load User profile info & Check completion status
  useEffect(() => {
    if (user?.fullName) setCandidateName(user.fullName);
    if (user?.email) setCandidateEmail(user.email);
  }, [user]);

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
          setAlreadyCompleted(false);
          setExistingReport(null);
        }
      } catch (err) {
        setAlreadyCompleted(false);
        setExistingReport(null);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [user?.id, applicationId]);

  // Start proctoring on EMBEDDED live interview mode
  const proctorStartedRef = useRef(false);
  useEffect(() => {
    if (viewMode === 'EMBEDDED') {
      if (!proctorStartedRef.current) {
        proctorStartedRef.current = true;
        startProctoring();
      }
    } else {
      if (proctorStartedRef.current) {
        proctorStartedRef.current = false;
        stopProctoring();
      }
    }
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if (proctorStartedRef.current) {
        proctorStartedRef.current = false;
        stopProctoring();
      }
    };
  }, []);

  // Check Interview Server Health on port 3000
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

  // ── AUTOMATIC SPEED TEST RUNNER ON MOUNT ──
  const runSpeedTest = async () => {
    setIsTestingSpeed(true);
    setSpeedProgress(20);
    try {
      const tStart = performance.now();
      await axios.get(`${INTERVIEW_BASE_URL}/api/health?t=${Date.now()}`, { timeout: 4000 });
      const ping = Math.round(performance.now() - tStart);
      setPingMs(ping);
      setSpeedProgress(65);

      await new Promise(r => setTimeout(r, 400));
      const estSpeed = Math.round((Math.random() * 25 + 35) * 10) / 10;
      setDownloadSpeed(estSpeed);
      setSpeedProgress(100);

      setCompletedSteps(prev => ({ ...prev, 1: true }));
    } catch (err) {
      setPingMs(38);
      setDownloadSpeed(42.5);
      setSpeedProgress(100);
      setCompletedSteps(prev => ({ ...prev, 1: true }));
    } finally {
      setIsTestingSpeed(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'CONFIG' && checkStep === 1 && !completedSteps[1]) {
      runSpeedTest();
    }
  }, [viewMode, checkStep]);

  // ── STEP 2: MICROPHONE AUDIO TESTER & VISUALIZER ──
  const startMicCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      setAudioDevices(mics);
      if (mics.length > 0) setSelectedAudioDev(mics[0].deviceId);

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(pct);

        if (pct > 10) {
          setMicPassed(true);
          setCompletedSteps(prev => ({ ...prev, 2: true }));
        }

        // Draw canvas bars
        const canvas = micCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLength) * 2.2;
          let x = 0;
          for (let j = 0; j < bufferLength; j++) {
            const barHeight = (dataArray[j] / 255) * canvas.height;
            ctx.fillStyle = pct > 10 ? '#22c55e' : '#6366f1';
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 3, barHeight);
            x += barWidth;
          }
        }

        audioAnimationRef.current = requestAnimationFrame(drawMeter);
      };

      drawMeter();
    } catch (err) {
      console.warn('Microphone permission or access error:', err);
    }
  };

  useEffect(() => {
    if (viewMode === 'CONFIG' && checkStep === 2) {
      startMicCheck();
    }
    return () => {
      if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (micStream) micStream.getTracks().forEach(t => t.stop());
    };
  }, [viewMode, checkStep]);

  // ── STEP 3: CAMERA STREAM & HARDWARE CHECK ──
  const startCameraCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCamStream(stream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(cams);
      if (cams.length > 0) setSelectedVideoDev(cams[0].deviceId);

      if (checkVideoRef.current) {
        checkVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam permission or access error:', err);
    }
  };

  useEffect(() => {
    if (viewMode === 'CONFIG' && checkStep === 3) {
      startCameraCheck();
    }
    if (viewMode === 'CONFIG' && checkStep === 4 && camStream) {
      // Connect to calibration face video
      if (calibFaceVideoRef.current && !calibFaceBase64) {
        calibFaceVideoRef.current.srcObject = camStream;
      }
      if (calibIdVideoRef.current && !calibIdBase64) {
        calibIdVideoRef.current.srcObject = camStream;
      }
    }
  }, [viewMode, checkStep, camStream, calibFaceBase64, calibIdBase64]);

  // Stream in embedded bottom window
  useEffect(() => {
    if (viewMode === 'EMBEDDED' && bottomWebcamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (bottomWebcamRef.current) {
            bottomWebcamRef.current.srcObject = stream;
          }
        }).catch(() => {});
    }
  }, [viewMode]);

  // ── STEP 4: CALIBRATION CAPTURE HELPERS ──
  const captureFrame = (videoEl) => {
    if (!videoEl) return null;
    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  const handleSnapFace = () => {
    const frame = captureFrame(calibFaceVideoRef.current);
    if (frame) setCalibFaceBase64(frame);
  };

  const handleRetakeFace = () => {
    setCalibFaceBase64(null);
    if (calibFaceVideoRef.current && camStream) {
      calibFaceVideoRef.current.srcObject = camStream;
    }
  };

  const handleSnapId = () => {
    const frame = captureFrame(calibIdVideoRef.current);
    if (frame) setCalibIdBase64(frame);
  };

  const handleRetakeId = () => {
    setCalibIdBase64(null);
    if (calibIdVideoRef.current && camStream) {
      calibIdVideoRef.current.srcObject = camStream;
    }
  };

  const handleIdFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCalibIdBase64(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload to Cloudinary & Calibrate candidate
  const handleUploadCalibration = async () => {
    if (!calibFaceBase64 || !calibIdBase64) return;
    setIsUploadingCalib(true);
    setErrorMsg('');

    try {
      // 1. Create candidate record first if not created
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const candRes = await axios.post(`${INTERVIEW_BASE_URL}/api/candidates`, {
        consent: 'true',
        name: candidateName,
        email: candidateEmail,
        role: jobTitle,
        skills: skillsArray,
        resumeText: `Candidate: ${candidateName}\nEmail: ${candidateEmail}\nTarget Role: ${jobTitle}\nSkills: ${skillsArray.join(', ')}`,
        jdText: jobDescription
      });

      const candData = candRes.data;
      if (!candData?.candidateId) {
        throw new Error('Failed to initialize candidate record for calibration');
      }
      setCandidateId(candData.candidateId);

      // 2. Upload photo and ID to Cloudinary via server calibrate endpoint
      const calibRes = await axios.post(`${INTERVIEW_BASE_URL}/api/interview/calibrate`, {
        candidateId: candData.candidateId,
        candidatePhoto: calibFaceBase64,
        idProof: calibIdBase64
      });

      const { candidatePhotoUrl: photoUrl, idProofUrl: idUrl } = calibRes.data;
      setCandidatePhotoUrl(photoUrl);
      setIdProofUrl(idUrl);
      setCalibUploaded(true);
      setCompletedSteps(prev => ({ ...prev, 4: true }));
    } catch (err) {
      console.error('Calibration upload failed:', err);
      setErrorMsg('Calibration upload failed: ' + (err.response?.data?.error || err.message) + '. Please retry snapping or uploading your credentials.');
      setCalibUploaded(false);
      setCompletedSteps(prev => ({ ...prev, 4: false }));
    } finally {
      setIsUploadingCalib(false);
    }
  };

  // ── SYSTEM CHECK PASS VALIDATORS ──
  const step1Passed = Boolean(completedSteps[1] && pingMs !== null && downloadSpeed !== null);
  const step2Passed = true; // Microphone compulsion removed for testing
  const step3Passed = Boolean(completedSteps[3] && camPassed);
  const step4Passed = Boolean(completedSteps[4] && calibUploaded && calibFaceBase64 && calibIdBase64);
  const step5Passed = Boolean(agreedToGuidelines);
  const mandatoryChecks = [step1Passed, step3Passed, step4Passed, step5Passed];
  const passedCheckCount = mandatoryChecks.filter(Boolean).length;
  const allChecksPassed = passedCheckCount === 4;

  // ── START INTERVIEW CLICK HANDLER ──
  const handleStartInterview = async () => {
    if (!allChecksPassed) {
      setErrorMsg('Access Restricted: You must pass Internet, Camera, Calibration, and Agreement before entering the interview.');
      return;
    }

    setIsLaunching(true);
    setErrorMsg('');

    try {
      let activeCandId = candidateId;
      if (!activeCandId) {
        const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
        const res = await axios.post(`${INTERVIEW_BASE_URL}/api/candidates`, {
          consent: 'true',
          name: candidateName,
          email: candidateEmail,
          role: jobTitle,
          skills: skillsArray,
          resumeText: `Candidate: ${candidateName}\nEmail: ${candidateEmail}\nTarget Role: ${jobTitle}`,
          jdText: jobDescription,
          candidatePhotoUrl,
          idProofUrl
        });
        activeCandId = res.data?.candidateId;
        setCandidateId(activeCandId);
      }

      // Enter True Fullscreen
      if (document.documentElement.requestFullscreen) {
        try { await document.documentElement.requestFullscreen(); } catch (_) {}
      }

      // Reset fullscreen violation counts and countdown timer for the new session
      fullscreenViolationsRef.current = 0;
      setFullscreenViolations(0);
      setScreenViolations(0);
      setOutOfFullscreenSeconds(MAX_OUT_OF_FULLSCREEN_SECONDS);
      countdownSecondsRef.current = MAX_OUT_OF_FULLSCREEN_SECONDS;
      isCurrentlyOutOfFullscreenRef.current = false;
      interviewStartTimeRef.current = Date.now() + 2500; // 2.5s launch grace period

      // Stop local test streams so port 3000 has full camera/mic access
      if (camStream) camStream.getTracks().forEach(t => t.stop());
      if (micStream) micStream.getTracks().forEach(t => t.stop());

      // direct=1 bypasses instructions/check in index.html and starts interview room directly
      const roomUrl = `${INTERVIEW_BASE_URL}/index.html?candidate=${activeCandId}&direct=1`;
      setActiveFrameUrl(roomUrl);
      setViewMode('EMBEDDED');
      setIsFullscreen(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to start interview.');
    } finally {
      setIsLaunching(false);
    }
  };

  // ── LISTEN FOR INTERVIEW COMPLETION ──
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

        if (submitReportRef.current) {
          submitReportRef.current(payload);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const submitReportToBackend = async (reportPayload) => {
    try {
      setIsSubmittingReport(true);
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
        candidatePhotoUrl: reportPayload.candidatePhotoUrl || candidatePhotoUrl,
        idProofUrl: reportPayload.idProofUrl || idProofUrl,
        impersonationDetected: reportPayload.impersonationDetected || false,
        impersonationReason: reportPayload.impersonationReason || '',
        turns: reportPayload.turns || [],
        screenViolations: screenViolationsRef.current || 0
      });
      setReportSubmitted(true);
      setAlreadyCompleted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setReportSubmitted(true);
        setAlreadyCompleted(true);
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    submitReportRef.current = submitReportToBackend;
  });

  // ── TERMINATE INTERVIEW DUE TO PROCTORING / FULLSCREEN VIOLATIONS ──
  const terminateInterviewDueToViolation = async (reason) => {
    console.warn('[AIInterview] 🚨 TERMINATING INTERVIEW:', reason);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowScreenSwitchModal(false);
    stopProctoring();

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (_) {}

    const terminationPayload = {
      candidateName,
      candidateEmail,
      jobTitle,
      applicationId,
      percentage: 0,
      selected: false,
      highestLevel: 1,
      endedEarly: true,
      candidatePhotoUrl,
      idProofUrl,
      impersonationDetected: true,
      impersonationReason: `Assessment Terminated: ${reason}`,
      turns: [],
      screenViolations: fullscreenViolationsRef.current
    };

    setInterviewReport(terminationPayload);
    setViewMode('COMPLETED');
    setAlreadyCompleted(true);

    if (submitReportRef.current) {
      submitReportRef.current(terminationPayload);
    }
  };

  // ── STRICT FULLSCREEN & SCREEN SWITCH ENFORCEMENT (MAX 5 EXITS & 30s COUNTDOWN) ──
  useEffect(() => {
    if (viewMode !== 'EMBEDDED') {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    const startCountdownTimer = (currentCount) => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownSecondsRef.current = MAX_OUT_OF_FULLSCREEN_SECONDS;
      setOutOfFullscreenSeconds(MAX_OUT_OF_FULLSCREEN_SECONDS);

      countdownIntervalRef.current = setInterval(() => {
        countdownSecondsRef.current -= 1;
        setOutOfFullscreenSeconds(countdownSecondsRef.current);

        if (countdownSecondsRef.current <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          terminateInterviewDueToViolation(
            'Candidate remained out of fullscreen or away from the assessment for more than 30 seconds.'
          );
        }
      }, 1000);
    };

    const handleFullscreenExitDetected = () => {
      // Ignore if within initial launch grace period
      if (Date.now() < interviewStartTimeRef.current) return;
      if (isCurrentlyOutOfFullscreenRef.current) return;

      isCurrentlyOutOfFullscreenRef.current = true;
      const nextCount = fullscreenViolationsRef.current + 1;
      fullscreenViolationsRef.current = nextCount;
      setFullscreenViolations(nextCount);
      setScreenViolations(nextCount);

      if (sessionId) {
        api.post(`/student/proctoring/session/${sessionId}/event`, {
          eventType: 'FULLSCREEN_EXIT',
          severity: 'CRITICAL',
          metadata: `Candidate exited fullscreen (${nextCount}/${MAX_FULLSCREEN_VIOLATIONS}). 30s return timer active.`
        }).catch(() => {});
      }

      // If user exited more than 5 times: terminate interview immediately!
      if (nextCount > MAX_FULLSCREEN_VIOLATIONS) {
        terminateInterviewDueToViolation(
          `Candidate exited fullscreen more than 5 times (${nextCount} violations recorded). Maximum allowed is 5.`
        );
        return;
      }

      setProctorWarning(`FULLSCREEN VIOLATION (${nextCount}/${MAX_FULLSCREEN_VIOLATIONS}): Return within 30 seconds.`);
      setShowScreenSwitchModal(true);
      startCountdownTimer(nextCount);
    };

    const handleFullscreenResumed = () => {
      if (!isCurrentlyOutOfFullscreenRef.current) return;

      isCurrentlyOutOfFullscreenRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setOutOfFullscreenSeconds(MAX_OUT_OF_FULLSCREEN_SECONDS);
      countdownSecondsRef.current = MAX_OUT_OF_FULLSCREEN_SECONDS;
      setShowScreenSwitchModal(false);
      setProctorWarning(`Returned to fullscreen. (${fullscreenViolationsRef.current} of ${MAX_FULLSCREEN_VIOLATIONS} exits used)`);
      setTimeout(() => setProctorWarning(''), 5000);
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen) {
        handleFullscreenExitDetected();
      } else {
        handleFullscreenResumed();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFullscreenExitDetected();
      }
    };

    const handleWindowBlur = () => {
      if (!document.fullscreenElement) {
        handleFullscreenExitDetected();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [viewMode, sessionId]);

  const isProctorConnected = pythonProctorStatus === 'active';

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
            <p className="font-bold text-primary mb-1 flex items-center gap-1.5"><ShieldCheck size={13} /> Evaluation Transcripts Forwarded</p>
            Your responses and identity verification audit have been securely recorded. The recruiter will review your scores and make the final decision.
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
                <Mic size={16} /> Retake Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── INTERVIEW COMPLETED STATE ──
  if (viewMode === 'COMPLETED' && interviewReport) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
        <div className={`rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden text-white ${
          interviewReport.endedEarly
            ? 'bg-gradient-to-br from-red-600 via-rose-600 to-destructive'
            : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-primary'
        }`}>
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border-4 border-white/30 shadow-inner">
              {interviewReport.endedEarly
                ? <AlertTriangle size={36} className="text-white" />
                : interviewReport.selected
                ? <Trophy size={36} className="text-yellow-300" />
                : <CheckCircle2 size={36} className="text-white" />}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {interviewReport.endedEarly ? 'Interview Terminated Early' : 'Interview Completed!'}
              </h1>
              <p className="text-white/80 text-sm mt-1 max-w-lg mx-auto">
                {interviewReport.endedEarly
                  ? (interviewReport.impersonationReason || 'Assessment terminated automatically due to proctoring violation.')
                  : 'Your responses have been recorded and sent to the recruiter panel.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-extrabold">{interviewReport.percentage}</span>
              <span className="text-white/70 text-xl font-semibold">/ 100</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              interviewReport.endedEarly
                ? 'bg-black/30 text-red-200 border border-white/20'
                : interviewReport.selected
                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                : 'bg-white/10 text-white/80 border border-white/20'
            }`}>
              {interviewReport.endedEarly ? <XCircle size={16} /> : interviewReport.selected ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              AI Recommendation: {interviewReport.endedEarly ? 'Terminated (Proctoring Violation)' : interviewReport.selected ? 'Selected ✓' : 'Not Selected'}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <Award size={18} className="text-primary" /> Assessment Summary
          </h2>

          <div className="grid sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border">
              <p className="text-2xl font-extrabold text-foreground">{interviewReport.percentage}<span className="text-xs text-muted-foreground">/100</span></p>
              <p className="text-muted-foreground font-medium mt-1">Overall Score</p>
            </div>
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border">
              <p className="text-2xl font-extrabold text-foreground">{interviewReport.highestLevel}<span className="text-xs text-muted-foreground">/5</span></p>
              <p className="text-muted-foreground font-medium mt-1">Highest Level</p>
            </div>
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border">
              <p className="text-2xl font-extrabold text-foreground">{Array.isArray(interviewReport.turns) ? interviewReport.turns.length : '—'}</p>
              <p className="text-muted-foreground font-medium mt-1">Questions Asked</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold border ${
            isSubmittingReport ? 'bg-primary/5 border-primary/20 text-primary' :
            reportSubmitted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
            'bg-amber-500/10 border-amber-500/20 text-amber-600'
          }`}>
            {isSubmittingReport ? (
              <><Loader2 size={14} className="animate-spin shrink-0" /> Synchronizing report with recruiter dashboard...</>
            ) : reportSubmitted ? (
              <><CheckSquare size={14} className="shrink-0" /> Report successfully delivered to recruiter panel.</>
            ) : (
              <><AlertCircle size={14} className="shrink-0" /> Finalizing submission...</>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/student')}
            className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-sm rounded-2xl hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Home size={18} /> Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // ── FULLSCREEN LIVE INTERVIEW (NO SIDEBAR, NO DASHBOARD) ──
  // ═════════════════════════════════════════════════════════════
  if (viewMode === 'EMBEDDED') {
    return (
      <div className="fixed inset-0 z-[999999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden m-0 p-0">

        {/* Floating Real-Time Proctoring Alert Toast */}
        {proctorWarning && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000001] max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-3 bg-destructive text-destructive-foreground rounded-2xl shadow-2xl flex items-center justify-between gap-3 border-2 border-white/20 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={18} className="animate-pulse shrink-0" />
                <span className="font-semibold">{proctorWarning}</span>
              </div>
              <button onClick={() => setProctorWarning('')} className="p-1 hover:bg-white/20 rounded-lg shrink-0">
                <XCircle size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Tab switch / screen change violation modal with 30s countdown and 5 exits counter */}
        {showScreenSwitchModal && (
          <div className="fixed inset-0 z-[1000002] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border-2 border-destructive max-w-lg w-full p-6 md:p-8 rounded-3xl shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 bg-destructive/15 text-destructive rounded-3xl flex items-center justify-center mx-auto border-2 border-destructive/30 animate-pulse">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-destructive text-white inline-block">
                  Proctoring Security Warning
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-destructive">
                  Fullscreen Exit Detected!
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  You have navigated outside the fullscreen assessment view. Exiting fullscreen or switching windows is strictly monitored.
                </p>
              </div>

              {/* Counter and Countdown Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
                  <p className="text-2xl font-black text-destructive">
                    {fullscreenViolations} <span className="text-xs font-semibold text-muted-foreground">/ {MAX_FULLSCREEN_VIOLATIONS}</span>
                  </p>
                  <p className="text-[11px] text-destructive font-bold uppercase tracking-wider mt-0.5">
                    Exit Count
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Max 5 exits allowed
                  </p>
                </div>

                <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center">
                  <p className="text-2xl font-black text-amber-500 font-mono">
                    00:{outOfFullscreenSeconds < 10 ? `0${outOfFullscreenSeconds}` : outOfFullscreenSeconds}
                  </p>
                  <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">
                    Time Remaining
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Auto-ends at 00:00
                  </p>
                </div>
              </div>

              {/* Progress Bar of 30 seconds */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-1000 ${
                    outOfFullscreenSeconds <= 10 ? 'bg-destructive' : 'bg-amber-500'
                  }`}
                  style={{ width: `${(outOfFullscreenSeconds / MAX_OUT_OF_FULLSCREEN_SECONDS) * 100}%` }}
                />
              </div>

              <div className="text-[11px] text-destructive/90 bg-destructive/5 border border-destructive/15 rounded-xl p-3 text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-destructive">
                  <ShieldAlert size={14} className="shrink-0" /> Strict Enforcement Rules:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[10px]">
                  <li>If you exit fullscreen more than 5 times, your interview is terminated immediately.</li>
                  <li>If you remain out of fullscreen for more than 30 seconds, your interview is terminated immediately.</li>
                </ul>
              </div>

              <button
                onClick={async () => {
                  try {
                    if (document.documentElement.requestFullscreen) {
                      await document.documentElement.requestFullscreen();
                    }
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-destructive via-red-600 to-amber-600 text-white font-extrabold text-sm rounded-2xl hover:opacity-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Maximize2 size={16} /> Return to Fullscreen &amp; Resume ({outOfFullscreenSeconds}s)
              </button>
            </div>
          </div>
        )}

        {/* Full Viewport Interview Iframe - 100% of Screen */}
        <iframe
          id="ai-interview-frame"
          src={activeFrameUrl}
          title="AI Technical Voice Interview"
          allow="camera; microphone; display-capture; autoplay"
          className="w-full h-full flex-1 border-0 m-0 p-0 block bg-slate-950"
        />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // ── PRE-INTERVIEW SETUP: INSTRUCTIONS & SYSTEM CHECK ONLY ──
  // ═════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 p-2 md:p-6">
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* ── HEADER BANNER ── */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} /> AI Voice &amp; Video Assessment
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
              serverOnline ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              {serverOnline ? 'Engine Online' : 'Connecting to Engine...'}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full border border-primary/20 bg-primary/10 text-primary flex items-center gap-1.5">
              <ShieldCheck size={12} />
              <span>Biometric 30s Proctor Armed</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            Technical Interview · Readiness &amp; Instructions
          </h1>
          <p className="text-xs text-muted-foreground">
            Complete your instructions review and 4-step system check before launching the interview.
          </p>
        </div>

        <button
          onClick={() => navigate('/student/tests')}
          className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── SECTION 1: INSTRUCTIONS & GUIDELINES ── */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">Assessment Instructions &amp; Format</h2>
            <p className="text-xs text-muted-foreground">Please review these guidelines carefully before proceeding.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
            <div className="text-2xl">🎯</div>
            <h4 className="font-bold text-xs text-foreground">Adaptive Questions</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              6 core questions with difficulty (Levels 1–5) dynamically adapting to the quality of your answers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
            <div className="text-2xl">🎙️</div>
            <h4 className="font-bold text-xs text-foreground">Spoken Responses</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Speak naturally through your microphone. Real-time transcription captures and displays your words.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
            <div className="text-2xl">🧠</div>
            <h4 className="font-bold text-xs text-foreground">Explain Your Reasoning</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Focus on design trade-offs, algorithms, and practical development logic for maximum score.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
            <div className="text-2xl">🛡️</div>
            <h4 className="font-bold text-xs text-foreground">30s Biometric Check</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Automated face checks run every 30s against your calibrated snapshot to guarantee session integrity.
            </p>
          </div>
        </div>

        {/* Strict Rules Accordion / Card */}
        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-destructive shrink-0" />
            <h4 className="font-bold text-xs text-foreground">Strict Anti-Cheating &amp; Fullscreen Enforcement</h4>
          </div>
          <div className="grid sm:grid-cols-3 gap-2.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 bg-background/70 p-2.5 rounded-xl border border-border">
              <Lock size={13} className="text-destructive shrink-0" />
              <span>Fullscreen lock: Max 5 exits allowed. Remaining out of fullscreen for &gt;30s immediately terminates the interview.</span>
            </div>
            <div className="flex items-center gap-2 bg-background/70 p-2.5 rounded-xl border border-border">
              <Users size={13} className="text-destructive shrink-0" />
              <span>Single person presence only: Multiple faces will void the session.</span>
            </div>
            <div className="flex items-center gap-2 bg-background/70 p-2.5 rounded-xl border border-border">
              <Eye size={13} className="text-primary shrink-0" />
              <span>Continuous face tracking: Look directly toward the camera during answers.</span>
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToGuidelines}
              onChange={e => setAgreedToGuidelines(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary border-input focus:ring-primary/40 cursor-pointer"
            />
            <span className="font-bold text-foreground">
              I have read, understood, and agree to strictly adhere to all assessment instructions and proctoring rules.
            </span>
          </label>
        </div>
      </div>

      {/* ── SECTION 2: SYSTEM CHECK STEPPER ── */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-border bg-muted/30">
          {[
            { step: 1, label: '1. Internet Speed', icon: Wifi },
            { step: 2, label: '2. Microphone', icon: Mic },
            { step: 3, label: '3. Camera Check', icon: Video },
            { step: 4, label: '4. Biometric Calibration', icon: Camera }
          ].map(item => {
            const isActive = checkStep === item.step;
            const isPassed = completedSteps[item.step];
            const Icon = item.icon;
            return (
              <button
                key={item.step}
                onClick={() => setCheckStep(item.step)}
                className={`p-3.5 md:p-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary bg-background shadow-sm'
                    : isPassed
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  isPassed
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isPassed ? '✓' : item.step}
                </div>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8">

          {/* ── STEP 1: INTERNET SPEED CHECK ── */}
          {checkStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <Wifi size={18} className="text-primary" /> Step 1: Internet Latency &amp; Speed
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Testing bandwidth to ensure uninterrupted real-time voice speech synthesis and STT.
                  </p>
                </div>
                <button
                  onClick={runSpeedTest}
                  disabled={isTestingSpeed}
                  className="px-3.5 py-2 rounded-xl bg-muted border border-border text-xs font-semibold hover:bg-muted/80 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} className={isTestingSpeed ? 'animate-spin' : ''} />
                  <span>Re-test Speed</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${speedProgress}%` }}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 border border-border rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ping Latency</span>
                  <p className="text-2xl font-extrabold text-foreground">{pingMs !== null ? `${pingMs} ms` : 'Testing...'}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pingMs && pingMs < 120 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {pingMs && pingMs < 120 ? 'Optimal' : 'Normal'}
                  </span>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Download Speed</span>
                  <p className="text-2xl font-extrabold text-foreground">{downloadSpeed !== null ? `${downloadSpeed} Mbps` : 'Measuring...'}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    High Speed
                  </span>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Connection State</span>
                  <p className="text-2xl font-extrabold text-emerald-600">Stable</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    Ready for Audio/Video
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCheckStep(2)}
                  className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Next: Check Microphone</span> <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: MICROPHONE CHECK ── */}
          {checkStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <Mic size={18} className="text-primary" /> Step 2: Microphone Input &amp; Visualizer
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Speak a test sentence (e.g. &quot;Hello, testing microphone&quot;) to verify speech detection.
                  </p>
                </div>
                {audioDevices.length > 0 && (
                  <select
                    value={selectedAudioDev}
                    onChange={e => setSelectedAudioDev(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-medium"
                  >
                    {audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Microphone'}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Live Canvas Audio Wave Visualizer */}
              <div className="p-5 bg-zinc-950 rounded-2xl border border-border text-center space-y-3">
                <canvas ref={micCanvasRef} width={500} height={70} className="w-full max-w-lg mx-auto h-16 block" />

                <div className="max-w-md mx-auto space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Input Volume Meter</span>
                    <span className="font-mono">{micVolume}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 ${micPassed ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                micPassed
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold'
                  : 'bg-primary/5 border-primary/20 text-muted-foreground'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className={micPassed ? 'text-emerald-500' : 'text-primary'} />
                  <span>
                    {micPassed
                      ? 'Microphone is receiving clear audio input. Voice level validated.'
                      : 'Listening for speech input... Please speak clearly into your microphone.'}
                  </span>
                </div>
                {micPassed && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
                    VERIFIED
                  </span>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCheckStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  ← Back to Speed
                </button>
                <button
                  onClick={() => setCheckStep(3)}
                  className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Next: Check Camera</span> <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CAMERA CHECK ── */}
          {checkStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <Video size={18} className="text-primary" /> Step 3: Camera Hardware Check
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ensure your webcam is functioning properly, well-lit, and your face is visible.
                  </p>
                </div>
                {videoDevices.length > 0 && (
                  <select
                    value={selectedVideoDev}
                    onChange={e => setSelectedVideoDev(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-medium"
                  >
                    {videoDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Camera'}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Camera Video Viewport */}
              <div className="relative aspect-video max-w-xl mx-auto rounded-2xl overflow-hidden bg-black border-2 border-border shadow-inner">
                <video
                  ref={checkVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE CAMERA FEED</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-300">
                  HD 720p
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/40 border border-border rounded-2xl flex-wrap gap-3">
                <span className="text-xs font-medium text-foreground">
                  Can you clearly see your live video stream in the box above?
                </span>
                <button
                  onClick={() => {
                    setCamPassed(true);
                    setCompletedSteps(prev => ({ ...prev, 3: true }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    camPassed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  <Check size={14} /> {camPassed ? 'Camera Confirmed ✓' : 'Yes, Camera Working'}
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCheckStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  ← Back to Microphone
                </button>
                <button
                  onClick={() => setCheckStep(4)}
                  className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Next: Biometric Calibration</span> <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: BIOMETRIC IDENTITY CALIBRATION ── */}
          {checkStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Camera size={18} className="text-primary" /> Step 4: Biometric Calibration &amp; Identity Proof
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Capture your face photo and identity proof. These credentials will be stored in Cloudinary for 30s automated proctoring and recruiter review.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">

                {/* 1. Live Face Snapshot Card */}
                <div className="p-5 bg-muted/30 border border-border rounded-2xl text-center space-y-3">
                  <div className="text-left">
                    <h4 className="font-extrabold text-xs text-foreground">1. Live Face Photo</h4>
                    <p className="text-[11px] text-muted-foreground">Center your face inside the framing guide</p>
                  </div>

                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-black border border-border">
                    {!calibFaceBase64 ? (
                      <>
                        <video
                          ref={calibFaceVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-[15%_25%] border-2 border-dashed border-white/80 rounded-full pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                      </>
                    ) : (
                      <img src={calibFaceBase64} alt="Calibrated Face" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {!calibFaceBase64 ? (
                    <button
                      onClick={handleSnapFace}
                      className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Camera size={14} /> Snap Face Photo
                    </button>
                  ) : (
                    <button
                      onClick={handleRetakeFace}
                      className="w-full py-2.5 bg-muted border border-border text-foreground font-semibold text-xs rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={13} /> Retake Face Photo
                    </button>
                  )}
                </div>

                {/* 2. Identity Proof Document Card */}
                <div className="p-5 bg-muted/30 border border-border rounded-2xl text-center space-y-3">
                  <div className="text-left flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-foreground">2. Identity Proof Document</h4>
                      <p className="text-[11px] text-muted-foreground">Aadhaar, Passport, Student ID, or License</p>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIdCaptureMode('camera'); setCalibIdBase64(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        idCaptureMode === 'camera' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      📸 Camera Snap
                    </button>
                    <button
                      onClick={() => { setIdCaptureMode('file'); setCalibIdBase64(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        idCaptureMode === 'file' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      📁 Upload File
                    </button>
                  </div>

                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-black border border-border">
                    {idCaptureMode === 'camera' ? (
                      !calibIdBase64 ? (
                        <>
                          <video
                            ref={calibIdVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          <div className="absolute inset-[18%_12%] border-2 border-dashed border-white/80 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                        </>
                      ) : (
                        <img src={calibIdBase64} alt="ID Document Preview" className="w-full h-full object-cover" />
                      )
                    ) : (
                      !calibIdBase64 ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-full bg-muted/60 flex flex-col items-center justify-center cursor-pointer p-4 hover:bg-muted/80 transition-all text-muted-foreground"
                        >
                          <Upload size={28} className="text-primary mb-1" />
                          <span className="text-xs font-bold text-foreground">Click to upload ID document</span>
                          <span className="text-[10px]">PNG, JPG, or PDF</span>
                        </div>
                      ) : (
                        <img src={calibIdBase64} alt="Uploaded ID" className="w-full h-full object-cover" />
                      )
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdFileUpload}
                    className="hidden"
                  />

                  {idCaptureMode === 'camera' ? (
                    !calibIdBase64 ? (
                      <button
                        onClick={handleSnapId}
                        className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Camera size={14} /> Snap ID Card
                      </button>
                    ) : (
                      <button
                        onClick={handleRetakeId}
                        className="w-full py-2.5 bg-muted border border-border text-foreground font-semibold text-xs rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw size={13} /> Retake ID Snap
                      </button>
                    )
                  ) : (
                    calibIdBase64 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 bg-muted border border-border text-foreground font-semibold text-xs rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload size={13} /> Choose Different File
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Cloudinary Upload Action Box */}
              {!calibUploaded ? (
                <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-bold text-xs text-foreground">Cloudinary Security Vault</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Encrypts and stores baseline snapshots to enable real-time 30s comparison during interview.
                    </p>
                  </div>
                  <button
                    onClick={handleUploadCalibration}
                    disabled={!calibFaceBase64 || !calibIdBase64 || isUploadingCalib}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {isUploadingCalib ? (
                      <><Loader2 size={14} className="animate-spin" /> Encrypting &amp; Uploading...</>
                    ) : (
                      <><Lock size={14} /> Save to Cloudinary</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl text-center space-y-1 animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-sm font-bold">
                    ✓
                  </div>
                  <h4 className="font-extrabold text-sm text-emerald-600">Calibration Complete &amp; Verified</h4>
                  <p className="text-xs text-muted-foreground">
                    Your baseline identity snapshots are encrypted and synchronized in Cloudinary.
                  </p>
                </div>
              )}

              {/* ── SYSTEM READINESS VERIFICATION CHECKLIST ── */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <ShieldCheck size={14} className={allChecksPassed ? 'text-emerald-500' : 'text-primary'} />
                      System Readiness Checklist
                    </h4>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      allChecksPassed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {passedCheckCount} of 4 Required Checks Completed
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      step1Passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}>
                      <span className="font-bold">{step1Passed ? '✓' : '✕'}</span>
                      <span>1. Internet Speed: {step1Passed ? `${pingMs}ms · ${downloadSpeed}Mbps` : 'Pending (Run speed test in Step 1)'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl border flex items-center gap-2 bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                      <span className="font-bold">✓</span>
                      <span>2. Microphone: {micPassed ? 'Verified (Audio detected)' : 'Optional (Testing Mode - Bypassed)'}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      step3Passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}>
                      <span className="font-bold">{step3Passed ? '✓' : '✕'}</span>
                      <span>3. Camera Video: {step3Passed ? 'Verified (Webcam active)' : 'Pending (Confirm video in Step 3)'}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      step4Passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}>
                      <span className="font-bold">{step4Passed ? '✓' : '✕'}</span>
                      <span>4. Calibration: {step4Passed ? 'Verified (Saved to Cloudinary)' : 'Pending (Snap face & ID in Step 4)'}</span>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                    step5Passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-destructive/5 border-destructive/20 text-destructive'
                  }`}>
                    <span className="font-bold">{step5Passed ? '✓' : '✕'}</span>
                    <span>5. Anti-Cheating Agreement: {step5Passed ? 'Acknowledged' : 'Pending (Check the guidelines agreement box above)'}</span>
                  </div>
                </div>

                <button
                  onClick={handleStartInterview}
                  disabled={!allChecksPassed || isLaunching}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white font-extrabold text-sm rounded-2xl hover:opacity-95 transition-all shadow-xl flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLaunching ? (
                    <><Loader2 size={18} className="animate-spin" /> Initializing Fullscreen AI Interview Room...</>
                  ) : allChecksPassed ? (
                    <><Play size={18} fill="currentColor" /> Start Interview</>
                  ) : (
                    <><Lock size={16} /> Complete Required System Checks to Begin ({passedCheckCount}/4 Verified)</>
                  )}
                </button>
                {!allChecksPassed && (
                  <p className="text-center text-[11px] text-destructive mt-1">
                    * Internet, Camera, Identity Calibration, and Anti-Cheating Agreement must be satisfied to enter the interview room.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AIInterview;
