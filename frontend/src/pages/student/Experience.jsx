import React, { useState } from 'react';
import { useStudentProfile, useAddExperience, useUpdateExperience, useDeleteExperience } from '../../hooks/useStudent';
import { Briefcase, Plus, Edit2, Trash2, X, Save, Building2, Calendar, MapPin } from 'lucide-react';

const emptyForm = { company: '', role: '', employmentType: 'Full-time', startDate: '', endDate: '', isCurrent: false, description: '' };

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Apprenticeship'];

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
    <input className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" {...props} />
  </div>
);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

const ExperienceCard = ({ exp, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-11 h-11 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Building2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base">{exp.role}</h3>
          <p className="text-sm text-primary font-medium">{exp.company}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full font-medium">{exp.employmentType}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={10} /> {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
            </span>
          </div>
          {exp.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{exp.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit({ ...exp, startDate: exp.startDate?.split('T')[0] || '', endDate: exp.endDate?.split('T')[0] || '' })}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={15} /></button>
        <button onClick={() => onDelete(exp.id)} disabled={deleting}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
      </div>
    </div>
  </div>
);

const ExperienceForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-primary">{initial.id ? 'Edit Experience' : 'Add Experience'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <InputField label="Company / Organization *" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Google Inc." />
        <InputField label="Job Title / Role *" value={form.role} onChange={e => set('role', e.target.value)} placeholder="Software Engineer Intern" />
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Employment Type</label>
          <select className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div />
        <InputField label="Start Date *" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        <InputField label="End Date" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} disabled={form.isCurrent} />
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm mb-3">
            <input type="checkbox" checked={form.isCurrent} onChange={e => set('isCurrent', e.target.checked)} className="rounded" />
            I currently work here
          </label>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
          <textarea className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all"
            rows={3} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe your responsibilities, achievements, technologies used..." />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => onSave(form)} disabled={loading || !form.company || !form.role || !form.startDate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
          <Save size={14} /> {loading ? 'Saving...' : 'Save Experience'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
};

const Experience = () => {
  const { data: profile, isLoading } = useStudentProfile();
  const addExp = useAddExperience();
  const updateExp = useUpdateExperience();
  const deleteExp = useDeleteExperience();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSaveNew = async (form) => { await addExp.mutateAsync(form); setShowForm(false); };
  const handleSaveEdit = async (form) => { await updateExp.mutateAsync(form); setEditing(null); };
  const handleDelete = async (id) => { if (window.confirm('Delete this experience?')) await deleteExp.mutateAsync(id); };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}</div>;

  const experiences = profile?.experiences || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Work Experience</h1>
          <p className="text-muted-foreground">Add your internships, jobs, and professional experience</p>
        </div>
        {!showForm && !editing && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shrink-0">
            <Plus size={16} /> Add Experience
          </button>
        )}
      </div>

      {showForm && <ExperienceForm initial={emptyForm} onSave={handleSaveNew} onCancel={() => setShowForm(false)} loading={addExp.isPending} />}

      {experiences.length === 0 && !showForm ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No experience added yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add internships, part-time jobs, or full-time roles</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
            Add First Experience
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map(exp =>
            editing?.id === exp.id
              ? <ExperienceForm key={exp.id} initial={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} loading={updateExp.isPending} />
              : <ExperienceCard key={exp.id} exp={exp} onEdit={setEditing} onDelete={handleDelete} deleting={deleteExp.isPending} />
          )}
        </div>
      )}
    </div>
  );
};

export default Experience;
