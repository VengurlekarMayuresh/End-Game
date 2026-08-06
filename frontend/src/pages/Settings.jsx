import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentProfile, useUpdatePreferences } from '../hooks/useStudent';
import { Settings as SettingsIcon, Bell, Shield, Target, Save, CheckCircle2, X, Plus } from 'lucide-react';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const REMOTE_PREFS = ['Remote', 'On-site', 'Hybrid', 'Open to all'];

const TagInput = ({ label, tags, setTags, placeholder }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) { setTags([...tags, val]); }
    setInput('');
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
            {tag}
            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive transition-colors ml-1">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <button onClick={add} className="px-3 py-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
          <Plus size={16} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Press Enter or + to add</p>
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { data: profile } = useStudentProfile();
  const updatePrefs = useUpdatePreferences();
  const [saved, setSaved] = useState(false);

  const prefs = profile?.preferences;
  const [roles, setRoles] = useState(prefs?.preferredRoles || []);
  const [locations, setLocations] = useState(prefs?.preferredLocations || []);
  const [salary, setSalary] = useState(prefs?.expectedSalary || '');
  const [empType, setEmpType] = useState(prefs?.employmentType || '');
  const [remotePref, setRemotePref] = useState(prefs?.remotePreference || '');

  React.useEffect(() => {
    if (prefs) {
      setRoles(prefs.preferredRoles || []);
      setLocations(prefs.preferredLocations || []);
      setSalary(prefs.expectedSalary || '');
      setEmpType(prefs.employmentType || '');
      setRemotePref(prefs.remotePreference || '');
    }
  }, [prefs]);

  const handleSave = async () => {
    await updatePrefs.mutateAsync({
      preferredRoles: roles, preferredLocations: locations,
      expectedSalary: salary, employmentType: empType, remotePreference: remotePref,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Configure your job preferences and account settings</p>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Shield size={18} />
          </div>
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="flex items-center gap-4">
          {user?.profilePicture && (
            <img src={user.profilePicture} alt="" className="w-14 h-14 rounded-2xl object-cover" />
          )}
          <div>
            <p className="font-semibold">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Role: <span className="font-medium text-primary">{user?.role}</span></p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-muted/40 rounded-xl text-sm text-muted-foreground">
          <Shield size={14} className="inline mr-2" />
          Your account is authenticated via Google. Password management is handled by Google.
        </div>
      </div>

      {/* Job Preferences */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Target size={18} />
          </div>
          <h2 className="text-lg font-semibold">Job Preferences</h2>
        </div>

        <div className="space-y-5">
          <TagInput label="Preferred Job Roles" tags={roles} setTags={setRoles} placeholder="Software Engineer, Product Manager..." />
          <TagInput label="Preferred Locations" tags={locations} setTags={setLocations} placeholder="Mumbai, Bangalore, Remote..." />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Expected Salary (₹ per annum)</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 8 LPA, 12-15 LPA" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Employment Type</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={empType} onChange={e => setEmpType(e.target.value)}>
                <option value="">Any type</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Remote Preference</label>
            <div className="flex flex-wrap gap-2">
              {REMOTE_PREFS.map(r => (
                <button key={r} onClick={() => setRemotePref(r === remotePref ? '' : r)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${remotePref === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={updatePrefs.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
              <Save size={14} /> {updatePrefs.isPending ? 'Saving...' : 'Save Preferences'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 size={14} /> Preferences saved!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications (display only) */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Bell size={18} />
          </div>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        {[
          { label: 'New job recommendations', desc: 'Get notified when new jobs match your profile', on: true },
          { label: 'Application status updates', desc: 'Updates when a recruiter reviews your application', on: true },
          { label: 'Profile views', desc: 'Be notified when recruiters view your profile', on: false },
        ].map(({ label, desc, on }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted'} relative cursor-pointer`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
