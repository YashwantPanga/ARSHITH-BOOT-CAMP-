import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Award, CheckCircle, XCircle, Users, 
  TrendingUp, RefreshCw, AlertCircle, Clock, BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminQuizAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getQuizAnalytics();
      if (res.success && res.analytics) {
        setAnalytics(res.analytics);
      } else {
        throw new Error('Failed to load analytics.');
      }
    } catch (err) {
      console.error('Quiz analytics error:', err);
      setError('Could not load quiz analytics from server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-slate-400 space-y-2">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <p>Calculating Quiz System Analytics & Performance Metrics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-rose-300 text-xs font-bold space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p>{error || 'Analytics unavailable.'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Total Module Quiz Attempts</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.totalQuizAttempts}</p>
          <p className="text-[11px] text-emerald-400 font-bold">{analytics.quizPassRate}% Pass Rate</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Average Quiz Score</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.avgQuizScore}%</p>
          <p className="text-[11px] text-slate-400 font-medium">Across all 15 modules</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Final Test Attempts</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics.totalFinalAttempts}</p>
          <p className="text-[11px] text-amber-400 font-bold">{analytics.finalPassRate}% Certification Pass Rate</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Passed Final Assessment</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{analytics.passedFinalAttempts}</p>
          <p className="text-[11px] text-slate-400 font-medium">Earned SQL Certification</p>
        </div>

      </div>

      {/* Module-Wise Performance Breakdown */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Module-Wise Quiz Performance</h3>
            <p className="text-xs text-slate-400 font-medium">Average student scores and attempt volumes per module</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 pt-2">
          {Array.from({ length: 15 }, (_, i) => {
            const modId = `sql-mod-${i + 1}`;
            const data = analytics.modulePerformance?.[modId] || { attempts: 0, avgPercentage: 0, passedCount: 0 };
            
            return (
              <div
                key={modId}
                className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-black flex items-center justify-center border border-slate-800 shrink-0">
                    M{i + 1}
                  </span>
                  <span className="font-bold text-white truncate">
                    Module {i + 1} Quiz
                  </span>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Attempts</span>
                    <span className="font-black text-white">{data.attempts}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pass Ratio</span>
                    <span className="font-black text-emerald-400">{data.passedCount} Passed</span>
                  </div>

                  <div className="w-24">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Score</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${data.avgPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{data.avgPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Attempts Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module Attempts Log */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Module Quiz Submissions</h3>
          {analytics.recentQuizAttempts?.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No module quiz attempts logged yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {analytics.recentQuizAttempts?.map(a => (
                <div key={a.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{a.studentName || a.userId}</span>
                    <p className="text-[10px] text-slate-400">{a.moduleId} • Attempt #{a.attemptNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      a.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {a.percentage}% ({a.passed ? 'PASSED' : 'FAILED'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Final Test Attempts Log */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Final Assessment Submissions</h3>
          {analytics.recentFinalAttempts?.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No final test attempts logged yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {analytics.recentFinalAttempts?.map(a => (
                <div key={a.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{a.studentName || a.userId}</span>
                    <p className="text-[10px] text-slate-400">Time: {a.timeTakenFormatted} • Attempt #{a.attemptNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      a.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {a.score}/25 ({a.percentage}%) {a.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
