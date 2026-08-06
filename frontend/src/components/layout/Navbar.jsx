import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Menu, X, Briefcase } from 'lucide-react';

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Briefcase size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">HireSense AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse Jobs
          </Link>
          <Link to="/company" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            For Recruiters
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sign up
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link to="/jobs" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setMobileMenuOpen(false)}>Browse Jobs</Link>
            <Link to="/company" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setMobileMenuOpen(false)}>For Recruiters</Link>
            <div className="h-px bg-border my-2"></div>
            <Link to="/login" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link to="/register" className="bg-primary text-primary-foreground text-sm font-medium p-2 rounded-md text-center" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
