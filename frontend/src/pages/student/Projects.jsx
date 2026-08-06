import React, { useState } from 'react';
import { useStudentProfile, useAddProject, useUpdateProject, useDeleteProject } from '../../hooks/useStudent';
import { Code2, Plus, Edit2, Trash2, X, Save, GitBranch, ExternalLink, Layers } from 'lucide-react';

const emptyForm = { title: '', description: '', techStack: '', role: '', duration: '', githubUrl: '', liveUrl: '' };

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
    <input className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" {...props} />
  </div>
);

const ProjectCard = ({ project, onEdit, onDelete, deleting }) => (
  <div className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-11 h-11 bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Code2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">{project.title}</h3>
            {project.role && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{project.role}</span>}
            {project.duration && <span className="text-xs text-muted-foreground">{project.duration}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
          {project.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {project.techStack.map(t => (
                <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-md">{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <GitBranch size={12} /> GitHub
              </a>
            )}
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <ExternalLink size={12} /> Live Demo
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit({ ...project, techStack: Array.isArray(project.techStack) ? project.techStack.join(', ') : '' })}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
          <Edit2 size={15} />
        </button>
        <button onClick={() => onDelete(project.id)} disabled={deleting}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  </div>
);

const ProjectForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-primary">{initial.id ? 'Edit Project' : 'Add Project'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField label="Project Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="HireSense AI Platform" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description *</label>
          <textarea
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
            rows={3} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Brief description of what the project does..." />
        </div>
        <div className="sm:col-span-2">
          <InputField label="Tech Stack (comma separated)" value={form.techStack} onChange={e => set('techStack', e.target.value)} placeholder="React, Node.js, PostgreSQL, Prisma" />
        </div>
        <InputField label="Your Role" value={form.role} onChange={e => set('role', e.target.value)} placeholder="Full Stack Developer" />
        <InputField label="Duration" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="3 months, Jan 2024 – Apr 2024" />
        <InputField label="GitHub URL" value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." />
        <InputField label="Live Demo URL" value={form.liveUrl} onChange={e => set('liveUrl', e.target.value)} placeholder="https://..." />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.description}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
          <Save size={14} /> {loading ? 'Saving...' : 'Save Project'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-muted text-sm font-medium rounded-xl hover:bg-muted/80 transition-all">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
};

const Projects = () => {
  const { data: profile, isLoading } = useStudentProfile();
  const addProject = useAddProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSaveNew = async (form) => { await addProject.mutateAsync(form); setShowForm(false); };
  const handleSaveEdit = async (form) => { await updateProject.mutateAsync(form); setEditing(null); };
  const handleDelete = async (id) => { if (window.confirm('Delete this project?')) await deleteProject.mutateAsync(id); };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1, 2].map(i => <div key={i} className="h-36 bg-muted rounded-2xl" />)}</div>;

  const projects = profile?.projects || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Projects</h1>
          <p className="text-muted-foreground">Showcase your work and technical achievements</p>
        </div>
        {!showForm && !editing && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shrink-0">
            <Plus size={16} /> Add Project
          </button>
        )}
      </div>

      {showForm && <ProjectForm initial={emptyForm} onSave={handleSaveNew} onCancel={() => setShowForm(false)} loading={addProject.isPending} />}

      {projects.length === 0 && !showForm ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-violet-500/10 text-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add your personal, academic, and professional projects</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all">
            Add First Project
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p =>
            editing?.id === p.id
              ? <ProjectForm key={p.id} initial={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} loading={updateProject.isPending} />
              : <ProjectCard key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} deleting={deleteProject.isPending} />
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
