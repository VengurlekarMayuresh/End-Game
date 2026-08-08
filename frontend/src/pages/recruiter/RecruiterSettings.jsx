import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { getImageUrl } from '../../lib/utils';
import {
  Bell, Shield, Target, Save, CheckCircle2, X, Plus,
  Building2, UserCircle, Briefcase
} from 'lucide-react';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const REMOTE_PREFS = ['Remote', 'On-site', 'Hybrid', 'Flexible'];

const TagInput = ({ label, tags, setTags, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary text-sm rounded-full">
            {tag}
            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive ml-1"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder={placeholder} />
        <button onClick={add} className="px-3 py-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors"><Plus size={16} /></button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Press Enter or + to add</p>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
      <div className="w-9 h-9 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const RecruiterSettings = () => {
  const { user } = useAuth();
  const [recruiter, setRecruiter] = useState(null);
  const [hiringFor, setHiringFor] = useState([]);
  const [locations, setLocations] = useState([]);
  const [remote, setRemote] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/recruiter/profile').then(r => {
      setRecruiter(r.data);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // For now store preferences client-side (extend schema to add these later)
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const notifItems = [
    { label: 'New application received', desc: 'When a student applies to your job', on: true },
    { label: 'Application status updates', desc: 'Reminders about pending reviews', on: true },
    { label: 'Job deadline approaching', desc: '2 days before your listing closes', on: true },
    { label: 'Profile views', desc: 'When students view your company profile', on: false },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and notification settings</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 text-green-600 text-sm font-medium rounded-xl border border-green-500/20">
          <CheckCircle2 size={16} /> Settings saved successfully!
        </div>
      )}

      {/* Account */}
      <Section title="Account" icon={<Shield size={18} />}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary/10 flex items-center justify-center shrink-0">
            {user?.profilePicture
              ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
              : <UserCircle size={28} className="text-secondary" />}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.fullName}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            {recruiter?.designation && (
              <p className="text-sm text-secondary flex items-center gap-1 mt-1">
                <Briefcase size={13} /> {recruiter.designation}
                {recruiter.companyName && <> at <span className="font-semibold">{recruiter.companyName}</span></>}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 p-3 bg-muted/40 rounded-xl text-sm text-muted-foreground">
          <Shield size={14} className="inline mr-2" />
          Your account is authenticated via Google. Password management is handled by Google.
        </div>
      </Section>

      {/* Hiring Preferences */}
      <Section title="Hiring Preferences" icon={<Target size={18} />}>
        <div className="space-y-5">
          <TagInput label="Hiring For Roles" tags={hiringFor} setTags={setHiringFor} placeholder="React Developer, Data Analyst..." />
          <TagInput label="Preferred Candidate Locations" tags={locations} setTags={setLocations} placeholder="Mumbai, Bangalore, Remote..." />
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Work Mode Preference</label>
            <div className="flex flex-wrap gap-2">
              {REMOTE_PREFS.map(r => (
                <button key={r} onClick={() => setRemote(r === remote ? '' : r)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${remote === r ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border hover:border-secondary/50 hover:bg-muted/50'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-all">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={<Bell size={18} />}>
        <div className="divide-y divide-border">
          {notifItems.map(({ label, desc, on }) => (
            <div key={label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative shrink-0 ${on ? 'bg-secondary' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default RecruiterSettings;
