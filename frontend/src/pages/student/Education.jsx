import React, { useState } from 'react';
import { useStudentProfile, useAddEducation, useUpdateEducation, useDeleteEducation } from '../../hooks/useStudent';
import { GraduationCap, Plus, Edit2, Trash2, X, Save, BookOpen, Calendar } from 'lucide-react';

const emptyForm = {
  institution: '', university: '', degree: '', branch: '',
  cgpa: '', percentage: '', startYear: '', endYear: '', isCurrent: false,
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
    <input className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" {...props} />
  </div>
);

const EducationCard = ({ edu, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-11 h-11 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight">{edu.degree} in {edu.branch}</h3>
          <p className="text-sm text-primary font-medium mt-0.5">{edu.institution}</p>
          {edu.university && <p className="text-xs text-muted-foreground mt-0.5">{edu.university}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={11} /> {edu.startYear} – {edu.isCurrent ? 'Present' : edu.endYear || '—'}
            </span>
            {edu.cgpa && <span className="text-xs font-medium bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">CGPA: {edu.cgpa}</span>}
            {edu.percentage && <span className="text-xs font-medium bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">{edu.percentage}%</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(edu)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
          <Edit2 size={15} />
        </button>
        <button onClick={() => onDelete(edu.id)} disabled={deleting} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  </div>
);

const EducationForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-primary">{initial.id ? 'Edit Education' : 'Add Education'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <InputField label="Institution *" value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="Vidyalankar Institute of Technology" />
        <InputField label="University" value={form.university} onChange={e => set('university', e.target.value)} placeholder="Mumbai University" />
        <InputField label="Degree *" value={form.degree} onChange={e => set('degree', e.target.value)} placeholder="B.Tech, M.Sc, MBA..." />
        <InputField label="Branch / Major *" value={form.branch} onChange={e => set('branch', e.target.value)} placeholder="Computer Science" />
        <InputField label="CGPA" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="8.5" />
        <InputField label="Percentage %" type="number" step="0.1" min="0" max="100" value={form.percentage} onChange={e => set('percentage', e.target.value)} placeholder="85.5" />
        <InputField label="Start Year *" type="number" min="1990" max="2030" value={form.startYear} onChange={e => set('startYear', e.target.value)} placeholder="2021" />
        <InputField label="End Year" type="number" min="1990" max="2035" value={form.endYear} onChange={e => set('endYear', e.target.value)} placeholder="2025" disabled={form.isCurrent} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input type="checkbox" checked={form.isCurrent} onChange={e => set('isCurrent', e.target.checked)} className="rounded" />
        Currently studying here
      </label>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => onSave(form)} disabled={loading || !form.institution || !form.degree || !form.branch || !form.startYear}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
          <Save size={14} /> {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
};

const Education = () => {
  const { data: profile, isLoading } = useStudentProfile();
  const addEdu = useAddEducation();
  const updateEdu = useUpdateEducation();
  const deleteEdu = useDeleteEducation();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSaveNew = async (form) => {
    await addEdu.mutateAsync(form);
    setShowForm(false);
  };

  const handleSaveEdit = async (form) => {
    await updateEdu.mutateAsync(form);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this education record?')) {
      await deleteEdu.mutateAsync(id);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}</div>;

  const educations = profile?.education || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Education</h1>
          <p className="text-muted-foreground">Add your academic qualifications and degrees</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shrink-0">
            <Plus size={16} /> Add Education
          </button>
        )}
      </div>

      {showForm && (
        <EducationForm initial={emptyForm} onSave={handleSaveNew} onCancel={() => setShowForm(false)} loading={addEdu.isPending} />
      )}

      {educations.length === 0 && !showForm ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No education added yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add your degrees, diplomas, and academic qualifications</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
            Add First Degree
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {educations.map(edu =>
            editing?.id === edu.id
              ? <EducationForm key={edu.id} initial={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} loading={updateEdu.isPending} />
              : <EducationCard key={edu.id} edu={edu} onEdit={setEditing} onDelete={handleDelete} deleting={deleteEdu.isPending} />
          )}
        </div>
      )}
    </div>
  );
};

export default Education;
