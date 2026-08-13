import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  ArrowLeft, Clock, BarChart3, AlertCircle, 
  Terminal, Search, UserCircle, CheckCircle2, XCircle, Eye, Code, Award, X, Send, Mail, ShieldAlert
} from 'lucide-react';

const STATUS_BADGES = {
  COMPLETED: 'bg-green-500/10 text-green-600 border border-green-500/20',
  AUTO_SUBMITTED: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
};

const CodingAssessmentResults = () => {
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [decisionThreshold, setDecisionThreshold] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendSummary, setSendSummary] = useState(null);
  const [sendError, setSendError] = useState('');

  // Code inspection Modal
  const [inspectAttempt, setInspectAttempt] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const fetchResults = () => {
    setLoading(true);
    Promise.all([
      api.get(`/recruiter/coding-assessments/${id}`),
      api.get(`/recruiter/coding-assessments/${id}/results`)
    ])
      .then(([assessmentRes, resultsRes]) => {
        setAssessment(assessmentRes.data);
        setAttempts(resultsRes.data);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to fetch results'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  useEffect(() => {
    const totalPossibleScore = assessment?.problems?.reduce((sum, problem) => sum + Number(problem.marks || 0), 0) || 0;
    if (totalPossibleScore > 0 && decisionThreshold === '') {
      setDecisionThreshold(String(Math.round(totalPossibleScore * 0.6 * 10) / 10));
    }
  }, [assessment, decisionThreshold]);

  const filteredAttempts = attempts.filter(att => {
    const name = att.student?.user?.fullName || '';
    const email = att.student?.user?.email || '';
    return name.toLowerCase().includes(search.toLowerCase()) || 
           email.toLowerCase().includes(search.toLowerCase());
  });

  const openCodeInspector = (att) => {
    setInspectAttempt(att);
    setShowCodeModal(true);
  };

  const completedAttempts = attempts.filter(att => att.status === 'COMPLETED' || att.status === 'AUTO_SUBMITTED');
  const thresholdValue = Number(decisionThreshold || 0);
  const eligibleAttempts = completedAttempts.filter(att => Number(att.score || 0) >= thresholdValue);
  const rejectedAttempts = completedAttempts.filter(att => Number(att.score || 0) < thresholdValue);

  const totalPossibleScore = assessment?.problems?.reduce((sum, problem) => sum + Number(problem.marks || 0), 0) || 0;

  const handleSendDecisionEmails = async () => {
    setSendingEmails(true);
    setSendError('');
    setSendSummary(null);

    try {
      const { data } = await api.post(`/recruiter/coding-assessments/${id}/send-result-emails`, {
        threshold: thresholdValue,
      });
      setSendSummary(data);
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to send decision emails');
    } finally {
      setSendingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate metrics
  const avgScore = completedAttempts.length > 0 
    ? (completedAttempts.reduce((acc, curr) => acc + curr.score, 0) / completedAttempts.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/recruiter/coding-assessments" className="p-2 hover:bg-muted rounded-xl transition-colors border">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Coding Assessment Results</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Inspect candidate performance and review source code</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <UserCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total Candidates</p>
            <p className="text-2xl font-bold mt-0.5">{attempts.length}</p>
          </div>
        </div>
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Average Score</p>
            <p className="text-2xl font-bold mt-0.5">{avgScore} marks</p>
          </div>
        </div>
        <div className="bg-card border p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Evaluated Submissions</p>
            <p className="text-2xl font-bold mt-0.5">{completedAttempts.length}</p>
          </div>
        </div>
      </div>

      {/* Decision Email Actions */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Mail size={18} className="text-secondary" /> Send decision emails
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set a marks cutoff and send congratulations to candidates at or above it, and rejection emails to those below it.
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-muted/40 px-3 py-2 rounded-xl">
            {eligibleAttempts.length} eligible · {rejectedAttempts.length} not selected
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Minimum marks</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={decisionThreshold}
              onChange={e => setDecisionThreshold(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder={totalPossibleScore ? `e.g. ${Math.round(totalPossibleScore * 0.6 * 10) / 10}` : 'e.g. 40'}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSendDecisionEmails}
              disabled={sendingEmails || !Number.isFinite(thresholdValue)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              <Send size={16} /> {sendingEmails ? 'Sending...' : 'Send Emails'}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total possible marks</p>
            <p className="text-2xl font-bold mt-1">{totalPossibleScore || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Eligible</p>
            <p className="text-2xl font-bold mt-1">{eligibleAttempts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Not Selected</p>
            <p className="text-2xl font-bold mt-1">{rejectedAttempts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Threshold</p>
            <p className="text-2xl font-bold mt-1">{decisionThreshold || 0} marks</p>
          </div>
        </div>

        {sendError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
            <AlertCircle size={16} /> {sendError}
          </div>
        )}

        {sendSummary && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-green-500/10 text-green-700 text-sm rounded-xl border border-green-500/20">
            <CheckCircle2 size={16} />
            <span>
              Emails processed: {sendSummary.sent}/{sendSummary.total} sent, {sendSummary.failed} failed, {sendSummary.selected} selected, {sendSummary.rejected} not selected.
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
          placeholder="Search by candidate name or email..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {/* Main List */}
      {filteredAttempts.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
          <Terminal size={36} className="mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-foreground">No candidate attempts found</p>
          <p className="text-xs mt-1">Once applied candidates complete the test, their marks will be recorded here.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border shadow-sm">
          {filteredAttempts.map((att) => {
            const user = att.student?.user;
            const subCount = att.submissions?.length || 0;
            return (
              <div key={att.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary/35 flex items-center justify-center shrink-0">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="text-muted-foreground" size={24} />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-foreground truncate">{user?.fullName || 'Anonymous'}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize ${STATUS_BADGES[att.status]}`}>
                        {att.status.replace('_', ' ').toLowerCase()}
                      </span>
                      {att.proctoringSession && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          att.proctoringSession.riskLevel === 'CRITICAL' || att.proctoringSession.riskLevel === 'HIGH'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : att.proctoringSession.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-green-500/10 text-green-600 border border-green-500/20'
                        }`}>
                          Proctor: {att.proctoringSession.riskScore}% ({att.proctoringSession.riskLevel})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium pt-0.5">
                      {att.completedAt && (
                        <span>Submitted: {new Date(att.completedAt).toLocaleDateString()}</span>
                      )}
                      <span>Time Taken: {Math.round(att.timeTaken / 60) || 0}m {att.timeTaken % 60 || 0}s</span>
                      <span>Problems Solved: {subCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 justify-between md:justify-end shrink-0 text-sm">
                  <div className="text-right">
                    <p className="font-extrabold text-base text-foreground">{att.score} marks</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Score</p>
                  </div>

                  <button
                    onClick={() => openCodeInspector(att)}
                    disabled={subCount === 0}
                    className="px-4 py-2 border rounded-xl hover:bg-muted text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    <Code size={13} /> Review Code
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Code Inspector Modal */}
      {showCodeModal && inspectAttempt && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold">Review Code Solutions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Candidate: {inspectAttempt.student?.user?.fullName} | Score: {inspectAttempt.score} marks</p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Proctoring integrity report in Modal */}
              {inspectAttempt.proctoringSession && (
                <div className="p-5 border border-border/80 bg-muted/10 rounded-2xl space-y-4 shadow-sm text-xs">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b pb-2">
                    <ShieldAlert size={16} className="text-primary animate-pulse" /> Integrity Proctoring Report
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-card border rounded-lg space-y-1">
                      <p className="text-muted-foreground uppercase font-bold text-[9px]">Integrity Risk Score</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <p className={`text-xl font-extrabold ${
                          inspectAttempt.proctoringSession.riskLevel === 'CRITICAL' || inspectAttempt.proctoringSession.riskLevel === 'HIGH'
                            ? 'text-red-500'
                            : inspectAttempt.proctoringSession.riskLevel === 'MEDIUM'
                            ? 'text-amber-500'
                            : 'text-green-600'
                        }`}>
                          {inspectAttempt.proctoringSession.riskScore} / 100
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          inspectAttempt.proctoringSession.riskLevel === 'CRITICAL' || inspectAttempt.proctoringSession.riskLevel === 'HIGH'
                            ? 'bg-red-500/10 text-red-500'
                            : inspectAttempt.proctoringSession.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-green-600/10 text-green-600'
                        }`}>
                          {inspectAttempt.proctoringSession.riskLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-card border rounded-lg space-y-1">
                      <p className="text-muted-foreground uppercase font-bold text-[9px]">Assessment Stage</p>
                      <p className="text-base font-bold text-foreground mt-1 capitalize">
                        {inspectAttempt.proctoringSession.stage.toLowerCase()} Test
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Status: {inspectAttempt.proctoringSession.status}
                      </p>
                    </div>

                    <div className="p-3 bg-card border rounded-lg space-y-1">
                      <p className="text-muted-foreground uppercase font-bold text-[9px]">Proctor Events</p>
                      <p className="text-base font-bold text-foreground mt-1 font-semibold">
                        {inspectAttempt.proctoringSession.events?.length || 0} events logged
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Started: {new Date(inspectAttempt.proctoringSession.startedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Proctoring events timeline list */}
                  {inspectAttempt.proctoringSession.events && inspectAttempt.proctoringSession.events.length > 0 && (
                    <div className="bg-card border rounded-xl overflow-hidden mt-2">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b text-muted-foreground font-bold">
                            <th className="p-2.5">Time</th>
                            <th className="p-2.5">Event Type</th>
                            <th className="p-2.5">Severity</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectAttempt.proctoringSession.events.map((evt, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="p-2.5 text-muted-foreground">
                                {new Date(evt.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="p-2.5 font-semibold text-foreground capitalize">
                                {evt.eventType.replace('_', ' ').toLowerCase()}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                                  evt.severity === 'CRITICAL' 
                                    ? 'bg-red-500/10 text-red-500' 
                                    : evt.severity === 'WARNING' 
                                    ? 'bg-amber-500/10 text-amber-500' 
                                    : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {evt.severity}
                                </span>
                              </td>
                              <td className="p-2.5 text-muted-foreground">
                                {evt.duration ? `${evt.duration.toFixed(1)}s` : '-'}
                              </td>
                              <td className="p-2.5 text-muted-foreground italic max-w-[200px] truncate">
                                {evt.metadata || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {inspectAttempt.submissions.map((sub, idx) => (
                <div key={sub.id} className="border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                  {/* Problem bar */}
                  <div className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Task {idx + 1}: {sub.codingProblem?.title}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-semibold">
                        <span className="capitalize">Lang: <span className="font-bold text-foreground">{sub.language.toLowerCase()}</span></span>
                        <span>Tests Passed: <span className="font-bold text-foreground">{sub.testsPassed} / {sub.totalTests}</span></span>
                        {sub.executionTime !== null && (
                          <span>Avg Time: <span className="font-bold text-foreground">{(sub.executionTime).toFixed(3)}s</span></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between w-full sm:w-auto text-xs shrink-0 font-bold">
                      <div className="px-3 py-1 bg-primary/5 text-primary rounded-lg border border-primary/10">
                        Score: {sub.marksObtained} / {sub.codingProblem?.marks} marks
                      </div>
                      <div className="font-bold">
                        {sub.status === 'SUCCESS' ? (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                            <CheckCircle2 size={13} /> Passed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-600 rounded-full border border-red-500/20" title={sub.errorMessage || sub.status}>
                            <XCircle size={13} /> {sub.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission details error if fail */}
                  {sub.errorMessage && (
                    <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/10 text-destructive text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      <p className="font-bold uppercase mb-1">Error Logs:</p>
                      {sub.errorMessage}
                    </div>
                  )}

                  {/* Code Editor Preview */}
                  <div className="p-4 bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto select-text leading-relaxed min-h-[150px] whitespace-pre border-t-0">
                    {sub.code}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-muted/20 border-t border-border flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 font-bold text-sm transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingAssessmentResults;
