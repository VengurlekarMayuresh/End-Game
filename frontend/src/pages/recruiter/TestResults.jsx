import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import { 
  ArrowLeft, BarChart3, Users, CheckCircle2, XCircle, 
  Clock, Award, ChevronDown, ChevronUp, AlertCircle, FileText,
  TrendingUp, Activity, HelpCircle, Send, Mail, ShieldAlert
} from 'lucide-react';

const TestResults = () => {
  const { id } = useParams(); // testId
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionMetric, setDecisionMetric] = useState('percentage');
  const [decisionThreshold, setDecisionThreshold] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendSummary, setSendSummary] = useState(null);
  const [sendError, setSendError] = useState('');

  // Expand detail view for a specific candidate's attempt
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);

  const fetchResultsAndAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [testRes, resultsRes, analyticsRes] = await Promise.all([
        api.get(`/recruiter/tests/${id}`),
        api.get(`/recruiter/tests/${id}/results`),
        api.get(`/recruiter/tests/${id}/analytics`)
      ]);
      setTest(testRes.data);
      setResults(resultsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch test results or analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultsAndAnalytics();
  }, [id]);

  useEffect(() => {
    if (test?.passingPercentage != null && decisionMetric === 'percentage' && decisionThreshold === '') {
      setDecisionThreshold(String(test.passingPercentage));
    }
  }, [test, decisionMetric, decisionThreshold]);

  const completedResults = results.filter(att => att.status === 'COMPLETED' || att.status === 'AUTO_SUBMITTED');

  const scoreForDecision = (att) => {
    if (decisionMetric === 'score') return Number(att.score || 0);
    return Number(att.percentage || 0);
  };

  const eligibleAttempts = completedResults.filter(att => scoreForDecision(att) >= Number(decisionThreshold || 0));
  const rejectedAttempts = completedResults.filter(att => scoreForDecision(att) < Number(decisionThreshold || 0));

  const handleSendDecisionEmails = async () => {
    setSendingEmails(true);
    setSendError('');
    setSendSummary(null);

    try {
      const { data } = await api.post(`/recruiter/tests/${id}/send-result-emails`, {
        threshold: Number(decisionThreshold),
        metric: decisionMetric,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-muted-foreground">{error || 'Test not found'}</p>
        <button onClick={() => navigate('/recruiter/tests')} className="inline-flex items-center text-primary font-medium hover:underline">
          <ArrowLeft size={16} className="mr-2" /> Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/recruiter/tests')} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{test.name}</h1>
          <p className="text-muted-foreground">Detailed candidate performance and aggregate test analytics</p>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && analytics.totalAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Users size={22} />
            </div>
            <p className="text-3xl font-bold mb-1">{analytics.totalAttempts}</p>
            <p className="text-sm font-semibold text-foreground">Total Candidates</p>
            <p className="text-xs text-muted-foreground mt-0.5">Attempted this test</p>
          </div>
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={22} />
            </div>
            <p className="text-3xl font-bold mb-1">{analytics.passPercentageRate.toFixed(1)}%</p>
            <p className="text-sm font-semibold text-foreground">Passing Rate</p>
            <p className="text-xs text-muted-foreground mt-0.5">{analytics.passCount} passed / {analytics.failCount} failed</p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <Award size={22} />
            </div>
            <p className="text-3xl font-bold mb-1">{analytics.averagePercentage.toFixed(1)}%</p>
            <p className="text-sm font-semibold text-foreground">Average Score</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg: {analytics.averageScore.toFixed(1)} marks</p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4">
              <Clock size={22} />
            </div>
            <p className="text-3xl font-bold mb-1">{Math.round(analytics.averageTimeTaken / 60)} min</p>
            <p className="text-sm font-semibold text-foreground">Average Duration</p>
            <p className="text-xs text-muted-foreground mt-0.5">Time taken per attempt</p>
          </div>
        </div>
      )}

      {/* Decision Email Actions */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Mail size={18} className="text-secondary" /> Send decision emails
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manually choose a threshold and send congratulations to candidates above it, and rejection emails to those below it.
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-muted/40 px-3 py-2 rounded-xl">
            {eligibleAttempts.length} eligible · {rejectedAttempts.length} not selected
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Metric</label>
            <select
              value={decisionMetric}
              onChange={e => setDecisionMetric(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              <option value="percentage">Percentage</option>
              <option value="score">Marks</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Minimum {decisionMetric === 'score' ? 'marks' : 'percentage'}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={decisionThreshold}
              onChange={e => setDecisionThreshold(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder={decisionMetric === 'score' ? 'e.g. 15' : 'e.g. 40'}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSendDecisionEmails}
              disabled={sendingEmails || !Number.isFinite(Number(decisionThreshold))}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              <Send size={16} /> {sendingEmails ? 'Sending...' : 'Send Emails'}
            </button>
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
            <p className="text-2xl font-bold mt-1">{decisionThreshold} {decisionMetric === 'score' ? 'marks' : '%'}</p>
          </div>
        </div>

        {/* Candidate lists for preview */}
        {completedResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
            <div className="border border-border rounded-xl p-4 bg-background max-h-64 overflow-y-auto relative">
              <h4 className="font-bold text-green-600 mb-3 sticky top-0 bg-background pb-2 border-b border-border z-10 flex items-center justify-between">
                <span>Eligible</span>
                <span className="text-xs bg-green-500/10 px-2 py-0.5 rounded-full">{eligibleAttempts.length}</span>
              </h4>
              <div className="space-y-2">
                {eligibleAttempts.map(att => (
                  <div key={att.id} className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                    <span className="font-medium truncate mr-2">{att.student?.user?.fullName || 'Anonymous'}</span>
                    <span className="text-xs font-bold whitespace-nowrap text-green-600">
                      {scoreForDecision(att)} {decisionMetric === 'score' ? 'marks' : '%'}
                    </span>
                  </div>
                ))}
                {eligibleAttempts.length === 0 && <p className="text-xs text-muted-foreground">No eligible candidates.</p>}
              </div>
            </div>
            
            <div className="border border-border rounded-xl p-4 bg-background max-h-64 overflow-y-auto relative">
              <h4 className="font-bold text-destructive mb-3 sticky top-0 bg-background pb-2 border-b border-border z-10 flex items-center justify-between">
                <span>Not Selected</span>
                <span className="text-xs bg-destructive/10 px-2 py-0.5 rounded-full">{rejectedAttempts.length}</span>
              </h4>
              <div className="space-y-2">
                {rejectedAttempts.map(att => (
                  <div key={att.id} className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                    <span className="font-medium truncate mr-2">{att.student?.user?.fullName || 'Anonymous'}</span>
                    <span className="text-xs font-bold whitespace-nowrap text-destructive">
                      {scoreForDecision(att)} {decisionMetric === 'score' ? 'marks' : '%'}
                    </span>
                  </div>
                ))}
                {rejectedAttempts.length === 0 && <p className="text-xs text-muted-foreground">No rejected candidates.</p>}
              </div>
            </div>
          </div>
        )}

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

      {/* Breakdowns */}
      {analytics && analytics.totalAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category-wise Performance */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Activity size={18} className="text-secondary" /> Category-wise Avg Performance
            </h3>
            {Object.keys(analytics.categoryPerformance).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No category data available</p>
            ) : (
              <div className="space-y-3.5">
                {Object.keys(analytics.categoryPerformance).map(cat => {
                  const val = analytics.categoryPerformance[cat].averagePercentage;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-foreground capitalize">{cat}</span>
                        <span className="text-secondary">{val.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Difficulty-wise Performance */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <BarChart3 size={18} className="text-secondary" /> Difficulty-wise Avg Performance
            </h3>
            {Object.keys(analytics.difficultyPerformance).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No difficulty data available</p>
            ) : (
              <div className="space-y-3.5">
                {Object.keys(analytics.difficultyPerformance).map(diff => {
                  const val = analytics.difficultyPerformance[diff].averagePercentage;
                  return (
                    <div key={diff} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-foreground">{diff}</span>
                        <span className="text-secondary">{val.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate attempts list */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users size={20} /> Candidate Attempts List
        </h2>

        {results.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            No attempts recorded yet for this test.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
            {results.map((att) => {
              const studentName = att.student?.user?.fullName || 'Anonymous';
              const studentEmail = att.student?.user?.email || 'N/A';
              const studentPic = att.student?.user?.profilePicture;
              const isExpanded = expandedAttemptId === att.id;

              return (
                <div key={att.id} className="p-5 flex flex-col gap-4">
                  
                  {/* Summary bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 overflow-hidden">
                        {studentPic ? (
                          <img src={getImageUrl(studentPic)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={18} className="text-secondary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{studentName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{studentEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <div className="text-right">
                        <p className="font-bold text-base">{att.score} marks</p>
                        <p className="text-xs text-muted-foreground">{att.percentage.toFixed(1)}%</p>
                      </div>

                      <div className="flex items-center gap-1.5 font-bold text-xs shrink-0">
                        {att.passed ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-full">
                            <CheckCircle2 size={13} /> Pass
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-600 rounded-full">
                            <XCircle size={13} /> Fail
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium">{new Date(att.completedAt || att.startedAt).toLocaleDateString()}</p>
                        <p className="mt-0.5">{Math.round(att.timeTaken / 60) || 0}m {att.timeTaken % 60 || 0}s</p>
                      </div>

                      <button
                        onClick={() => setExpandedAttemptId(isExpanded ? null : att.id)}
                        className="p-1.5 hover:bg-muted rounded-xl transition-all text-muted-foreground"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Detailed breakdown when expanded */}
                  {isExpanded && (
                    <div className="mt-2 border-t border-border pt-4 space-y-4 bg-muted/10 p-4 rounded-xl">
                      
                      {/* Metric breakdown summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                        <div className="p-3 bg-card border rounded-lg">
                          <p className="text-muted-foreground">Correct Answers</p>
                          <p className="text-base font-bold text-green-600 mt-1">{att.correctAnswersCount}</p>
                        </div>
                        <div className="p-3 bg-card border rounded-lg">
                          <p className="text-muted-foreground">Wrong Answers</p>
                          <p className="text-base font-bold text-red-500 mt-1">{att.wrongAnswersCount}</p>
                        </div>
                        <div className="p-3 bg-card border rounded-lg">
                          <p className="text-muted-foreground">Skipped Questions</p>
                          <p className="text-base font-bold text-yellow-600 mt-1">{att.skippedCount}</p>
                        </div>
                        <div className="p-3 bg-card border rounded-lg">
                          <p className="text-muted-foreground">Submission Status</p>
                          <p className="text-base font-bold text-foreground mt-1 capitalize">{att.status.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {/* Proctoring Report */}
                      {att.proctoringSession && (
                        <div className="space-y-3 mt-4 border-t border-border pt-4">
                          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            <ShieldAlert size={16} className="text-primary animate-pulse" /> Integrity Proctoring Report
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-card border rounded-lg space-y-1">
                              <p className="text-muted-foreground uppercase font-bold text-[9px]">Integrity Risk Score</p>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <p className={`text-xl font-extrabold ${
                                  att.proctoringSession.riskLevel === 'CRITICAL' || att.proctoringSession.riskLevel === 'HIGH'
                                    ? 'text-red-500'
                                    : att.proctoringSession.riskLevel === 'MEDIUM'
                                    ? 'text-amber-500'
                                    : 'text-green-600'
                                }`}>
                                  {att.proctoringSession.riskScore} / 100
                                </p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  att.proctoringSession.riskLevel === 'CRITICAL' || att.proctoringSession.riskLevel === 'HIGH'
                                    ? 'bg-red-500/10 text-red-500'
                                    : att.proctoringSession.riskLevel === 'MEDIUM'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-green-600/10 text-green-600'
                                }`}>
                                  {att.proctoringSession.riskLevel}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 bg-card border rounded-lg space-y-1">
                              <p className="text-muted-foreground uppercase font-bold text-[9px]">Assessment Stage</p>
                              <p className="text-base font-bold text-foreground mt-1 capitalize">
                                {att.proctoringSession.stage.toLowerCase()} Test
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Status: {att.proctoringSession.status}
                              </p>
                            </div>
                            <div className="p-3 bg-card border rounded-lg space-y-1">
                              <p className="text-muted-foreground uppercase font-bold text-[9px]">Proctor Events</p>
                              <p className="text-base font-bold text-foreground mt-1">
                                {att.proctoringSession.events?.length || 0} events logged
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Started: {new Date(att.proctoringSession.startedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* Proctoring Event List */}
                          {att.proctoringSession.events && att.proctoringSession.events.length > 0 && (
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
                                  {att.proctoringSession.events.map((evt, idx) => (
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

                      {/* Evaluated Answers */}
                      {att.answers && att.answers.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <p className="text-sm font-bold text-foreground">Question-by-Question Evaluation:</p>
                          <div className="space-y-2">
                            {att.answers.map((ans, idx) => {
                              // Find corresponding question in test definition
                              const qDef = test.testQuestions?.find(tq => tq.questionId === ans.questionId)?.question;
                              if (!qDef) return null;

                              return (
                                <div key={idx} className="p-4 bg-card border rounded-xl space-y-2 text-xs">
                                  <div className="flex justify-between items-start gap-4">
                                    <p className="font-semibold leading-relaxed flex-1">
                                      <span className="text-muted-foreground mr-1.5">Q{idx+1}.</span>
                                      {qDef.statement}
                                    </p>
                                    <span className={`px-2 py-0.5 rounded font-bold ${
                                      ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {ans.isCorrect ? `+${ans.marksObtained}` : `${ans.marksObtained}`} marks
                                    </span>
                                  </div>

                                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] pt-1">
                                    <div className="flex items-center gap-1 bg-muted/40 p-2 rounded-lg">
                                      <span className="font-semibold text-muted-foreground">Selected answer:</span>
                                      <span className={ans.isCorrect ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                                        {ans.selectedOption || '(Skipped)'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                                      <span className="font-semibold text-green-700">Correct answer:</span>
                                      <span className="text-green-700 font-semibold">{qDef.correctAnswer}</span>
                                    </div>
                                  </div>

                                  {qDef.explanation && !ans.isCorrect && (
                                    <p className="text-muted-foreground text-[10px] bg-muted/20 p-2 rounded-md italic mt-1 leading-relaxed">
                                      Explanation: {qDef.explanation}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResults;
