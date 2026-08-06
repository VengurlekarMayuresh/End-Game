import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MessageCircle, GitBranch, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <Briefcase size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">HireSense AI</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              The next-generation recruitment automation platform built for modern engineering teams.
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors"><MessageCircle size={20} /></a>
              <a href="#" className="hover:text-foreground transition-colors"><GitBranch size={20} /></a>
              <a href="#" className="hover:text-foreground transition-colors"><Globe size={20} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/assessments" className="hover:text-primary transition-colors">AI Assessments</Link></li>
              <li><Link to="/interviews" className="hover:text-primary transition-colors">Video Interviews</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/documentation" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/guides" className="hover:text-primary transition-colors">Hiring Guides</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} HireSense AI Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Built with React 19 & Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
