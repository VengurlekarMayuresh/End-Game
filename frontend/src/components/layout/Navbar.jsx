import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Moon, Sun, Menu, X, Briefcase,
  LayoutDashboard, UserCircle, LogOut, ChevronDown, Bell
} from 'lucide-react';

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDashboardPath = () => {
    if (user?.role === 'STUDENT') return '/student';
    if (user?.role === 'RECRUITER') return '/recruiter';
    if (user?.role === 'ADMIN') return '/admin';
    return '/';
  };

  const getDashboardLabel = () => {
    if (user?.role === 'STUDENT') return 'Student Dashboard';
    if (user?.role === 'RECRUITER') return 'Recruiter Dashboard';
    if (user?.role === 'ADMIN') return 'Admin Panel';
    return 'Dashboard';
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Briefcase size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">HireSense AI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse Jobs
          </Link>
          <Link to="/company" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            For Recruiters
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            /* ── Logged-in user menu ── */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                  {user.profilePicture
                    ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                    : <UserCircle size={20} className="text-primary" />}
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate hidden lg:block">{user.fullName}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <p className="font-semibold text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                      {user.role}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard size={15} className="text-primary" />
                      {getDashboardLabel()}
                    </Link>
                    <Link
                      to={user.role === 'RECRUITER' ? '/recruiter/profile' : '/student/profile'}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-muted transition-colors"
                    >
                      <UserCircle size={15} className="text-muted-foreground" />
                      My Profile
                    </Link>
                  </div>

                  <div className="p-1.5 border-t border-border">
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest buttons ── */
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                Sign up free
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Link to="/jobs" className="text-sm font-medium p-2.5 hover:bg-muted rounded-xl" onClick={() => setMobileMenuOpen(false)}>Browse Jobs</Link>
            <Link to="/company" className="text-sm font-medium p-2.5 hover:bg-muted rounded-xl" onClick={() => setMobileMenuOpen(false)}>For Recruiters</Link>
            <div className="h-px bg-border my-1" />
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2.5 py-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    {user.profilePicture
                      ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                      : <UserCircle size={20} className="text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <Link to={getDashboardPath()} className="text-sm font-medium p-2.5 hover:bg-muted rounded-xl flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard size={16} /> {getDashboardLabel()}
                </Link>
                <button onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="text-sm font-medium p-2.5 text-destructive hover:bg-destructive/10 rounded-xl flex items-center gap-2 w-full text-left">
                  <LogOut size={16} /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium p-2.5 hover:bg-muted rounded-xl" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                <Link to="/register" className="bg-primary text-primary-foreground text-sm font-semibold p-2.5 rounded-xl text-center" onClick={() => setMobileMenuOpen(false)}>Sign up free</Link>
              </>
            )}
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 text-sm font-medium p-2.5 hover:bg-muted rounded-xl text-muted-foreground"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
