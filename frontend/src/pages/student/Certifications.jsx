import React, { useState } from 'react';
import { useStudentProfile, useAddCertification, useUpdateCertification, useDeleteCertification } from '../../hooks/useStudent';
import { Award, Plus, Edit2, Trash2, X, Save, BadgeCheck, ExternalLink, Calendar } from 'lucide-react';

const emptyForm = { title: '', organization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' };

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
    <input className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" {...props} />
  </div>
);

const CertificationCard = ({ cert, onEdit, onDelete, deleting }) => {
  const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
  return (
    <div className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
            <BadgeCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base">{cert.title}</h3>
            <p className="text-sm text-primary font-medium mt-0.5">{cert.organization}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={10} /> Issued {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              {cert.expiryDate && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                  {isExpired ? 'Expired' : 'Valid until'} {new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {cert.credentialId && <span className="text-xs text-muted-foreground">ID: {cert.credentialId}</span>}
              {cert.credentialUrl && (
                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink size={11} /> View Credential
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit({ ...cert, issueDate: cert.issueDate?.split('T')[0] || '', expiryDate: cert.expiryDate?.split('T')[0] || '' })}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={15} /></button>
          <button onClick={() => onDelete(cert.id)} disabled={deleting}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  );
};

const CertificationForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-primary">{initial.id ? 'Edit Certification' : 'Add Certification'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField label="Certification Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="AWS Certified Solutions Architect" />
        </div>
        <InputField label="Issuing Organization *" value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Amazon Web Services" />
        <InputField label="Credential ID" value={form.credentialId} onChange={e => set('credentialId', e.target.value)} placeholder="ABC123XYZ" />
        <InputField label="Issue Date *" type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} />
        <InputField label="Expiry Date (leave blank if no expiry)" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
        <div className="sm:col-span-2">
          <InputField label="Credential URL" value={form.credentialUrl} onChange={e => set('credentialUrl', e.target.value)} placeholder="https://www.credly.com/..." />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.organization || !form.issueDate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
          <Save size={14} /> {loading ? 'Saving...' : 'Save Certification'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
};

const Certifications = () => {
  const { data: profile, isLoading } = useStudentProfile();
  const addCert = useAddCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSaveNew = async (form) => { await addCert.mutateAsync(form); setShowForm(false); };
  const handleSaveEdit = async (form) => { await updateCert.mutateAsync(form); setEditing(null); };
  const handleDelete = async (id) => { if (window.confirm('Delete this certification?')) await deleteCert.mutateAsync(id); };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}</div>;

  const certifications = profile?.certifications || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Certifications</h1>
          <p className="text-muted-foreground">Add your certificates, courses, and credentials</p>
        </div>
        {!showForm && !editing && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shrink-0">
            <Plus size={16} /> Add Certification
          </button>
        )}
      </div>

      {showForm && <CertificationForm initial={emptyForm} onSave={handleSaveNew} onCancel={() => setShowForm(false)} loading={addCert.isPending} />}

      {certifications.length === 0 && !showForm ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No certifications yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add AWS, Google, Coursera, or any other certifications you hold</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
            Add First Certification
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certifications.map(cert =>
            editing?.id === cert.id
              ? <CertificationForm key={cert.id} initial={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} loading={updateCert.isPending} />
              : <CertificationCard key={cert.id} cert={cert} onEdit={setEditing} onDelete={handleDelete} deleting={deleteCert.isPending} />
          )}
        </div>
      )}
    </div>
  );
};

export default Certifications;
