import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
  ArrowLeft, Award, CheckCircle2, AlertTriangle, Layers, Database,
  Code, Cpu, Clock, Check, X, ShieldCheck, Sparkles, Sliders, UserCheck, XCircle
} from 'lucide-react';

const ResumeAptitudeResults = () => {
  const { attemptId, applicationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Passing threshold state & advancement state
  const [threshold, setThreshold] = useState(40);
  const [advancing, setAdvancing] = useState(false);
  const [advancementResult, setAdvancementResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      try {
        setLoading(true);
        let endpoint = `/student/resume-aptitude/session/${attemptId}/results`;
        if (applicationId) {
          endpoint = `/recruiter/resume-aptitude/application/${applicationId}/results`;
        }
        const res = await api.get(endpoint);
        if (!mounted) return;
        setData(res.data);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchResults();
    return () => { mounted = false; };
  }, [attemptId, applicationId]);

  const handleAdvanceCandidate = async (override = false) => {
    const appId = data?.application?.id || applicationId;
    if (!appId) {
      alert('Application ID unavailable for advancement.');
      return;
    }

    setAdvancing(true);
    try {
      const res = await api.post(`/recruiter/resume-aptitude/application/${appId}/advance`, {
        threshold,
        status: 'INTERVIEW',
        override
      });
      setAdvancementResult({ success: true, message: res.data.message });
      alert(res.data.message || 'Candidate advanced to GD / Interview Round!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to advance candidate');
      setAdvancementResult({ success: false, message: err.response?.data?.message });
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-6">
        <div className="h-10 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto bg-card border rounded-2xl p-8 text-center space-y-4 my-10">
        <AlertTriangle size={36} className="text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Results Unavailable</h2>
        <p className="text-muted-foreground text-sm">{error || 'Data missing'}</p>
        <Link to="/recruiter/jobs" className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
      </div>
    );
  }

  const { attempt, scoreResult, application } = data;
  const student = attempt?.student || application?.student;
  const user = student?.user;
  const job = application?.job;
  const breakdown = scoreResult?.categoryBreakdown || {};

  const candidateScore = scoreResult?.weightedCompositeScore ?? scoreResult?.percentage ?? 0;
  const clearsThreshold = candidateScore >= threshold;

  // Render unattempted candidate view with direct advancement provision
  if (!attempt) {
    const appId = application?.id || applicationId;
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-6">
        <div>
          <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft size={16} /> Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award size={24} className="text-primary" /> Role-Specific Aptitude Round
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Candidate: <span className="font-semibold text-foreground">{user?.fullName || 'Candidate'}</span> ({user?.email}) {job ? `· Applied for ${job.title}` : ''}
          </p>
        </div>

        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Candidate Has Not Attempted This Round Yet</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              This candidate has not started or completed the 45-minute Role-Specific Aptitude Round. You can assign the test to them or directly advance them to the next round.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={async () => {
                try {
                  await api.post('/recruiter/assign-resume-aptitude', { applicationId: appId });
                  alert(`Assigned ${user?.fullName || 'candidate'} to Role-Specific Aptitude Round!`);
                } catch (e) {
                  alert(e.response?.data?.message || 'Failed to assign round');
                }
              }}
              className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles size={16} /> Assign Role-Specific Aptitude Round
            </button>

            <button
              onClick={() => handleAdvanceCandidate(true)}
              disabled={advancing || advancementResult?.success}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
            >
              <UserCheck size={16} />
              {advancementResult?.success ? '✓ Advanced to Next Round (GD / Interview)' : advancing ? 'Advancing Candidate...' : 'Proceed Candidate to Next Round (GD / Interview)'}
            </button>
          </div>

          {advancementResult && (
            <p className={`text-xs font-bold mt-2 ${advancementResult.success ? 'text-emerald-600' : 'text-destructive'}`}>
              {advancementResult.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 lg:p-6">
      <div>
        <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award size={24} className="text-primary" /> Role-Specific Aptitude Results
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Candidate: <span className="font-semibold text-foreground">{user?.fullName || 'Candidate'}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {attempt.passed ? 'PASSED ROUND' : 'FAILED'}
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              Weighted Composite: {candidateScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Evaluation & Next Round Advancement Panel */}
      <div className="bg-gradient-to-r from-card via-muted/30 to-card border-2 border-primary/20 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sliders size={18} className="text-primary" /> Threshold & Progression Control
            </h2>
            <p className="text-xs text-muted-foreground">Set evaluation threshold and advance candidate to GD / Interview (Modules 14-15)</p>
          </div>

          {/* Threshold Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Passing Threshold:</span>
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {[40, 50, 60, 70].map(pct => (
                <button
                  key={pct}
                  onClick={() => setThreshold(pct)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${threshold === pct ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-center">
          <div className="p-3.5 bg-background rounded-xl border space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Candidate Score</p>
            <p className="text-2xl font-extrabold text-foreground">{candidateScore}%</p>
          </div>

          <div className="p-3.5 bg-background rounded-xl border space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Configured Threshold</p>
            <p className="text-2xl font-extrabold text-primary">{threshold}%</p>
          </div>

          <div className="p-3.5 bg-background rounded-xl border space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Evaluation Result</p>
            {clearsThreshold ? (
              <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Clears Threshold ({candidateScore}% ≥ {threshold}%)
              </p>
            ) : (
              <p className="text-sm font-bold text-destructive flex items-center gap-1.5">
                <XCircle size={16} /> Below Threshold ({candidateScore}% &lt; {threshold}%)
              </p>
            )}
          </div>
        </div>

        {/* Advancement Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
          {clearsThreshold ? (
            <button
              onClick={() => handleAdvanceCandidate(false)}
              disabled={advancing || advancementResult?.success}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
            >
              <Sparkles size={16} />
              {advancementResult?.success ? '✓ Advanced to Next Round (GD / Interview)' : advancing ? 'Advancing Candidate...' : 'Shortlist & Proceed to Next Round (GD / Interview)'}
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleAdvanceCandidate(true)}
                disabled={advancing || advancementResult?.success}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
              >
                <UserCheck size={14} /> Override Threshold & Advance Anyway
              </button>
              <span className="text-xs text-muted-foreground font-medium">Candidate is below {threshold}% passing mark.</span>
            </div>
          )}

          {advancementResult && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${advancementResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {advancementResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Project Ladder', icon: Layers, stat: breakdown.projectLadder, weight: '40%' },
          { label: 'Core CS Theory', icon: Cpu, stat: breakdown.coreCs, weight: '25%' },
          { label: 'SQL Sandbox', icon: Database, stat: breakdown.sql, weight: '20%' },
          { label: 'DSA Bank', icon: Code, stat: breakdown.dsa, weight: '15%' },
        ].map(cat => (
          <div key={cat.label} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><cat.icon size={14} className="text-primary" /> {cat.label}</span>
              <span>Weight {cat.weight}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {cat.stat?.score ?? 0} <span className="text-xs text-muted-foreground font-normal">/ {cat.stat?.max ?? 0}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{cat.stat?.correct ?? 0} of {cat.stat?.count ?? 0} answered correctly</p>
          </div>
        ))}
      </div>

      {/* Skill Gap Analysis Matrix */}
      {attempt.skillExtraction && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" /> Extracted Skill Gap Analysis
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
              <p className="font-semibold text-emerald-600 mb-2">Matched Skills (JD & Resume)</p>
              <div className="flex flex-wrap gap-1">
                {(attempt.skillExtraction.matchedSkills || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full">{s}</span>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
              <p className="font-semibold text-amber-600 mb-2">Claimed Unverified Skills</p>
              <div className="flex flex-wrap gap-1">
                {(attempt.skillExtraction.claimedUnverifiedSkills || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full">{s}</span>
                ))}
              </div>
            </div>

            <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/20">
              <p className="font-semibold text-destructive mb-2">Missing Skills from JD</p>
              <div className="flex flex-wrap gap-1">
                {(attempt.skillExtraction.missingSkills || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Question Answers */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-base">Graded Answer Audit Log</h2>
        <div className="space-y-3">
          {(scoreResult.gradedAnswers || []).map((ans, idx) => (
            <div key={ans.questionId} className={`p-4 rounded-xl border text-xs space-y-2 ${ans.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5">
                  {ans.isCorrect ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-destructive" />}
                  Q{idx + 1}: [{ans.category}] {ans.topic} {ans.level ? `(Level ${ans.level})` : ''}
                </span>
                <span className="font-mono font-semibold">{ans.marksObtained} / {ans.maxMarks} marks</span>
              </div>

              <p className="text-foreground/90 font-medium">{ans.statement}</p>
              
              <div className="grid sm:grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  <span className="font-semibold">Candidate Answer: </span>
                  <span className={ans.isCorrect ? 'text-emerald-600 font-bold' : 'text-destructive font-bold'}>
                    {ans.studentAnswer || '(No answer)'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Canonical Answer: </span>
                  <span className="text-foreground font-semibold">{ans.canonicalAnswer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeAptitudeResults;
