import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  MessageSquare, Search, CheckCircle2, Briefcase,
  Award, Loader2, Eye, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, ShieldAlert,
  MessageCircle, RefreshCw
} from 'lucide-react';

const InterviewDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedReport, setExpandedReport] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recruiter/interview-reports');
      setReports(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch interview reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDecision = async (reportId, decision) => {
    const note = noteInputs[reportId] || '';
    try {
      setDecisionLoading(prev => ({ ...prev, [reportId]: decision }));
      await api.put(`/recruiter/interview-reports/${reportId}/decision`, { decision, note });
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, recruiterDecision: decision, status: decision === 'REVIEW' ? 'PENDING_REVIEW' : decision, recruiterNote: note } : r
      ));
      setShowNoteFor(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record decision');
    } finally {
      setDecisionLoading(prev => ({ ...prev, [reportId]: null }));
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (r.candidateName || '').toLowerCase().includes(q) ||
        (r.candidateEmail || '').toLowerCase().includes(q) ||
        (r.jobTitle || '').toLowerCase().includes(q);
      const matchesFilter =
        filterStatus === 'ALL' ? true :
        filterStatus === 'PENDING' ? r.status === 'PENDING_REVIEW' :
        filterStatus === 'SELECTED' ? r.status === 'SELECTED' :
        filterStatus === 'REJECTED' ? r.status === 'REJECTED' : true;
      return matchesSearch && matchesFilter;
    });
  }, [reports, searchQuery, filterStatus]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING_REVIEW').length,
    selected: reports.filter(r => r.status === 'SELECTED').length,
    rejected: reports.filter(r => r.status === 'REJECTED').length,
    avgScore: reports.length ? Math.round(reports.reduce((s, r) => s + (r.percentage || 0), 0) / reports.length) : 0
  }), [reports]);

  const getScoreColor = (pct) =>
    pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-destructive';
  const getScoreBg = (pct) =>
    pct >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : pct >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-destructive/10 border-destructive/20';
  const getStatusBadge = (status) => {
    if (status === 'SELECTED') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (status === 'REJECTED') return 'bg-destructive/10 text-destructive border-destructive/20';
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  };
  const getStatusLabel = (status) => {
    if (status === 'SELECTED') return '✓ Selected';
    if (status === 'REJECTED') return '✕ Rejected';
    return '⏳ Pending Review';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
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
            <MessageSquare className="text-primary" size={28} /> AI Interview Reports & Review
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review completed AI voice interview sessions, evaluate transcripts, and make final decisions on candidates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchReports}
            className="px-3.5 py-2 bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Interviews</p>
          <p className="text-3xl font-extrabold text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground">Completed sessions</p>
        </div>
        <div className="bg-card border border-amber-500/20 rounded-2xl p-5 shadow-sm space-y-1">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Pending Review</p>
          <p className="text-3xl font-extrabold text-amber-600">{stats.pending}</p>
          <p className="text-[11px] text-muted-foreground">Awaiting your decision</p>
        </div>
        <div className="bg-card border border-emerald-500/20 rounded-2xl p-5 shadow-sm space-y-1">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Selected</p>
          <p className="text-3xl font-extrabold text-emerald-600">{stats.selected}</p>
          <p className="text-[11px] text-muted-foreground">Candidates approved</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg. Score</p>
          <p className={`text-3xl font-extrabold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}<span className="text-sm text-muted-foreground">/100</span></p>
          <p className="text-[11px] text-muted-foreground">Across all candidates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or job title..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'PENDING', 'SELECTED', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                filterStatus === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-input hover:border-primary/40'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'PENDING' ? '⏳ Pending' : f === 'SELECTED' ? '✓ Selected' : '✕ Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-semibold text-foreground">No interview reports found</p>
            <p className="text-xs mt-1">
              {reports.length === 0
                ? 'No candidates have completed the AI interview yet.'
                : 'No reports match your current filters.'}
            </p>
          </div>
        ) : (
          filteredReports.map(report => {
            const isExpanded = expandedReport === report.id;
            const isLoadingDecision = !!decisionLoading[report.id];
            const isPending = report.status === 'PENDING_REVIEW';

            return (
              <div key={report.id} className={`bg-card border rounded-2xl shadow-sm overflow-hidden transition-all ${
                isPending ? 'border-amber-500/30' : report.status === 'SELECTED' ? 'border-emerald-500/30' : 'border-destructive/20'
              }`}>
                {/* Report Header Row */}
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Candidate Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 font-extrabold text-primary text-base">
                      {report.student?.profilePicture
                        ? <img src={getImageUrl(report.student.profilePicture)} alt="" className="w-full h-full object-cover" />
                        : (report.candidateName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-foreground">{report.candidateName}</h3>
                        {report.endedEarly && (
                          <span className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-bold border border-destructive/20">
                            Early End
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{report.candidateEmail}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase size={11} /> {report.jobTitle}
                      </p>
                    </div>
                  </div>

                  {/* Score + Status + Actions */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* Score Circle */}
                    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${getScoreBg(report.percentage)}`}>
                      <span className={`text-xl font-extrabold ${getScoreColor(report.percentage)}`}>{report.percentage}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">/100</span>
                    </div>

                    {/* AI recommendation chip */}
                    <div className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      report.selected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {report.selected ? 'AI: Select ✓' : 'AI: Not Select'}
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${getStatusBadge(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>

                    {/* Expand button */}
                    <button
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                      className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-border"
                    >
                      <Eye size={13} /> {isExpanded ? 'Hide' : 'Review'}
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <p className="text-lg font-extrabold text-foreground">{report.percentage}<span className="text-xs text-muted-foreground">/100</span></p>
                        <p className="text-muted-foreground mt-0.5">Overall Score</p>
                      </div>
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <p className="text-lg font-extrabold text-foreground">{report.highestLevel}<span className="text-xs text-muted-foreground">/5</span></p>
                        <p className="text-muted-foreground mt-0.5">Highest Level</p>
                      </div>
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <p className="text-lg font-extrabold text-foreground">{report.turnsCount || 0}</p>
                        <p className="text-muted-foreground mt-0.5">Questions</p>
                      </div>
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <p className={`text-lg font-extrabold ${report.screenViolations > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                          {report.screenViolations}
                        </p>
                        <p className="text-muted-foreground mt-0.5">Screen Violations</p>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className={`p-4 rounded-xl border text-xs ${report.selected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                      <p className={`font-bold mb-1 ${report.selected ? 'text-emerald-600' : 'text-destructive'}`}>
                        {report.selected ? '✓ AI Recommends: SELECTED' : '✕ AI Recommends: NOT SELECTED'}
                      </p>
                      <p className="text-muted-foreground">
                        This candidate scored {report.percentage}/100 overall{report.endedEarly ? ', but the interview ended early (likely due to repeated low scores)' : ''}. The AI recommendation is advisory — your final decision overrides it.
                        {report.screenViolations > 0 && ` ⚠ ${report.screenViolations} screen violation(s) were detected during the session.`}
                      </p>
                    </div>

                    {/* Transcript */}
                    {Array.isArray(report.turns) && report.turns.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Interview Transcript ({report.turns.length} Q&A pairs)</p>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                          {report.turns.map((turn, i) => (
                            <div key={i} className={`p-3 rounded-xl border text-xs space-y-1 ${
                              (turn.score >= 7) ? 'bg-emerald-500/5 border-emerald-500/20' :
                              (turn.score >= 5) ? 'bg-amber-500/5 border-amber-500/20' :
                              'bg-destructive/5 border-destructive/20'
                            }`}>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-foreground">Q{i + 1}: {turn.topic} — {turn.sub}</span>
                                <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                                  (turn.score >= 7) ? 'bg-emerald-500/15 text-emerald-600' :
                                  (turn.score >= 5) ? 'bg-amber-500/15 text-amber-600' :
                                  'bg-destructive/15 text-destructive'
                                }`}>{turn.score}/10</span>
                              </div>
                              <p className="font-semibold text-foreground/80">{turn.question}</p>
                              <p className="text-muted-foreground leading-relaxed">{turn.answer || <em>No answer</em>}</p>
                              {turn.summary && <p className="text-muted-foreground italic text-[10px]">Summary: {turn.summary}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note input */}
                    {showNoteFor === report.id && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Decision Note (optional)</label>
                        <textarea
                          rows={2}
                          value={noteInputs[report.id] || ''}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                          placeholder="Add a note to explain your decision (e.g. 'Strong DSA skills, weak in system design')..."
                          className="w-full p-2.5 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                      </div>
                    )}

                    {/* Decision Buttons */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => handleDecision(report.id, 'SELECTED')}
                        disabled={isLoadingDecision}
                        className="flex-1 min-w-[120px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {decisionLoading[report.id] === 'SELECTED' ? <Loader2 size={13} className="animate-spin" /> : <ThumbsUp size={13} />}
                        Select Candidate
                      </button>
                      <button
                        onClick={() => handleDecision(report.id, 'REJECTED')}
                        disabled={isLoadingDecision}
                        className="flex-1 min-w-[120px] py-2.5 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {decisionLoading[report.id] === 'REJECTED' ? <Loader2 size={13} className="animate-spin" /> : <ThumbsDown size={13} />}
                        Reject Candidate
                      </button>
                      <button
                        onClick={() => setShowNoteFor(showNoteFor === report.id ? null : report.id)}
                        className="py-2.5 px-3.5 bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle size={13} /> Note
                      </button>
                    </div>

                    {/* Existing decision note */}
                    {report.recruiterNote && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs">
                        <p className="font-semibold text-primary mb-0.5">Recruiter Note:</p>
                        <p className="text-muted-foreground">{report.recruiterNote}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border">
                      <span>Completed: {new Date(report.completedAt).toLocaleString()}</span>
                      {report.decidedAt && <span>Decided: {new Date(report.decidedAt).toLocaleString()}</span>}
                      {report.interviewSessionId && <span className="font-mono">Session: {report.interviewSessionId.slice(0, 12)}...</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      {reports.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pb-4">
          AI recommendations support — not replace — human judgment. Review transcript evidence before making decisions.
        </p>
      )}
    </div>
  );
};

export default InterviewDashboard;
