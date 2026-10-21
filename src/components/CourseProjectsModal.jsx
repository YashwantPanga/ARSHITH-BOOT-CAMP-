import React, { useState, useEffect } from 'react';
import { readStudent, userIdOf } from '../utils/session';
import { 
  X, Briefcase, Code, CheckCircle, ExternalLink, Copy, Check, 
  Terminal, Sparkles, AlertCircle, Clock, FileText, ChevronRight 
} from 'lucide-react';

export default function CourseProjectsModal({ isOpen, onClose, course }) {
  const projects = course?.projects || [];
  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [submissions, setSubmissions] = useState({});
  const [githubUrlInput, setGithubUrlInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (isOpen) {
      // Load saved project submissions from localStorage
      const loaded = {};
      projects.forEach(p => {
        const saved = localStorage.getItem(`arb_proj_sub_${userIdOf(readStudent())}_${course?.id}_${p.id}`);
        if (saved) {
          try { loaded[p.id] = JSON.parse(saved); } catch (e) {}
        }
      });
      setSubmissions(loaded);
      setSaveSuccess(false);
    }
  }, [isOpen, course]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    if (activeProject) {
      setGithubUrlInput(submissions[activeProject.id]?.githubUrl || '');
      setSaveSuccess(false);
    }
  }, [activeProject, submissions]);

  if (!isOpen || !course) return null;

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSubmission = (e) => {
    e.preventDefault();
    if (!githubUrlInput.trim() || !activeProject) return;

    const record = {
      githubUrl: githubUrlInput.trim(),
      submittedAt: new Date().toISOString(),
      status: 'Submitted'
    };

    const userId = userIdOf(readStudent());

    localStorage.setItem(`arb_proj_sub_${userId}_${course.id}_${activeProject.id}`, JSON.stringify(record));
    localStorage.setItem(`arb_proj_submitted_${course.id}_${userId}`, 'true');
    setSubmissions(prev => ({ ...prev, [activeProject.id]: record }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const completedCount = Object.keys(submissions).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-brand-950/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-[92vh] animate-scale-in">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 gap-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-peach-50 flex items-center justify-center text-peach-500 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow">
                  Course Hands-on Projects
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {completedCount} / {projects.length} Completed
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-900 line-clamp-1">
                {course.title} · {projects.length} mini projects
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden md:grid md:grid-cols-12">
          
          {/* Projects Left Sidebar (4 Cols) */}
          <div className="md:col-span-4 bg-cream p-4 md:border-r border-b md:border-b-0 border-slate-100 md:overflow-y-auto space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 pb-1">
              Select a project
            </div>

            {projects.map((proj, idx) => {
              const isSelected = activeProject?.id === proj.id;
              const isSubmitted = !!submissions[proj.id];

              return (
                <button
                  key={proj.id}
                  onClick={() => setActiveProjectId(proj.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border ${
                    isSelected
                      ? 'bg-white border-peach-400 ring-4 ring-peach-100 text-brand-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase text-peach-500">
                      Project #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {proj.difficulty}
                      </span>
                      {isSubmitted && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-mint-50 text-mint-500">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold line-clamp-2 leading-snug">
                    {proj.title}
                  </h4>

                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {proj.subtitle}
                  </p>
                </button>
              );
            })}

            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1 mt-4">
              <span className="font-semibold text-brand-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-peach-500" />
                <span>Lightweight Design</span>
              </span>
              <p>Each project is sized to 1–2 pages of code (50–90 lines) and directly applies modules you studied.</p>
            </div>
          </div>

          {/* Project Details Right Area (8 Cols) */}
          <div className="md:col-span-8 p-4 sm:p-6 md:overflow-y-auto space-y-6 text-slate-600">
            {activeProject ? (
              <>
                {/* Project Header Banner */}
                <div className="bg-brand-900 text-white p-5 rounded-2xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-peach-500 text-white text-[10px] font-semibold uppercase rounded-full">
                      {activeProject.subtitle}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-brand-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{activeProject.estimatedTime}</span>
                      <span>•</span>
                      <span>{activeProject.pageLength}</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white">
                    {activeProject.title}
                  </h2>
                  <p className="text-sm text-brand-100 leading-relaxed">
                    {activeProject.description}
                  </p>
                </div>

                {/* Core Learning Objectives */}
                {activeProject.objectives && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>What You Will Practice</span>
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      {activeProject.objectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-2 bg-brand-50/60 p-2.5 rounded-xl border border-brand-100">
                          <span className="text-peach-500 font-bold">•</span>
                          <span className="text-slate-700">{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements Checklist */}
                {activeProject.requirements && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>Project Requirements & Deliverables</span>
                    </h4>
                    <ul className="space-y-1.5 text-sm text-slate-600 pl-1">
                      {activeProject.requirements.map((req, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-peach-50 text-[10px] font-bold text-peach-600 flex items-center justify-center shrink-0 mt-0.5">
                            {rIdx + 1}
                          </span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Complete Starter Code / Template */}
                {activeProject.starterCode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                        <Code className="w-4 h-4" />
                        <span>Starter Code & Reference Implementation</span>
                      </h4>
                      <button
                        onClick={() => handleCopyCode(activeProject.starterCode)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-brand-900 rounded-lg flex items-center gap-1 transition-all"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <div className="code-block max-h-72">
                      <pre>{activeProject.starterCode}</pre>
                    </div>
                  </div>
                )}

                {/* Expected Terminal Output */}
                {activeProject.expectedOutput && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-peach-500" />
                      <span>Expected Terminal Output</span>
                    </h4>
                    <div className="code-block">
                      <pre>{activeProject.expectedOutput}</pre>
                    </div>
                  </div>
                )}

                {/* GitHub Submission Card */}
                <div className="bg-peach-50 p-5 rounded-2xl border border-peach-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-peach-500" />
                        <span>Submit Project GitHub Link</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Upload your script to GitHub and record your repository link below.
                      </p>
                    </div>
                    {submissions[activeProject.id] && (
                      <span className="px-2.5 py-1 bg-mint-50 text-mint-500 text-[10px] font-semibold uppercase rounded-full">
                        Saved ✓
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveSubmission} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder={`https://github.com/username/${course?.id || 'course'}-mini-project`}
                      value={githubUrlInput}
                      onChange={(e) => setGithubUrlInput(e.target.value)}
                      required
                      className="input flex-1 font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="btn-primary shrink-0"
                    >
                      Save Submission
                    </button>
                  </form>

                  {saveSuccess && (
                    <p className="text-xs text-mint-500 font-semibold flex items-center gap-1">
                      ✓ Project link saved successfully!
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>

        </div>

      </div>
    </div>
  );
}
