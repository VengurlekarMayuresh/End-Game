import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import {
  ArrowLeft, Award, CheckCircle2, AlertTriangle, Layers, Database,
  Code, Cpu, Clock, Check, X, ShieldCheck
} from 'lucide-react';

const ResumeAptitudeResults = () => {
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/student/resume-aptitude/session/${attemptId}/results`);
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
  }, [attemptId]);

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

  const { attempt, scoreResult } = data;
  const student = attempt?.student;
  const user = student?.user;
  const breakdown = scoreResult?.categoryBreakdown || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 lg:p-6">
      <div>
        <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award size={24} className="text-primary" /> Resume-Driven Aptitude Results
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
              Weighted Composite: {scoreResult.weightedCompositeScore}%
            </span>
          </div>
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
