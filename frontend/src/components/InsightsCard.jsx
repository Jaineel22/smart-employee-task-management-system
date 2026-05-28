import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyInsights, getTeamInsights } from '../services/insightService';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const InsightsCard = ({ isManager = false }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = isManager
        ? await getTeamInsights()
        : await getMyInsights();
      setInsights(data || []);
    } catch {
      setInsights(['Unable to generate insights at this time. Please try again shortly.']);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [isManager]);

  const visibleInsights = expanded ? insights : insights.slice(0, 3);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-slate-100 rounded-lg" />
        <div className="h-3 bg-slate-100 rounded w-32" />
      </div>
      {[0,1,2].map(i => <div key={i} className="h-9 bg-slate-100 rounded-xl mb-2" />)}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">
              {isManager ? 'Team Intelligence' : 'AI Productivity Insights'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isManager ? 'Smart team analytics' : 'Personalised for you'}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Refresh insights"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Insights list */}
      <AnimatePresence>
        <div className="space-y-2">
          {visibleInsights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5"
            >
              <p className="text-xs text-slate-700 leading-relaxed">{insight}</p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Expand/collapse */}
      {insights.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold mt-3"
        >
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> {insights.length - 3} more insights</>}
        </button>
      )}
    </div>
  );
};

export default InsightsCard;