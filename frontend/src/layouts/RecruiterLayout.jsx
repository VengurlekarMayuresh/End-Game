import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/utils';
import {
  LayoutDashboard, UserCircle, Briefcase, Users,
  Settings, LogOut, Building2, ChevronLeft, ChevronRight, Bell,
  ClipboardList, HelpCircle
} from 'lucide-react';

const RecruiterLayout = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard',      path: '/recruiter',             icon: <LayoutDashboard size={20} />, end: true },
    { name: 'My Profile',     path: '/recruiter/profile',     icon: <UserCircle size={20} /> },
    { name: 'Post a Job',     path: '/recruiter/jobs/new',    icon: <Briefcase size={20} /> },
    { name: 'My Jobs',        path: '/recruiter/jobs',        icon: <Building2 size={20} /> },
    { name: 'Aptitude Tests', path: '/recruiter/tests',       icon: <ClipboardList size={20} /> },
    { name: 'Question Bank',  path: '/recruiter/questions',   icon: <HelpCircle size={20} /> },
    { name: 'Candidates',     path: '/recruiter/candidates',  icon: <Users size={20} /> },
    { name: 'Settings',       path: '/recruiter/settings',    icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0`}>
        {/* Logo + toggle */}
        <div className={`p-4 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-secondary-foreground" />
              </div>
              <span className="font-bold text-sm">HireSense</span>
              <span className="text-xs px-1.5 py-0.5 bg-secondary/20 text-secondary rounded font-medium">Recruiter</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-secondary/20 flex items-center justify-center shrink-0">
                {user?.profilePicture
                  ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
                  : <UserCircle size={20} className="text-secondary" />}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              title={collapsed ? item.name : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-secondary/15 text-secondary'
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

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-secondary/20">
              {user?.profilePicture
                ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
                : <UserCircle size={20} className="text-secondary m-1" />}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RecruiterLayout;
