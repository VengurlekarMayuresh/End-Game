import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  Sparkles, Sliders, CheckCircle2, XCircle, Clock, Search,
  Award, ArrowRight, UserCheck, ShieldCheck, UserCircle, Briefcase, Filter, ChevronRight
} from 'lucide-react';

const RoleSpecificAptitudeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ candidates: [], totalCandidates: 0, assignedCount: 0, completedCount: 0 });

  // Threshold and Filter states
  const [threshold, setThreshold] = useState(40);
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

  // Advance single candidate to Next Round (GD / Interview)
  const handleAdvanceCandidate = async (appId, override = false) => {
    setAdvancingAppId(appId);
    try {
      const res = await api.post(`/recruiter/resume-aptitude/application/${appId}/advance`, {
        threshold,
        status: 'INTERVIEW',
        override
      });
      alert(res.data.message || 'Candidate advanced to GD / Interview Round!');
      fetchOverview();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to advance candidate');
    } finally {
      setAdvancingAppId(null);
    }
  };

  // Bulk advance eligible candidates
  const handleBulkAdvance = async (eligibleApps) => {
    if (!eligibleApps || eligibleApps.length === 0) return;
    if (!window.confirm(`Are you sure you want to advance all ${eligibleApps.length} eligible candidates to the GD / Interview Round?`)) return;

    setBulkAdvancing(true);
    let successCount = 0;
    for (const app of eligibleApps) {
      try {
        await api.post(`/recruiter/resume-aptitude/application/${app.applicationId}/advance`, {
          threshold,
          status: 'INTERVIEW',
          override: false
        });
        successCount++;
      } catch (e) {}
    }
    setBulkAdvancing(false);
    alert(`Successfully advanced ${successCount} candidates to GD / Interview Round!`);
    fetchOverview();
  };

  // Filter candidates logic
  const filteredCandidates = useMemo(() => {
    const list = data.candidates || [];
    return list.filter(c => {
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
  }, [data.candidates, searchQuery, statusFilter, threshold]);

  const eligibleUnadvanced = useMemo(() => {
    return (data.candidates || []).filter(c => {
      const score = c.scoreResult?.weightedCompositeScore ?? c.scoreResult?.percentage ?? 0;
      const isEligible = score >= threshold;
      const isAdvanced = c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED';
      return isEligible && !isAdvanced;
    });
  }, [data.candidates, threshold]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={28} /> Role-Specific Aptitude Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage candidate attempts, set passing thresholds, inspect scores, and advance eligible candidates to GD / Interview Round.
          </p>
        </div>

        {eligibleUnadvanced.length > 0 && (
          <button
            onClick={() => handleBulkAdvance(eligibleUnadvanced)}
            disabled={bulkAdvancing}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <UserCheck size={18} />
            {bulkAdvancing ? 'Advancing Candidates...' : `Advance All ${eligibleUnadvanced.length} Eligible Candidates`}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      {/* Analytics Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Candidates</p>
          <p className="text-3xl font-extrabold text-foreground">{data.totalCandidates}</p>
          <p className="text-[11px] text-muted-foreground">Applications across all jobs</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Assigned to Round</p>
          <p className="text-3xl font-extrabold text-violet-600">{data.assignedCount}</p>
          <p className="text-[11px] text-muted-foreground">{data.completedCount} attempts completed</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Eligible (≥ {threshold}%)</p>
          <p className="text-3xl font-extrabold text-emerald-600">{eligibleUnadvanced.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Ready to advance to Interview</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Advanced to Next Round</p>
          <p className="text-3xl font-extrabold text-primary">
            {(data.candidates || []).filter(c => c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED').length}
          </p>
          <p className="text-[11px] text-muted-foreground">In GD / Interview Round</p>
        </div>
      </div>

      {/* Threshold Setting & Filter Bar */}
      <div className="bg-gradient-to-r from-card via-muted/20 to-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-primary" />
            <span className="font-bold text-sm">Round Passing Threshold:</span>
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {[40, 50, 60, 70].map(pct => (
                <button
                  key={pct}
                  onClick={() => setThreshold(pct)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${threshold === pct ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Candidates scoring <span className="font-bold text-foreground">≥ {threshold}%</span> are marked as eligible for advancement.
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, email, or job..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex gap-1 bg-muted/60 p-1 rounded-xl flex-wrap w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ELIGIBLE', label: `Eligible (≥${threshold}%)` },
              { id: 'ADVANCED', label: 'Advanced' },
              { id: 'NEEDS_REVIEW', label: 'Needs Review' },
              { id: 'UNATTEMPTED', label: 'Unattempted' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === tab.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <Award size={36} className="mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-semibold text-foreground">No candidates match the selected filter</p>
            <p className="text-xs mt-1">Try clearing your search query or selecting a different status tab.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCandidates.map(c => {
              const score = c.scoreResult?.weightedCompositeScore ?? c.scoreResult?.percentage ?? 0;
              const clears = score >= threshold;
              const isAdvanced = c.applicationStatus === 'INTERVIEW' || c.applicationStatus === 'OFFERED';
              const isCompleted = c.attempt?.status === 'COMPLETED' || c.attempt?.status === 'AUTO_SUBMITTED';

              return (
                <div key={c.applicationId} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  
                  {/* Candidate Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                      {c.profilePicture
                        ? <img src={getImageUrl(c.profilePicture)} alt="" className="w-full h-full object-cover" />
                        : <UserCircle size={24} className="text-primary" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-foreground truncate">{c.studentName}</h3>
                        <span className="text-xs text-muted-foreground">({c.studentEmail})</span>
                        {isAdvanced && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Advanced to Interview
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Briefcase size={12} /> Applied for: <span className="font-semibold text-foreground">{c.jobTitle}</span>
                      </p>

                      {/* Score breakdown pills */}
                      {c.scoreResult && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                            Score: {score}%
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Ladder: {c.scoreResult.categoryBreakdown?.projectLadder?.score || 0}/{c.scoreResult.categoryBreakdown?.projectLadder?.max || 0}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Theory: {c.scoreResult.categoryBreakdown?.coreCs?.score || 0}/{c.scoreResult.categoryBreakdown?.coreCs?.max || 0}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            SQL: {c.scoreResult.categoryBreakdown?.sql?.score || 0}/{c.scoreResult.categoryBreakdown?.sql?.max || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-3 flex-wrap shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
                    {/* Status Badge */}
                    <div className="text-right">
                      {isCompleted ? (
                        clears ? (
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Clears {threshold}%
                          </span>
                        ) : (
                          <span className="text-xs px-3 py-1 rounded-full bg-destructive/10 text-destructive font-bold flex items-center gap-1">
                            <XCircle size={13} /> Below {threshold}%
                          </span>
                        )
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center gap-1">
                          <Clock size={13} /> Unattempted
                        </span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/recruiter/resume-aptitude/application/${c.applicationId}/results`}
                        className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Award size={13} /> View Results
                      </Link>

                      {!isAdvanced ? (
                        <button
                          onClick={() => handleAdvanceCandidate(c.applicationId, !clears)}
                          disabled={advancingAppId === c.applicationId}
                          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                            clears
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                          }`}
                        >
                          <UserCheck size={13} />
                          {advancingAppId === c.applicationId
                            ? 'Advancing...'
                            : clears
                            ? 'Proceed to Next Round (GD/Interview)'
                            : 'Override & Proceed to Next Round'}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-600 font-bold rounded-xl flex items-center gap-1">
                          <CheckCircle2 size={13} /> In Interview Stage
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
