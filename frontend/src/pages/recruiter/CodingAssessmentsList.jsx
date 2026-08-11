import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  Plus, Edit, Trash2, Copy, Send, 
  Archive, BarChart3, Briefcase, Clock, FileText, 
  CheckCircle2, AlertCircle, X, Search, Terminal
} from 'lucide-react';

const STATUS_BADGES = {
  DRAFT: 'bg-muted text-muted-foreground border border-border',
  PUBLISHED: 'bg-green-500/10 text-green-600 border border-green-500/20',
  ARCHIVED: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const CodingAssessmentsList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAssessment, setAssigningAssessment] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [savingAssign, setSavingAssign] = useState(false);

  const fetchAssessments = () => {
    setLoading(true);
    api.get('/recruiter/coding-assessments')
      .then(res => setAssessments(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to fetch coding assessments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/recruiter/coding-assessments/${id}/duplicate`);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to duplicate assessment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment? All problems inside and candidates\' scores for this assessment will be lost.')) return;
    try {
      await api.delete(`/recruiter/coding-assessments/${id}`);
      setAssessments(assessments.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete assessment');
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Once published, students can start taking the assessment. Publish now?')) return;
    try {
      await api.post(`/recruiter/coding-assessments/${id}/publish`);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish assessment');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this assessment? Students will no longer be able to access it.')) return;
    try {
      await api.post(`/recruiter/coding-assessments/${id}/archive`);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive assessment');
    }
  };

  const openAssignModal = async (ass) => {
    setAssigningAssessment(ass);
    setSelectedJobIds(ass.jobs.map(j => j.id));
    setShowAssignModal(true);
    
    try {
      const { data } = await api.get('/recruiter/jobs');
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs', err);
    }
  };

  const handleAssignSave = async (e) => {
    e.preventDefault();
    setSavingAssign(true);
    try {
      await api.post(`/recruiter/coding-assessments/${assigningAssessment.id}/assign`, { jobIds: selectedJobIds });
      setShowAssignModal(false);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign assessment');
    } finally {
      setSavingAssign(false);
    }
  };

  const toggleJobSelection = (jobId) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const filteredAssessments = assessments.filter(a => {
    if (filter !== 'ALL' && a.status !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Coding Assessments</h1>
          <p className="text-muted-foreground">Configure coding tasks and link them to your job postings</p>
        </div>
        <Link to="/recruiter/coding-assessments/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all shrink-0 shadow-sm"
        >
          <Plus size={16} /> Create Coding Assessment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 flex-wrap shrink-0">
          {['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map(s => {
            const count = s === 'ALL' ? assessments.length : assessments.filter(a => a.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Search assessments..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Terminal size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No coding assessments found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create a coding assessment, specify programming tasks, and assign them to your job listings.
          </p>
          <Link to="/recruiter/coding-assessments/new" className="px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all inline-block shadow-sm">
            Create First Assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((ass) => (
            <div key={ass.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-secondary/30 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-foreground">{ass.name}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_BADGES[ass.status]}`}>
                      {ass.status}
                    </span>
                  </div>
                  
                  {ass.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {ass.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground font-medium pt-1">
                    <span className="flex items-center gap-1"><Clock size={13} />{ass.duration} mins</span>
                    <span className="flex items-center gap-1"><FileText size={13} />{ass._count?.problems ?? 0} problems</span>
                    <span className="flex items-center gap-1"><BarChart3 size={13} />{ass._count?.attempts ?? 0} attempts completed</span>
                  </div>

                  {/* Jobs list */}
                  <div className="flex flex-wrap gap-2 pt-2 items-center">
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Briefcase size={12} /> Assigned Jobs:
                    </span>
                    {ass.jobs?.length > 0 ? (
                      ass.jobs.map(j => (
                        <span key={j.id} className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-semibold rounded-md border border-secondary/20">
                          {j.title}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None (Unassigned)</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
                  <button 
                    onClick={() => openAssignModal(ass)}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
                    title="Assign to Jobs"
                  >
                    <Briefcase size={13} /> Assign
                  </button>
                  
                  <Link 
                    to={`/recruiter/coding-assessments/${ass.id}/results`}
                    className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-transparent hover:border-secondary/20"
                    title="View Submissions / Results"
                  >
                    <BarChart3 size={16} />
                  </Link>

                  {ass.status !== 'ARCHIVED' && (
                    <Link 
                      to={`/recruiter/coding-assessments/${ass.id}/edit`}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                      title="Edit Assessment"
                    >
                      <Edit size={16} />
                    </Link>
                  )}

                  <button 
                    onClick={() => handleDuplicate(ass.id)}
                    className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-transparent hover:border-secondary/20"
                    title="Duplicate Assessment"
                  >
                    <Copy size={16} />
                  </button>

                  {ass.status === 'DRAFT' && (
                    <button 
                      onClick={() => handlePublish(ass.id)}
                      className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-500/20"
                      title="Publish Assessment"
                    >
                      <Send size={16} />
                    </button>
                  )}

                  {ass.status === 'PUBLISHED' && (
                    <button 
                      onClick={() => handleArchive(ass.id)}
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                      title="Archive Assessment"
                    >
                      <Archive size={16} />
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(ass.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                    title="Delete Assessment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Assign Coding Assessment to Jobs</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Assessment: {assigningAssessment?.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignSave}>
              <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
                <p className="text-xs text-muted-foreground mb-4">
                  Select which jobs should require this Coding Assessment. Candidates will unlock this coding stage once they successfully pass the Aptitude Test (if configured).
                </p>
                {jobs.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground italic">
                    No active job listings. Post a job first.
                  </div>
                ) : (
                  jobs.map(job => {
                    const isSelected = selectedJobIds.includes(job.id);
                    return (
                      <label 
                        key={job.id} 
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer hover:bg-muted/50 transition-all ${
                          isSelected ? 'border-secondary/40 bg-secondary/5' : 'border-border bg-card'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleJobSelection(job.id)}
                          className="rounded text-secondary focus:ring-secondary/40 h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">Location: {job.location} | Status: {job.status}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
              
              <div className="p-6 bg-muted/20 border-t border-border flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 font-semibold text-sm transition-all"
                >
                  {savingAssign ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingAssessmentsList;
