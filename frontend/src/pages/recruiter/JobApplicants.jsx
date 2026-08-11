import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  ArrowLeft, Search, ChevronDown, Clock, Star,
  CheckCircle2, CircleDashed, GraduationCap, Briefcase,
  UserCircle, Download, MessageSquare, BadgeCheck, Users
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently applied' },
  { value: 'exam', label: 'Exam completed first' },
  { value: 'score', label: 'Highest score' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'status', label: 'Application status' },
];

const getLatestEducation = (student) => student?.education?.[0] || null;

const formatScore = (examSummary) => {
  const aptitude = examSummary?.aptitude;
  const coding = examSummary?.coding;

  if (aptitude?.completed && coding?.completed) {
    return `Aptitude ${aptitude.percentage?.toFixed(1) ?? aptitude.score?.toFixed?.(1) ?? aptitude.score}%, Coding ${coding.score?.toFixed?.(1) ?? coding.score}`;
  }

  if (aptitude?.completed) {
    return `${aptitude.percentage?.toFixed(1) ?? aptitude.score?.toFixed?.(1) ?? aptitude.score}% aptitude`;
  }

  if (coding?.completed) {
    return `${coding.score?.toFixed?.(1) ?? coding.score} coding marks`;
  }

  return 'No exam yet';
};

const ApplicantCard = ({ application }) => {
  const student = application.student;
  const user = student?.user;
  const education = getLatestEducation(student);
  const resume = student?.documents?.[0];
  const examSummary = application.examSummary;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {user?.profilePicture
            ? <img src={getImageUrl(user.profilePicture)} alt={user.fullName} className="w-full h-full object-cover" />
            : <UserCircle size={24} className="text-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-lg">{user?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                {application.status}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${examSummary?.completed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                {examSummary?.completed ? 'Exam completed' : 'Exam pending'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground">
            {education && (
              <span className="flex items-center gap-1">
                <GraduationCap size={11} /> {education.degree} · {education.institution}
              </span>
            )}
            <span className="flex items-center gap-1 text-secondary">
              <Briefcase size={11} /> Applied on {new Date(application.appliedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Star size={11} /> {formatScore(examSummary)}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Aptitude Test</p>
              {examSummary?.aptitude ? (
                <div className="mt-1 text-sm">
                  <p className="font-semibold text-foreground">{examSummary.aptitude.percentage?.toFixed?.(1) ?? examSummary.aptitude.percentage ?? examSummary.aptitude.score}%</p>
                  <p className="text-xs text-muted-foreground">{examSummary.aptitude.passed ? 'Passed' : 'Completed'} · {examSummary.aptitude.status}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5"><CircleDashed size={14} /> Not attempted</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Coding Assessment</p>
              {examSummary?.coding ? (
                <div className="mt-1 text-sm">
                  <p className="font-semibold text-foreground">{examSummary.coding.score?.toFixed?.(1) ?? examSummary.coding.score} marks</p>
                  <p className="text-xs text-muted-foreground">{examSummary.coding.passed ? 'Passed' : 'Completed'} · {examSummary.coding.status}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5"><CircleDashed size={14} /> Not attempted</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
            {resume && (
              <a href={`http://localhost:5000${resume.url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-secondary hover:underline font-medium">
                <Download size={12} /> Download Resume
              </a>
            )}
            {application.examSummary?.completed && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <BadgeCheck size={12} /> Score-ready candidate
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} /> {new Date(application.appliedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const JobApplicants = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('exam');

  useEffect(() => {
    let mounted = true;

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/recruiter/jobs/${jobId}/applications`);
        if (mounted) setApplications(data);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load applicants');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchApplications();

    return () => { mounted = false; };
  }, [jobId]);

  const job = applications[0]?.job;

  const sortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      const name = app.student?.user?.fullName?.toLowerCase() || '';
      const email = app.student?.user?.email?.toLowerCase() || '';
      return !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    });

    const scoreFor = (app) => app.examSummary?.bestScore ?? -1;

    return [...filtered].sort((left, right) => {
      if (sortBy === 'name') {
        return (left.student?.user?.fullName || '').localeCompare(right.student?.user?.fullName || '');
      }

      if (sortBy === 'status') {
        return (left.status || '').localeCompare(right.status || '') || new Date(right.appliedAt) - new Date(left.appliedAt);
      }

      if (sortBy === 'recent') {
        return new Date(right.appliedAt) - new Date(left.appliedAt);
      }

      if (sortBy === 'score') {
        return scoreFor(right) - scoreFor(left) || new Date(right.appliedAt) - new Date(left.appliedAt);
      }

      const leftCompleted = left.examSummary?.completed ? 1 : 0;
      const rightCompleted = right.examSummary?.completed ? 1 : 0;
      return rightCompleted - leftCompleted || scoreFor(right) - scoreFor(left) || new Date(right.appliedAt) - new Date(left.appliedAt);
    });
  }, [applications, search, sortBy]);

  const stats = useMemo(() => {
    const total = applications.length;
    const completed = applications.filter(app => app.examSummary?.completed).length;
    const reviewed = applications.filter(app => ['SHORTLISTED', 'INTERVIEW', 'OFFERED'].includes(app.status)).length;
    const averageScore = completed > 0
      ? (applications.reduce((sum, app) => sum + (app.examSummary?.bestScore ?? 0), 0) / completed).toFixed(1)
      : '0.0';

    return { total, completed, reviewed, averageScore };
  }, [applications]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-3 animate-pulse">
          <div className="h-8 w-56 bg-muted rounded-lg" />
          <div className="h-5 w-96 bg-muted rounded-lg" />
        </div>
        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-2xl" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-10 text-center space-y-4">
        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
          <CircleDashed size={28} />
        </div>
        <h1 className="text-2xl font-bold">Applicants unavailable</h1>
        <p className="text-muted-foreground">{error}</p>
        <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold">
          <ArrowLeft size={16} /> Back to My Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft size={16} /> Back to My Jobs
          </Link>
          <h1 className="text-3xl font-bold mb-1">{job?.title || 'Job applicants'}</h1>
          <p className="text-muted-foreground">Review every application for this role, then sort by exam completion or marks.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-3 py-1.5 rounded-full bg-muted">{stats.total} applicants</span>
          <span className="px-3 py-1.5 rounded-full bg-muted">{stats.completed} exams completed</span>
          <span className="px-3 py-1.5 rounded-full bg-muted">Avg score {stats.averageScore}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Total Applicants</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Exam Completed</p>
          <p className="text-2xl font-bold mt-1">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Shortlisted+</p>
          <p className="text-2xl font-bold mt-1">{stats.reviewed}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Average Score</p>
          <p className="text-2xl font-bold mt-1">{stats.averageScore}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-[240px]">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {sortedApplications.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No applicants found</h3>
          <p className="text-muted-foreground text-sm">Try a different search term or wait for new applications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedApplications.map(application => (
            <ApplicantCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobApplicants;