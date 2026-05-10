import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { analyzeIntelligence, IntelligenceInsight } from '../services/geminiService';


export const IntelligenceInsights: React.FC = () => {
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIntelligenceData();
      const results = await analyzeIntelligence(data);
      setInsights(results);
    } catch (err) {
      console.error(err);
      setError('Failed to generate AI intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return 'lightbulb';
      case 'anomaly': return 'warning';
      case 'forecast': return 'trending_up';
      default: return 'info';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            Gemini Intelligence
          </h3>
          <p className="text-xs text-gray-500">Deep analysis of operational metrics</p>
        </div>
        <button 
          onClick={fetchAnalysis}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
          title="Refresh Analysis"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col items-center justify-center text-center gap-3 backdrop-blur-sm">
           <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shadow-sm">
             <span className="material-symbols-outlined text-2xl">error</span>
           </div>
           <div>
             <h4 className="font-bold text-rose-900 dark:text-rose-200">Intelligence Offline</h4>
             <p className="text-sm text-rose-600 dark:text-rose-400/80 mt-1 max-w-sm">{error}</p>
           </div>
           <button 
             onClick={fetchAnalysis}
             className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
           >
             Retry Analysis
           </button>
        </div>
      ) : loading && insights.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-50 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="group relative bg-slate-50 dark:bg-gray-800/30 rounded-2xl p-4 border border-slate-100 dark:border-gray-800 hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-primary`}>
                     <span className="material-symbols-outlined text-lg">{getIcon(insight.type)}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getImpactColor(insight.impact)}`}>
                    {insight.impact}
                  </span>
               </div>
               
               <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                 {insight.title}
               </h4>
               <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                 {insight.description}
               </p>
               
               <div className="pt-3 border-t border-slate-200 dark:border-gray-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recommendation</p>
                  <p className="text-xs font-medium text-primary">
                    {insight.suggestion}
                  </p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
