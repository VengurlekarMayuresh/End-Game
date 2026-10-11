import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  Sparkles, Sliders, CheckCircle2, XCircle, Clock, Search,
  Award, ArrowRight, UserCheck, ShieldCheck, UserCircle, Briefcase, Filter,
  ChevronRight, Users, ChevronDown, ArrowUpRight, CheckCheck, AlertCircle
} from 'lucide-react';

const RoleSpecificAptitudeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    jobs: [],
    candidates: [],
    totalCandidates: 0,
    assignedCount: 0,
    completedCount: 0
  });

  // 1. Job Selection State (Default: 'ALL' or specific job ID)
  const [selectedJobId, setSelectedJobId] = useState('ALL');

  // 2. Threshold State (Slider Bar from 0% to 100%)
  const [threshold, setThreshold] = useState(50);

  // Search & Secondary Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ELIGIBLE, ADVANCED, UNATTEMPTED, NEEDS_REVIEW
  const [advancingAppId, setAdvancingAppId] = useState(null);
  const [bulkAdvancing, setBulkAdvancing] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recruiter/resume-aptitude/overview');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch aptitude overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Compute unique jobs if backend didn't return them directly
  const availableJobs = useMemo(() => {
    if (data.jobs && data.jobs.length > 0) return data.jobs;
    const map = {};
    (data.candidates || []).forEach(c => {
      if (c.jobId && !map[c.jobId]) {
        map[c.jobId] = {
          id: c.jobId,
          title: c.jobTitle || 'Job Role',
          totalApplicants: 0,
          completedAttempts: 0
        };
      }
      if (c.jobId && map[c.jobId]) {
        map[c.jobId].totalApplicants++;
        if (c.attempt?.status === 'COMPLETED' || c.attempt?.status === 'AUTO_SUBMITTED') {
          map[c.jobId].completedAttempts++;
        }
      }
    });
    return Object.values(map);
  }, [data.jobs, data.candidates]);

  // Candidates for the currently selected job
  const jobCandidates = useMemo(() => {
    const list = data.candidates || [];
    if (selectedJobId === 'ALL') return list;
    return list.filter(c => c.jobId === selectedJobId);
  }, [data.candidates, selectedJobId]);

  // Filter candidates logic (Search + Status + Threshold)
  const filteredCandidates = useMemo(() => {
    return jobCandidates.filter(c => {
      const nameMatch = (c.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!nameMatch) return false;

      const score = c.scoreResult?.weightedCompositeScore ?? c.scoreResult?.percentage ?? 0;
      const isEligible = score >= threshold;
      const isAdvanced = c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED';
      const isCompleted = c.attempt?.status === 'COMPLETED' || c.attempt?.status === 'AUTO_SUBMITTED';

      if (statusFilter === 'ELIGIBLE') return isEligible && !isAdvanced;
      if (statusFilter === 'ADVANCED') return isAdvanced;
      if (statusFilter === 'NEEDS_REVIEW') return isCompleted && !isEligible && !isAdvanced;
      if (statusFilter === 'UNATTEMPTED') return !c.attempt || c.attempt.status === 'IN_PROGRESS';

      return true;
    });
  }, [jobCandidates, searchQuery, statusFilter, threshold]);

  // All eligible unadvanced candidates in the current job filter
  const eligibleUnadvanced = useMemo(() => {
    return jobCandidates.filter(c => {
      const score = c.scoreResult?.weightedCompositeScore ?? c.scoreResult?.percentage ?? 0;
      const isEligible = score >= threshold;
      const isAdvanced = c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED';
      return isEligible && !isAdvanced;
    });
  }, [jobCandidates, threshold]);

  // Advance single candidate to GD / Interview
  const handleAdvanceCandidate = async (appId, override = false) => {
    setAdvancingAppId(appId);
    try {
      const res = await api.post(`/recruiter/resume-aptitude/application/${appId}/advance`, {
        threshold,
        status: 'INTERVIEW',
        override
      });
      alert(res.data.message || 'Candidate advanced to GD / Interview Round successfully!');
      fetchOverview();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to advance candidate');
    } finally {
      setAdvancingAppId(null);
    }
  };

  // Bulk advance all eligible candidates above the threshold
  const handleBulkAdvance = async () => {
    if (!eligibleUnadvanced || eligibleUnadvanced.length === 0) return;
    
    const targetJobName = selectedJobId === 'ALL'
      ? 'all job roles'
      : (availableJobs.find(j => j.id === selectedJobId)?.title || 'this job');

    if (!window.confirm(
      `Proceed all ${eligibleUnadvanced.length} candidates scoring >= ${threshold}% for ${targetJobName} to the AI Interview Round?`
    )) {
      return;
    }

    setBulkAdvancing(true);
    let successCount = 0;
    for (const app of eligibleUnadvanced) {
      try {
        await api.post(`/recruiter/resume-aptitude/application/${app.applicationId}/advance`, {
          threshold,
          status: 'INTERVIEW',
          override: false
        });
        successCount++;
      } catch (e) {
        console.error('Failed to advance', app.studentName, e);
      }
    }
    setBulkAdvancing(false);
    alert(`Successfully advanced ${successCount} candidate(s) to the Interview Round!`);
    fetchOverview();
  };

  const selectedJobDetails = useMemo(() => {
    if (selectedJobId === 'ALL') return null;
    return availableJobs.find(j => j.id === selectedJobId);
  }, [availableJobs, selectedJobId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 p-2 md:p-4">
      
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full uppercase tracking-wider mb-2">
            <Sparkles size={13} /> Role-Specific Evaluation & Progression Suite
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Role-Specific Candidate Threshold & Interview Pipeline
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
            Select a job requisition to filter candidate attempts, adjust the passing benchmark slider, inspect performance breakdowns, and proceed qualified talent into the AI Interview round.
          </p>
        </div>

        {/* Global / Job Bulk Advance Action */}
        {eligibleUnadvanced.length > 0 && (
          <button
            onClick={handleBulkAdvance}
            disabled={bulkAdvancing}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs md:text-sm rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2.5 shrink-0 disabled:opacity-50"
          >
            <UserCheck size={18} />
            {bulkAdvancing
              ? 'Proceeding Candidates...'
              : `Proceed All ${eligibleUnadvanced.length} Candidates (≥ ${threshold}%) to Interview`}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-2xl border border-destructive/20 font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: JOB POST SELECTOR BAR ── */}
      <div className="bg-card border-2 border-primary/20 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
              <Briefcase size={16} /> 1. Select Target Job Post
            </label>
            <p className="text-xs text-muted-foreground">
              Filter evaluation scores and bulk proceed actions specifically for candidates of this role.
            </p>
          </div>

          <div className="w-full md:w-96 relative">
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary text-foreground font-bold text-xs md:text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer shadow-sm pr-10"
            >
              <option value="ALL">📁 All Job Posts ({data.totalCandidates} Total Applicants)</option>
              {availableJobs.map(job => (
                <option key={job.id} value={job.id}>
                  💼 {job.title} ({job.totalApplicants} applicants · {job.completedAttempts} completed)
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Selected Job Meta Badge */}
        {selectedJobDetails && (
          <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="font-extrabold text-foreground text-sm">{selectedJobDetails.title}</span>
                <span className="text-muted-foreground ml-2">({selectedJobDetails.location || 'Remote'} · {selectedJobDetails.type || 'Full Time'})</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span>Total Applicants: <strong className="text-foreground">{selectedJobDetails.totalApplicants}</strong></span>
              <span>Assessments Completed: <strong className="text-emerald-600">{selectedJobDetails.completedAttempts}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 2: THRESHOLD SLIDER BAR & BENCHMARK CONTROLS ── */}
      <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-primary" />
              <h2 className="text-base font-extrabold text-foreground">
                2. Set Role-Specific Passing Threshold Bar
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust the slider bar to define the minimum composite test score required for the interview round.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-2xl flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Passing Benchmark:</span>
              <span className="text-xl font-black text-primary font-mono">{threshold}%</span>
            </div>
          </div>
        </div>

        {/* The Interactive Slider Bar */}
        <div className="space-y-3 px-1 py-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full h-3.5 bg-muted rounded-xl appearance-none cursor-pointer accent-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-muted-foreground font-mono">
            <span>10% (Permissive)</span>
            <span>30%</span>
            <span>50% (Standard)</span>
            <span>70%</span>
            <span>90% (Strict)</span>
          </div>
        </div>

        {/* Quick Benchmark Preset Buttons & Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1">Presets:</span>
            {[35, 45, 50, 60, 70, 80].map(pct => (
              <button
                key={pct}
                onClick={() => setThreshold(pct)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  threshold === pct
                    ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCheck size={16} className="text-emerald-500" />
            <span>
              <strong className="text-emerald-600 font-bold">{eligibleUnadvanced.length}</strong> candidate(s) meet or exceed <strong className="text-foreground">{threshold}%</strong> and qualify for interview.
            </span>
          </div>
        </div>
      </div>

      {/* ── STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-1 shadow-sm">
          <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Candidates In Selection</p>
          <p className="text-2xl md:text-3xl font-extrabold text-foreground">{jobCandidates.length}</p>
          <p className="text-[11px] text-muted-foreground">
            {selectedJobId === 'ALL' ? 'Across all job postings' : 'Applied to this specific role'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-1 shadow-sm">
          <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Completed Assessments</p>
          <p className="text-2xl md:text-3xl font-extrabold text-violet-600">
            {jobCandidates.filter(c => c.attempt?.status === 'COMPLETED' || c.attempt?.status === 'AUTO_SUBMITTED').length}
          </p>
          <p className="text-[11px] text-muted-foreground">Ready for benchmark review</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-1 shadow-sm">
          <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Eligible (≥ {threshold}%)</p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600">{eligibleUnadvanced.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Ready to proceed to interview</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-1 shadow-sm">
          <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Already in Interview Round</p>
          <p className="text-2xl md:text-3xl font-extrabold text-primary">
            {jobCandidates.filter(c => c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED').length}
          </p>
          <p className="text-[11px] text-muted-foreground">Assigned & unlocked</p>
        </div>
      </div>

      {/* ── STEP 3: SEARCH & FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate by name or email..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
          />
        </div>

        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl flex-wrap w-full sm:w-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: `All (${jobCandidates.length})` },
            { id: 'ELIGIBLE', label: `Eligible (≥${threshold}%)` },
            { id: 'ADVANCED', label: 'In Interview' },
            { id: 'NEEDS_REVIEW', label: 'Below Bar' },
            { id: 'UNATTEMPTED', label: 'Unattempted' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === tab.id ? 'bg-card shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 4: SCROLLABLE CANDIDATES LIST WITH SCORE BARS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Users size={14} /> Candidates Scroll List ({filteredCandidates.length})
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Current Passing Cutoff: <strong className="text-primary font-bold">{threshold}%</strong>
          </span>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground space-y-3">
            <Award size={40} className="mx-auto opacity-30 text-primary" />
            <p className="font-bold text-foreground text-base">No candidates found for this view</p>
            <p className="text-xs max-w-md mx-auto">
              There are no candidates matching the selected job, threshold ({threshold}%), and filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredCandidates.map(c => {
              const score = c.scoreResult?.weightedCompositeScore ?? c.scoreResult?.percentage ?? 0;
              const clears = score >= threshold;
              const isAdvanced = c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED';
              const isCompleted = c.attempt?.status === 'COMPLETED' || c.attempt?.status === 'AUTO_SUBMITTED';

              return (
                <div
                  key={c.applicationId}
                  className={`bg-card border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
                    isAdvanced
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : clears && isCompleted
                      ? 'border-primary/30 hover:border-primary'
                      : 'border-border'
                  }`}
                >
                  
                  {/* Candidate Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      {c.profilePicture
                        ? <img src={getImageUrl(c.profilePicture)} alt="" className="w-full h-full object-cover" />
                        : <UserCircle size={26} className="text-primary" />}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-base text-foreground truncate">{c.studentName}</h4>
                        <span className="text-xs text-muted-foreground font-mono">({c.studentEmail})</span>
                        {isAdvanced && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold flex items-center gap-1 border border-emerald-500/30">
                            <CheckCircle2 size={11} /> Interview Assigned
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Briefcase size={13} className="text-primary" />
                        Applied for: <strong className="text-foreground">{c.jobTitle}</strong>
                        <span className="text-muted-foreground">· Applied: {new Date(c.appliedAt).toLocaleDateString()}</span>
                      </p>

                      {/* Visual Score Progress Bar ("Scroll") */}
                      <div className="pt-2 space-y-1.5 max-w-xl">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold flex items-center gap-1 text-foreground">
                            <span>Score:</span>
                            <span className={clears && isCompleted ? 'text-emerald-600 font-black font-mono' : 'text-foreground font-mono'}>
                              {score.toFixed(1)}%
                            </span>
                          </span>

                          <span className="text-[11px] text-muted-foreground">
                            Threshold: <strong className="text-foreground">{threshold}%</strong>
                          </span>
                        </div>

                        {/* Interactive Bar */}
                        <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                          {/* Cutoff marker line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                            style={{ left: `${threshold}%` }}
                            title={`Cutoff: ${threshold}%`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              clears && isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : isCompleted
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-muted-foreground/30'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(score, 0))}%` }}
                          />
                        </div>

                        {/* Breakdown Pills */}
                        {c.scoreResult && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                              Project Ladder: <strong className="text-foreground">{c.scoreResult.categoryBreakdown?.projectLadder?.score || 0}/{c.scoreResult.categoryBreakdown?.projectLadder?.max || 0}</strong>
                            </span>
                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                              Theory: <strong className="text-foreground">{c.scoreResult.categoryBreakdown?.coreCs?.score || 0}/{c.scoreResult.categoryBreakdown?.coreCs?.max || 0}</strong>
                            </span>
                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                              SQL: <strong className="text-foreground">{c.scoreResult.categoryBreakdown?.sql?.score || 0}/{c.scoreResult.categoryBreakdown?.sql?.max || 0}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-3 flex-wrap shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
                    {/* Status Pill */}
                    <div className="text-right">
                      {isCompleted ? (
                        clears ? (
                          <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-extrabold flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle2 size={13} /> Clears ({score.toFixed(0)}% ≥ {threshold}%)
                          </span>
                        ) : (
                          <span className="text-xs px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive font-bold flex items-center gap-1 border border-destructive/20">
                            <XCircle size={13} /> Below ({score.toFixed(0)}% &lt; {threshold}%)
                          </span>
                        )
                      ) : (
                        <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-bold flex items-center gap-1 border border-amber-500/20">
                          <Clock size={13} /> Assessment Pending
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/recruiter/resume-aptitude/application/${c.applicationId}/results`}
                        className="px-3.5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Award size={13} /> View Breakdown
                      </Link>

                      {!isAdvanced ? (
                        <button
                          onClick={() => handleAdvanceCandidate(c.applicationId, !clears)}
                          disabled={advancingAppId === c.applicationId}
                          className={`px-4 py-2.5 font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                            clears
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                          }`}
                        >
                          <UserCheck size={14} />
                          {advancingAppId === c.applicationId
                            ? 'Proceeding...'
                            : clears
                            ? 'Proceed to Interview'
                            : 'Override & Proceed'}
                        </button>
                      ) : (
                        <span className="px-3.5 py-2.5 text-xs bg-emerald-500/15 text-emerald-600 font-extrabold rounded-xl flex items-center gap-1.5 border border-emerald-500/30">
                          <CheckCircle2 size={14} /> In Interview Stage
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default RoleSpecificAptitudeDashboard;
