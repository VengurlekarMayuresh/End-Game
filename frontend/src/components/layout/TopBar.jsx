import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../ui/Logo';
        
Let me continue with the TopBar component and then MainLayout.
<tool_call>
<function=write>
<parameter=content>
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Menu, X, Bell, UserCircle, ChevronDown } from 'lucide-react';
import UserMenu from './UserMenu';

const TopBar = ({ onMenuClick }) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="h-16 bg-background/90 backdrop-blur-md border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <Logo href="/" size="md" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification bell */}
          <button className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default TopBar;