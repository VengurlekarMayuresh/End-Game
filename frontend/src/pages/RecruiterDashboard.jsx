import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import {
  Briefcase, Users, TrendingUp, Eye,
  Plus, ArrowRight, Building2, MapPin,
  Clock, Star, CheckCircle2, AlertCircle,
  BarChart3, Target, Zap, ChevronRight
} from 'lucide-react';

// Stat card component
const StatCard = ({ icon, label, value, sub, color, trend }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold mb-1">{value}</p>
    <p className="text-sm font-medium text-foreground">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

// Quick action card
const QuickAction = ({ icon, title, desc, to, color }) => (
  <Link to={to} className="group flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:border-primary/30 transition-all">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
  </Link>
);

// Tip card
const TipCard = ({ icon, title, desc, done }) => (
  <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${done ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-border'}`}>
    <div className={`mt-0.5 shrink-0 ${done ? 'text-green-500' : 'text-muted-foreground'}`}>
      {done ? <CheckCircle2 size={18} /> : icon}
    </div>
    <div>
      <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </div>
);

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recruiter/dashboard')
      .then(r => setDashData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recruiter = dashData?.recruiter;
  const stats = dashData?.stats || {};

  const profileComplete = !!(
    recruiter?.companyName &&
    recruiter?.designation &&
    recruiter?.industry &&
    recruiter?.phone
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-muted rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-32 bg-muted rounded-2xl"/>)}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Hero welcome banner */}
      <div className="relative bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border border-secondary/20 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-secondary mb-1">{greeting()},</p>
              <h1 className="text-3xl font-bold mb-2">{user?.fullName} 👋</h1>
              <p className="text-muted-foreground">
                {recruiter?.companyName
                  ? <>Recruiting for <span className="font-semibold text-foreground">{recruiter.companyName}</span> · {recruiter.designation}</>
                  : 'Complete your company profile to start hiring top talent'}
              </p>
            </div>
            <Link
              to="/recruiter/jobs/new"
              className="flex items-center gap-2 px-5 py-3 bg-secondary text-secondary-foreground font-semibold text-sm rounded-xl hover:bg-secondary/90 transition-all shrink-0 shadow-sm"
            >
              <Plus size={16} /> Post a Job
            </Link>
          </div>

          {/* Profile completion bar */}
          {!profileComplete && (
            <div className="mt-6 p-4 bg-background/60 backdrop-blur rounded-2xl border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Profile Setup Progress</p>
                <span className="text-xs text-secondary font-medium">
                  {[recruiter?.companyName, recruiter?.designation, recruiter?.industry, recruiter?.phone].filter(Boolean).length} / 4 steps
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-700"
                  style={{ width: `${([recruiter?.companyName, recruiter?.designation, recruiter?.industry, recruiter?.phone].filter(Boolean).length / 4) * 100}%` }}
                />
              </div>
              <Link to="/recruiter/profile" className="inline-flex items-center gap-1 text-xs text-secondary font-medium mt-2 hover:underline">
                Complete profile <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase size={22} />}
          label="Active Jobs" value={stats.activeJobs ?? 0}
          sub="Jobs currently live" color="bg-blue-500/10 text-blue-500" trend={0}
        />
        <StatCard
          icon={<Users size={22} />}
          label="Applications" value={stats.totalApplications ?? 0}
          sub="Total received" color="bg-violet-500/10 text-violet-500" trend={0}
        />
        <StatCard
          icon={<Star size={22} />}
          label="Shortlisted" value={stats.shortlisted ?? 0}
          sub="Awaiting interview" color="bg-yellow-500/10 text-yellow-600" trend={0}
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Interviews" value={stats.interviews ?? 0}
          sub="Scheduled this week" color="bg-green-500/10 text-green-500" trend={0}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <QuickAction
              to="/recruiter/jobs/new"
              icon={<Plus size={20} />}
              title="Post a New Job"
              desc="Create a job listing and attract candidates"
              color="bg-blue-500/10 text-blue-500"
            />
            <QuickAction
              to="/recruiter/candidates"
              icon={<Users size={20} />}
              title="Browse Candidates"
              desc="Explore AI-matched candidates for your roles"
              color="bg-violet-500/10 text-violet-500"
            />
            <QuickAction
              to="/recruiter/jobs"
              icon={<BarChart3 size={20} />}
              title="View Job Analytics"
              desc="Track views, applications, and conversion rates"
              color="bg-green-500/10 text-green-500"
            />
            <QuickAction
              to="/recruiter/profile"
              icon={<Building2 size={20} />}
              title="Update Company Profile"
              desc="Keep your company information up to date"
              color="bg-orange-500/10 text-orange-500"
            />
          </div>

          {/* Recent Activity (empty state) */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-muted-foreground opacity-40" />
              </div>
              <p className="font-medium text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Post your first job to start seeing applications</p>
              <Link to="/recruiter/jobs/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
                <Plus size={14} /> Post First Job
              </Link>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* Company card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-secondary" /> Company Profile
            </h3>
            {recruiter?.companyName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary font-bold text-lg shrink-0">
                    {recruiter.companyName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{recruiter.companyName}</p>
                    <p className="text-sm text-muted-foreground">{recruiter.industry}</p>
                  </div>
                </div>
                {recruiter.companySize && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={13} /> {recruiter.companySize} employees
                  </div>
                )}
                {recruiter.officeAddress && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={13} /> {recruiter.officeAddress}
                  </div>
                )}
                {recruiter.companyWebsite && (
                  <a href={recruiter.companyWebsite} target="_blank" rel="noreferrer"
                    className="text-xs text-secondary hover:underline flex items-center gap-1">
                    <Eye size={11} /> {recruiter.companyWebsite.replace('https://', '')}
                  </a>
                )}
                <Link to="/recruiter/profile"
                  className="text-xs text-secondary font-medium hover:underline flex items-center gap-1 mt-1">
                  Edit profile <ArrowRight size={11} />
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Company details not set</p>
                <Link to="/recruiter/profile" className="text-xs text-secondary font-medium hover:underline mt-1 inline-block">
                  Set up now →
                </Link>
              </div>
            )}
          </div>

          {/* Getting Started Checklist */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target size={16} className="text-secondary" /> Getting Started
            </h3>
            <div className="space-y-2">
              <TipCard
                icon={<AlertCircle size={18} />}
                title="Complete company profile"
                desc="Add company name, industry, size"
                done={!!(recruiter?.companyName && recruiter?.industry)}
              />
              <TipCard
                icon={<AlertCircle size={18} />}
                title="Add contact number"
                desc="So candidates can reach you"
                done={!!recruiter?.phone}
              />
              <TipCard
                icon={<AlertCircle size={18} />}
                title="Post your first job"
                desc="Start attracting top candidates"
                done={stats.activeJobs > 0}
              />
              <TipCard
                icon={<AlertCircle size={18} />}
                title="Review applications"
                desc="Shortlist and schedule interviews"
                done={stats.shortlisted > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
