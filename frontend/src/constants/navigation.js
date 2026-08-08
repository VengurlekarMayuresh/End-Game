import {
  LayoutDashboard, UserCircle, FileText, GraduationCap,
  Code2, Briefcase, Award, Files, Settings, ClipboardList,
  Building2, Users, HelpCircle
} from 'lucide-react';

export const studentNav = [
  { name: 'Dashboard',      path: '/student',               icon: LayoutDashboard, end: true },
  { name: 'My Profile',     path: '/student/profile',       icon: UserCircle },
  { name: 'Resume',         path: '/student/resume',        icon: FileText },
  { name: 'Education',      path: '/student/education',     icon: GraduationCap },
  { name: 'Projects',       path: '/student/projects',      icon: Code2 },
  { name: 'Experience',     path: '/student/experience',    icon: Briefcase },
  { name: 'Certifications', path: '/student/certifications',icon: Award },
  { name: 'Documents',      path: '/student/documents',     icon: Files },
  { name: 'Aptitude Tests', path: '/student/tests',         icon: ClipboardList },
  { name: 'Settings',       path: '/student/settings',      icon: Settings },
];

export const recruiterNav = [
  { name: 'Dashboard',       path: '/recruiter',             icon: LayoutDashboard, end: true },
  { name: 'My Profile',      path: '/recruiter/profile',     icon: UserCircle },
  { name: 'Post a Job',      path: '/recruiter/jobs/new',    icon: Briefcase },
  { name: 'My Jobs',         path: '/recruiter/jobs',        icon: Building2 },
  { name: 'Aptitude Tests',  path: '/recruiter/tests',       icon: ClipboardList },
  { name: 'Question Bank',   path: '/recruiter/questions',   icon: HelpCircle },
  { name: 'Candidates',      path: '/recruiter/candidates',  icon: Users },
  { name: 'Settings',        path: '/recruiter/settings',    icon: Settings },
];

export const adminNav = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Settings',  path: '/admin/settings', icon: Settings },
];