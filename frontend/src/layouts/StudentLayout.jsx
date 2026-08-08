import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getImageUrl } from '../lib/utils';
import {
  LayoutDashboard, UserCircle, FileText, GraduationCap,
  Code2, Briefcase, Award, Files, Settings, LogOut,
  Briefcase as BriefcaseLogo, ChevronLeft, ChevronRight,
  Moon, Sun, Bell, ClipboardList
} from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard',      path: '/student',               icon: <LayoutDashboard size={20} />, end: true },
    { name: 'My Profile',     path: '/student/profile',       icon: <UserCircle size={20} /> },
    { name: 'Resume',         path: '/student/resume',        icon: <FileText size={20} /> },
    { name: 'Education',      path: '/student/education',     icon: <GraduationCap size={20} /> },
    { name: 'Projects',       path: '/student/projects',      icon: <Code2 size={20} /> },
    { name: 'Experience',     path: '/student/experience',    icon: <Briefcase size={20} /> },
    { name: 'Certifications', path: '/student/certifications',icon: <Award size={20} /> },
    { name: 'Documents',      path: '/student/documents',     icon: <Files size={20} /> },
    { name: 'Aptitude Tests', path: '/student/tests',         icon: <ClipboardList size={20} /> },
    { name: 'Settings',       path: '/student/settings',      icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar ── */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0 z-40`}>
        {/* Logo + collapse */}
        <div className={`p-4 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BriefcaseLogo size={16} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-sm">HireSense AI</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {user?.profilePicture
                  ? <img src={getImageUrl(user.profilePicture)} alt={user.fullName} className="w-full h-full object-cover" />
                  : <UserCircle size={20} className="text-primary" />}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              title={collapsed ? item.name : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              {item.icon}
              {!collapsed && item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {/* Breadcrumb hint — collapsed sidebar shows brand here */}
            {collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <BriefcaseLogo size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm font-bold">HireSense AI</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
              <Bell size={17} />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-primary/10 ml-1">
              {user?.profilePicture
                ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
                : <UserCircle size={20} className="text-primary w-full h-full p-0.5" />}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
