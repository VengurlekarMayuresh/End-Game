import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  ArrowLeft, Save, Search, CheckCircle2, AlertCircle, 
  HelpCircle, Eye, ChevronLeft, ChevronRight, Settings, 
  Plus, Calendar, ShieldAlert, Upload, FileJson, X
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

const CheckboxField = ({ label, desc, ...props }) => (
  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30 transition-all select-none">
    <input
      type="checkbox"
      className="rounded text-secondary focus:ring-secondary/40 h-4.5 w-4.5 mt-0.5"
      {...props}
    />
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {desc && <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>}
    </div>
  </label>
);

const TestForm = () => {
  const { id } = useParams(); // testId if editing
  const navigate = useNavigate();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Test details form
  const [form, setForm] = useState({
    name: '',
    description: '',
    instructions: '',
    duration: '30',
    passingPercentage: '40',
    maxAttempts: '1',
    negativeMarking: false,
    marksPerQuestion: '1.0',
    randomQuestionOrder: false,
    randomOptionOrder: false,
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  });

// Question selection states
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  
  // JSON upload states
  const [jsonUploadOpen, setJsonUploadOpen] = useState(false);
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonUploading, setJsonUploading] = useState(false);
  const [jsonUploadResult, setJsonUploadResult] = useState(null);
  const [jsonPreview, setJsonPreview] = useState(null);

  // Question search filters
  const [qSearch, setQSearch] = useState('');
  const [qCategory, setQCategory] = useState('');
  const [qDifficulty, setQDifficulty] = useState('');
  const [qPage, setQPage] = useState(1);
  const [qTotalPages, setQTotalPages] = useState(1);

  // Question preview dialog
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Load test details if editing
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/recruiter/tests/${id}`)
        .then(res => {
          const t = res.data;
          setForm({
            name: t.name,
            description: t.description || '',
            instructions: t.instructions || '',
            duration: String(t.duration),
            passingPercentage: String(t.passingPercentage),
            maxAttempts: String(t.maxAttempts),
            negativeMarking: t.negativeMarking,
            marksPerQuestion: String(t.marksPerQuestion),
            randomQuestionOrder: t.randomQuestionOrder,
            randomOptionOrder: t.randomOptionOrder,
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
            endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
            status: t.status
          });
          setSelectedQuestionIds(t.testQuestions.map(tq => tq.questionId));
        })
        .catch(err => setError(err.response?.data?.message || 'Failed to load test details'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // Fetch Questions for selector list
  const fetchQuestionSelector = () => {
    setQuestionsLoading(true);
    api.get('/recruiter/questions', {
      params: { search: qSearch, category: qCategory, difficulty: qDifficulty, page: qPage, limit: 5 }
    })
      .then(res => {
        setQuestions(res.data.questions);
        setQTotalPages(res.data.pagination.totalPages);
      })
      .catch(err => console.error('Error loading questions', err))
      .finally(() => setQuestionsLoading(false));
  };

  useEffect(() => {
    fetchQuestionSelector();
  }, [qSearch, qCategory, qDifficulty, qPage]);

  // JSON Upload Handlers
  const handleJsonFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Please select a valid JSON file');
      return;
    }
    
    setJsonFile(file);
    setJsonUploadResult(null);
    setJsonPreview(null);
    setError('');
    
    // Parse and preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.questions || !Array.isArray(data.questions)) {
          setError('Invalid JSON format: expected { "questions": [...] }');
          return;
        }
        setJsonPreview(data.questions.slice(0, 5)); // Preview first 5
      } catch (err) {
        setError('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleJsonUpload = async () => {
    if (!jsonFile) return;
    
    setJsonUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', jsonFile);
    
    try {
      const res = await api.post('/recruiter/questions/bulk', jsonFile, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = res.data;
      setJsonUploadResult(result);
      
      if (result.created && result.created.length > 0) {
        // Refresh question list
        fetchQuestionSelector();
        // Auto-select newly created questions
        const newIds = result.created.map(q => q.id);
        setSelectedQuestionIds(prev => [...new Set([...prev, ...newIds])]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload questions');
    } finally {
      setJsonUploading(false);
    }
  };

  const handleJsonClose = () => {
    setJsonUploadOpen(false);
    setJsonFile(null);
    setJsonUploadResult(null);
    setJsonPreview(null);
  };

  const handleQuestionToggle = (qId) => {
    setSelectedQuestionIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.duration) {
      setError('Please fill in Name and Duration.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      description: form.description,
      instructions: form.instructions,
      duration: parseInt(form.duration),
      passingPercentage: parseFloat(form.passingPercentage),
      maxAttempts: parseInt(form.maxAttempts),
      negativeMarking: form.negativeMarking,
      marksPerQuestion: parseFloat(form.marksPerQuestion),
      randomQuestionOrder: form.randomQuestionOrder,
      randomOptionOrder: form.randomOptionOrder,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status,
      questionIds: selectedQuestionIds
    };

    try {
      if (isEdit) {
        await api.put(`/recruiter/tests/${id}`, payload);
      } else {
        await api.post('/recruiter/tests', payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/recruiter/tests'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">{isEdit ? 'Test Configurations Updated!' : 'Test Created!'}</h2>
        <p className="text-muted-foreground">Redirecting to test listings...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Configure Test' : 'Create Aptitude Test'}</h1>
          <p className="text-muted-foreground">Configure settings and select questions for your assessment</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Test details panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <Settings size={16} className="text-secondary" /> General Info
            </h2>
            
            <InputField 
              label="Test Name" 
              required 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="e.g. Quantitative & Reasoning Aptitude Test"
            />
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Test Description</label>
              <textarea 
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                rows={3} 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Give a short summary of the test for the candidates..." 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Instructions</label>
              <textarea 
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                rows={4} 
                value={form.instructions} 
                onChange={e => setForm({...form, instructions: e.target.value})}
                placeholder="List rules, details about scoring and review options..." 
              />
            </div>
          </div>

          {/* Select Questions from Question Bank */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="font-semibold flex items-center gap-2 text-base">
                <HelpCircle size={16} className="text-secondary" /> Add Questions
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-secondary/15 text-secondary font-bold rounded-full">
                  {selectedQuestionIds.length} Selected
                </span>
                <button
                  type="button"
                  onClick={() => setJsonUploadOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-xl hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  <Upload size={13} /> Upload JSON
                </button>
              </div>
            </div>

            {/* Questions Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-8 pr-3 py-2 border border-input rounded-xl bg-background text-xs focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="Search questions..."
                  value={qSearch}
                  onChange={e => { setQSearch(e.target.value); setQPage(1); }}
                />
              </div>
              <input
                className="w-full px-3 py-2 border border-input rounded-xl bg-background text-xs focus:outline-none focus:ring-2 focus:ring-secondary/40"
                placeholder="Category..."
                value={qCategory}
                onChange={e => { setQCategory(e.target.value); setQPage(1); }}
              />
              <select
                className="w-full px-3 py-2 border border-input rounded-xl bg-background text-xs focus:outline-none focus:ring-2 focus:ring-secondary/40"
                value={qDifficulty}
                onChange={e => { setQDifficulty(e.target.value); setQPage(1); }}
              >
                <option value="">All Difficulties</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Selection List */}
            {questionsLoading ? (
              <div className="space-y-2 animate-pulse py-2">
                {[1, 2].map(i => <div key={i} className="h-14 bg-muted rounded-xl" />)}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-2xl text-xs text-muted-foreground">
                No matching questions. Create questions in the <Link to="/recruiter/questions" className="text-secondary font-semibold hover:underline">Question Bank</Link> first.
              </div>
            ) : (
              <div className="space-y-2.5">
                {questions.map(q => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div 
                      key={q.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                        isChecked ? 'border-secondary/40 bg-secondary/5' : 'border-border bg-card'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleQuestionToggle(q.id)}
                        className="rounded text-secondary focus:ring-secondary/40 h-4.5 w-4.5 mt-0.5 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${DIFFICULTY_BADGES[q.difficulty]}`}>
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                            {q.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Marks: {q.marks}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-foreground line-clamp-2">
                          {q.statement}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewQuestion(q)}
                        className="p-1.5 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-transparent shrink-0"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* Mini Pagination */}
                {qTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                    <span className="text-[10px] text-muted-foreground">Page {qPage} of {qTotalPages}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQPage(p => Math.max(1, p - 1))}
                        disabled={qPage === 1}
                        className="p-1.5 border border-input rounded-lg disabled:opacity-50 transition-all hover:bg-muted text-muted-foreground"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQPage(p => Math.min(qTotalPages, p + 1))}
                        disabled={qPage === qTotalPages}
                        className="p-1.5 border border-input rounded-lg disabled:opacity-50 transition-all hover:bg-muted text-muted-foreground"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Configuration settings panel */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <Settings size={16} className="text-secondary" /> Test Settings
            </h2>
            
            <InputField 
              label="Duration (minutes)" 
              type="number" 
              required 
              min="1" 
              value={form.duration} 
              onChange={e => setForm({...form, duration: e.target.value})}
            />

            <InputField 
              label="Passing Score (%)" 
              type="number" 
              required 
              min="1" 
              max="100" 
              value={form.passingPercentage} 
              onChange={e => setForm({...form, passingPercentage: e.target.value})}
            />

            <InputField 
              label="Max Attempts Allowed" 
              type="number" 
              required 
              min="1" 
              value={form.maxAttempts} 
              onChange={e => setForm({...form, maxAttempts: e.target.value})}
            />

            <InputField 
              label="Default Marks Per Question" 
              type="number" 
              required 
              step="0.5" 
              value={form.marksPerQuestion} 
              onChange={e => setForm({...form, marksPerQuestion: e.target.value})}
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <ShieldAlert size={16} className="text-secondary" /> Anti-Cheating & Order
            </h2>
            
            <CheckboxField 
              label="Enable Negative Marking"
              desc="Subtract question negative marks on incorrect responses"
              checked={form.negativeMarking}
              onChange={e => setForm({...form, negativeMarking: e.target.checked})}
            />

            <CheckboxField 
              label="Random Question Order"
              desc="Shuffles questions for each student attempt"
              checked={form.randomQuestionOrder}
              onChange={e => setForm({...form, randomQuestionOrder: e.target.checked})}
            />

            <CheckboxField 
              label="Random Option Order"
              desc="Shuffles options within questions for each attempt"
              checked={form.randomOptionOrder}
              onChange={e => setForm({...form, randomOptionOrder: e.target.checked})}
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <Calendar size={16} className="text-secondary" /> Schedule (Optional)
            </h2>
            
            <InputField 
              label="Start Date" 
              type="date" 
              value={form.startDate} 
              onChange={e => setForm({...form, startDate: e.target.value})}
            />

            <InputField 
              label="End Date" 
              type="date" 
              value={form.endDate} 
              onChange={e => setForm({...form, endDate: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={16} /> {saving ? 'Saving configurations...' : 'Save Test'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* JSON Upload Modal */}
      {jsonUploadOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileJson size={20} className="text-primary" /> Upload Questions from JSON
              </h2>
              <button onClick={handleJsonClose} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {!jsonFile ? (
                // File selection step
                <div className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileChange}
                      className="hidden"
                      id="json-file-input"
                    />
                    <label htmlFor="json-file-input" className="cursor-pointer flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileJson size={32} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Drag & drop or click to select JSON file</p>
                        <p className="text-sm">Max 100 questions per upload</p>
                      </div>
                    </label>
                  </div>
                  
                  <div className="bg-muted/40 rounded-xl p-4 text-sm">
                    <p className="font-semibold mb-2">Expected JSON Format:</p>
                    <pre className="bg-background p-3 rounded-lg text-xs overflow-x-auto text-muted-foreground">
{`{
  "questions": [
    {
      "statement": "What is 2 + 2?",
      "options": ["2", "3", "4", "5"],
      "correctAnswer": "4",
      "explanation": "Basic arithmetic",
      "category": "Quantitative Aptitude",
      "topic": "Basic Math",
      "difficulty": "EASY",
      "tags": ["math", "basic"],
      "marks": 1.0,
      "negativeMarks": 0.25,
      "estimatedTime": 30,
      "status": "ACTIVE"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              ) : (
                // Preview step
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Preview ({jsonPreview?.length || 0} of {jsonUploadResult?.created?.length || '?'} questions)</h3>
                    <button
                      onClick={() => {
                        setJsonFile(null);
                        setJsonPreview(null);
                        setJsonUploadResult(null);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Change file
                    </button>
                  </div>
                  
                  {jsonPreview && jsonPreview.length > 0 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {jsonPreview.map((q, idx) => (
                        <div key={idx} className="p-3 bg-muted/40 rounded-xl text-sm">
                          <p className="font-medium mb-1 line-clamp-2">{q.statement}</p>
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${DIFFICULTY_BADGES[q.difficulty]}`}>
                              {q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 bg-secondary/15 text-secondary rounded-full font-medium">
                              {q.category}
                            </span>
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                              Marks: {q.marks || 1.0}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2 text-[11px] text-muted-foreground">
                            <span>Correct: {q.correctAnswer}</span>
                            <span>Options: {q.options?.length || 0}</span>
                          </div>
                        </div>
                      ))}
                      {jsonUploadResult && jsonUploadResult.created && jsonUploadResult.created.length > jsonPreview.length && (
                        <p className="text-xs text-muted-foreground text-center">... and {jsonUploadResult.created.length - jsonPreview.length} more questions</p>
                      )}
                    </div>
                  )}
                  
                  {jsonUploadResult && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                        <div>
                          <p className="font-medium text-green-700">Upload Successful!</p>
                          <p className="text-sm text-green-600">
                            {jsonUploadResult.created?.length || 0} questions created
                            {jsonUploadResult.failed?.length > 0 && (
                              <span className="ml-2 text-orange-600">, {jsonUploadResult.failed.length} failed</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {jsonUploadResult.failed && jsonUploadResult.failed.length > 0 && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                          <p className="font-medium text-destructive mb-2">Failed Questions:</p>
                          <ul className="space-y-1 text-sm">
                            {jsonUploadResult.failed.map((f, idx) => (
                              <li key={idx} className="text-destructive/80">
                                {f.question}: {f.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleJsonUpload}
                          disabled={jsonUploading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                          {jsonUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={14} /> {jsonUploadResult.created?.length ? 'Re-upload' : 'Upload Questions'}
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleJsonClose}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )} else if (!jsonUploadResult) {
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleJsonUpload}
                        disabled={jsonUploading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        <Upload size={14} /> Upload Questions
                      </button>
                      <button
                        onClick={handleJsonClose}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Question Preview</h2>
              <button onClick={() => setPreviewQuestion(null)} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_BADGES[previewQuestion.difficulty]}`}>
                    {previewQuestion.difficulty}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-secondary/15 text-secondary rounded-full font-medium">
                    {previewQuestion.category}
                  </span>
                </div>
                <p className="text-lg font-semibold leading-relaxed pt-2">
                  {previewQuestion.statement}
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-sm font-semibold text-muted-foreground font-semibold">Options:</p>
                <div className="grid gap-2">
                  {previewQuestion.options.map((opt, idx) => {
                    const label = String.fromCharCode(65 + idx); // A, B, C, D
                    const isCorrect = opt === previewQuestion.correctAnswer;
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-3 items-center p-3 rounded-xl border text-sm ${
                          isCorrect 
                            ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-500 font-semibold' 
                            : 'bg-background border-border text-foreground'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCorrect ? 'bg-green-500/20' : 'bg-muted'
                        }`}>
                          {label}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-5 py-2 bg-muted hover:bg-muted/80 rounded-xl font-medium text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestForm;
