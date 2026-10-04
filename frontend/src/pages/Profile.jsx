import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStudentProfile, useUpdateProfile, useUpdateSocialLinks } from '../hooks/useStudent';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/utils';
import api from '../lib/axios';
import {
  User, Phone, MapPin, Calendar, Globe, GitBranch,
  Save, Edit2, X, CheckCircle2, ExternalLink, Code2,
  Sparkles, Mic, CheckCheck, ShieldCheck, Clock, Building2,
  ArrowRight, Briefcase, Award, AlertCircle, ChevronRight
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'PROFILE' vs 'INTERVIEWS'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'interviews' ? 'INTERVIEWS' : 'PROFILE');

  useEffect(() => {
    if (tabParam === 'interviews') {
      setActiveTab('INTERVIEWS');
    } else if (tabParam === 'profile') {
      setActiveTab('PROFILE');
    }
  }, [tabParam]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams(tabKey === 'INTERVIEWS' ? { tab: 'interviews' } : {});
  };

  // Applications & Interview State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoadingApps(true);
        const res = await api.get('/student/applications');
        setApplications(res.data || []);
      } catch (err) {
        console.error('Failed to load applications in profile', err);
      } finally {
        setLoadingApps(false);
      }
    };
    fetchApplications();
  }, []);

  const assignedInterviews = applications.filter(a => a.status === 'INTERVIEW' || a.status === 'OFFERED');
  const otherApplications = applications.filter(a => a.status !== 'INTERVIEW' && a.status !== 'OFFERED');

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
    <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold mb-1">Candidate Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your credentials, social presence, and track assigned technical interviews
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-2xl shrink-0">
          <button
            onClick={() => handleTabChange('PROFILE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PROFILE'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User size={15} />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => handleTabChange('INTERVIEWS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'INTERVIEWS'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic size={15} />
            <span>Assigned Interviews</span>
            {assignedInterviews.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'INTERVIEWS' ? 'bg-white text-violet-700' : 'bg-emerald-500 text-white animate-pulse'
              }`}>
                {assignedInterviews.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: PROFILE DETAILS                                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: ASSIGNED INTERVIEWS & PIPELINE TRACKER                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'INTERVIEWS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Informational Guidance Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Hiring Pipeline & Round Clearance Policy
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                When an application reaches the <strong className="text-foreground">Interview Assigned</strong> stage,
                all preceding qualification rounds (Resume Screening, General Aptitude, and Role-Specific Technical Test)
                are certified as <strong className="text-emerald-600">COMPLETED / CLEARED</strong>.
                You are eligible to launch the live AI Technical Voice Interview at any time.
              </p>
            </div>
          </div>

          {/* ASSIGNED INTERVIEWS SECTION */}
          {assignedInterviews.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Mic size={18} className="text-violet-600" /> Active Technical Interviews ({assignedInterviews.length})
              </h2>

              {assignedInterviews.map((app) => {
                const companyName = app.job?.recruiter?.companyName || 'Hiring Organization';
                const jobTitle = app.job?.title || 'Software Engineer';
                const isOffered = app.status === 'OFFERED';

                return (
                  <div
                    key={app.id}
                    className="bg-card border-2 border-violet-500/30 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden"
                  >
                    {/* Card Top: Job Title & Company */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                      <div className="flex items-center gap-4">
                        {app.job?.recruiter?.companyLogo ? (
                          <img
                            src={app.job.recruiter.companyLogo}
                            alt=""
                            className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-violet-500/10 text-violet-600 font-bold text-xl rounded-2xl flex items-center justify-center border border-violet-500/20 shrink-0">
                            {companyName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-foreground">{jobTitle}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                              {isOffered ? 'JOB OFFERED' : 'INTERVIEW ASSIGNED'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{companyName}</span>
                            {app.job?.location && <span>· {app.job.location}</span>}
                            {app.job?.type && <span>· {app.job.type}</span>}
                            <span>· Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      <Link
                        to="/student/interview"
                        className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                      >
                        <Mic size={15} /> Enter Interview Room
                      </Link>
                    </div>

                    {/* 4-ROUND PIPELINE PROGRESSION: ALL PREVIOUS ROUNDS CLEARED */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCheck size={14} className="text-emerald-500" />
                        Complete Round Evaluation Status
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        
                        {/* Round 1 */}
                        <div className="p-4 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl flex items-start gap-3.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCheck size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase text-emerald-600">Round 1</span>
                              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                COMPLETED
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-foreground mt-0.5">Resume Screening & ATS Matching</h5>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                              Candidate resume passed automated ATS skill gap criteria and was approved by recruiters.
                            </p>
                          </div>
                        </div>

                        {/* Round 2 */}
                        <div className="p-4 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl flex items-start gap-3.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCheck size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase text-emerald-600">Round 2</span>
                              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                COMPLETED
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-foreground mt-0.5">General Aptitude Assessment</h5>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                              Quantitative, logical reasoning, and core problem solving benchmarks cleared.
                            </p>
                          </div>
                        </div>

                        {/* Round 3 */}
                        <div className="p-4 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl flex items-start gap-3.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCheck size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase text-emerald-600">Round 3</span>
                              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                COMPLETED
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-foreground mt-0.5">Role-Specific Technical & Coding Round</h5>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                              Evaluated on live DSA coding challenges, SQL sandbox queries, and technical project ladder.
                            </p>
                          </div>
                        </div>

                        {/* Round 4 */}
                        <div className="p-4 bg-violet-500/15 border-2 border-violet-500/40 rounded-2xl flex items-start gap-3.5 relative shadow-sm">
                          <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                            <Mic size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase text-violet-600 dark:text-violet-400">Round 4 (Final Stage)</span>
                              <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">
                                {isOffered ? 'PASSED & OFFERED' : 'ASSIGNED & ACTIVE'}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-foreground mt-0.5">AI Technical Voice Interview</h5>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                              Real-time interactive voice interview with AI technical interviewer evaluating architectural depth and communication.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mx-auto">
                <Mic size={28} className="opacity-40" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-foreground">No Interviews Assigned Currently</h3>
                <p className="text-xs text-muted-foreground">
                  Complete your pending aptitude assessments and keep your profile updated to unlock the AI technical voice interview round.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/student/tests"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all"
                >
                  View My Tests
                </Link>
                <Link
                  to="/jobs"
                  className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl hover:bg-secondary/90 transition-all"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          )}

          {/* OTHER APPLICATIONS PIPELINE */}
          {otherApplications.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Briefcase size={16} className="text-primary" /> Other Active Applications ({otherApplications.length})
              </h2>

              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {otherApplications.map((app) => (
                  <div key={app.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">{app.job?.title}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {app.job?.recruiter?.companyName || 'Company'} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full border bg-muted text-muted-foreground">
                      Stage: {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Profile;
