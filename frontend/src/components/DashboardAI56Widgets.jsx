// src/components/DashboardAI56Widgets.jsx
// Drop-in AI-5 + AI-6 widgets for existing DashboardPage.jsx
// Import and add exactly where indicated below — zero other changes needed.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, ShieldAlert, AlertTriangle, TrendingUp } from 'lucide-react';
import { getMyRecommendations }    from '../services/recommendationService';
import { getMyRisk, getCriticalTasks } from '../services/riskService';

// ── Shared skeleton ───────────────────────────────────────────────────────────
const Skel = ({ h = 'h-4', w = 'w-full' }) => (
  <div className={`${h} ${w} bg-slate-100 rounded animate-pulse`} />
);

// ════════════════════════════════════════════════════════════════════════════════
// EMPLOYEE: My Recommendations Widget
// Add to EmployeeDashboard AFTER the PredictionCard:
//   <MyRecommendationsWidget userId={user.id} month={prodMonth} year={prodYear} />
// ════════════════════════════════════════════════════════════════════════════════
export const MyRecommendationsWidget = ({ userId, month, year }) => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getMyRecommendations(month, year)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, month, year]);

  const PRIORITY_DOT = {
    HIGH:   'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW:    'bg-green-500',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-violet-600" />
          <p className="text-xs font-bold text-slate-700">AI Recommendations</p>
        </div>
        <button
          onClick={() => navigate('/recommendations')}
          className="text-xs text-violet-600 font-semibold hover:underline"
        >
          View all →
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skel key={i} h="h-10" />)}
        </div>
      ) : !data || !(data.recommendations?.length) ? (
        <div className="text-center py-6 text-slate-400">
          <p className="text-xs">You're on track — no actions needed! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.recommendations.slice(0, 3).map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-2.5 items-start p-2.5 rounded-xl bg-violet-50 border border-violet-100"
            >
              <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${PRIORITY_DOT[rec.priority] || 'bg-slate-400'}`} />
              <p className="text-xs text-slate-700 leading-relaxed">{rec.message}</p>
            </motion.div>
          ))}
          {data.totalRecommendations > 3 && (
            <p className="text-[10px] text-slate-400 text-center">
              +{data.totalRecommendations - 3} more recommendations
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// EMPLOYEE: My Risk Tasks Widget
// Add to EmployeeDashboard AFTER MyRecommendationsWidget:
//   <MyRiskTasksWidget userId={user.id} />
// ════════════════════════════════════════════════════════════════════════════════
export const MyRiskTasksWidget = ({ userId }) => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getMyRisk()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const RISK_COLORS = {
    CRITICAL: 'bg-red-50 border-red-200 text-red-700',
    HIGH:     'bg-orange-50 border-orange-200 text-orange-700',
    MEDIUM:   'bg-amber-50 border-amber-200 text-amber-700',
    LOW:      'bg-green-50 border-green-200 text-green-700',
  };

  const riskyTasks = (data?.taskRisks || [])
    .filter(t => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(t.riskLevel));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-rose-600" />
          <p className="text-xs font-bold text-slate-700">My Task Risks</p>
        </div>
        <button
          onClick={() => navigate('/risk-analytics')}
          className="text-xs text-rose-600 font-semibold hover:underline"
        >
          Full analysis →
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skel key={i} h="h-12" />)}</div>
      ) : !riskyTasks.length ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
          <TrendingUp size={14} className="text-green-600" />
          <p className="text-xs text-green-700 font-medium">All tasks on track — no risks detected!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {riskyTasks.slice(0, 3).map((task, i) => (
            <motion.div
              key={task.taskId || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl border ${RISK_COLORS[task.riskLevel]}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{task.taskTitle}</p>
                <p className="text-[10px] opacity-70">
                  {task.daysRemaining != null
                    ? task.daysRemaining < 0
                      ? `${Math.abs(task.daysRemaining)}d overdue`
                      : `${task.daysRemaining}d left`
                    : 'No deadline'} · {task.completionPercentage ?? 0}% done
                </p>
              </div>
              <span className="text-xs font-black">{task.riskScore}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MANAGER: Critical Tasks Banner
// Add to ManagerDashboard AFTER the AI Prediction Engine banner:
//   <ManagerCriticalTasksBanner />
// ════════════════════════════════════════════════════════════════════════════════
export const ManagerCriticalTasksBanner = () => {
  const navigate = useNavigate();
  const [count,   setCount]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCriticalTasks()
      .then(tasks => setCount(tasks.length))
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  if (loading || count === null) return null;
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} className="text-white flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">
            {count} Critical Task{count !== 1 ? 's' : ''} Require Immediate Action
          </p>
          <p className="text-xs text-red-200 mt-0.5">
            AI-6 Deadline Risk Engine detected high-risk deadlines
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate('/risk-analytics')}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap transition-colors"
      >
        <ShieldAlert size={13} /> View Risks
      </button>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MANAGER: Recommendation + Risk summary cards (for KPI grid)
// Usage inside ManagerDashboard cards array — or render standalone:
//   <ManagerAI56SummaryCards />
// ════════════════════════════════════════════════════════════════════════════════
export const ManagerAI56SummaryCards = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* AI-5 card */}
      <button
        onClick={() => navigate('/recommendations')}
        className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50 border border-violet-100 hover:border-violet-300 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-violet-800">Team Recommendations</p>
          <p className="text-xs text-violet-500">AI-5 · Personalised insights per employee</p>
        </div>
      </button>

      {/* AI-6 card */}
      <button
        onClick={() => navigate('/risk-analytics')}
        className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 hover:border-rose-300 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-rose-800">Deadline Risk Analytics</p>
          <p className="text-xs text-rose-500">AI-6 · Proactive risk prediction per task</p>
        </div>
      </button>
    </div>
  );
};