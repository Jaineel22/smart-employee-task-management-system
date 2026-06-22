import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PauseCircle, PlayCircle, Clock, AlertTriangle,
  RefreshCw, BarChart2, Users, Activity,
} from 'lucide-react';
import {
  getAllPausedTasks, getMyPausedTasks,
  getInterruptionAnalytics,
} from '../services/reportService';
import PauseTaskModal    from '../components/PauseTaskModal';
import ResumeTaskModal   from '../components/ResumeTaskModal';
import Loader from '../components/Loader';

// ── Duration formatter ────────────────────────────────────────────────────────
const fmtHours = (h) => {
  if (h == null) return '—';
  if (h < 1)    return '<1h';
  if (h < 24)   return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

// ── Interruption row ──────────────────────────────────────────────────────────
const InterruptionRow = ({ item, onResume, isManager }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-colors"
  >
    {/* Pause indicator */}
    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0 animate-pulse" />

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {item.taskTitle || `Task #${item.taskId}`}
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
          PAUSED
        </span>
      </div>

      {isManager && item.employeeName && (
        <p className="text-xs text-slate-500 mt-0.5">
          <Users size={10} className="inline mr-1" />
          {item.employeeName}
        </p>
      )}

      <p className="text-xs text-slate-500 mt-1">
        <span className="font-medium">Reason:</span> {item.pauseReason}
      </p>

      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
        <span><Clock size={9} className="inline mr-0.5" />
          Paused: {item.pausedAt ? new Date(item.pausedAt).toLocaleString() : '—'}
        </span>
        {item.interruptionDurationHours != null && (
          <span>Duration: {fmtHours(item.interruptionDurationHours)}</span>
        )}
      </div>
    </div>

    {!isManager && onResume && (
      <button
        onClick={() => onResume(item)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex-shrink-0 transition-colors"
      >
        <PlayCircle size={13} /> Resume
      </button>
    )}
  </motion.div>
);

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const TaskInterruptionPage = () => {
  const { user }  = useAuth();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [pausedTasks,  setPausedTasks]  = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // Modals
  const [pauseTarget,  setPauseTarget]  = useState(null);
  const [resumeTarget, setResumeTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [paused, analytics] = await Promise.all([
        isManager ? getAllPausedTasks() : getMyPausedTasks(),
        isManager ? getInterruptionAnalytics() : Promise.resolve(null),
      ]);
      setPausedTasks(paused);
      setAnalytics(analytics);
    } catch (err) {
      setError('Failed to load interruption data.');
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <PauseCircle size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Task Interruptions</h1>
              <p className="text-xs text-orange-100">
                {isManager ? 'Monitor paused tasks and delay justifications' : 'Manage your paused tasks'}
              </p>
            </div>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Manager analytics */}
      {isManager && analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Interruptions',    value: analytics.totalInterruptions,    color: 'bg-slate-50 text-slate-700'   },
            { label: 'Currently Paused',       value: analytics.currentlyPausedCount,  color: 'bg-amber-50 text-amber-700'  },
            { label: 'Total Paused Hours',     value: `${analytics.totalPausedHours}h`, color: 'bg-orange-50 text-orange-700'},
            { label: 'Avg Pause Duration',     value: `${analytics.avgPauseDurationHours ?? 0}h`, color: 'bg-red-50 text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl p-4 ${color}`}>
              <p className="text-xs font-semibold opacity-70">{label}</p>
              <p className="text-2xl font-black mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {isManager && analytics && (analytics.mostInterruptedEmployee || analytics.mostInterruptedProject) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analytics.mostInterruptedEmployee && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Most Interrupted Employee</p>
              <p className="text-sm font-bold text-slate-800">{analytics.mostInterruptedEmployee}</p>
            </div>
          )}
          {analytics.mostInterruptedProject && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Most Interrupted Project</p>
              <p className="text-sm font-bold text-slate-800">{analytics.mostInterruptedProject}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Currently paused tasks */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          {isManager ? `All Paused Tasks (${pausedTasks.length})` : `My Paused Tasks (${pausedTasks.length})`}
        </p>

        {pausedTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <PlayCircle size={28} className="mx-auto mb-2 opacity-30 text-green-500" />
            <p className="text-sm">No tasks currently paused — all clear!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pausedTasks.map((item, i) => (
              <InterruptionRow
                key={item.id || i}
                item={item}
                isManager={isManager}
                onResume={!isManager ? (t) => setResumeTarget(t) : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent interruptions (manager) */}
      {isManager && analytics?.recentInterruptions?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Recent Interruptions
          </p>
          <div className="space-y-2">
            {analytics.recentInterruptions.map((item, i) => (
              <div key={item.id || i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100">
                <Activity size={14} className={item.currentlyPaused ? 'text-amber-500 mt-0.5' : 'text-green-500 mt-0.5'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.taskTitle || `Task #${item.taskId}`}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.currentlyPaused ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.currentlyPaused ? 'PAUSED' : 'RESUMED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {item.employeeName} · {item.pauseReason}
                    {item.interruptionDurationHours != null && ` · ${fmtHours(item.interruptionDurationHours)}`}
                  </p>
                  {item.delayJustification && (
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      Justification: {item.delayJustification}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {resumeTarget && (
          <ResumeTaskModal
            interruption={resumeTarget}
            onClose={() => setResumeTarget(null)}
            onSuccess={() => { setResumeTarget(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskInterruptionPage;