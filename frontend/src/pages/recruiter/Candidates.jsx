import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import {
  Users, Search, Filter, Eye, CheckCircle2,
  XCircle, Clock, Star, MessageSquare, Download,
  UserCircle, GraduationCap, Briefcase, ChevronDown
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'APPLIED',    label: 'Applied',     cls: 'bg-blue-500/10 text-blue-600' },
  { value: 'REVIEWING',  label: 'Reviewing',   cls: 'bg-yellow-500/10 text-yellow-600' },
  { value: 'SHORTLISTED',label: 'Shortlisted', cls: 'bg-violet-500/10 text-violet-600' },
  { value: 'INTERVIEW',  label: 'Interview',   cls: 'bg-orange-500/10 text-orange-600' },
  { value: 'OFFERED',    label: 'Offered',     cls: 'bg-green-500/10 text-green-600' },
  { value: 'REJECTED',   label: 'Rejected',    cls: 'bg-red-500/10 text-red-600' },
];

const getStatusStyle = (s) => STATUS_OPTIONS.find(o => o.value === s) || STATUS_OPTIONS[0];

const CandidateCard = ({ app, onStatusChange }) => {
  const { student, job, status, appliedAt } = app;
  const user = student?.user;
  const latestEdu = student?.education?.[0];
  const resumeDoc = student?.documents?.[0];
  const st = getStatusStyle(status);
  const [updating, setUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notes, setNotes] = useState(app.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const handleStatus = async (newStatus) => {
    setUpdating(true); setShowDropdown(false);
    try {
      await onStatusChange(app.id, newStatus, notes);
    } finally { setUpdating(false); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {user?.profilePicture
            ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
            : <UserCircle size={24} className="text-primary" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-base">{user?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
              {/* Status dropdown */}
              <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} disabled={updating}
                  className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-xs font-medium rounded-lg transition-colors">
                  Update <ChevronDown size={12} />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => handleStatus(opt.value)}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${status === opt.value ? 'font-semibold' : ''}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {latestEdu && (
              <span className="flex items-center gap-1">
                <GraduationCap size={11} /> {latestEdu.degree} · {latestEdu.institution}
              </span>
            )}
            {job && (
              <span className="flex items-center gap-1 text-secondary">
                <Briefcase size={11} /> Applied for: {job.title}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {new Date(appliedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Skills */}
          {student?.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {student.skills.slice(0, 5).map(s => (
                <span key={s.id} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md">{s.name}</span>
              ))}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
            {resumeDoc && (
              <a href={`http://localhost:5000${resumeDoc.url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-secondary hover:underline font-medium">
                <Download size={12} /> Download Resume
              </a>
            )}
            <button onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare size={12} /> {showNotes ? 'Hide' : 'Notes'}
            </button>
          </div>

          {/* Notes */}
          {showNotes && (
            <div className="mt-3 space-y-2">
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                rows={2} placeholder="Private notes about this candidate..."
                value={notes} onChange={e => setNotes(e.target.value)}
              />
              <button onClick={() => handleStatus(status)}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-secondary/90 transition-all">
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Candidates = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/recruiter/candidates').then(r => setApplications(r.data)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (appId, newStatus, notes) => {
    await api.put(`/recruiter/applications/${appId}/status`, { status: newStatus, notes });
    setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus, notes } : a));
  };

  const filtered = applications.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    const name = a.student?.user?.fullName?.toLowerCase() || '';
    const email = a.student?.user?.email?.toLowerCase() || '';
    if (search && !name.includes(search.toLowerCase()) && !email.includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { ALL: applications.length };
  STATUS_OPTIONS.forEach(o => { counts[o.value] = applications.filter(a => a.status === o.value).length; });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Candidates</h1>
        <p className="text-muted-foreground">Review and manage all applications across your job postings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
          {[{ value: 'ALL', label: 'All' }, ...STATUS_OPTIONS].map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === opt.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {opt.label} ({counts[opt.value] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={`p-3 rounded-xl border text-center transition-all hover:shadow-sm ${statusFilter === opt.value ? 'border-secondary/40 bg-secondary/5' : 'border-border bg-card'}`}>
            <p className="text-2xl font-bold">{counts[opt.value] ?? 0}</p>
            <p className={`text-xs font-medium mt-0.5 ${opt.cls?.split(' ')[1] || 'text-muted-foreground'}`}>{opt.label}</p>
          </button>
        ))}
      </div>

      {/* Candidate list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-36 bg-muted rounded-2xl"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No candidates yet</h3>
          <p className="text-muted-foreground text-sm">Post a job to start receiving applications from students</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found</p>
          {filtered.map(app => (
            <CandidateCard key={app.id} app={app} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Candidates;
