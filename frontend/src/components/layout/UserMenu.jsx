import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../lib/utils';
import {
  LayoutDashboard, UserCircle, LogOut, ChevronDown, ChevronUp
} from 'lucide-react';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const menuRef = useRef(null);

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

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {user?.profilePicture
            ? <img src={getImageUrl(user.profilePicture)} alt="" className="w-full h-full object-cover" />
            : <UserCircle size={20} className="text-primary" />}
        </div>
        <span className="text-sm font-medium max-w-[120px] truncate hidden lg:block">{user?.fullName}</span>
        {user?.role === 'RECRUITER' && (
          <span className="text-xs px-1.5 py-0.5 bg-secondary/20 text-secondary rounded font-medium hidden sm:inline-block">
            Recruiter
          </span>
        )}
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="font-semibold text-sm truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {user?.role === 'RECRUITER' && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full font-medium">
                Recruiter
              </span>
            )}
          </div>

          <div className="p-1.5 space-y-0.5">
            <Link
              to={getDashboardPath()}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-muted transition-colors"
            >
              <LayoutDashboard size={15} className="text-primary" />
              {getDashboardLabel()}
            </Link>
            <Link
              to={user?.role === 'RECRUITER' ? '/recruiter/profile' : '/student/profile'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-muted transition-colors"
            >
              <UserCircle size={15} className="text-muted-foreground" />
              My Profile
            </Link>
          </div>

          <div className="p-1.5 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;