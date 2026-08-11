import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  ArrowLeft, Save, CheckCircle2, AlertCircle, 
  Settings, Plus, X, Trash2, Edit, Terminal, Eye, Code, FileCode
} from 'lucide-react';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const DIFFICULTY_BADGES = {
  EASY: 'bg-green-500/10 text-green-600 border border-green-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  HARD: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const InputField = ({ label, required, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    <input
      className={`w-full px-3 py-2.5 rounded-xl bg-background border ${
        error ? 'border-destructive focus:ring-destructive/40' : 'border-input focus:ring-secondary/40'
      } text-sm focus:outline-none focus:ring-2 transition-all`}
      {...props}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const TextAreaField = ({ label, required, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    <textarea
      className={`w-full px-3 py-2.5 rounded-xl bg-background border ${
        error ? 'border-destructive focus:ring-destructive/40' : 'border-input focus:ring-secondary/40'
      } text-sm focus:outline-none focus:ring-2 transition-all resize-y`}
      {...props}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const CodingAssessmentForm = () => {
  const { id } = useParams(); // assessmentId if editing
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Assessment Settings
  const [form, setForm] = useState({
    name: '',
    description: '',
    instructions: '',
    duration: '60',
    status: 'DRAFT'
  });

  // Problems List
  const [problems, setProblems] = useState([]);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  
  // Problem Form State (inside Modal)
  const [probForm, setProbForm] = useState({
    title: '',
    statement: '',
    description: '',
    difficulty: 'EASY',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    marks: '10',
    supportedLanguages: ['PYTHON', 'JAVA'],
    pythonStarterCode: '',
    javaStarterCode: '',
    order: '0',
    status: 'ACTIVE'
  });

  const [testCases, setTestCases] = useState([]);

  // Fetch Assessment details if editing
  const fetchAssessmentDetails = () => {
    setLoading(true);
    api.get(`/recruiter/coding-assessments/${id}`)
      .then(res => {
        const a = res.data;
        setForm({
          name: a.name,
          description: a.description || '',
          instructions: a.instructions || '',
          duration: String(a.duration),
          status: a.status
        });
        setProblems(a.problems || []);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load coding assessment'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isEdit) {
      fetchAssessmentDetails();
    }
  }, [id, isEdit]);

  // Handle Assessment Save
  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        ...form,
        duration: parseInt(form.duration)
      };

      if (isEdit) {
        await api.put(`/recruiter/coding-assessments/${id}`, payload);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const { data } = await api.post('/recruiter/coding-assessments', payload);
        navigate(`/recruiter/coding-assessments/${data.id}/edit`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coding assessment settings');
    } finally {
      setSaving(false);
    }
  };

  // Open modal to add a new problem
  const handleAddProblemClick = () => {
    setEditingProblem(null);
    setProbForm({
      title: '',
      statement: '',
      description: '',
      difficulty: 'EASY',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      marks: '20',
      supportedLanguages: ['PYTHON', 'JAVA'],
      pythonStarterCode: 'def solve():\n    # Write Python code here\n    pass',
      javaStarterCode: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write Java code here\n    }\n}',
      order: String(problems.length),
      status: 'ACTIVE'
    });
    setTestCases([
      { input: '', expectedOutput: '', isPublic: true, marks: 1.0 },
      { input: '', expectedOutput: '', isPublic: false, marks: 1.0 }
    ]);
    setShowProblemModal(true);
  };

  // Open modal to edit a problem
  const handleEditProblemClick = (prob) => {
    setEditingProblem(prob);
    setProbForm({
      title: prob.title,
      statement: prob.statement,
      description: prob.description,
      difficulty: prob.difficulty,
      inputFormat: prob.inputFormat || '',
      outputFormat: prob.outputFormat || '',
      constraints: prob.constraints || '',
      marks: String(prob.marks),
      supportedLanguages: prob.supportedLanguages || ['PYTHON', 'JAVA'],
      pythonStarterCode: prob.pythonStarterCode || '',
      javaStarterCode: prob.javaStarterCode || '',
      order: String(prob.order),
      status: prob.status
    });
    setTestCases(prob.testCases || []);
    setShowProblemModal(true);
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    if (!probForm.title || !probForm.statement || !probForm.description) {
      alert('Please fill in required fields (title, statement, description)');
      return;
    }

    if (testCases.length === 0) {
      alert('Please add at least one test case');
      return;
    }

    const payload = {
      ...probForm,
      marks: parseFloat(probForm.marks),
      order: parseInt(probForm.order),
      testCases: testCases.map(tc => ({
        ...tc,
        marks: parseFloat(tc.marks) || 1.0
      }))
    };

    try {
      if (editingProblem) {
        // Update problem
        await api.put(`/recruiter/coding-problems/${editingProblem.id}`, payload);
      } else {
        // Create problem
        await api.post(`/recruiter/coding-assessments/${id}/problems`, payload);
      }
      setShowProblemModal(false);
      fetchAssessmentDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save problem');
    }
  };

  const handleDeleteProblem = async (probId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      await api.delete(`/recruiter/coding-problems/${probId}`);
      fetchAssessmentDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete problem');
    }
  };

  // Test Case Helpers
  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isPublic: false, marks: 1.0 }]);
  };

  const removeTestCase = (idx) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const updateTestCaseField = (idx, field, value) => {
    setTestCases(testCases.map((tc, i) => {
      if (i === idx) {
        return { ...tc, [field]: value };
      }
      return tc;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/recruiter/coding-assessments" className="p-2 hover:bg-muted rounded-xl transition-colors border">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Coding Assessment' : 'New Coding Assessment'}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isEdit ? 'Update settings and coding problems' : 'Configure metadata for the programming test'}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Settings Form (Left/Center) */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleAssessmentSubmit} className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border/50 pb-3">
              <Settings size={18} className="text-primary" /> Assessment Settings
            </h2>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 text-green-600 text-sm rounded-xl border border-green-500/20">
                <CheckCircle2 size={16} /> Assessment settings updated successfully!
              </div>
            )}

            <InputField 
              label="Assessment Title" 
              required 
              placeholder="e.g. Core Software Developer Assessment"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <TextAreaField 
              label="Description" 
              rows={3}
              placeholder="Provide a brief summary of the assessment..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <TextAreaField 
              label="Instructions" 
              rows={4}
              placeholder="1. Time limit applies.\n2. Supported languages are Python and Java..."
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Duration (in minutes)" 
                required 
                type="number"
                min="5"
                max="300"
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-secondary text-secondary-foreground font-bold text-sm rounded-xl hover:bg-secondary/90 shadow-sm flex items-center gap-2 transition-all"
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Problems Sidebar (Right) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Terminal size={18} className="text-primary" /> Coding Problems
                </h2>
                {isEdit && (
                  <button
                    onClick={handleAddProblemClick}
                    className="p-1 hover:bg-muted text-primary rounded-lg transition-colors border"
                    title="Add Coding Problem"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {!isEdit ? (
                <div className="text-center py-12 text-sm text-muted-foreground italic leading-relaxed">
                  Please save the Assessment Settings first to add coding problems.
                </div>
              ) : problems.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground italic leading-relaxed">
                  No coding problems added yet. Click the "+" button to add your first coding task.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {problems.map((p, idx) => (
                    <div key={p.id} className="p-3 border rounded-2xl flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{idx + 1}. {p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${DIFFICULTY_BADGES[p.difficulty]}`}>
                            {p.difficulty}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">{p.marks} marks</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditProblemClick(p)}
                          className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                          title="Edit Problem"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProblem(p.id)}
                          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                          title="Delete Problem"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Problem Modal (Add/Edit problem and test cases) */}
      {showProblemModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold">{editingProblem ? 'Edit Coding Problem' : 'Add Coding Problem'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Specify task details, supported starter code, and test cases</p>
              </div>
              <button onClick={() => setShowProblemModal(false)} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="flex-1 overflow-y-auto flex flex-col justify-between">
              
              <div className="p-6 space-y-6">
                
                {/* 1. Problem Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary border-b border-border/40 pb-1">1. Problem Specification</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField 
                      label="Problem Title" 
                      required 
                      placeholder="e.g. Inverse Matrix Transpose"
                      value={probForm.title}
                      onChange={e => setProbForm({ ...probForm, title: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Difficulty</label>
                        <select
                          value={probForm.difficulty}
                          onChange={e => setProbForm({ ...probForm, difficulty: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                        >
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <InputField 
                        label="Marks / Score" 
                        required 
                        type="number"
                        min="1"
                        value={probForm.marks}
                        onChange={e => setProbForm({ ...probForm, marks: e.target.value })}
                      />
                    </div>
                  </div>

                  <TextAreaField 
                    label="Problem Statement (Markdown supported)" 
                    required 
                    rows={4}
                    placeholder="Describe the overall problem clearly. e.g. Write a function that finds the sum of two integers..."
                    value={probForm.statement}
                    onChange={e => setProbForm({ ...probForm, statement: e.target.value })}
                  />

                  <TextAreaField 
                    label="Detailed Explanation / Description" 
                    required 
                    rows={3}
                    placeholder="Enter technical details, algorithmic requirements, or helpful background context..."
                    value={probForm.description}
                    onChange={e => setProbForm({ ...probForm, description: e.target.value })}
                  />

                  <div className="grid md:grid-cols-3 gap-4">
                    <TextAreaField 
                      label="Input Format" 
                      rows={2}
                      placeholder="e.g. Single line containing space-separated integers"
                      value={probForm.inputFormat}
                      onChange={e => setProbForm({ ...probForm, inputFormat: e.target.value })}
                    />
                    <TextAreaField 
                      label="Output Format" 
                      rows={2}
                      placeholder="e.g. Return the computed sum as a single integer"
                      value={probForm.outputFormat}
                      onChange={e => setProbForm({ ...probForm, outputFormat: e.target.value })}
                    />
                    <TextAreaField 
                      label="Constraints" 
                      rows={2}
                      placeholder="e.g. 1 <= N <= 10^5"
                      value={probForm.constraints}
                      onChange={e => setProbForm({ ...probForm, constraints: e.target.value })}
                    />
                  </div>
                </div>

                {/* 2. Starter Code */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary border-b border-border/40 pb-1 flex items-center gap-2">
                    <Code size={16} /> 2. Starter Codes
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-1.5">
                        <FileCode size={14} className="text-blue-500" /> Python Starter Code
                      </label>
                      <textarea
                        rows={6}
                        className="w-full p-3 font-mono text-xs rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary/40 focus:outline-none resize-y"
                        value={probForm.pythonStarterCode}
                        onChange={e => setProbForm({ ...probForm, pythonStarterCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-1.5">
                        <FileCode size={14} className="text-orange-500" /> Java Starter Code
                      </label>
                      <textarea
                        rows={6}
                        className="w-full p-3 font-mono text-xs rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary/40 focus:outline-none resize-y"
                        value={probForm.javaStarterCode}
                        onChange={e => setProbForm({ ...probForm, javaStarterCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Test Cases */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Eye size={16} /> 3. Grading Test Cases
                    </h3>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="px-2.5 py-1 border text-xs font-semibold rounded-lg hover:bg-muted transition-colors flex items-center gap-1 text-primary"
                    >
                      <Plus size={12} /> Add Test Case
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Define test inputs and expected outputs. At least one public and one hidden test case are recommended. Public test cases are shown to the candidate during execution. Hidden test cases remain private and determine actual candidate marks.
                  </p>

                  <div className="space-y-3">
                    {testCases.map((tc, idx) => (
                      <div key={idx} className="p-4 border rounded-2xl bg-muted/10 space-y-3 relative">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-muted-foreground">Test Case #{idx + 1}</span>
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.isPublic}
                                onChange={e => updateTestCaseField(idx, 'isPublic', e.target.checked)}
                                className="rounded text-primary focus:ring-primary/40 h-3.5 w-3.5"
                              />
                              <span>Public / Sample</span>
                            </label>
                            
                            <div className="flex items-center gap-1.5">
                              <span>Weight:</span>
                              <input 
                                type="number"
                                min="0.1"
                                step="0.1"
                                className="w-16 px-1.5 py-0.5 bg-background border rounded text-center text-xs"
                                value={tc.marks}
                                onChange={e => updateTestCaseField(idx, 'marks', e.target.value)}
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeTestCase(idx)}
                              className="p-1 hover:bg-destructive/10 text-destructive rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-medium mb-1 text-muted-foreground">Input</label>
                            <textarea
                              rows={2}
                              className="w-full p-2 font-mono border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                              placeholder="e.g. 2 7 11 15\n9"
                              value={tc.input}
                              onChange={e => updateTestCaseField(idx, 'input', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-muted-foreground">Expected Output</label>
                            <textarea
                              rows={2}
                              className="w-full p-2 font-mono border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                              placeholder="e.g. 0 1"
                              value={tc.expectedOutput}
                              onChange={e => updateTestCaseField(idx, 'expectedOutput', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="p-6 bg-muted/20 border-t border-border flex gap-3 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  className="px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 font-semibold text-sm transition-all"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingAssessmentForm;
