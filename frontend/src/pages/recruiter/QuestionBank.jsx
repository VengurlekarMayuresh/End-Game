import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { 
  Plus, Search, Edit2, Trash2, Eye, X, 
  HelpCircle, Tag, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const DIFFICULTY_BADGES = {
  EASY: 'bg-green-500/10 text-green-600 border border-green-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  HARD: 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Form fields
  const [form, setForm] = useState({
    statement: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswerIndex: '0', // 0, 1, 2, 3
    explanation: '',
    category: '',
    topic: '',
    difficulty: 'EASY',
    tags: '',
    marks: '1.0',
    negativeMarks: '0.0',
    estimatedTime: '60',
    status: 'ACTIVE'
  });

  const fetchQuestions = () => {
    setLoading(true);
    setError('');
    api.get('/recruiter/questions', {
      params: { search, category, difficulty, page, limit: 8 }
    })
      .then(res => {
        setQuestions(res.data.questions);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to fetch questions');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, [search, category, difficulty, page]);

  const resetForm = () => {
    setForm({
      statement: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correctAnswerIndex: '0',
      explanation: '',
      category: '',
      topic: '',
      difficulty: 'EASY',
      tags: '',
      marks: '1.0',
      negativeMarks: '0.0',
      estimatedTime: '60',
      status: 'ACTIVE'
    });
    setEditingQuestion(null);
  };

  const handleEditClick = (q) => {
    setEditingQuestion(q);
    
    // Find the correct index
    const correctIdx = q.options.indexOf(q.correctAnswer);
    
    setForm({
      statement: q.statement,
      option1: q.options[0] || '',
      option2: q.options[1] || '',
      option3: q.options[2] || '',
      option4: q.options[3] || '',
      correctAnswerIndex: correctIdx !== -1 ? String(correctIdx) : '0',
      explanation: q.explanation || '',
      category: q.category,
      topic: q.topic || '',
      difficulty: q.difficulty,
      tags: q.tags.join(', '),
      marks: String(q.marks),
      negativeMarks: String(q.negativeMarks),
      estimatedTime: q.estimatedTime ? String(q.estimatedTime) : '',
      status: q.status
    });
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/recruiter/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const options = [form.option1.trim(), form.option2.trim(), form.option3.trim(), form.option4.trim()];
    if (options.some(o => !o)) {
      alert('All four options must be filled out');
      return;
    }

    const correctAnswer = options[parseInt(form.correctAnswerIndex)];
    if (!correctAnswer) {
      alert('Please select a valid correct option');
      return;
    }

    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      statement: form.statement,
      options,
      correctAnswer,
      explanation: form.explanation,
      category: form.category,
      topic: form.topic,
      difficulty: form.difficulty,
      tags: tagsArray,
      marks: parseFloat(form.marks),
      negativeMarks: parseFloat(form.negativeMarks),
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : null,
      status: form.status
    };

    try {
      if (editingQuestion) {
        await api.put(`/recruiter/questions/${editingQuestion.id}`, payload);
      } else {
        await api.post('/recruiter/questions', payload);
      }
      setShowFormModal(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Question Bank</h1>
          <p className="text-muted-foreground">Manage reusable questions for your Aptitude Tests</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowFormModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all shrink-0"
        >
          <Plus size={16} /> Add Question
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Search questions or tags..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div>
          <select
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            value={difficulty}
            onChange={e => { setDifficulty(e.target.value); setPage(1); }}
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <input
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
            placeholder="Filter Category (e.g. Math)"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main content table / cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No questions found</h3>
          <p className="text-muted-foreground text-sm">
            Add questions to your Question Bank to select them when creating tests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-4">
            {questions.map((q) => (
              <div key={q.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-secondary/30 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${DIFFICULTY_BADGES[q.difficulty] || 'bg-muted'}`}>
                        {q.difficulty}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 bg-secondary/10 text-secondary font-medium rounded-full">
                        {q.category}
                      </span>
                      {q.topic && (
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">
                          Topic: {q.topic}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Marks: {q.marks} | Neg Marks: {q.negativeMarks}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-base leading-relaxed line-clamp-2">
                      {q.statement}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => setPreviewQuestion(q)}
                      className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                      title="Preview Question"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleEditClick(q)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(q.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {q.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                    <Tag size={12} className="text-muted-foreground/60 mt-0.5 shrink-0" />
                    {q.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-input rounded-xl hover:bg-muted disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-input rounded-xl hover:bg-muted disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="text-2xl font-bold">{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowFormModal(false)} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Question Statement *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all resize-none"
                  placeholder="e.g. In a class of 40 students, 60% are girls. How many boys are in the class?"
                  value={form.statement}
                  onChange={e => setForm({ ...form, statement: e.target.value })}
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">Options *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-xs bg-muted p-2 rounded-lg">A</span>
                    <input
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      placeholder="Option 1"
                      value={form.option1}
                      onChange={e => setForm({ ...form, option1: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-xs bg-muted p-2 rounded-lg">B</span>
                    <input
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      placeholder="Option 2"
                      value={form.option2}
                      onChange={e => setForm({ ...form, option2: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-xs bg-muted p-2 rounded-lg">C</span>
                    <input
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      placeholder="Option 3"
                      value={form.option3}
                      onChange={e => setForm({ ...form, option3: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-xs bg-muted p-2 rounded-lg">D</span>
                    <input
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      placeholder="Option 4"
                      value={form.option4}
                      onChange={e => setForm({ ...form, option4: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Correct option selector */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Correct Option *</label>
                <select
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  value={form.correctAnswerIndex}
                  onChange={e => setForm({ ...form, correctAnswerIndex: e.target.value })}
                >
                  <option value="0">Option A ({form.option1 || 'Empty'})</option>
                  <option value="1">Option B ({form.option2 || 'Empty'})</option>
                  <option value="2">Option C ({form.option3 || 'Empty'})</option>
                  <option value="3">Option D ({form.option4 || 'Empty'})</option>
                </select>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Category *</label>
                  <input
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="e.g. Quantitative Aptitude"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Topic</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="e.g. Percentages"
                    value={form.topic}
                    onChange={e => setForm({ ...form, topic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Difficulty *</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={form.difficulty}
                    onChange={e => setForm({ ...form, difficulty: e.target.value })}
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Estimated Time (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="60"
                    value={form.estimatedTime}
                    onChange={e => setForm({ ...form, estimatedTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Marks *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="1.0"
                    value={form.marks}
                    onChange={e => setForm({ ...form, marks: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Negative Marks (on error)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="0.0"
                    value={form.negativeMarks}
                    onChange={e => setForm({ ...form, negativeMarks: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Explanation (Shown in results)</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all resize-none"
                  placeholder="Explain how to get the correct answer..."
                  value={form.explanation}
                  onChange={e => setForm({ ...form, explanation: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Tags (comma separated)</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="math, ratio, boys"
                    value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Status</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 border border-input rounded-xl hover:bg-muted font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 font-semibold text-sm transition-all"
                >
                  {editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Question Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Question Preview</h2>
              <button onClick={() => setPreviewQuestion(null)} className="p-1 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
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
                <p className="text-sm font-semibold text-muted-foreground">Options:</p>
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

              {previewQuestion.explanation && (
                <div className="border-t border-border pt-4 bg-muted/20 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-foreground mb-1">Explanation:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {previewQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
              <button
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

export default QuestionBank;
