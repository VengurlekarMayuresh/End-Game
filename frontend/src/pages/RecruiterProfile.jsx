import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';
import { getImageUrl } from '../lib/utils';
import {
  Building2, Phone, Globe, MapPin, Users, FileText,
  Save, Edit2, X, CheckCircle2, UserCircle, Briefcase
} from 'lucide-react';

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
    <input
      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
      {...props}
    />
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
      <div className="w-9 h-9 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500–1000', '1000+'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-Commerce',
  'Manufacturing', 'Media & Entertainment', 'Consulting', 'Real Estate', 'Other',
];

const RecruiterProfile = () => {
  const { user } = useAuth();
  const [recruiter, setRecruiter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: '', designation: '', industry: '', companyWebsite: '',
    companySize: '', companyDescription: '', phone: '', officeAddress: '',
  });

  useEffect(() => {
    api.get('/recruiter/profile')
      .then(r => {
        setRecruiter(r.data);
        setForm({
          companyName: r.data.companyName || '',
          designation: r.data.designation || '',
          industry: r.data.industry || '',
          companyWebsite: r.data.companyWebsite || '',
          companySize: r.data.companySize || '',
          companyDescription: r.data.companyDescription || '',
          phone: r.data.phone || '',
          officeAddress: r.data.officeAddress || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/recruiter/profile', form);
      setRecruiter(data.recruiter);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      {[1, 2].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Company Profile</h1>
          <p className="text-muted-foreground">Manage your company details visible to candidates</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all shrink-0"
          >
            <Edit2 size={15} /> Edit Profile
          </button>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 text-green-600 text-sm font-medium rounded-xl border border-green-500/20">
          <CheckCircle2 size={16} /> Profile updated successfully!
        </div>
      )}

      {/* Account info (read-only) */}
      <Section title="Account Information" icon={<UserCircle size={18} />}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-secondary/10 flex items-center justify-center shrink-0">
            {user?.profilePicture
              ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
              : <UserCircle size={32} className="text-secondary" />}
          </div>
          <div>
            <h3 className="text-xl font-bold">{user?.fullName}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
            {recruiter?.designation && (
              <p className="text-sm font-medium text-secondary mt-1 flex items-center gap-1.5">
                <Briefcase size={13} /> {recruiter.designation}
                {recruiter?.companyName && <> at {recruiter.companyName}</>}
              </p>
            )}
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
              <CheckCircle2 size={12} /> Verified with Google
            </span>
          </div>
        </div>
      </Section>

      {/* Company details */}
      <Section title="Company Details" icon={<Building2 size={18} />}>
        {!editing ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { label: 'Company Name', value: recruiter?.companyName, icon: <Building2 size={13} /> },
              { label: 'Your Designation', value: recruiter?.designation, icon: <Briefcase size={13} /> },
              { label: 'Industry', value: recruiter?.industry, icon: <FileText size={13} /> },
              { label: 'Company Size', value: recruiter?.companySize ? `${recruiter.companySize} employees` : null, icon: <Users size={13} /> },
              { label: 'Phone', value: recruiter?.phone, icon: <Phone size={13} /> },
              { label: 'Website', value: recruiter?.companyWebsite, icon: <Globe size={13} />, link: true },
              { label: 'Office Address', value: recruiter?.officeAddress, icon: <MapPin size={13} /> },
            ].map(({ label, value, icon, link }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">{icon}{label}</p>
                {value
                  ? link
                    ? <a href={value} target="_blank" rel="noreferrer" className="text-sm text-secondary hover:underline">{value}</a>
                    : <p className="text-sm font-medium">{value}</p>
                  : <p className="text-sm text-muted-foreground/50 italic">Not set</p>
                }
              </div>
            ))}
            {recruiter?.companyDescription && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">About the Company</p>
                <p className="text-sm">{recruiter.companyDescription}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Company Name *" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Corp" />
              <InputField label="Your Designation *" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="HR Manager, CTO..." />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Industry</label>
                <select className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Company Size</label>
                <select className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  value={form.companySize} onChange={e => set('companySize', e.target.value)}>
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <InputField label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              <InputField label="Company Website" value={form.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} placeholder="https://acme.com" />
              <div className="sm:col-span-2">
                <InputField label="Office Address" value={form.officeAddress} onChange={e => set('officeAddress', e.target.value)} placeholder="Mumbai, Maharashtra" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">About the Company</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none transition-all"
                  rows={4} value={form.companyDescription}
                  onChange={e => set('companyDescription', e.target.value)}
                  placeholder="Describe what your company does, its mission, culture..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !form.companyName || !form.designation}
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-all">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};

export default RecruiterProfile;
