import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, 
  Search, Filter, BookOpen, AlertCircle, Save, X, Eye, EyeOff
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminQuizManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'module' | 'final-test'
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit/Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState('module');
  const [formModuleId, setFormModuleId] = useState('sql-mod-1');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formOptionD, setFormOptionD] = useState('');
  const [formCorrectAnswer, setFormCorrectAnswer] = useState(0); // 0, 1, 2, 3
  const [formExplanation, setFormExplanation] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('medium');
  const [formStatus, setFormStatus] = useState('active');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminQuestions();
      if (res.success && res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Fetch questions error:', err);
      setError('Failed to load questions from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormCategory('module');
    setFormModuleId('sql-mod-1');
    setFormQuestionText('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormOptionD('');
    setFormCorrectAnswer(0);
    setFormExplanation('');
    setFormDifficulty('medium');
    setFormStatus('active');
    setModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormCategory(q.category || 'module');
    setFormModuleId(q.moduleId || 'sql-mod-1');
    setFormQuestionText(q.questionText || '');
    setFormOptionA(q.options?.[0] || '');
    setFormOptionB(q.options?.[1] || '');
    setFormOptionC(q.options?.[2] || '');
    setFormOptionD(q.options?.[3] || '');
    setFormCorrectAnswer(q.correctAnswer ?? 0);
    setFormExplanation(q.explanation || '');
    setFormDifficulty(q.difficulty || 'medium');
    setFormStatus(q.status || 'active');
    setModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!formQuestionText || !formOptionA || !formOptionB) {
      alert('Please fill in question text and at least 2 options.');
      return;
    }

    const payload = {
      category: formCategory,
      moduleId: formCategory === 'final-test' ? 'final-test' : formModuleId,
      questionText: formQuestionText,
      options: [formOptionA, formOptionB, formOptionC, formOptionD].filter(Boolean),
      correctAnswer: Number(formCorrectAnswer),
      explanation: formExplanation,
      difficulty: formDifficulty,
      status: formStatus
    };

    try {
      if (editingQuestion) {
        await api.updateAdminQuestion(editingQuestion.id, payload);
        setSuccessMsg('Question updated successfully!');
      } else {
        await api.createAdminQuestion(payload);
        setSuccessMsg('New question created successfully!');
      }
      setModalOpen(false);
      fetchQuestions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Save question error:', err);
      alert(err.message || 'Error saving question.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.deleteAdminQuestion(id);
      setSuccessMsg('Question deleted successfully!');
      fetchQuestions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Error deleting question.');
    }
  };

  // Filter logic
  const filteredQuestions = questions.filter(q => {
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    if (moduleFilter !== 'all' && q.moduleId !== moduleFilter) return false;
    if (searchQuery) {
      const qText = (q.questionText || '').toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Admin Portal</span>
          <h2 className="text-xl sm:text-2xl font-black text-white">Quiz & Assessment Question Bank</h2>
          <p className="text-xs text-slate-400">Total {questions.length} questions loaded from system catalog.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        {/* Category Filter */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Filter Type</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl text-xs p-2.5 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories (Module & Final)</option>
            <option value="module">Module Quiz Questions (75)</option>
            <option value="final-test">Final Assessment Questions (25)</option>
          </select>
        </div>

        {/* Module Filter */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Filter Module</label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl text-xs p-2.5 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Modules</option>
            {Array.from({ length: 15 }, (_, i) => (
              <option key={i + 1} value={`sql-mod-${i + 1}`}>Module {i + 1}</option>
            ))}
            <option value="final-test">Final Assessment</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Search Question Text</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl text-xs pl-9 pr-3 py-2.5 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Questions List Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p>Fetching Question Bank Data...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 text-xs font-bold space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p>No questions found matching selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-brand-900 text-emerald-300 text-[10px] font-black uppercase rounded-md border border-brand-800">
                    {q.category === 'final-test' ? 'Final Test' : (q.moduleId || 'Module')}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-800">
                    {q.difficulty || 'Medium'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{q.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-xs font-bold text-rose-300 rounded-lg border border-rose-800 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white font-mono leading-relaxed">
                {idx + 1}. {q.questionText}
              </h4>

              {/* Options Grid */}
              <div className="grid sm:grid-cols-2 gap-2 text-xs font-mono">
                {q.options?.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctAnswer;
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                        isCorrect ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="truncate">{opt}</span>
                      {isCorrect && <span className="ml-auto text-[10px] uppercase text-emerald-400 font-black">✓ Correct</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-emerald-400 font-semibold not-italic">Explanation:</strong> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border-2 border-brand-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-bold"
                  >
                    <option value="module">Module Quiz Question</option>
                    <option value="final-test">Final Assessment Question</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Module</label>
                  <select
                    value={formModuleId}
                    onChange={(e) => setFormModuleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-bold"
                    disabled={formCategory === 'final-test'}
                  >
                    {Array.from({ length: 15 }, (_, i) => (
                      <option key={i + 1} value={`sql-mod-${i + 1}`}>Module {i + 1}</option>
                    ))}
                    <option value="final-test">Final Assessment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Question Stem</label>
                <textarea
                  rows={3}
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="Enter clear, non-ambiguous question text..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-3 rounded-xl font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Options A - D */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Answer Options</label>
                
                <div className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-slate-400 text-center">A</span>
                  <input
                    type="text"
                    value={formOptionA}
                    onChange={(e) => setFormOptionA(e.target.value)}
                    placeholder="Option A text..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-slate-400 text-center">B</span>
                  <input
                    type="text"
                    value={formOptionB}
                    onChange={(e) => setFormOptionB(e.target.value)}
                    placeholder="Option B text..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-slate-400 text-center">C</span>
                  <input
                    type="text"
                    value={formOptionC}
                    onChange={(e) => setFormOptionC(e.target.value)}
                    placeholder="Option C text..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-slate-400 text-center">D</span>
                  <input
                    type="text"
                    value={formOptionD}
                    onChange={(e) => setFormOptionD(e.target.value)}
                    placeholder="Option D text..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Correct Answer Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Set Correct Answer</label>
                  <select
                    value={formCorrectAnswer}
                    onChange={(e) => setFormCorrectAnswer(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 p-2.5 rounded-xl font-black"
                  >
                    <option value={0}>Option A (Index 0)</option>
                    <option value={1}>Option B (Index 1)</option>
                    <option value={2}>Option C (Index 2)</option>
                    <option value={3}>Option D (Index 3)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-bold"
                  >
                    <option value="easy">Easy</option>
                    <option value="easy-medium">Easy/Medium</option>
                    <option value="medium">Medium</option>
                    <option value="medium-practical">Medium/Practical</option>
                    <option value="advanced">Advanced</option>
                    <option value="practical">Practical SQL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Answer Review Explanation</label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is right and why distractors are wrong..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-3 rounded-xl font-sans focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
