import React, { useState, useEffect } from 'react';
import { useStudentProfile, useAddSkill, useUpdateSkill, useDeleteSkill, useUpdatePreferences } from '../../hooks/useStudent';
import {
  GraduationCap, Briefcase, Leaf, Code, Palette, Database,
  Mic, Music, Network, Target, Trash2, CheckCircle, X,
  Plus, Save, Edit2, Globe, Users, Clock,
  Folder, FileText, UsersRound, Cpu, CloudDownload,
  Lyrics, Eye, Camera, ExternalLink
} from 'lucide-react';

const emptySkill = { name: '', category: '', level: 'INTERMEDIATE' };
const emptyExperience = { company: '', role: '', employmentType: 'Full-time', startDate: '', endDate: '', isCurrent: false, description: '' };
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Apprenticeship'];
const emptyEducation = { institution: '', university: '', degree: '', branch: '', cgpa: '', percentage: '', startYear: '', endYear: '', isCurrent: false };
const emptyCertification = { title: '', organization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' };
const emptyLanguage = { language: '', proficiency: 'FLUENT', read: true, write: true, speak: true };

const SkillCard = ({ skill, index, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Code size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{skill.name}</h3>
          {skill.category && <p className="text-xs text-muted-foreground mt-0.5">{skill.category}</p>}
          <p className="text-xs text-muted-foreground mt-1">Level: {skill.level}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(skill)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDelete(skill.id)} disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  </div>
);

const ExperienceCard = ({ exp, index, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-orange/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Briefcase size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{exp.role}</h3>
          <p className="text-primary font-medium">{exp.company}</p>
          <p className="text-xs text-muted-foreground">{exp.employmentType}</p>
          <p className="text-xs text-muted-foreground mt-1">({new Date(exp.startDate).toLocaleDateString()} – {exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()})</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit({ ...exp, startDate: exp.startDate?.split('T')[0] || '', endDate: exp.endDate?.split('T')[0] || '' })} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
        <button onClick={() => onDelete(exp.id)} disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  </div>
);

const EducationCard = ({ edu, index, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-blue/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{edu.degree} in {edu.branch}</h3>
          <p className="text-primary font-medium">{edu.institution}</p>
          {edu.university && <p className="text-xs text-muted-foreground mt-0.5">{edu.university}</p>}
          <p className="text-xs text-muted-foreground mt-1">Graduation: {edu.startYear} – {edu.isCurrent ? 'Present' : edu.endYear || '—'}</p>
          {edu.cgpa && <p className="text-xs font-medium bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">CGPA: {edu.cgpa}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(edu)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
        <button onClick={() => onDelete(edu.id)} disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  </div>
);

const CertificationCard = ({ cert, index, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-purple/10 text-purple-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{cert.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{cert.organization}</p>
          <p className="text-xs text-muted-foreground mt-1">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(cert)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
        <button onClick={() => onDelete(cert.id)} disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  </div>
);

const LanguageCard = ({ lang, index, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-green/10 text-green-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Leaf size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{lang.language}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Proficiency: {lang.proficiency}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(lang)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
        <button onClick={() => onDelete(lang.id)} disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  </div>
);

const CompleteProfile = () => {
  const { data: profile, isLoading } = useStudentProfile();
  const skills = profile?.skills || [];
  const experiences = profile?.experiences || [];
  const educations = profile?.education || [];
  const certifications = profile?.certifications || [];
  const languages = profile?.languages || [];
  const preferences = profile?.preferences || {};

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [showEduForm, setShowEduForm] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [showLangForm, setShowLangForm] = useState(false);
  const [editingLang, setEditingLang] = useState(null);

  const handleSaveNewSkill = async (skill) => {
    await addSkill.mutateAsync(skill);
    setShowSkillForm(false);
    setEditingSkill(null);
  };

  const handleSaveEditSkill = async (skill) => {
    if (editingSkill?.id) {
      await updateSkill.mutateAsync({ id: editingSkill.id, ...skill });
      setEditingSkill(null);
    }
    setShowSkillForm(false);
  };

  const handleDeleteSkill = async (id) => {
    await deleteSkill.mutateAsync(id);
  };

  const handleSaveNewExp = async (exp) => {
    await addExperience.mutateAsync(exp);
    setShowExpForm(false);
    setEditingExp(null);
  };

  const handleSaveEditExp = async (exp) => {
    if (editingExp?.id) {
      await updateExperience.mutateAsync({ id: editingExp.id, ...exp });
      setEditingExp(null);
    }
    setShowExpForm(false);
  };

  const handleDeleteExp = async (id) => {
    await deleteExperience.mutateAsync(id);
  };

  const handleSaveNewEdu = async (edu) => {
    await addEducation.mutateAsync(edu);
    setShowEduForm(false);
    setEditingEdu(null);
  };

  const handleSaveEditEdu = async (edu) => {
    if (editingEdu?.id) {
      await updateEducation.mutateAsync({ id: editingEdu.id, ...edu });
      setEditingEdu(null);
    }
    setShowEduForm(false);
  };

  const handleDeleteEdu = async (id) => {
    await deleteEducation.mutateAsync(id);
  };

  const handleSaveNewCert = async (cert) => {
    await addCertification.mutateAsync(cert);
    setShowCertForm(false);
    setEditingCert(null);
  };

  const handleSaveEditCert = async (cert) => {
    if (editingCert?.id) {
      await updateCertification.mutateAsync({ id: editingCert.id, ...cert });
      setEditingCert(null);
    }
    setShowCertForm(false);
  };

  const handleDeleteCert = async (id) => {
    await deleteCertification.mutateAsync(id);
  };

  const handleSaveNewLang = async (lang) => {
    await addLanguage.mutateAsync(lang);
    setShowLangForm(false);
    setEditingLang(null);
  };

  const handleSaveEditLang = async (lang) => {
    if (editingLang?.id) {
      await updateLanguage.mutateAsync({ id: editingLang.id, ...lang });
      setEditingLang(null);
    }
    setShowLangForm(false);
  };

  const handleDeleteLang = async (id) => {
    await deleteLanguage.mutateAsync(id);
  };

  const handleSavePreferences = async (pref) => {
    await updatePreferences.mutateAsync(pref);
  };

  const onBatchSave = async () => {
    const skillsData = skills.map(skill => ({
      name: skill.name,
      category: skill.category,
      level: skill.level,
    }));

    const experiencesData = experiences.map(exp => ({
      company: exp.company,
      role: exp.role,
      employmentType: exp.employmentType,
      startDate: exp.startDate ? new Date(exp.startDate).toISOString() : null,
      endDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
      isCurrent: exp.isCurrent,
      description: exp.description,
    }));

    const educationData = educations.map(edu => ({
      institution: edu.institution,
      university: edu.university,
      degree: edu.degree,
      branch: edu.branch,
      cgpa: edu.cgpa,
      percentage: edu.percentage,
      startYear: parseInt(edu.startYear),
      endYear: edu.endYear ? parseInt(edu.endYear) : null,
      isCurrent: edu.isCurrent,
    }));

    const certificationsData = certifications.map(cert => ({
      title: cert.title,
      organization: cert.organization,
      issueDate: new Date(cert.issueDate).toISOString(),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString() : null,
      credentialId: cert.credentialId,
      credentialUrl: cert.credentialUrl,
    }));

    const languagesData = languages.map(lang => ({
      language: lang.language,
      proficiency: lang.proficiency,
      read: lang.read,
      write: lang.write,
      speak: lang.speak,
    }));

    const preferencesData = {
      preferredRoles: preferences.preferredRoles || [],
      preferredLocations: preferences.preferredLocations || [],
      expectedSalary: preferences.expectedSalary,
      employmentType: preferences.employmentType,
      remotePreference: preferences.remotePreference,
    };

    await batchUpdateProfile.mutateAsync({
      skills: skillsData,
      experiences: experiencesData,
      education: educationData,
      certifications: certificationsData,
      languages: languagesData,
      preferences: preferencesData,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-44 bg-muted rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Complete Your Profile</h1>
          <p className="text-muted-foreground">Add your skills, experience, education and more to improve your match scores</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Progress: {Math.round((skills.length + experiences.length + educations.length + certifications.length + languages.length) / 20 * 100)}%</span>
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Skills</h2>
          <button
            onClick={() => setShowSkillForm(true)}
            className="text-primary hover:text-primary/90 transition-colors text-sm font-medium">
            <Plus size={14} /> Add Skill
          </button>
        </div>
        {skills.length === 0 && !showSkillForm ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Code size={28} />
            </div>
            <h3 className="font-semibold text-lg mb-2">No skills added yet</h3>
            <p className="text-muted-foreground text-sm">Add your technical and soft skills to improve matching</p>
            <button onClick={() => setShowSkillForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
              Add First Skill
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill, i) => (
              <SkillCard key={skill.id} skill={skill} index={i} />
            ))}
            {showSkillForm && (
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-primary">{editingSkill?.id ? 'Edit Skill' : 'Add Skill'}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Skill name *"
                    value={editingSkill?.name || ''}
                    onChange={e => setEditingSkill(prev => ({ ...prev, name: e.target.value }))}
                    required />
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editingSkill?.category || ''}
                    onChange={e => setEditingSkill(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">No category</option>
                    <option value="Programming">Programming</option>
                    <option value="Databases">Databases</option>
                    <option value="Framework">Framework</option>
                    <option value="Cloud/DevOps">Cloud/DevOps</option>
                    <option value="Tools">Tools</option>
                  </select>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editingSkill?.level || 'INTERMEDIATE'}
                    onChange={e => setEditingSkill(prev => ({ ...prev, level: e.target.value }))}
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="EXPERT">EXPERT</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => handleSaveNewSkill(editingSkill ? { ...editingSkill, name: '' } : { name: '', category: '', level: 'INTERMEDIATE' })} disabled={!editingSkill?.name}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                    <Save size={14} /> {editingSkill?.id ? 'Update' : 'Save'}
                  </button>
                  <button onClick={() => setShowSkillForm(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Work Experience</h2>
          <button
            onClick={() => setShowExpForm(true)}
            className="text-primary hover:text-primary/90 transition-colors text-sm font-medium">
            <Plus size={14} /> Add Experience
          </button>
        </div>
        {experiences.length === 0 && !showExpForm ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-orange/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="font-semibold text-lg mb-2">No experience added yet</h3>
            <p className="text-muted-foreground text-sm">Add your internships, jobs, or professional experience</p>
            <button onClick={() => setShowExpForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
              Add First Experience
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {experiences.map((exp, i) => (
              <ExperienceCard key={exp.id} exp={exp} index={i} />
            ))}
            {showExpForm && (
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-primary">{editingExp?.id ? 'Edit Experience' : 'Add Experience'}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Company / Organization *"
                    value={editingExp?.company || ''}
                    onChange={e => setEditingExp(prev => ({ ...prev, company: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Job Title / Role *"
                    value={editingExp?.role || ''}
                    onChange={e => setEditingExp(prev => ({ ...prev, role: e.target.value }))}
                    required />
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editingExp?.employmentType || 'Full-time'}
                    onChange={e => setEditingExp(prev => ({ ...prev, employmentType: e.target.value }))}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="date"
                    value={editingExp?.startDate || ''}
                    onChange={e => setEditingExp(prev => ({ ...prev, startDate: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="date"
                    value={editingExp?.endDate || ''}
                    onChange={e => setEditingExp(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={editingExp?.isCurrent} />
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm mb-3">
                      <input type="checkbox" checked={editingExp?.isCurrent} onChange={e => setEditingExp(prev => ({ ...prev, isCurrent: e.target.checked }))} className="rounded" />
                      I currently work here
                    </label>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
                    <textarea
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all"
                      rows={3}
                      value={editingExp?.description || ''}
                      onChange={e => setEditingExp(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your responsibilities, achievements, technologies used..." />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => handleSaveNewExp(editingExp ? { ...editingExp, company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' })} disabled={!editingExp?.company}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                    <Save size={14} /> {editingExp?.id ? 'Update' : 'Save'}
                  </button>
                  <button onClick={() => setShowExpForm(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Education</h2>
          <button
            onClick={() => setShowEduForm(true)}
            className="text-primary hover:text-primary/90 transition-colors text-sm font-medium">
            <Plus size={14} /> Add Education
          </button>
        </div>
        {educations.length === 0 && !showEduForm ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} />
            </div>
            <h3 className="font-semibold text-lg mb-2">No education added yet</h3>
            <p className="text-muted-foreground text-sm">Add your degrees and academic qualifications</p>
            <button onClick={() => setShowEduForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
              Add First Degree
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {educations.map((edu, i) => (
              <EducationCard key={edu.id} edu={edu} index={i} />
            ))}
            {showEduForm && (
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-primary">{editingEdu?.id ? 'Edit Education' : 'Add Education'}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Institution *"
                    value={editingEdu?.institution || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, institution: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="University"
                    value={editingEdu?.university || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, university: e.target.value }))}
                  />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Degree *"
                    value={editingEdu?.degree || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, degree: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Branch / Major *"
                    value={editingEdu?.branch || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, branch: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editingEdu?.cgpa || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, cgpa: e.target.value }))}
                  />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingEdu?.percentage || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, percentage: e.target.value }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="number"
                    min="1990"
                    max="2030"
                    value={editingEdu?.startYear || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, startYear: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="number"
                    min="1990"
                    max="2035"
                    value={editingEdu?.endYear || ''}
                    onChange={e => setEditingEdu(prev => ({ ...prev, endYear: e.target.value }))}
                    disabled={editingEdu?.isCurrent} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={editingEdu?.isCurrent} onChange={e => setEditingEdu(prev => ({ ...prev, isCurrent: e.target.checked }))} className="rounded" />
                  Currently studying here
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => handleSaveNewEdu(editingEdu ? { ...editingEdu, institution: '', university: '', degree: '', branch: '', cgpa: '', percentage: '', startYear: '', endYear: '', isCurrent: false })} disabled={!editingEdu?.institution}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                    <Save size={14} /> {editingEdu?.id ? 'Update' : 'Save'}
                  </button>
                  <button onClick={() => setShowEduForm(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Certifications</h2>
          <button
            onClick={() => setShowCertForm(true)}
            className="text-primary hover:text-primary/90 transition-colors text-sm font-medium">
            <Plus size={14} /> Add Certification
          </button>
        </div>
        {certifications.length === 0 && !showCertForm ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-purple/10 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} />
            </div>
            <h3 className="font-semibold text-lg mb-2">No certifications added yet</h3>
            <p className="text-muted-foreground text-sm">Add your certifications and credentials</p>
            <button onClick={() => setShowCertForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
              Add First Certification
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert, i) => (
              <CertificationCard key={cert.id} cert={cert} index={i} />
            ))}
            {showCertForm && (
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-primary">{editingCert?.id ? 'Edit Certification' : 'Add Certification'}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Certification Title *"
                    value={editingCert?.title || ''}
                    onChange={e => setEditingCert(prev => ({ ...prev, title: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Organization"
                    value={editingCert?.organization || ''}
                    onChange={e => setEditingCert(prev => ({ ...prev, organization: e.target.value }))}
                  />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="date"
                    value={editingCert?.issueDate || ''}
                    onChange={e => setEditingCert(prev => ({ ...prev, issueDate: e.target.value }))}
                    required />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    type="date"
                    value={editingCert?.expiryDate || ''}
                    onChange={e => setEditingCert(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Credential ID"
                    value={editingCert?.credentialId || ''}
                    onChange={e => setEditingCert(prev => ({ ...prev, credentialId: e.target.value }))}
                  />
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Credential URL"
                    value={editingCert?.credentialUrl || ''}
                    onChange={e => setEditingCert(prev => ({ ...prev, credentialUrl: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => handleSaveNewCert(editingCert ? { ...editingCert, title: '', organization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' })} disabled={!editingCert?.title}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                    <Save size={14} /> {editingCert?.id ? 'Update' : 'Save'}
                  </button>
                  <button onClick={() => setShowCertForm(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Languages</h2>
          <button
            onClick={() => setShowLangForm(true)}
            className="text-primary hover:text-primary/90 transition-colors text-sm font-medium">
            <Plus size={14} /> Add Language
          </button>
        </div>
        {languages.length === 0 && !showLangForm ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-green/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Leaf size={28} />
            </div>
            <h3 className="font-semibold text-lg mb-2">No languages added yet</h3>
            <p className="text-muted-foreground text-sm">Add the languages you speak</p>
            <button onClick={() => setShowLangForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
              Add First Language
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {languages.map((lang, i) => (
              <LanguageCard key={lang.id} lang={lang} index={i} />
            ))}
            {showLangForm && (
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-primary">{editingLang?.id ? 'Edit Language' : 'Add Language'}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Language *"
                    value={editingLang?.language || ''}
                    onChange={e => setEditingLang(prev => ({ ...prev, language: e.target.value }))}
                    required />
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editingLang?.proficiency || 'FLUENT'}
                    onChange={e => setEditingLang(prev => ({ ...prev, proficiency: e.target.value }))}
                  >
                    <option value="NATIVE">NATIVE</option>
                    <option value="FLUENT">FLUENT</option>
                    <option value="CONVERSATIONAL">CONVERSATIONAL</option>
                    <option value="BASIC">BASIC</option>
                  </select>
                  <div className="space-y-2">
                    <label>
                      <input
                        type="checkbox"
                        checked={editingLang?.read !== false}
                        onChange={e => setEditingLang(prev => ({ ...prev, read: e.target.checked }))}
                        className="rounded" />
                      Read
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={editingLang?.write !== false}
                        onChange={e => setEditingLang(prev => ({ ...prev, write: e.target.checked }))}
                        className="rounded" />
                      Write
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={editingLang?.speak !== false}
                        onChange={e => setEditingLang(prev => ({ ...prev, speak: e.target.checked }))}
                        className="rounded" />
                      Speak
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => handleSaveNewLang(editingLang ? { ...editingLang, language: '', proficiency: 'FLUENT', read: true, write: true, speak: true })} disabled={!editingLang?.language}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                    <Save size={14} /> {editingLang?.id ? 'Update' : 'Save'}
                  </button>
                  <button onClick={() => setShowLangForm(false)} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Job Preferences</h2>
          <p className="text-sm text-muted-foreground">Help match you with relevant jobs</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Preferred Roles</label>
            <input
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Software Engineer, Web Developer"
              value={preferences.preferredRoles?.join(', ') || ''}
              onChange={e => setEditingSkill ? null : null} // placeholder - would need state management
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Preferred Locations</label>
            <input
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Remote, Bangalore, Mumbai"
              value={preferences.preferredLocations?.join(', ') || ''}
              onChange={e => setEditingSkill ? null : null}
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Expected Salary</label>
          <input
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            type="number"
            value={preferences.expectedSalary || ''}
            placeholder="e.g. 1000000" />
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground mt-3">Employment Type</label>
          <select
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Any</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
          </select>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground mt-3">Remote Preference</label>
          <select
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Any</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSavePreferences}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
              <Save size={14} /> Save Preferences
            </button>
            <button
              onClick={() => setShowLangForm(false)} // Reuse close function
              className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Batch Save Button */}
      <div className="pt-6 border-t border-border/50">
        <button
          onClick={onBatchSave}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-all">
          <Save size={16} /> Batch Save All Profile Details
        </button>
        <p className="text-center text-muted-foreground mt-2 text-sm">
          This will save all your skills, experience, education, certifications and preferences at once
        </p>
      </div>
    </div>
  );
};

export default CompleteProfile;