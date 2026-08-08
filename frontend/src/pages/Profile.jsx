import React, { useState } from 'react';
import { useStudentProfile, useUpdateProfile, useUpdateSocialLinks } from '../hooks/useStudent';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/utils';
import {
  User, Phone, MapPin, Calendar, Globe, GitBranch,
  Save, Edit2, X, CheckCircle2, ExternalLink, Code2
} from 'lucide-react';

const ProfileSection = ({ title, icon, children }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
      <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
    <input
      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
      {...props}
    />
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useStudentProfile();
  const updateProfile = useUpdateProfile();
  const updateSocial = useUpdateSocialLinks();

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingSocial, setEditingSocial] = useState(false);
  const [personalForm, setPersonalForm] = useState({});
  const [socialForm, setSocialForm] = useState({});
  const [saved, setSaved] = useState('');

  const startEditPersonal = () => {
    setPersonalForm({
      phone: profile?.phone || '',
      gender: profile?.gender || '',
      dob: profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      pincode: profile?.pincode || '',
    });
    setEditingPersonal(true);
  };

  const startEditSocial = () => {
    setSocialForm({
      github: profile?.socialLinks?.github || '',
      linkedin: profile?.socialLinks?.linkedin || '',
      portfolio: profile?.socialLinks?.portfolio || '',
      leetcode: profile?.socialLinks?.leetcode || '',
      codechef: profile?.socialLinks?.codechef || '',
      hackerrank: profile?.socialLinks?.hackerrank || '',
      codeforces: profile?.socialLinks?.codeforces || '',
    });
    setEditingSocial(true);
  };

  const savePersonal = async () => {
    await updateProfile.mutateAsync(personalForm);
    setEditingPersonal(false);
    setSaved('personal');
    setTimeout(() => setSaved(''), 2000);
  };

  const saveSocial = async () => {
    await updateSocial.mutateAsync(socialForm);
    setEditingSocial(false);
    setSaved('social');
    setTimeout(() => setSaved(''), 2000);
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and social links</p>
      </div>

      {/* Account Info (read-only from Google) */}
      <ProfileSection title="Account Information" icon={<User size={18} />}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {user?.profilePicture
              ? <img src={getImageUrl(user.profilePicture)} alt={user.fullName} className="w-full h-full object-cover" />
              : <User size={32} className="text-primary" />
            }
          </div>
          <div>
            <h3 className="text-xl font-bold">{user?.fullName}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              <CheckCircle2 size={12} /> Verified with Google
            </span>
          </div>
        </div>
      </ProfileSection>

      {/* Personal Info */}
      <ProfileSection title="Personal Information" icon={<Phone size={18} />}>
        {!editingPersonal ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Phone', value: profile?.phone },
                { label: 'Gender', value: profile?.gender },
                { label: 'Date of Birth', value: profile?.dob ? new Date(profile.dob).toLocaleDateString() : null },
                { label: 'City', value: profile?.city },
                { label: 'State', value: profile?.state },
                { label: 'Country', value: profile?.country },
                { label: 'Pincode', value: profile?.pincode },
                { label: 'Address', value: profile?.address },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-medium">{value || <span className="text-muted-foreground/50 italic">Not set</span>}</p>
                </div>
              ))}
            </div>
            <button onClick={startEditPersonal} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Edit2 size={14} /> Edit personal info
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Phone" value={personalForm.phone} onChange={e => setPersonalForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Gender</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  value={personalForm.gender}
                  onChange={e => setPersonalForm(p => ({ ...p, gender: e.target.value }))}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <InputField label="Date of Birth" type="date" value={personalForm.dob} onChange={e => setPersonalForm(p => ({ ...p, dob: e.target.value }))} />
              <InputField label="City" value={personalForm.city} onChange={e => setPersonalForm(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" />
              <InputField label="State" value={personalForm.state} onChange={e => setPersonalForm(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" />
              <InputField label="Country" value={personalForm.country} onChange={e => setPersonalForm(p => ({ ...p, country: e.target.value }))} placeholder="India" />
              <InputField label="Pincode" value={personalForm.pincode} onChange={e => setPersonalForm(p => ({ ...p, pincode: e.target.value }))} placeholder="400001" />
              <InputField label="Address" value={personalForm.address} onChange={e => setPersonalForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={savePersonal} disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                <Save size={14} /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditingPersonal(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
        {saved === 'personal' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={14} /> Saved successfully!
          </div>
        )}
      </ProfileSection>

      {/* Social Links */}
      <ProfileSection title="Social Links" icon={<Globe size={18} />}>
        {!editingSocial ? (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {[
                { label: 'GitHub', icon: <GitBranch size={14} />, value: profile?.socialLinks?.github },
                { label: 'LinkedIn', icon: <Globe size={14} />, value: profile?.socialLinks?.linkedin },
                { label: 'Portfolio', icon: <Globe size={14} />, value: profile?.socialLinks?.portfolio },
                { label: 'LeetCode', icon: <Code2 size={14} />, value: profile?.socialLinks?.leetcode },
                { label: 'Codechef', icon: <Code2 size={14} />, value: profile?.socialLinks?.codechef },
                { label: 'HackerRank', icon: <Code2 size={14} />, value: profile?.socialLinks?.hackerrank },
                { label: 'Codeforces', icon: <Code2 size={14} />, value: profile?.socialLinks?.codeforces },
              ].map(({ label, icon, value }) => (
                <div key={label} className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl">
                  <span className="text-muted-foreground">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {value
                      ? <a href={value} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
                          {value.replace('https://', '')} <ExternalLink size={10} />
                        </a>
                      : <p className="text-sm text-muted-foreground/50 italic">Not set</p>
                    }
                  </div>
                </div>
              ))}
            </div>
            <button onClick={startEditSocial} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Edit2 size={14} /> Edit social links
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {['github', 'linkedin', 'portfolio', 'leetcode', 'codechef', 'hackerrank', 'codeforces'].map(key => (
                <InputField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={socialForm[key]}
                  onChange={e => setSocialForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={`https://...`} />
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveSocial} disabled={updateSocial.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                <Save size={14} /> {updateSocial.isPending ? 'Saving...' : 'Save Links'}
              </button>
              <button onClick={() => setEditingSocial(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
        {saved === 'social' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={14} /> Saved successfully!
          </div>
        )}
      </ProfileSection>
    </div>
  );
};

export default Profile;
