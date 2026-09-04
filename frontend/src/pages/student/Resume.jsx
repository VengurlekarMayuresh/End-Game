import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentProfile } from '../../hooks/useStudent';
import api from '../../lib/axios';
import {
  Save, CheckCircle2, Plus, X, ChevronDown, Search,
  User, BookOpen, Briefcase, Code2, Award, Star, AlertCircle
} from 'lucide-react';

// ── Huge list of common skills ──────────────────────────────────────────────
const SKILL_SUGGESTIONS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go',
  'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'Dart',
  // Web Frontend
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'HTML', 'CSS',
  'Tailwind CSS', 'Bootstrap', 'Redux', 'Zustand', 'GraphQL',
  // Web Backend
  'Node.js', 'Express.js', 'NestJS', 'Django', 'FastAPI', 'Flask',
  'Spring Boot', 'Laravel', 'ASP.NET', 'Ruby on Rails',
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Supabase',
  'Firebase', 'Cassandra', 'DynamoDB', 'Elasticsearch',
  // Cloud / DevOps
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux', 'Nginx', 'Vercel',
  // Mobile
  'React Native', 'Flutter', 'Android', 'iOS', 'Expo',
  // AI / ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'NLP', 'Computer Vision', 'Pandas', 'NumPy',
  'Data Analysis', 'Data Science', 'OpenCV',
  // Tools
  'Git', 'GitHub', 'Figma', 'Postman', 'Jira', 'Confluence', 'VS Code',
  'Linux Terminal', 'REST APIs', 'WebSockets', 'Prisma', 'Mongoose',
  // Soft skills
  'Problem Solving', 'Team Leadership', 'Communication', 'Project Management',
  'Agile', 'Scrum', 'Public Speaking', 'Critical Thinking',
];

// ── Skill Tag Input with autocomplete ────────────────────────────────────────
const SkillSelector = ({ skills, onChange }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = SKILL_SUGGESTIONS.filter(
    s => s.toLowerCase().includes(query.toLowerCase()) && !skills.includes(s)
  ).slice(0, 10);

  const addSkill = (skill) => {
    if (!skills.includes(skill) && skill.trim()) {
      onChange([...skills, skill.trim()]);
    }
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skill) => onChange(skills.filter(s => s !== skill));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
      e.preventDefault();
      addSkill(query.trim());
    }
    if (e.key === 'Backspace' && !query && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="min-h-[48px] w-full flex flex-wrap gap-2 p-3 rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/40 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map(skill => (
          <span key={skill} className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-lg">
            {skill}
            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors">
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? 'Search and add skills...' : ''}
          className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            <>
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground font-medium">Click to add or press Enter</p>
              </div>
              {filtered.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => addSkill(s)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Plus size={13} className="text-muted-foreground" /> {s}
                </button>
              ))}
              {query && !SKILL_SUGGESTIONS.includes(query) && (
                <button
                  type="button"
                  onClick={() => addSkill(query)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-500/10 hover:text-green-600 transition-colors flex items-center gap-2 border-t border-border"
                >
                  <Plus size={13} /> Add "{query}" as custom skill
                </button>
              )}
            </>
          ) : query ? (
            <button
              type="button"
              onClick={() => addSkill(query)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-green-500/10 hover:text-green-600 transition-colors flex items-center gap-2"
            >
              <Plus size={13} /> Add "{query}" as custom skill
            </button>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">Start typing to search skills...</div>
          )}
        </div>
      )}

      {skills.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">{skills.length} skill{skills.length !== 1 ? 's' : ''} added</p>
      )}
    </div>
  );
};

// ── Section Header ─────────────────────────────────────────────────────────
const SectionCard = ({ icon, title, subtitle, children }) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-3 px-6 py-4 bg-muted/30 border-b border-border">
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

// ── Input field helper ─────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${props.className || ''}`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={`w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none ${props.className || ''}`}
  />
);

// ── Main Component ─────────────────────────────────────────────────────────
const Resume = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useStudentProfile();

  const defaultExperience = { company: '', role: '', startDate: '', endDate: '', current: false, description: '' };
  const defaultEducation  = { institution: '', degree: '', field: '', startYear: '', endYear: '', grade: '' };
  const defaultProject    = { title: '', techStack: [], description: '', link: '' };
  const defaultCert       = { name: '', issuer: '', year: '' };

  const [form, setForm] = useState({
    objective: '',
    yearsOfExperience: '',
    skills: [],
    experiences: [{ ...defaultExperience }],
    education: [{ ...defaultEducation }],
    projects: [{ ...defaultProject }],
    certifications: [{ ...defaultCert }],
    languages: [],
    linkedin: '',
    github: '',
    portfolio: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (profile?.resumeData) {
      setForm(prev => ({ ...prev, ...profile.resumeData }));
    }
  }, [profile]);

  // ── Handlers for simple fields ─────────────────────────────────────────
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // ── Handlers for array sections ────────────────────────────────────────
  const addItem = (key, def) => setForm(f => ({ ...f, [key]: [...f[key], { ...def }] }));
  const removeItem = (key, idx) => setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  const updateItem = (key, idx, field, value) =>
    setForm(f => ({ ...f, [key]: f[key].map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await api.post('/student/resume', { resumeData: form });
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.message || 'Failed to save resume details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Resume Builder</h1>
          <p className="text-muted-foreground text-sm">Fill in your details. Skills and experience are used to automatically calculate your match score when you apply to jobs.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> {isSaving ? 'Saving...' : 'Save Resume'}</>}
        </button>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── 1. Basics ─────────────────────────────────────────────────── */}
      <SectionCard icon={<User size={18} />} title="Basic Info" subtitle="Auto-filled from your profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input value={user?.fullName || ''} disabled className="opacity-60 cursor-not-allowed" />
          </Field>
          <Field label="Email">
            <Input value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
          </Field>
          <Field label="LinkedIn URL">
            <Input placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e => set('linkedin', e.target.value)} />
          </Field>
          <Field label="GitHub URL">
            <Input placeholder="https://github.com/..." value={form.github} onChange={e => set('github', e.target.value)} />
          </Field>
          <Field label="Portfolio Website">
            <Input placeholder="https://yoursite.com" value={form.portfolio} onChange={e => set('portfolio', e.target.value)} />
          </Field>
        </div>
        <Field label="Career Objective / Summary">
          <Textarea rows={3} placeholder="A passionate engineer with expertise in building scalable web applications..." value={form.objective} onChange={e => set('objective', e.target.value)} />
        </Field>
      </SectionCard>

      {/* ── 2. Skills (core matching) ───────────────────────────────────── */}
      <SectionCard icon={<Star size={18} />} title="Skills" subtitle="Used for match scoring — add as many as relevant">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <Field label="Total Years of Experience" required>
            <Input
              type="number"
              min="0"
              max="50"
              step="0.5"
              placeholder="e.g. 2.5"
              value={form.yearsOfExperience}
              onChange={e => set('yearsOfExperience', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Skills" required>
          <SkillSelector skills={form.skills} onChange={v => set('skills', v)} />
        </Field>
        <Field label="Languages Known (e.g. English, Hindi)">
          <SkillSelector skills={form.languages} onChange={v => set('languages', v)} />
        </Field>
      </SectionCard>

      {/* ── 3. Education ───────────────────────────────────────────────── */}
      <SectionCard icon={<BookOpen size={18} />} title="Education" subtitle="Add your degrees / academic qualifications">
        {form.education.map((edu, idx) => (
          <div key={idx} className="relative border border-border rounded-xl p-4 space-y-4">
            {form.education.length > 1 && (
              <button onClick={() => removeItem('education', idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive">
                <X size={16} />
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Institution">
                <Input placeholder="MIT, IIT Bombay..." value={edu.institution} onChange={e => updateItem('education', idx, 'institution', e.target.value)} />
              </Field>
              <Field label="Degree">
                <Input placeholder="B.Tech, M.Sc..." value={edu.degree} onChange={e => updateItem('education', idx, 'degree', e.target.value)} />
              </Field>
              <Field label="Field / Major">
                <Input placeholder="Computer Science..." value={edu.field} onChange={e => updateItem('education', idx, 'field', e.target.value)} />
              </Field>
              <Field label="Grade / CGPA">
                <Input placeholder="8.5 / 10 or 85%" value={edu.grade} onChange={e => updateItem('education', idx, 'grade', e.target.value)} />
              </Field>
              <Field label="Start Year">
                <Input type="number" placeholder="2020" value={edu.startYear} onChange={e => updateItem('education', idx, 'startYear', e.target.value)} />
              </Field>
              <Field label="End Year">
                <Input type="number" placeholder="2024" value={edu.endYear} onChange={e => updateItem('education', idx, 'endYear', e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addItem('education', defaultEducation)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> Add Another Education
        </button>
      </SectionCard>

      {/* ── 4. Work Experience ─────────────────────────────────────────── */}
      <SectionCard icon={<Briefcase size={18} />} title="Work Experience" subtitle="Include internships and full-time roles">
        {form.experiences.map((exp, idx) => (
          <div key={idx} className="relative border border-border rounded-xl p-4 space-y-4">
            {form.experiences.length > 1 && (
              <button onClick={() => removeItem('experiences', idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive">
                <X size={16} />
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company / Organization">
                <Input placeholder="Google, Startup XYZ..." value={exp.company} onChange={e => updateItem('experiences', idx, 'company', e.target.value)} />
              </Field>
              <Field label="Role / Title">
                <Input placeholder="Software Engineer Intern..." value={exp.role} onChange={e => updateItem('experiences', idx, 'role', e.target.value)} />
              </Field>
              <Field label="Start Date">
                <Input type="month" value={exp.startDate} onChange={e => updateItem('experiences', idx, 'startDate', e.target.value)} />
              </Field>
              <Field label="End Date">
                <Input type="month" value={exp.endDate} disabled={exp.current} onChange={e => updateItem('experiences', idx, 'endDate', e.target.value)} />
                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                  <input type="checkbox" checked={exp.current} onChange={e => updateItem('experiences', idx, 'current', e.target.checked)} className="accent-primary" />
                  <span className="text-xs text-muted-foreground">Currently working here</span>
                </label>
              </Field>
            </div>
            <Field label="Description / Key Achievements">
              <Textarea rows={3} placeholder="Built RESTful APIs using Node.js and Express. Reduced query time by 40%..." value={exp.description} onChange={e => updateItem('experiences', idx, 'description', e.target.value)} />
            </Field>
          </div>
        ))}
        <button type="button" onClick={() => addItem('experiences', defaultExperience)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> Add Another Experience
        </button>
      </SectionCard>

      {/* ── 5. Projects ────────────────────────────────────────────────── */}
      <SectionCard icon={<Code2 size={18} />} title="Projects" subtitle="Side projects, academic projects, open source contributions">
        {form.projects.map((proj, idx) => (
          <div key={idx} className="relative border border-border rounded-xl p-4 space-y-4">
            {form.projects.length > 1 && (
              <button onClick={() => removeItem('projects', idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive">
                <X size={16} />
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Project Title">
                <Input placeholder="HireSense AI Platform" value={proj.title} onChange={e => updateItem('projects', idx, 'title', e.target.value)} />
              </Field>
              <Field label="Project / Live Link">
                <Input placeholder="https://github.com/..." value={proj.link} onChange={e => updateItem('projects', idx, 'link', e.target.value)} />
              </Field>
            </div>
            <Field label="Tech Stack Used">
              <SkillSelector
                skills={proj.techStack || []}
                onChange={v => updateItem('projects', idx, 'techStack', v)}
              />
            </Field>
            <Field label="Description">
              <Textarea rows={3} placeholder="A full-stack platform for AI-driven hiring. Used React, Node.js, Prisma..." value={proj.description} onChange={e => updateItem('projects', idx, 'description', e.target.value)} />
            </Field>
          </div>
        ))}
        <button type="button" onClick={() => addItem('projects', defaultProject)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> Add Another Project
        </button>
      </SectionCard>

      {/* ── 6. Certifications ──────────────────────────────────────────── */}
      <SectionCard icon={<Award size={18} />} title="Certifications" subtitle="Online courses, professional certifications">
        {form.certifications.map((cert, idx) => (
          <div key={idx} className="relative border border-border rounded-xl p-4">
            {form.certifications.length > 1 && (
              <button onClick={() => removeItem('certifications', idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive">
                <X size={16} />
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Certification Name">
                <Input placeholder="AWS Certified Developer" value={cert.name} onChange={e => updateItem('certifications', idx, 'name', e.target.value)} />
              </Field>
              <Field label="Issuing Organization">
                <Input placeholder="Amazon, Coursera, NPTEL..." value={cert.issuer} onChange={e => updateItem('certifications', idx, 'issuer', e.target.value)} />
              </Field>
              <Field label="Year">
                <Input type="number" placeholder="2024" value={cert.year} onChange={e => updateItem('certifications', idx, 'year', e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addItem('certifications', defaultCert)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> Add Another Certification
        </button>
      </SectionCard>

      {/* Footer save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all shadow-sm ${
            saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saved ? <><CheckCircle2 size={18} /> Saved!</> : <><Save size={18} /> {isSaving ? 'Saving...' : 'Save Resume'}</>}
        </button>
      </div>

    </div>
  );
};

export default Resume;
