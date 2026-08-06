import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentProfile } from '../hooks/useStudent';
import { CheckCircle2, Circle, Trophy, Star, FileText, Target, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useStudentProfile();

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
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
    <div className="max-w-6xl mx-auto space-y-8">
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
          <p className="text-sm font-medium text-primary">Next step: Add your latest projects</p>
        </div>
      </div>

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
          <h3 className="text-2xl font-bold mb-1">12</h3>
          <p className="text-muted-foreground text-sm">Applied Jobs</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4">
            <Star size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-1">4</h3>
          <p className="text-muted-foreground text-sm">Saved Jobs</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-4">
            <Eye size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-1">28</h3>
          <p className="text-muted-foreground text-sm">Profile Views</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recommended Actions */}
        <div className="lg:col-span-2 space-y-4">
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

        {/* Recent Activity Placeholder */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="text-center py-8 text-muted-foreground">
              <Trophy size={48} className="mx-auto mb-4 opacity-20" />
              <p>No recent activity.</p>
              <p className="text-sm">Start applying to jobs to see your timeline!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
