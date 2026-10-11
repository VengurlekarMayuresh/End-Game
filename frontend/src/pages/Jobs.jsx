import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { CURATED_JOBS } from '../constants/jobsData';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  Share2,
  Check,
  Flame,
  Award,
  Globe,
  SlidersHorizontal,
  RotateCcw,
  Layers,
  Cpu,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const fmtSalary = (min, max, currency = '$') => {
  if (!min && !max) return 'Competitive';
  const curr = currency || '$';
  const fmt = n => (n >= 100000 ? `${(n / 1000).toFixed(0)}k` : `${(n / 1000).toFixed(0)}k`);
  if (min && max) return `${curr}${fmt(min)} – ${curr}${fmt(max)}`;
  if (min) return `${curr}${fmt(min)}+`;
  return `Up to ${curr}${fmt(max)}`;
};

const Jobs = () => {
  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [experienceFilter, setExperienceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('match'); // 'match', 'salary', 'recent'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'saved'

  // Saved / bookmarked jobs in localStorage
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      const saved = localStorage.getItem('hiresense_saved_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quick view drawer state
  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Email alert subscription state
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubscribed, setAlertSubscribed] = useState(false);

  // Fetch real jobs from backend
  useEffect(() => {
    setLoading(true);
    api.get('/student/jobs')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDbJobs(res.data);
        }
      })
      .catch(() => {
        // Fall back gracefully to curated jobs
      })
      .finally(() => setLoading(false));
  }, []);

  // Persist saved jobs
  const toggleSaveJob = (jobId, e) => {
    if (e) e.stopPropagation();
    setSavedJobIds(prev => {
      const next = prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId];
      try {
        localStorage.setItem('hiresense_saved_jobs', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Combine real DB jobs with curated benchmark jobs
  const allAvailableJobs = useMemo(() => {
    const dbFormatted = dbJobs.map(j => ({
      ...j,
      isFromDb: true,
      matchScore: j.matchScore || 95,
      isFeatured: true,
      department: j.department || 'Engineering',
      experienceLevel: j.experienceLevel || 'Mid-Senior'
    }));

    // Avoid duplicates if DB has matching IDs
    const existingIds = new Set(dbFormatted.map(j => j.id));
    const curatedFiltered = CURATED_JOBS.filter(j => !existingIds.has(j.id));

    return [...dbFormatted, ...curatedFiltered];
  }, [dbJobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = allAvailableJobs;

    // Filter by saved tab
    if (activeTab === 'saved') {
      result = result.filter(j => savedJobIds.includes(j.id));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(job => {
        const titleMatch = job.title?.toLowerCase().includes(q);
        const compMatch = (job.recruiter?.companyName || '').toLowerCase().includes(q);
        const skillsMatch = job.skills?.some(s => s.toLowerCase().includes(q));
        const descMatch = (job.description || '').toLowerCase().includes(q);
        return titleMatch || compMatch || skillsMatch || descMatch;
      });
    }

    // Location query
    if (locationQuery.trim()) {
      const l = locationQuery.toLowerCase().trim();
      result = result.filter(job => {
        const loc = (job.location || '').toLowerCase();
        return loc.includes(l) || (l.includes('remote') && job.isRemote);
      });
    }

    // Remote only toggle
    if (remoteOnly) {
      result = result.filter(job => job.isRemote);
    }

    // Experience filter
    if (experienceFilter !== 'ALL') {
      result = result.filter(job => {
        const exp = (job.experienceLevel || '').toLowerCase();
        if (experienceFilter === 'ENTRY') return exp.includes('junior') || exp.includes('entry') || exp.includes('1-');
        if (experienceFilter === 'MID') return exp.includes('mid') || exp.includes('2-') || exp.includes('3-');
        if (experienceFilter === 'SENIOR') return exp.includes('senior') || exp.includes('4-') || exp.includes('5-');
        if (experienceFilter === 'LEAD') return exp.includes('lead') || exp.includes('staff') || exp.includes('principal');
        return true;
      });
    }

    // Category / Domain filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(job => {
        const title = (job.title || '').toLowerCase();
        const skills = (job.skills || []).map(s => s.toLowerCase());
        if (selectedCategory === 'FULLSTACK') {
          return title.includes('full') || skills.includes('react') || skills.includes('node');
        }
        if (selectedCategory === 'BACKEND') {
          return title.includes('backend') || skills.includes('go') || skills.includes('kafka') || skills.includes('postgres');
        }
        if (selectedCategory === 'AI_ML') {
          return title.includes('machine learning') || title.includes('ai') || skills.includes('pytorch') || skills.includes('python');
        }
        if (selectedCategory === 'DEVOPS') {
          return title.includes('devops') || title.includes('cloud') || title.includes('security') || skills.includes('kubernetes');
        }
        if (selectedCategory === 'FRONTEND') {
          return title.includes('frontend') || skills.includes('webgl') || skills.includes('three.js') || skills.includes('css');
        }
        return true;
      });
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'match') {
        return (b.matchScore || 90) - (a.matchScore || 90);
      }
      if (sortBy === 'salary') {
        const maxA = a.salaryMax || a.salaryMin || 0;
        const maxB = b.salaryMax || b.salaryMin || 0;
        return maxB - maxA;
      }
      if (sortBy === 'recent') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [allAvailableJobs, searchQuery, locationQuery, remoteOnly, experienceFilter, selectedCategory, sortBy, activeTab, savedJobIds]);

  const resetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedCategory('ALL');
    setRemoteOnly(false);
    setExperienceFilter('ALL');
    setSortBy('match');
  };

  const handleCopyJobLink = (job) => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubscribeAlerts = (e) => {
    e.preventDefault();
    if (alertEmail) {
      setAlertSubscribed(true);
      setTimeout(() => {
        setAlertEmail('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 pt-20 selection:bg-primary/20 selection:text-primary">
      <div className="container mx-auto max-w-7xl">
        
        {/* ────────────────────────────────────────────────────────── */}
        {/* 1. HEADER & SEARCH HERO */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs font-semibold mb-4 text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <Sparkles size={14} className="text-primary" />
            Direct AI Interviews & Verified Compensation
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Find High-Impact Technical Roles
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Search verified engineering positions with transparent salary bands, AI match benchmarking, and direct recruiter interviews.
          </p>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 2. SEARCH & FILTER CONTAINER */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Keyword Search */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Job title, skills (React, Go, Python...), or company"
                className="w-full pl-10 pr-9 py-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Location Search */}
            <div className="md:col-span-4 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Location (San Francisco, New York, Remote...)"
                className="w-full pl-10 pr-9 py-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
              />
              {locationQuery && (
                <button
                  onClick={() => setLocationQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Experience Dropdown */}
            <div className="md:col-span-3">
              <select
                value={experienceFilter}
                onChange={e => setExperienceFilter(e.target.value)}
                className="w-full py-3 px-3.5 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none text-sm cursor-pointer"
              >
                <option value="ALL">All Experience Levels</option>
                <option value="ENTRY">Entry / Junior (0-2 yrs)</option>
                <option value="MID">Mid-Level (2-4 yrs)</option>
                <option value="SENIOR">Senior (4-7 yrs)</option>
                <option value="LEAD">Staff / Lead (7+ yrs)</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Pills Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">Category:</span>
              {[
                { id: 'ALL', label: 'All Disciplines' },
                { id: 'FULLSTACK', label: 'Full-Stack' },
                { id: 'BACKEND', label: 'Backend & Systems' },
                { id: 'AI_ML', label: 'AI / ML' },
                { id: 'DEVOPS', label: 'DevOps & SRE' },
                { id: 'FRONTEND', label: 'Frontend & 3D' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  remoteOnly
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                    : 'bg-muted/60 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <Globe size={13} />
                Remote Only
              </button>
            </div>

            {(searchQuery || locationQuery || remoteOnly || experienceFilter !== 'ALL' || selectedCategory !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors ml-auto"
              >
                <RotateCcw size={13} />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 3. TABS, COUNT & SORTING CONTROLS */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Tabs: All vs Saved */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Open Roles ({allAvailableJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark size={13} className={savedJobIds.length ? 'text-primary fill-primary' : ''} />
              Saved Roles ({savedJobIds.length})
            </button>
          </div>

          {/* Results count & Sort dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Showing <strong className="text-foreground">{filteredJobs.length}</strong> matching positions
            </span>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-1.5 text-xs">
              <SlidersHorizontal size={13} className="text-muted-foreground" />
              <span className="text-muted-foreground hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="salary">Highest Compensation</option>
              </select>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 4. JOB LISTINGS GRID */}
        {/* ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-card/60 border border-border rounded-2xl animate-pulse p-6" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-3xl p-14 text-center max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} />
            </div>
            <h3 className="font-bold text-xl mb-2">No matching positions found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              {activeTab === 'saved'
                ? 'You have not saved any jobs yet. Bookmark roles from the "All Open Roles" tab to review them here.'
                : 'Try adjusting your search criteria, clearing selected categories, or broadening your location keywords.'}
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const companyName = job.recruiter?.companyName || 'Confidential Enterprise';
              const logoInitial = companyName.charAt(0);
              const salaryStr = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
              const isSaved = savedJobIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobForModal(job)}
                  className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    
                    {/* Company Initial / Logo Badge */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                      {job.recruiter?.companyLogo ? (
                        <img
                          src={job.recruiter.companyLogo}
                          alt={companyName}
                          className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 text-primary font-black text-2xl flex items-center justify-center shrink-0 shadow-xs">
                          {logoInitial}
                        </div>
                      )}

                      {/* Mobile Save Bookmark Button */}
                      <button
                        onClick={(e) => toggleSaveJob(job.id, e)}
                        className="md:hidden p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                      >
                        {isSaved ? <BookmarkCheck size={18} className="text-primary fill-primary" /> : <Bookmark size={18} />}
                      </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors tracking-tight">
                              {job.title}
                            </h3>
                            {job.isUrgent && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <Flame size={12} /> Urgent Hire
                              </span>
                            )}
                            {job.isFeatured && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Verified Role
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="text-foreground font-semibold flex items-center gap-1">
                              <Building2 size={14} className="text-muted-foreground" />
                              {companyName}
                            </span>
                            <span>•</span>
                            <span>{job.department || 'Engineering'}</span>
                            {job.recruiter?.industry && (
                              <>
                                <span>•</span>
                                <span className="hidden sm:inline">{job.recruiter.industry}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Desktop Save Bookmark */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <button
                            onClick={(e) => toggleSaveJob(job.id, e)}
                            className="hidden md:flex p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                            title={isSaved ? 'Remove from saved' : 'Save job'}
                          >
                            {isSaved ? <BookmarkCheck size={16} className="text-primary fill-primary" /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground my-3">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-muted-foreground" />
                          <span>{job.location}</span>
                          {job.isRemote && (
                            <span className="ml-1 text-[11px] font-semibold px-1.5 py-0.2 rounded bg-muted text-foreground">
                              Remote
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <DollarSign size={14} />
                          <span>{salaryStr}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Briefcase size={14} className="text-muted-foreground" />
                          <span>{job.employmentType}</span>
                        </div>

                        {job.experienceLevel && (
                          <div className="flex items-center gap-1">
                            <Award size={14} className="text-muted-foreground" />
                            <span>{job.experienceLevel}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock size={13} className="text-muted-foreground" />
                          <span>{new Date(job.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Tech Skills Chips */}
                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/60">
                          {job.skills.map(skill => {
                            const isSearched = searchQuery && skill.toLowerCase().includes(searchQuery.toLowerCase());
                            return (
                              <span
                                key={skill}
                                className={`text-[11px] px-2.5 py-0.5 rounded-md font-mono transition-colors ${
                                  isSearched
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'bg-muted/70 text-muted-foreground'
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}

                          <div className="ml-auto flex items-center gap-2 pt-2 sm:pt-0">
                            <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Quick View & Apply <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* 5. JOB ALERTS SUBSCRIPTION CARD */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-card to-muted/40 border border-border shadow-md">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles size={14} /> Never Miss a Match
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Get Instant Verified Tech Role Alerts</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Receive weekly curated engineering jobs matching your exact stack, experience, and compensation requirements.
              </p>
            </div>

            <form onSubmit={handleSubscribeAlerts} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
              {alertSubscribed ? (
                <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Subscribed! Check your inbox.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    placeholder="engineer@domain.com"
                    value={alertEmail}
                    onChange={e => setAlertEmail(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-background border border-input text-xs outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-all shrink-0"
                  >
                    Subscribe Alerts
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. SLIDE-OVER QUICK VIEW MODAL / DRAWER */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedJobForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
            onClick={() => setSelectedJobForModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border bg-muted/20 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center shrink-0 border border-primary/20">
                    {(selectedJobForModal.recruiter?.companyName || 'C').charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
                      {selectedJobForModal.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span className="text-foreground font-semibold">
                        {selectedJobForModal.recruiter?.companyName || 'Confidential'}
                      </span>
                      <span>•</span>
                      <span>{selectedJobForModal.location} {selectedJobForModal.isRemote && '(Remote)'}</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {fmtSalary(selectedJobForModal.salaryMin, selectedJobForModal.salaryMax, selectedJobForModal.salaryCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedJobForModal(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm">
                {/* Highlights bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="text-[11px] text-muted-foreground">Compensation</div>
                    <div className="font-bold text-foreground text-xs mt-0.5">
                      {fmtSalary(selectedJobForModal.salaryMin, selectedJobForModal.salaryMax, selectedJobForModal.salaryCurrency)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="text-[11px] text-muted-foreground">Experience</div>
                    <div className="font-bold text-foreground text-xs mt-0.5">
                      {selectedJobForModal.experienceLevel || 'Mid-Senior'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="text-[11px] text-muted-foreground">Location</div>
                    <div className="font-bold text-foreground text-xs mt-0.5">
                      {selectedJobForModal.isRemote ? 'Remote First' : selectedJobForModal.location}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="text-[11px] text-muted-foreground">Workplace</div>
                    <div className="font-bold text-foreground text-xs mt-0.5">
                      {selectedJobForModal.employmentType || 'Full-time'}
                    </div>
                  </div>
                </div>

                {/* About the role */}
                <div>
                  <h4 className="font-bold text-base mb-2">Role Overview</h4>
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                    {selectedJobForModal.description ||
                      'Join an innovative engineering team delivering high-throughput cloud software. You will architect resilient services, collaborate with cross-functional product designers, and maintain high standards for system reliability.'}
                  </p>
                </div>

                {/* Tech Stack */}
                {selectedJobForModal.skills?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-base mb-2">Required Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobForModal.skills.map(s => (
                        <span key={s} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono font-medium border border-primary/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Responsibilities */}
                {selectedJobForModal.responsibilities && (
                  <div>
                    <h4 className="font-bold text-base mb-2">Core Responsibilities</h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                      {selectedJobForModal.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {selectedJobForModal.requirements && (
                  <div>
                    <h4 className="font-bold text-base mb-2">Qualifications & Skills</h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                      {selectedJobForModal.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {selectedJobForModal.benefits && (
                  <div>
                    <h4 className="font-bold text-base mb-2">Perks & Benefits</h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {selectedJobForModal.benefits.map((b, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-500 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HireSense AI Hiring Process */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-primary" />
                    <h4 className="font-bold text-sm text-primary">HireSense AI Fast-Track Interview Pipeline</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <div className="font-bold text-foreground">Step 1</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Resume Fit Check</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <div className="font-bold text-foreground">Step 2</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">AI Voice Interview</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <div className="font-bold text-foreground">Step 3</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Proctored Sandbox</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <div className="font-bold text-foreground">Step 4</div>
                      <div className="text-[11px] text-emerald-500 font-semibold mt-0.5">Final Offer Call</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyJobLink(selectedJobForModal)}
                    className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                    {copiedLink ? 'Link Copied!' : 'Share Position'}
                  </button>

                  <button
                    onClick={() => toggleSaveJob(selectedJobForModal.id)}
                    className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Bookmark size={14} className={savedJobIds.includes(selectedJobForModal.id) ? 'fill-primary text-primary' : ''} />
                    {savedJobIds.includes(selectedJobForModal.id) ? 'Saved' : 'Save'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/jobs/${selectedJobForModal.id}`}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    View Full Job & Apply
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Jobs;
