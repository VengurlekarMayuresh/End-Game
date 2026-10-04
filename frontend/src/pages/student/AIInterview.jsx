import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  Mic, MicOff, Volume2, Sparkles, AlertCircle, ArrowLeft, RefreshCw,
  CheckCircle2, Play, Send, Bot, User, Clock, Award, ShieldCheck,
  Video, Eye, FileText, ChevronRight, CheckCheck, Loader2, ExternalLink,
  Download, Sparkle, Laptop, Settings, ArrowUpRight
} from 'lucide-react';

const INTERVIEW_BASE_URL = 'http://localhost:3000';

const AIInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mode: 'EMBEDDED' (Interactive Web Canvas) vs 'CONFIG' (Candidate Details & Launch)
  const [viewMode, setViewMode] = useState('CONFIG');
  const [serverOnline, setServerOnline] = useState(null); // null = checking, true = online, false = offline
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

  // Hardware / Webcam preview
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [micActive, setMicActive] = useState(false);

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

  // 2. Initialize Hardware Webcam Preview
  useEffect(() => {
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

    if (viewMode === 'CONFIG') {
      enableWebcam();
    }

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
      }
    };
  }, [viewMode]);

  // 3. Quick Launch Candidate Session directly into the AI Interview Room
  const handleDirectLaunch = async () => {
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

  // 4. Open Document Intake (for PDF/DOCX resume file upload)
  const handleOpenIntake = () => {
    setActiveFrameUrl(`${INTERVIEW_BASE_URL}/intake.html`);
    setViewMode('EMBEDDED');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 p-4 lg:p-6">
      
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
              {serverOnline ? `AI Engine Online (Port 3000 · ${serverMeta?.gen || 'Active'})` : 'Connecting to AI Engine (Port 3000)...'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Conversational AI Technical Evaluation & Voice Room
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
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
              onClick={() => setViewMode('EMBEDDED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'EMBEDDED' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🖥️ Live Canvas Studio
            </button>
          </div>

          <a
            href={activeFrameUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            title="Open in dedicated full browser window"
          >
            <ExternalLink size={13} /> New Window
          </a>

          <button
            onClick={() => navigate('/student/tests')}
            className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── EMBEDDED IFRAME MODE ── */}
      {viewMode === 'EMBEDDED' ? (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg space-y-0">
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenIntake()}
                className="px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
              >
                <FileText size={13} /> Resume Intake
              </button>
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

          <div className="relative min-h-[820px] w-full bg-slate-950">
            <iframe
              id="ai-interview-frame"
              src={activeFrameUrl}
              title="HireSense AI Voice Interview"
              allow="camera; microphone; display-capture; autoplay"
              className="w-full h-[820px] border-0"
            />
          </div>
        </div>
      ) : (

        /* ── CONFIG & SETUP MODE ── */
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Candidate Camera & Hardware Verification */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <Video size={18} className="text-primary" /> Camera & Hardware Check
              </h3>
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-border flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-white flex items-center gap-1.5 font-medium">
                  <span className={`w-2 h-2 rounded-full ${mediaStream ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {mediaStream ? 'Webcam Live' : 'Camera Off'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
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

              <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2 text-xs text-muted-foreground">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" /> Assessment Integrity
                </p>
                <p className="text-[11px] leading-relaxed">
                  Questions adapt dynamically from Level 1 (Fundamentals) to Level 5 (Internals & System Architecture). Answers are transcribed in real-time.
                </p>
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
                  The AI interviewer will adaptively tailor question topics based on your specified skillset and target requisition.
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

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  onClick={handleDirectLaunch}
                  disabled={isLaunching || !serverOnline}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white font-extrabold text-sm rounded-2xl hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
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

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Or upload resume</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  onClick={handleOpenIntake}
                  className="w-full py-3 bg-secondary/80 hover:bg-secondary text-secondary-foreground font-bold text-xs rounded-xl transition-all border border-border flex items-center justify-center gap-2"
                >
                  <FileText size={15} /> Open Resume & JD Intake Studio (PDF / DOCX Upload)
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
      )}
    </div>
  );
};

export default AIInterview;
