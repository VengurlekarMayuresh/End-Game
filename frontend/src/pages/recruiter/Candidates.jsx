import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  Users, Search, CheckCircle2,
  XCircle, Clock, MessageSquare, Download,
  UserCircle, ChevronDown, CheckSquare, Square, Mail, BadgeCheck
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

const CandidateCard = ({ app, isSelected, toggleSelection, onStatusChange }) => {
  const { student, job, status, matchScore } = app;
  const user = student?.user;
  const st = getStatusStyle(status);
  const [updating, setUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notes, setNotes] = useState(app.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const handleStatus = async (newStatus, stage = undefined) => {
    setUpdating(true); setShowDropdown(false);
    try {
      await onStatusChange(app.id, newStatus, stage, notes);
    } finally { setUpdating(false); }
  };

  return (
    <div className={`bg-card border ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'} rounded-2xl p-5 hover:shadow-md transition-all`}>
      <div className="flex items-start gap-4">
        
        {/* Selection Checkbox */}
        <button onClick={() => toggleSelection(app.id)} className="mt-2 text-muted-foreground hover:text-primary">
          {isSelected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
        </button>

        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {user?.profilePicture
            ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
            : <UserCircle size={24} className="text-primary" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-base">{user?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs font-medium text-primary mt-1">Applied for: {job?.title}</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">Match</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 ${
                  (matchScore || 0) >= 80 ? 'border-green-500 text-green-600' :
                  (matchScore || 0) >= 50 ? 'border-yellow-500 text-yellow-600' :
                  'border-red-500 text-red-600'
                }`}>
                  {Math.round(matchScore || 0)}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                <div className="relative">
                  <button onClick={() => setShowDropdown(!showDropdown)} disabled={updating}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                    Update Status <ChevronDown size={14} />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10 py-1">
                      <button onClick={() => handleStatus('SHORTLISTED', 'RESUME')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${status === 'SHORTLISTED' ? 'bg-primary/5 text-primary font-medium' : ''}`}>
                        Shortlist (Resume)
                      </button>
                      <button onClick={() => handleStatus('INTERVIEW', 'CODING')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${status === 'INTERVIEW' ? 'bg-primary/5 text-primary font-medium' : ''}`}>
                        Shortlist (Exam/Coding)
                      </button>
                      <button onClick={async () => {
                        setShowDropdown(false);
                        try {
                          await api.post('/recruiter/assign-resume-aptitude', { applicationId: app.id });
                          alert(`Assigned ${user?.fullName || 'candidate'} to Role-Specific Aptitude Round!`);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to assign round');
                        }
                      }}
                        className="w-full text-left px-3 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-500/10">
                        ✨ Assign Role-Specific Aptitude
                      </button>
                      <Link to={`/recruiter/resume-aptitude/application/${app.id}/results`}
                        onClick={() => setShowDropdown(false)}
                        className="w-full text-left block px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-500/10">
                        📊 View Role-Specific Results
                      </Link>
                      <button onClick={() => handleStatus('OFFERED')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${status === 'OFFERED' ? 'bg-primary/5 text-primary font-medium' : ''}`}>
                        Offered
                      </button>
                      <button onClick={() => handleStatus('REJECTED')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600 ${status === 'REJECTED' ? 'bg-red-500/10 font-medium' : ''}`}>
                        Reject & Email
                      </button>
                      <hr className="my-1 border-border" />
                      <button onClick={() => handleStatus('REVIEWING')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${status === 'REVIEWING' ? 'bg-primary/5 text-primary font-medium' : ''}`}>
                        Mark as Reviewing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={async () => {
                try {
                  await api.post('/recruiter/assign-resume-aptitude', { applicationId: app.id });
                  alert(`Assigned ${user?.fullName || 'candidate'} to Role-Specific Aptitude Round!`);
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to assign round');
                }
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-600 font-bold hover:bg-violet-500/20 transition-colors flex items-center gap-1"
            >
              Assign Role-Specific Aptitude
            </button>
            <Link
              to={`/recruiter/resume-aptitude/application/${app.id}/results`}
              className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
            >
              <BadgeCheck size={12} /> View Role-Specific Results
            </Link>
            <button onClick={() => setShowNotes(!showNotes)} className="text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare size={14} /> Notes {notes ? '(1)' : ''}
            </button>
            {student?.resumeData && (
              <button className="text-xs font-medium flex items-center gap-1 text-primary hover:underline transition-colors">
                <Download size={14} /> View Platform Resume
              </button>
            )}
          </div>

          {showNotes && (
            <div className="mt-3 bg-muted/50 rounded-xl p-3">
              <textarea placeholder="Add private notes about this candidate..." value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm p-0 mb-2 h-16" />
              <div className="flex justify-end">
                <button onClick={() => handleStatus(status)} disabled={updating} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium">Save Note</button>
              </div>
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    try {
      const { data } = await api.get('/recruiter/candidates');
      setApplications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus, stage = undefined, notes = undefined) => {
    await api.put(`/recruiter/applications/${appId}/status`, { status: newStatus, stage, notes });
    setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus, notes: notes !== undefined ? notes : a.notes } : a));
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set()); // Fixed bug where newSet() was called instead of new Set()
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const handleBulkAction = async (actionStatus, stage = undefined) => {
    if (selectedIds.size === 0) return;
    setIsBulkActioning(true);
    try {
      await api.put(`/recruiter/bulk-shortlist`, {
        applicationIds: Array.from(selectedIds),
        status: actionStatus,
        stage
      });
      // update local
      setApplications(apps => apps.map(a => selectedIds.has(a.id) ? { ...a, status: actionStatus } : a));
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
    } finally {
      setIsBulkActioning(false);
    }
  };

  // Sort by match score descending
  const sortedApps = [...applications].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const filtered = sortedApps.filter(a => {
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Candidates</h1>
          <p className="text-muted-foreground">Review and manage all applications across your job postings</p>
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

      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border">
        
        <div className="flex items-center gap-4">
          <button onClick={selectAll} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={18}/> : <Square size={18}/>}
            Select All
          </button>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 border-l pl-4 border-border flex-wrap">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <button 
                onClick={() => handleBulkAction('SHORTLISTED', 'RESUME')}
                disabled={isBulkActioning}
                className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Mail size={14}/> Shortlist (Resume)
              </button>
              <button 
                onClick={() => handleBulkAction('INTERVIEW', 'CODING')}
                disabled={isBulkActioning}
                className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Mail size={14}/> Shortlist (Exam/Coding)
              </button>
              <button 
                onClick={() => handleBulkAction('REJECTED')}
                disabled={isBulkActioning}
                className="bg-red-500/10 text-red-600 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <XCircle size={14}/> Reject & Email
              </button>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Candidate list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-36 bg-muted rounded-2xl"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No candidates found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <CandidateCard 
              key={app.id} 
              app={app} 
              isSelected={selectedIds.has(app.id)}
              toggleSelection={toggleSelection}
              onStatusChange={handleStatusChange} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Candidates;
