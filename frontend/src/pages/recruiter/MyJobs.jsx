import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import {
  Briefcase, Plus, Users, Eye, Pencil, Trash2,
  MapPin, Clock, CheckCircle2, Pause, XCircle,
  FileText, ToggleLeft, AlertCircle, Search, Sparkles
} from 'lucide-react';

const STATUS_STYLES = {
  ACTIVE:  { label: 'Active',  cls: 'bg-green-500/10 text-green-600' },
  DRAFT:   { label: 'Draft',   cls: 'bg-muted text-muted-foreground' },
  PAUSED:  { label: 'Paused',  cls: 'bg-yellow-500/10 text-yellow-600' },
  CLOSED:  { label: 'Closed',  cls: 'bg-red-500/10 text-red-600' },
};

const fmtSalary = (min, max, currency) => {
  if (!min && !max) return null;
  const fmt = n => n >= 100000 ? `${(n/100000).toFixed(1)}L` : `${(n/1000).toFixed(0)}K`;
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max)}`;
};

const JobCard = ({ job, onDelete, onToggle }) => {
  const status = STATUS_STYLES[job.status] || STATUS_STYLES.DRAFT;
  const salary = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-secondary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-base">{job.title}</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
            {job.isRemote && <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-medium">Remote</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
            <span className="flex items-center gap-1"><Briefcase size={12} />{job.employmentType}</span>
            {salary && <span className="flex items-center gap-1 text-green-600 font-medium">{salary}</span>}
            <span className="flex items-center gap-1"><Users size={12} />{job._count?.applications ?? 0} applicants</span>
            <span className="flex items-center gap-1"><Clock size={12} />{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.slice(0, 5).map(s => <span key={s} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">{s}</span>)}
              {job.skills.length > 5 && <span className="text-xs text-muted-foreground">+{job.skills.length - 5}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link to={`/recruiter/jobs/${job.id}/shortlist`}
            className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Smart Shortlist">
            <Sparkles size={16} />
          </Link>
          <Link to={`/recruiter/jobs/${job.id}/applications`}
            className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="View Applicants">
            <Eye size={16} />
          </Link>
          <Link to={`/recruiter/jobs/${job.id}/edit`}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
            <Pencil size={16} />
          </Link>
          <button onClick={() => onToggle(job)}
            className="p-2 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Toggle Status">
            <ToggleLeft size={16} />
          </button>
          <button onClick={() => onDelete(job.id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchJobs = () => {
    setLoading(true);
    api.get('/recruiter/jobs').then(r => setJobs(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job and all its applications?')) return;
    await api.delete(`/recruiter/jobs/${id}`);
    setJobs(j => j.filter(x => x.id !== id));
  };

  const handleToggle = async (job) => {
    const next = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const { data } = await api.put(`/recruiter/jobs/${job.id}`, { ...job, skills: job.skills, status: next });
    setJobs(j => j.map(x => x.id === job.id ? { ...x, status: next } : x));
  };

  const filtered = jobs.filter(j => {
    if (filter !== 'ALL' && j.status !== filter) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { ALL: jobs.length, ACTIVE: 0, DRAFT: 0, PAUSED: 0, CLOSED: 0 };
  jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Jobs</h1>
          <p className="text-muted-foreground">Manage your job listings and track applications</p>
        </div>
        <Link to="/recruiter/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all shrink-0">
          <Plus size={16} /> Post Job
        </Link>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 flex-wrap">
          {['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'CLOSED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-28 bg-muted rounded-2xl"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">{search ? 'No matching jobs' : 'No jobs yet'}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {search ? 'Try a different search term' : 'Post your first job to start receiving applications'}
          </p>
          {!search && (
            <Link to="/recruiter/jobs/new" className="px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all inline-block">
              Post First Job
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <JobCard key={job.id} job={job} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyJobs;
