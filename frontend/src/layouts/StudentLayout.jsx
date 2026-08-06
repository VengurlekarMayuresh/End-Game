import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileText, 
  GraduationCap, 
  Code2, 
  Briefcase, 
  Award, 
  Files, 
  Settings, 
  LogOut
} from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={20} /> },
    { name: 'My Profile', path: '/student/profile', icon: <UserCircle size={20} /> },
    { name: 'Resume', path: '/student/resume', icon: <FileText size={20} /> },
    { name: 'Education', path: '/student/education', icon: <GraduationCap size={20} /> },
    { name: 'Projects', path: '/student/projects', icon: <Code2 size={20} /> },
    { name: 'Experience', path: '/student/experience', icon: <Briefcase size={20} /> },
    { name: 'Certifications', path: '/student/certifications', icon: <Award size={20} /> },
    { name: 'Documents', path: '/student/documents', icon: <Files size={20} /> },
    { name: 'Settings', path: '/student/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-primary" size={24} />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/student'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-auto md:h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
