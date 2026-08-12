import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import {
  Briefcase, MapPin, DollarSign, Users,
  Plus, X, Save, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Loader2
} from 'lucide-react';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    <input
      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
      {...props}
    />
  </div>
);

const TagInput = ({ label, tags, setTags, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-8">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
            {t}
            <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-destructive ml-0.5"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button onClick={add} type="button" className="px-3 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-sm">
          <Plus size={16} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Press Enter or + to add</p>
    </div>
  );
};

const PostJob = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', responsibilities: '',
    location: '', isRemote: false, employmentType: 'Full-time',
    salaryMin: '', salaryMax: '', salaryCurrency: 'INR',
    experienceMin: '0', experienceMax: '', openings: '1',
    status: 'ACTIVE', deadline: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const autoDetectSkills = async () => {
    const text = `${form.description} ${form.requirements}`.trim();
    if (!text) {
      setAnalyzeMsg('Write the job description & requirements first, then auto-detect.');
      return;
    }
    setAnalyzing(true); setAnalyzeMsg('');
    try {
      const { data } = await api.post('/recruiter/jobs/analyze', {
        description: form.description, requirements: form.requirements,
      });
      const detected = data.analysis?.skills || [];
      const detectedSet = new Set([...skills, ...detected]);
      setSkills(Array.from(detectedSet));
      setAnalyzeMsg(`${detected.length} skill(s) detected from the job description. Edit or remove any before posting.`);
    } catch (e) {
      setError(e.response?.data?.message || 'Skill detection failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (asDraft = false) => {
    if (!form.title || !form.description || !form.location || !form.employmentType) {
      setError('Please fill all required fields.');
      return;
    }
    setSaving(true); setError('');
    try {
      await api.post('/recruiter/jobs', {
        ...form, skills, status: asDraft ? 'DRAFT' : 'ACTIVE',
      });
      setSuccess(true);
      setTimeout(() => navigate('/recruiter/jobs'), 1200);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to post job.');
    } finally { setSaving(false); }
  };

  if (success) return (
    <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold">Job Posted!</h2>
      <p className="text-muted-foreground">Redirecting to your jobs...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Post a Job</h1>
          <p className="text-muted-foreground">Fill in the details to attract the right candidates</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Briefcase size={16} className="text-secondary" /> Job Details</h2>
            <InputField label="Job Title" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior React Developer" />
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Job Description <span className="text-destructive">*</span></label>
              <textarea className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                rows={5} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the role, team, and what makes it exciting..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Responsibilities</label>
              <textarea className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                rows={4} value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)}
                placeholder="List key responsibilities..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Requirements</label>
              <textarea className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                rows={4} value={form.requirements} onChange={e => set('requirements', e.target.value)}
                placeholder="Qualifications, must-haves, nice-to-haves..." />
            </div>
            <TagInput label="Required Skills" tags={skills} setTags={setSkills} placeholder="React, Node.js, Python..." />
            <button
              type="button"
              onClick={autoDetectSkills}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 disabled:opacity-50 transition-colors"
            >
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {analyzing ? 'Detecting skills...' : 'Auto-detect skills from description'}
            </button>
            {analyzeMsg && <p className="text-xs text-secondary mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> {analyzeMsg}</p>}
          </div>

          {/* Location & Type */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><MapPin size={16} className="text-secondary" /> Location & Type</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Location" required value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mumbai, Remote..." />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Employment Type <span className="text-destructive">*</span></label>
                <select className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.isRemote} onChange={e => set('isRemote', e.target.checked)} className="rounded" />
              Remote work available
            </label>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><DollarSign size={16} className="text-secondary" /> Salary</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Currency</label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                value={form.salaryCurrency} onChange={e => set('salaryCurrency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <InputField label="Min Salary" type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="500000" />
            <InputField label="Max Salary" type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="1200000" />
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Users size={16} className="text-secondary" /> Details</h2>
            <InputField label="No. of Openings" type="number" min="1" value={form.openings} onChange={e => set('openings', e.target.value)} />
            <InputField label="Min Experience (yrs)" type="number" min="0" value={form.experienceMin} onChange={e => set('experienceMin', e.target.value)} />
            <InputField label="Max Experience (yrs)" type="number" min="0" value={form.experienceMax} onChange={e => set('experienceMax', e.target.value)} placeholder="Optional" />
            <InputField label="Application Deadline" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => handleSubmit(false)} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-all">
              <Save size={16} /> {saving ? 'Posting...' : 'Post Job'}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 disabled:opacity-50 transition-all text-sm">
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
