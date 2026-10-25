import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { CURATED_JOBS } from '../constants/jobsData';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Briefcase,
  Clock,
  X,
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  Send,
  Users,
  Globe,
  FileText,
  Lock,
  Heart
} from 'lucide-react';

const fmtSalary = (min, max, currency = '$') => {
  if (!min && !max) return 'Competitive';
  const curr = currency || '$';
  const fmt = n => (n >= 100000 ? `${(n / 1000).toFixed(0)}k` : `${(n / 1000).toFixed(0)}k`);
  if (min && max) return `${curr}${fmt(min)} – ${curr}${fmt(max)}`;
  if (min) return `${curr}${fmt(min)}+`;
  return `Up to ${curr}${fmt(max)}`;
};

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

// Safe helper to parse responsibilities or requirements whether string or array
const parseList = (content) => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === 'string') {
    return content
      .split('\n')
      .map(s => s.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean);
  }
  return [];
};

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Application modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Saved bookmark state
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hiresense_saved_jobs') || '[]');
      return saved.includes(id);
    } catch {
      return false;
    }
  });

  const toggleBookmark = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('hiresense_saved_jobs') || '[]');
      let next;
      if (saved.includes(id)) {
        next = saved.filter(jobId => jobId !== id);
        setIsSaved(false);
      } else {
        next = [...saved, id];
        setIsSaved(true);
      }
      localStorage.setItem('hiresense_saved_jobs', JSON.stringify(next));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const fetchJob = useCallback(() => {
    setLoading(true);
    api
      .get(`/student/jobs/${id}`)
      .then((res) => {
        setJob(res.data);
        setError('');
      })
      .catch((err) => {
        const fallback = CURATED_JOBS.find((j) => j.id === id);
        if (fallback) {
          setJob(fallback);
          setError('');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch job details');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      // If it's a database job, submit application via API
      if (!id.startsWith('curated-')) {
        await api.post(`/student/jobs/${id}/apply`, { coverLetter });
      }
      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
        setCoverLetter('');
        setJob(prev => (prev ? { ...prev, hasApplied: true, applicationStatus: 'APPLIED' } : prev));
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-16">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading position details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 pt-24">
        <div className="container mx-auto max-w-md text-center space-y-4 bg-card border border-border p-8 rounded-3xl shadow-sm">
          <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold">Position Not Found</h2>
          <p className="text-xs text-muted-foreground">{error || 'This job posting may have expired or been filled.'}</p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Job Directory
          </Link>
        </div>
      </div>
    );
  }

  const companyName = job.recruiter?.companyName || 'Confidential Enterprise';
  const logoInitial = companyName.charAt(0).toUpperCase();
  const salaryStr = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const hasLogo = Boolean(job.recruiter?.companyLogo && !logoFailed);

  const responsibilitiesList = parseList(job.responsibilities);
  const requirementsList = parseList(job.requirements);
  const benefitsList = parseList(job.benefits);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-28 sm:pb-20 selection:bg-primary/20 selection:text-primary">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">

        {/* ────────────────────────────────────────────────────────── */}
        {/* 1. TOP NAV & BREADCRUMB STRIP */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Job Board
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs"
            >
              {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
              {copiedLink ? 'Link Copied!' : 'Share'}
            </button>

            <button
              onClick={toggleBookmark}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs"
            >
              {isSaved ? <BookmarkCheck size={14} className="text-primary fill-primary" /> : <Bookmark size={14} />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 2. MAIN HERO BANNER CARD */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm mb-8 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
              {/* Company Logo / Monogram */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 text-primary font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                {hasLogo ? (
                  <img
                    src={job.recruiter.companyLogo}
                    alt={companyName}
                    className="w-full h-full object-cover"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span>{logoInitial}</span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                    {job.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                  <span className="text-foreground font-semibold flex items-center gap-1">
                    <Building2 size={15} className="text-muted-foreground" />
                    {companyName}
                  </span>
                  <span>•</span>
                  <span>{job.department || 'Engineering'}</span>
                  <span>•</span>
                  <span>{job.location} {job.isRemote && '(Remote)'}</span>
                </div>
              </div>
            </div>

            {/* CTA on desktop */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {job.hasApplied ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  Applied · {job.applicationStatus || 'Under Review'}
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-8 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  Apply with HireSense Profile
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Attribute Strip */}
          <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border">
              <span className="text-muted-foreground block text-[11px] mb-1">Target Compensation</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <DollarSign size={15} />
                {salaryStr}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border">
              <span className="text-muted-foreground block text-[11px] mb-1">Workplace Model</span>
              <span className="font-bold text-sm text-foreground flex items-center gap-1">
                <MapPin size={15} className="text-muted-foreground" />
                {job.isRemote ? 'Remote First' : job.location}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border">
              <span className="text-muted-foreground block text-[11px] mb-1">Experience Level</span>
              <span className="font-bold text-sm text-foreground flex items-center gap-1">
                <Award size={15} className="text-muted-foreground" />
                {job.experienceLevel || 'Mid-Senior Level'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border">
              <span className="text-muted-foreground block text-[11px] mb-1">Date Posted</span>
              <span className="font-bold text-sm text-foreground flex items-center gap-1">
                <Clock size={15} className="text-muted-foreground" />
                {fmtDate(job.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 3. TWO-COLUMN RESPONSIVE LAYOUT */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Deep Job Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Aptitude & AI Screen Notice */}
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3.5">
              <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <strong className="text-foreground block font-bold mb-0.5">
                  Direct AI Interview Assessment Pipeline
                </strong>
                <p className="text-muted-foreground leading-relaxed">
                  Applicants for this role receive an automated candidate assessment link. The evaluation includes resume verification, conversational AI screening, and an interactive coding sandbox.
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Position Overview
              </h2>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                {job.description ||
                  'We are seeking an experienced technical professional to contribute to our mission-critical engineering initiatives. You will work alongside a collaborative team of architects and product designers to solve complex computational and operational challenges.'}
              </p>
            </div>

            {/* Responsibilities */}
            {responsibilitiesList.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  Key Responsibilities
                </h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {responsibilitiesList.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                      <span className="leading-relaxed text-foreground/90">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {requirementsList.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  Qualifications & Experience
                </h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {requirementsList.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      <span className="leading-relaxed text-foreground/90">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Skills Matrix */}
            {job.skills?.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers size={20} className="text-primary" />
                  Technologies & Competencies
                </h2>
                <div className="flex flex-wrap gap-2 pt-1">
                  {job.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits & Perks */}
            {benefitsList.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  Compensation & Perks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {benefitsList.map((b, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-start gap-2.5">
                      <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-foreground/90 font-medium leading-snug">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4-Step Autonomous AI Hiring Process */}
            <div className="p-6 sm:p-8 rounded-3xl bg-muted/30 border border-border shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Fast-Track Hiring Timeline</h3>
                  <p className="text-xs text-muted-foreground">What to expect after submitting your application</p>
                </div>
                <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  48-Hr Average Decision
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { step: '01', title: 'Resume Review', desc: 'Instant alignment check with claimed skills' },
                  { step: '02', title: 'AI Voice Screen', desc: '20-min interactive technical conversation' },
                  { step: '03', title: 'Coding Sandbox', desc: 'Hands-on proctored engineering challenge' },
                  { step: '04', title: 'Final Team Meet', desc: 'Direct offer alignment with engineering leadership' },
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-card border border-border text-center sm:text-left">
                    <span className="font-mono text-xs font-bold text-primary">{s.step}</span>
                    <h4 className="font-bold text-xs mt-1 mb-0.5">{s.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Quick Action Card */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-base">Application Summary</h3>

              <div className="space-y-3 text-xs border-y border-border py-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-semibold text-foreground">{companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Employment:</span>
                  <span className="font-semibold text-foreground">{job.employmentType || 'Full-time'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-semibold text-foreground">{job.isRemote ? 'Remote First' : job.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Compensation:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{salaryStr}</span>
                </div>
              </div>

              {job.hasApplied ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Application Submitted
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Apply with HireSense Profile
                  <ChevronRight size={15} />
                </button>
              )}

              <button
                onClick={toggleBookmark}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-muted font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                {isSaved ? <BookmarkCheck size={15} className="text-primary fill-primary" /> : <Bookmark size={15} />}
                {isSaved ? 'Saved in My Bookmarks' : 'Save Position'}
              </button>
            </div>

            {/* Company About Card */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center shrink-0">
                  {logoInitial}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{companyName}</h4>
                  <p className="text-xs text-muted-foreground">{job.recruiter?.industry || 'Technology & Engineering'}</p>
                </div>
              </div>

              {job.recruiter?.about && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {job.recruiter.about}
                </p>
              )}

              <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                {job.recruiter?.companySize && (
                  <div className="flex justify-between">
                    <span>Company Size:</span>
                    <span className="font-semibold text-foreground">{job.recruiter.companySize}</span>
                  </div>
                )}
                {job.recruiter?.fundingStage && (
                  <div className="flex justify-between">
                    <span>Stage:</span>
                    <span className="font-semibold text-foreground">{job.recruiter.fundingStage}</span>
                  </div>
                )}
              </div>

              {job.recruiter?.website && (
                <a
                  href={job.recruiter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <Globe size={14} /> Visit Company Portal
                  <ExternalLink size={12} className="text-muted-foreground" />
                </a>
              )}
            </div>

            {/* Verified Candidate Protection Guarantee */}
            <div className="p-5 rounded-2xl bg-muted/20 border border-border text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck size={16} className="text-emerald-500" />
                Verified Employer Guarantee
              </div>
              <p className="leading-relaxed">
                All roles on HireSense have verified compensation and active hiring budgets. Zero candidate ghosting or outdated vacancy listings.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. FIXED MOBILE BOTTOM CTA BAR */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3.5 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[11px] text-muted-foreground block">Salary</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{salaryStr}</span>
        </div>

        {job.hasApplied ? (
          <div className="px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Applied
          </div>
        ) : (
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            Apply Now
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. APPLY COVER LETTER & SUBMISSION MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">Apply for {job.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send application directly to {companyName}
                  </p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              {applySuccess ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-lg font-bold">Application Submitted!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    The recruiter has received your candidate profile. Check your Candidate Dashboard for AI interview and test links.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply}>
                  <div className="p-6 space-y-4 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <span className="font-semibold text-foreground block mb-0.5">Profile & Resume Sync</span>
                      <p className="text-xs text-muted-foreground">
                        Your HireSense profile, verified skill credentials, and saved resume details will be automatically attached to this submission.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1.5 text-foreground text-xs">
                        Cover Note or Project Highlights (Optional)
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Highlight specific achievements, systems you've built, or why you're excited about this role..."
                        className="w-full px-3.5 py-3 rounded-xl bg-background border border-input text-xs focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed"
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={applying}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {applying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          Confirm & Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default JobDetails;
