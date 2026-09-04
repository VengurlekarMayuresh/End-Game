import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  ArrowLeft, Search, Sparkles, ThumbsUp, ThumbsDown, Eye,
  CheckCircle2, CircleDashed, GraduationCap, Briefcase,
  Award, Target, Coffee, AlertTriangle, Square, CheckSquare
} from 'lucide-react';

const getScoreColor = (score) => {
  if (score >= 70) return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500/20' };
  if (score >= 40) return { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500/20' };
  return { bg: 'bg-destructive/10', text: 'text-destructive', ring: 'ring-destructive/20' };
};

const scoreLabel = (score) => {
  if (score >= 70) return 'Strong match';
  if (score >= 40) return 'Moderate match';
  return 'Low match';
};

const SkillPill = ({ name, status }) => {
  const base = 'px-2 py-0.5 rounded-full text-[11px] font-medium';
  if (status === 'matched') return <span className={`${base} bg-emerald-500/10 text-emerald-600`}>{name}</span>;
  if (status === 'partial') return <span className={`${base} bg-amber-500/10 text-amber-600`}>{name}</span>;
  return <span className={`${base} bg-muted text-muted-foreground line-through`}>{name}</span>;
};

const RequirementItem = ({ label, status }) => {
  const Icon = status === 'matched' ? CheckCircle2 : status === 'partial' ? Coffee : CircleDashed;
  const color = status === 'matched' ? 'text-emerald-600' : status === 'partial' ? 'text-amber-600' : 'text-muted-foreground';
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={14} className={`${color} shrink-0`} />
      <span className="text-foreground/90">{label}</span>
    </div>
  );
};

const ScoreBreakdown = ({ breakdown }) => {
  const items = [
    { key: 'skills', label: 'Skills', weight: 40 },
    { key: 'experience', label: 'Experience', weight: 25 },
    { key: 'education', label: 'Education', weight: 15 },
    { key: 'certifications', label: 'Certifications', weight: 10 },
    { key: 'similarity', label: 'Text Match', weight: 10 },
  ];

  return (
    <div className="space-y-2 mt-3">
      {items.map(item => {
        const val = breakdown?.[item.key];
        const pct = val ? Math.min(100, Math.round((val.score / item.weight) * 100)) : 0;
        const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-muted';
        return (
          <div key={item.key} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-muted-foreground">{item.label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-14 text-right font-medium">{val?.score?.toFixed?.(0) ?? 0}/{item.weight}</span>
          </div>
        );
      })}
    </div>
  );
};

const CandidateCard = ({ application, isSelected, toggleSelection, onStatusChange, updatingId, expanded, onToggleExpand }) => {
  const student = application.student;
  const user = student?.user;
  const ms = application.matchScore;
  const score = ms?.score ?? 0;
  const colors = getScoreColor(score);
  const education = student?.education?.[0];
  const resume = student?.documents?.[0];

  const matchedSkills = (ms?.matched || []).filter(x => x.category === 'skills').map(x => x.requirement);
  const partialSkills = (ms?.partiallyMatched || []).filter(x => x.category === 'skills').map(x => x.requirement);
  const allSkillReqs = [...ms?.matched?.filter(x => x.category === 'skills')?.map(x => x.requirement) ?? [],
    ...ms?.partiallyMatched?.filter(x => x.category === 'skills')?.map(x => x.requirement) ?? [],
    ...ms?.missing?.filter(x => x.category === 'skills')?.map(x => x.requirement) ?? []];

  const handleAction = (status, stage = undefined) => {
    onStatusChange(application.id, status, stage);
  };

  const isBusy = updatingId === application.id;

  return (
    <div className={`bg-card border rounded-2xl p-5 hover:shadow-md transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'} ${application.status === 'SHORTLISTED' ? 'ring-2 ring-emerald-500/30' : application.status === 'REJECTED' ? 'ring-2 ring-destructive/20' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button onClick={() => toggleSelection?.(application.id)} className="mt-1 text-muted-foreground hover:text-primary shrink-0">
          {isSelected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
        </button>
        {/* Score badge */}
        <div className={`w-16 h-16 rounded-2xl ${colors.bg} ${colors.text} flex flex-col items-center justify-center shrink-0`}>
          <span className="text-xl font-bold leading-none">{score}</span>
          <span className="text-[10px] font-semibold mt-0.5">MATCH</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {user?.profilePicture
                  ? <img src={getImageUrl(user.profilePicture)} alt={user.fullName} className="w-full h-full object-cover" />
                  : <GraduationCap size={20} className="text-primary" />}
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">{user?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                {scoreLabel(score)}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                {application.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground">
            {education && (
              <span className="flex items-center gap-1">
                <GraduationCap size={11} /> {education.degree} · {education.institution}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase size={11} /> Applied {new Date(application.appliedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {student?.skills?.length || 0} skills · {student?.experiences?.length || 0} experiences
            </span>
          </div>

          {/* Matched skills */}
          {allSkillReqs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {allSkillReqs.map(skill => {
                const status = matchedSkills.includes(skill) ? 'matched' : partialSkills.includes(skill) ? 'partial' : 'missing';
                return <SkillPill key={skill} name={skill} status={status} />;
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50">
            <button
              onClick={() => handleAction('SHORTLISTED', 'RESUME')}
              disabled={isBusy || application.status === 'SHORTLISTED'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              <ThumbsUp size={13} /> {isBusy && updatingId === application.id ? 'Updating...' : 'Shortlist (Resume)'}
            </button>
            <button
              onClick={async () => {
                try {
                  await api.post('/recruiter/assign-resume-aptitude', { applicationId: application.id });
                  alert('Assigned candidate to Role-Specific Aptitude Round!');
                } catch (e) {
                  alert(e.response?.data?.message || 'Failed to assign round');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-violet-500/10 text-violet-600 font-semibold hover:bg-violet-500/20 transition-colors"
            >
              <Sparkles size={13} /> Assign Role-Specific Aptitude
            </button>
            <Link
              to={`/recruiter/resume-aptitude/application/${application.id}/results`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              <Award size={13} /> View Role-Specific Results
            </Link>
            <button
              onClick={() => handleAction('REJECTED')}
              disabled={isBusy || application.status === 'REJECTED'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              <ThumbsDown size={13} /> Reject
            </button>
            <button
              onClick={() => handleAction('REVIEWING')}
              disabled={isBusy || application.status === 'REVIEWING'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-blue-500/10 text-blue-600 font-semibold hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
            >
              <Eye size={13} /> Mark Reviewing
            </button>
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              {expanded ? 'Hide breakdown' : 'Why this score?'}
            </button>
            {resume && (
              <a href={`http://localhost:5000${resume.url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-secondary hover:underline font-medium ml-auto">
                Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50 grid lg:grid-cols-2 gap-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Score Breakdown</p>
            <ScoreBreakdown breakdown={ms?.breakdown} />
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{ms?.explanation}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Requirements</p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {(ms?.matched || []).map((req, i) => (
                <RequirementItem key={`m${i}`} label={req.requirement} status="matched" />
              ))}
              {(ms?.partiallyMatched || []).map((req, i) => (
                <RequirementItem key={`p${i}`} label={req.requirement} status="partial" />
              ))}
              {(ms?.missing || []).map((req, i) => (
                <RequirementItem key={`x${i}`} label={req.requirement} status="missing" />
              ))}
              {!ms?.matched?.length && !ms?.partiallyMatched?.length && !ms?.missing?.length && (
                <p className="text-sm text-muted-foreground">No specific requirements detected in job description.</p>
              )}
            </div>
            {ms?.matched?.length + ms?.partiallyMatched?.length + ms?.missing?.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">Please ensure the job description lists skills and qualifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SmartShortlist = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  // Score threshold filter
  const [minScore, setMinScore] = useState(0);
  // Status filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;
    const fetchScores = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/recruiter/jobs/${jobId}/match-scores`);
        if (!mounted) return;
        setApplications(data.applications);
        setJobTitle(data.jobTitle || '');
        setRequirements(data.requirements || null);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load match scores');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchScores();
    return () => { mounted = false; };
  }, [jobId]);

  const handleStatusChange = async (appId, status, stage = undefined) => {
    setUpdatingId(appId);
    try {
      await api.put(`/recruiter/applications/${appId}/status`, { status, stage });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelection = (id) => {
    const n = new Set(selectedIds);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelectedIds(n);
  };

  const selectAll = () => {
    if (selectedIds.size === sortedApplications.length && sortedApplications.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedApplications.map(a => a.id)));
    }
  };

  const handleBulkAction = async (status, stage = undefined) => {
    if (selectedIds.size === 0) return;
    setIsBulkActioning(true);
    try {
      await api.put('/recruiter/bulk-shortlist', {
        applicationIds: Array.from(selectedIds),
        status,
        stage
      });
      setApplications(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, status } : a));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkActioning(false);
    }
  };

  const sortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      const name = app.student?.user?.fullName?.toLowerCase() || '';
      const email = app.student?.user?.email?.toLowerCase() || '';
      const score = app.matchScore?.score || 0;
      const matchesSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      const matchesScore = score >= minScore;
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      return matchesSearch && matchesScore && matchesStatus;
    });
    return [...filtered].sort((a, b) => (b.matchScore?.score || 0) - (a.matchScore?.score || 0));
  }, [applications, search, minScore, statusFilter]);

  const stats = useMemo(() => {
    const total = applications.length;
    if (total === 0) return { total: 0, avg: '0', best: 0, shortlisted: 0, rejected: 0, interview: 0 };
    const avgScore = applications.reduce((sum, app) => sum + (app.matchScore?.score || 0), 0) / total;
    const best = Math.max(...applications.map(app => app.matchScore?.score || 0));
    return {
      total,
      avg: avgScore.toFixed(0),
      best,
      shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
      rejected: applications.filter(a => a.status === 'REJECTED').length,
      interview: applications.filter(a => a.status === 'INTERVIEW').length,
    };
  }, [applications]);

  const hasStructuredReqs = useMemo(() => {
    const r = requirements;
    return Boolean(
      r?.skills?.length > 0 ||
      r?.experience?.minYears > 0 ||
      r?.education?.degrees?.length > 0 ||
      r?.certifications?.length > 0
    );
  }, [requirements]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-44 bg-muted rounded-2xl" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-10 text-center space-y-4">
        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
          <CircleDashed size={28} />
        </div>
        <h1 className="text-2xl font-bold">Shortlisting unavailable</h1>
        <p className="text-muted-foreground">{error}</p>
        <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold">
          <ArrowLeft size={16} /> Back to My Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft size={16} /> Back to My Jobs
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles size={24} className="text-secondary" /> Smart Shortlist — Resume Round
          </h1>
          <p className="text-muted-foreground mt-1">Candidates ranked by resume match against <span className="font-medium text-foreground">{jobTitle}</span></p>
        </div>
        {jobTitle && (
          <Link
            to={`/recruiter/jobs/${jobId}/applications`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
          >
            View all applicants
          </Link>
        )}
      </div>

      {/* Low-coverage warning */}
      {!hasStructuredReqs && applications.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-xl text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Few structured requirements detected in this job description</p>
            <p className="text-amber-600/80 mt-0.5">
              Scores are based on text similarity only. Add skills, experience, education and certifications to the job description &amp; re-post to get accurate matching.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '' },
          { label: 'Avg Match', value: `${stats.avg}%`, color: 'text-secondary' },
          { label: 'Best Match', value: `${stats.best}%`, color: 'text-emerald-600' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-violet-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-destructive' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Bulk Actions bar */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        {/* Top row: search + score threshold + status filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
              placeholder="Search candidates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Score threshold */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">Min score:</span>
            <input
              type="range" min="0" max="100" step="5" value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="w-28 accent-violet-500"
            />
            <span className="font-bold w-10 text-center bg-muted rounded-lg px-2 py-0.5">{minScore}%</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm rounded-xl border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW">Interview</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Bottom row: select all + bulk actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          <button onClick={selectAll} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            {selectedIds.size === sortedApplications.length && sortedApplications.length > 0
              ? <CheckCircle2 size={18} className="text-primary" />
              : <CircleDashed size={18} />}
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select All'}
          </button>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap border-l pl-3 border-border">
              <button
                onClick={() => handleBulkAction('SHORTLISTED', 'RESUME')}
                disabled={isBulkActioning}
                className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ThumbsUp size={14} /> Shortlist (Resume) & Email
              </button>
              <button
                onClick={() => handleBulkAction('REJECTED')}
                disabled={isBulkActioning}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ThumbsDown size={14} /> Reject & Email
              </button>
              <button
                onClick={() => handleBulkAction('REVIEWING')}
                disabled={isBulkActioning}
                className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Eye size={14} /> Mark Reviewing
              </button>
              <span className="text-xs text-muted-foreground ml-1">
                Tip: set min score + select all to bulk-shortlist top candidates
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Requirement summary */}
      {requirements && (requirements.skills?.length > 0 || requirements.experience || requirements.education) && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Target size={16} className="text-secondary" /> Extracted Job Requirements
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {requirements.skills?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {requirements.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-secondary/10 text-secondary text-[11px] font-medium rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {requirements.experience && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Experience</p>
                <p className="text-foreground/90">
                  {requirements.experience.minYears > 0 ? `${requirements.experience.minYears}${requirements.experience.maxYears ? `–${requirements.experience.maxYears}` : '+'} years` : 'Any'}
                  {requirements.experience.experienceLevel ? ` · ${requirements.experience.experienceLevel}` : ''}
                </p>
              </div>
            )}
            {requirements.education && requirements.education.degrees?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Education</p>
                <p className="text-foreground/90">{requirements.education.degrees.join(', ')}</p>
                {requirements.education.requiredFields?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{requirements.education.requiredFields.join(', ')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidates */}
      {sortedApplications.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No candidates match your filters</h3>
          <p className="text-muted-foreground text-sm">Try lowering the minimum score or clearing the status filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedApplications.map(application => (
            <CandidateCard
              key={application.id}
              application={application}
              isSelected={selectedIds.has(application.id)}
              toggleSelection={toggleSelection}
              onStatusChange={handleStatusChange}
              updatingId={updatingId}
              expanded={expandedId === application.id}
              onToggleExpand={() => setExpandedId(expandedId === application.id ? null : application.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartShortlist;
