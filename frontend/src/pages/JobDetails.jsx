import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, Building2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const fmtSalary = (min, max, currency) => {
  if (!min && !max) return 'Not Specified';
  const fmt = n => n >= 100000 ? `${(n/100000).toFixed(1)}L` : `${(n/1000).toFixed(0)}K`;
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max)}`;
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchJobDetails = () => {
    setLoading(true);
    api.get(`/student/jobs/${id}`)
      .then(res => {
        setJob(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to fetch job details');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await api.post(`/student/jobs/${id}/apply`, { coverLetter });
      setShowApplyModal(false);
      fetchJobDetails(); // reload to get hasApplied = true
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
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
  const logoInitial = companyName.charAt(0);
  const salaryStr = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link to="/jobs" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Jobs
        </Link>

        {/* Header Section */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-center gap-6">
              {job.recruiter?.companyLogo ? (
                <img src={job.recruiter.companyLogo} alt={companyName} className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="w-24 h-24 bg-primary/10 text-primary font-bold text-3xl flex items-center justify-center rounded-2xl shadow-sm shrink-0">
                  {logoInitial}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center text-xl text-muted-foreground font-medium">
                  <Building2 size={24} className="mr-2 text-muted-foreground" /> {companyName}
                </div>
              </div>
            </div>

            {job.hasApplied ? (
              <div className="w-full md:w-auto px-8 py-3.5 bg-green-500/10 border border-green-500/30 text-green-600 font-bold rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                Applied ({job.applicationStatus})
              </div>
            ) : (
              <button 
                onClick={() => setShowApplyModal(true)}
                className="w-full md:w-auto bg-primary text-primary-foreground font-bold px-10 py-4 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Apply Now
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-border">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><MapPin size={14} className="mr-1"/> Location</p>
              <p className="font-semibold">{job.location} {job.isRemote && '(Remote)'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><DollarSign size={14} className="mr-1"/> Salary</p>
              <p className="font-semibold text-green-600">{salaryStr}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Briefcase size={14} className="mr-1"/> Job Type</p>
              <p className="font-semibold">{job.employmentType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Clock size={14} className="mr-1"/> Posted</p>
              <p className="font-semibold">{new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">
            <section>
              <h2 className="text-2xl font-bold mb-4">Job Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>

            {job.responsibilities && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{job.responsibilities}</p>
              </section>
            )}

            {job.requirements && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </section>
            )}

            {job.skills?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 font-semibold">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Company Info */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="text-primary" size={18} /> About Company
              </h2>
              <div>
                <h3 className="font-bold text-lg">{companyName}</h3>
                {job.recruiter?.industry && <p className="text-sm text-muted-foreground">{job.recruiter.industry}</p>}
              </div>
              
              {job.recruiter?.companyDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.recruiter.companyDescription}
                </p>
              )}

              {job.recruiter?.companyWebsite && (
                <a 
                  href={job.recruiter.companyWebsite.startsWith('http') ? job.recruiter.companyWebsite : `https://${job.recruiter.companyWebsite}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center text-sm font-semibold py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-all"
                >
                  Visit Website
                </a>
              )}
            </div>

            {/* Test alert if job has an assigned test */}
            {job.testId && (
              <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-6 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles size={16} /> Aptitude Test Assigned
                </div>
                <p className="text-xs text-muted-foreground">
                  This job listing has a mandatory Aptitude Test. If you apply, you will gain access to take the assessment under your Student Dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Cover Letter Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">Submit your application to {companyName}</p>
            </div>
            
            <form onSubmit={handleApply}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Cover Letter (Optional)</label>
                  <textarea
                    rows={6}
                    placeholder="Introduce yourself, explain why you are a good fit..."
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  By applying, the recruiter will be able to review your student profile details and resume.
                </p>
              </div>
              
              <div className="p-6 bg-muted/30 border-t border-border flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold text-sm transition-all flex items-center gap-2"
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
