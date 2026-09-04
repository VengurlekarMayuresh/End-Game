import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  MessageSquare, Search, CheckCircle2, UserCircle, Briefcase,
  Award, Clock, CheckSquare, XCircle, Send, Star
} from 'lucide-react';

const InterviewDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInterviewCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recruiter/candidates');
      const allApps = res.data || [];
      // Filter for candidates in INTERVIEW or OFFERED status
      const interviewApps = allApps.filter(app =>
        app.status === 'INTERVIEW' || app.status === 'OFFERED'
      );
      setCandidates(interviewApps);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch interview candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewCandidates();
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.put(`/recruiter/applications/${appId}/status`, { status: newStatus });
      alert(`Updated candidate status to ${newStatus}!`);
      fetchInterviewCandidates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(app => {
      const user = app.student?.user;
      const q = searchQuery.toLowerCase();
      return (user?.fullName || '').toLowerCase().includes(q) ||
             (user?.email || '').toLowerCase().includes(q) ||
             (app.job?.title || '').toLowerCase().includes(q);
    });
  }, [candidates, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="text-primary" size={28} /> Group Discussion & Interview Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage candidates who passed Role-Specific Aptitude and have advanced to Group Discussion / Final Interview (Modules 14-15).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Advanced Candidates</p>
          <p className="text-3xl font-extrabold text-foreground">{candidates.length}</p>
          <p className="text-[11px] text-muted-foreground">In Interview / GD Pipeline</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Interview Scheduled</p>
          <p className="text-3xl font-extrabold text-primary">
            {candidates.filter(c => c.status === 'INTERVIEW').length}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium text-primary">Active Interview Stage</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Offers Extended</p>
          <p className="text-3xl font-extrabold text-emerald-600">
            {candidates.filter(c => c.status === 'OFFERED').length}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Final Offers Issued</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidates in interview stage..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-semibold text-foreground">No candidates currently in Interview stage</p>
            <p className="text-xs mt-1">Advance eligible candidates from the Role-Specific Aptitude Round to see them here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCandidates.map(app => {
              const user = app.student?.user;
              return (
                <div key={app.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                      {user?.profilePicture
                        ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
                        : <UserCircle size={24} className="text-primary" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-foreground truncate">{user?.fullName}</h3>
                        <span className="text-xs text-muted-foreground">({user?.email})</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Briefcase size={12} /> Job: <span className="font-semibold text-foreground">{app.job?.title}</span>
                      </p>
                      {app.notes && (
                        <p className="text-[11px] text-muted-foreground italic mt-1">
                          Notes: {app.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${app.status === 'OFFERED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                      {app.status === 'OFFERED' ? 'OFFER EXTENDED' : 'INTERVIEW STAGE'}
                    </span>

                    {app.status !== 'OFFERED' ? (
                      <button
                        onClick={() => handleStatusChange(app.id, 'OFFERED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Extend Job Offer
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Star size={13} /> Offer Granted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewDashboard;
