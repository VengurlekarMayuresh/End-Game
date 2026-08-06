import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const RoleSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.status === 'ACTIVE') {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">How do you want to use HireSense?</h1>
          <p className="text-muted-foreground text-lg">Select your role to personalize your experience.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Card */}
          <button 
            onClick={() => navigate('/onboarding/student')}
            className="text-left group relative bg-card p-8 rounded-2xl border border-border shadow-sm hover:border-primary hover:shadow-md transition-all"
          >
            <div className="bg-primary/10 text-primary p-4 rounded-xl w-fit mb-6">
              <GraduationCap size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">I am a Student</h2>
            <p className="text-muted-foreground mb-6">
              Build your professional profile, take AI assessments, and apply to top companies hiring on the platform.
            </p>
            <div className="flex items-center text-primary font-medium">
              Continue as Student <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Recruiter Card */}
          <button 
            onClick={() => navigate('/onboarding/recruiter')}
            className="text-left group relative bg-card p-8 rounded-2xl border border-border shadow-sm hover:border-secondary hover:shadow-md transition-all"
          >
            <div className="bg-secondary/10 text-secondary p-4 rounded-xl w-fit mb-6">
              <Building2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-secondary transition-colors">I am a Recruiter</h2>
            <p className="text-muted-foreground mb-6">
              Post jobs, configure custom hiring workflows, and let AI help you discover and evaluate the best talent.
            </p>
            <div className="flex items-center text-secondary font-medium">
              Continue as Recruiter <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
