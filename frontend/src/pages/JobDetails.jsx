import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Briefcase,
  Clock,
  X,
} from 'lucide-react';

const fmtSalary = (min, max, currency) => {
  if (!min && !max) return 'Not specified';
  const fmt = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`);
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max)}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// Icon + label chip, always vertically aligned
const InfoChip = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
    <Icon size={15} className="shrink-0" />
    <span>{children}</span>
  </span>
);

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-8 ${className}`}>{children}</div>
);

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const fetchJob = useCallback(() => {
    setLoading(true);
    api
      .get(`/student/jobs/${id}`)
      .then((res) => {
        setJob(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch job details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await api.post(`/student/jobs/${id}/apply`, { coverLetter });
      setShowApplyModal(false);
      setCoverLetter('');
      fetchJob();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-xl text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground">{error || 'Job not found'}</p>
          <Link to="/jobs" className="inline-flex items-center text-primary font-medium hover:underline">
            <ArrowLeft size={16} className="mr-2" /> Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const companyName = job.recruiter?.companyName || 'Confidential';
  const logoInitial = companyName.charAt(0).toUpperCase();
  const salaryStr = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const hasLogo = job.recruiter?.companyLogo && !logoFailed;

  const ApplyButton = ({ className = '' }) =>
    job.hasApplied ? (
      <div className={`inline-flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-2.5 text-green-600 text-sm font-semibold ${className}`}>
        <CheckCircle2 size={16} /> Applied &middot; {job.applicationStatus}
      </div>
    ) : (
      <button
        onClick={() => setShowApplyModal(true)}
        className={`inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors ${className}`}
      >
        Apply Now
      </button>
    );

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-12">
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Jobs
        </Link>

        {/* Header: logo + title + apply, all horizontal */}
        <SectionCard className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {hasLogo ? (
                <img
                  src={job.recruiter.companyLogo}
                  alt={companyName}
                  className="w-full h-full object-cover"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-primary font-bold text-2xl">{logoInitial}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">{job.title}</h1>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground font-medium">
                <Building2 size={16} className="shrink-0" />
                <span className="truncate">{companyName}</span>
              </div>
            </div>

            {/* Apply button sits inline on the same row on tablet/desktop */}
            <ApplyButton className="hidden sm:inline-flex w-full sm:w-auto" />
          </div>

          {/* Meta row: location, salary, type, posted — always horizontal, wraps on small screens */}
          <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-x-6 gap-y-2.5">
            <InfoChip icon={MapPin}>
              {job.location}
              {job.isRemote ? ' · Remote' : ''}
            </InfoChip>
            <InfoChip icon={DollarSign}>{salaryStr}</InfoChip>
            <InfoChip icon={Briefcase}>{job.employmentType}</InfoChip>
            <InfoChip icon={Clock}>Posted {fmtDate(job.createdAt)}</InfoChip>
          </div>

          {/* Full-width apply button on mobile, part of the card flow */}
          <ApplyButton className="sm:hidden w-full mt-5" />
        </SectionCard>

        {job.testId && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 px-5 py-4 rounded-2xl mb-6">
            <Sparkles size={18} className="text-primary shrink-0" />
            <p className="text-sm text-muted-foreground leading-snug">
              <span className="font-semibold text-primary">Aptitude test assigned.</span> Once you apply,
              you'll be able to take it from your Student Dashboard.
            </p>
          </div>
        )}

        {/* About the job — full width, single column */}
        <SectionCard className="mb-6">
          <h2 className="text-xl font-bold mb-4">About the Job</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {job.responsibilities && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Responsibilities
                </h3>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                  {job.responsibilities}
                </p>
              </div>
            )}

            {job.requirements && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Requirements
                </h3>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            {job.skills?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Skills Required
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-primary/5 text-primary border border-primary/10 px-3.5 py-1 rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* About the company — full width, comes last */}
        <SectionCard>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Building2 className="text-primary" size={20} /> About the Company
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {hasLogo ? (
                <img src={job.recruiter.companyLogo} alt={companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-xl">{logoInitial}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="font-semibold text-lg">{companyName}</h3>
              {job.recruiter?.industry && (
                <p className="text-sm text-muted-foreground">{job.recruiter.industry}</p>
              )}
              {job.recruiter?.companyDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.recruiter.companyDescription}
                </p>
              )}
              {job.recruiter?.companyWebsite && (
                <a
                  href={
                    job.recruiter.companyWebsite.startsWith('http')
                      ? job.recruiter.companyWebsite
                      : `https://${job.recruiter.companyWebsite}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 py-2 px-4 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-colors"
                >
                  <ExternalLink size={15} /> Visit website
                </a>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Fixed mobile apply bar so the CTA is always reachable while scrolling */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ApplyButton className="w-full" />
      </div>

      {/* Apply Cover Letter Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-card border border-border sm:rounded-3xl rounded-t-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom sm:zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Apply for {job.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">Submit your application to {companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="shrink-0 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApply}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Introduce yourself, explain why you are a good fit..."
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  By applying, the recruiter will be able to review your student profile details and resume.
                </p>
              </div>

              <div className="p-6 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
