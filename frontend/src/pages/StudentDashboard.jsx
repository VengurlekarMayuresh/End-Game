import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentProfile } from '../hooks/useStudent';
import { CheckCircle2, Circle, Trophy, Star, FileText, Target, Eye, AlertTriangle, Building2, Calendar, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

const STATUS_BADGES = {
  APPLIED: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  REVIEWING: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
  SHORTLISTED: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  INTERVIEW: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
  OFFERED: 'bg-green-500/10 text-green-600 border border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useStudentProfile();

  const [applications, setApplications] = useState([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [activeTestsCount, setActiveTestsCount] = useState(0);
  const [completedTestsCount, setCompletedTestsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      
      // Fetch applications
      try {
        const appRes = await api.get('/student/applications');
        setApplications(appRes.data);
        setApplicationsCount(appRes.data.length);
      } catch (err) {
        console.error('Failed to fetch applications', err);
      }
      
      // Fetch tests
      try {
        const testRes = await api.get('/student/tests');
        setActiveTestsCount(testRes.data.active.length);
        setCompletedTestsCount(testRes.data.completed.length);
      } catch (err) {
        console.error('Failed to fetch tests', err);
      }
      
      setLoadingStats(false);
    };
    fetchStats();
  }, []);

  if (isProfileLoading || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate dynamic completion % based on data present
  let completedSections = 0;
  const totalSections = 6;
  if (profile?.phone && profile?.address) completedSections++; // Personal Info
  if (profile?.education?.length > 0) completedSections++;     // Education
  if (profile?.skills?.length > 0) completedSections++;        // Skills
  if (profile?.projects?.length > 0) completedSections++;      // Projects
  if (profile?.socialLinks?.linkedin) completedSections++;     // Social
  
  // Checking for Resume Document
  const hasResume = profile?.documents?.some(doc => doc.type === 'RESUME');
  if (hasResume) completedSections++;

  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Section */}
      <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}! 👋</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Your profile is {completionPercentage}% complete. A complete profile significantly increases your chances of getting shortlisted by AI matchers.
          </p>
          <div className="w-full max-w-md bg-background rounded-full h-3 mb-2 overflow-hidden border border-border">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-primary">
            {completionPercentage === 100 ? 'Awesome! Your profile is fully complete.' : 'Next step: Update your certifications or projects.'}
          </p>
        </div>
      </div>

      {/* Pending Tests Warning Banner */}
      {activeTestsCount > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-yellow-500/20 text-yellow-600 rounded-xl shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">Pending Aptitude Tests</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              You have <span className="font-bold text-yellow-600">{activeTestsCount} pending aptitude tests</span> assigned to your job applications. Attempt them before they expire.
            </p>
          </div>
          <Link to="/student/tests" className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 font-bold text-xs rounded-lg transition-all shrink-0">
            View Tests
          </Link>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-1">{hasResume ? 'Uploaded' : 'Missing'}</h3>
          <p className="text-muted-foreground text-sm">Resume Status</p>
        </div>
        
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
            <Target size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-1">{applicationsCount}</h3>
          <p className="text-muted-foreground text-sm">Applied Jobs</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-1">{activeTestsCount}</h3>
          <p className="text-muted-foreground text-sm">Pending Tests</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-1">{completedTestsCount}</h3>
          <p className="text-muted-foreground text-sm">Completed Tests</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left pane: Recommended Actions & Applications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* My Job Applications */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 size={20} className="text-primary" /> My Job Applications
            </h2>
            
            {applications.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <Target className="mx-auto mb-3 opacity-20 text-primary" size={32} />
                <p className="font-semibold text-foreground">No applications submitted yet</p>
                <p className="text-xs mt-1">Start browsing active jobs to find matching opportunities.</p>
                <Link to="/jobs" className="mt-4 inline-block px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-all">
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
                {applications.map((app) => {
                  const companyName = app.job?.recruiter?.companyName || 'Confidential';
                  const logoInitial = companyName.charAt(0);
                  const statusCls = STATUS_BADGES[app.status] || STATUS_BADGES.APPLIED;

                  return (
                    <div key={app.id} className="p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-all">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {app.job?.recruiter?.companyLogo ? (
                          <img src={app.job.recruiter.companyLogo} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 bg-primary/10 text-primary font-bold text-lg flex items-center justify-center rounded-xl shrink-0">
                            {logoInitial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{app.job?.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{companyName}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar size={10} /> Applied: {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {app.job?.test && app.job.test.status === 'PUBLISHED' && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 text-[10px] font-bold rounded">
                            <ClipboardList size={10} /> Has Test
                          </span>
                        )}
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusCls}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recommended Actions</h2>
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
              {!hasResume && (
                <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Circle className="text-muted-foreground" size={20} />
                    <div>
                      <p className="font-semibold">Upload your resume</p>
                      <p className="text-sm text-muted-foreground">PDF format, max 5MB</p>
                    </div>
                  </div>
                  <Link to="/student/resume" className="text-sm font-medium text-primary hover:underline">Upload</Link>
                </div>
              )}
              {profile?.projects?.length === 0 && (
                <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Circle className="text-muted-foreground" size={20} />
                    <div>
                      <p className="font-semibold">Add a Project</p>
                      <p className="text-sm text-muted-foreground">Showcase your practical skills</p>
                    </div>
                  </div>
                  <Link to="/student/projects" className="text-sm font-medium text-primary hover:underline">Add Project</Link>
                </div>
              )}
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <div>
                    <p className="font-semibold">Verify Phone Number</p>
                    <p className="text-sm text-muted-foreground">Completed during onboarding</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right pane: Aptitude Tests Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Aptitude Tests Status</h2>
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="text-center py-8 text-muted-foreground">
              <Trophy size={48} className="mx-auto mb-4 opacity-20 text-primary" />
              {activeTestsCount > 0 ? (
                <div>
                  <p className="font-bold text-foreground">You have pending assessments!</p>
                  <p className="text-sm mt-1">Complete your tests to submit your application for review.</p>
                  <Link to="/student/tests" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all">
                    Go to Tests
                  </Link>
                </div>
              ) : (
                <div>
                  <p>All caught up!</p>
                  <p className="text-sm mt-1">No pending aptitude tests assigned currently.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
