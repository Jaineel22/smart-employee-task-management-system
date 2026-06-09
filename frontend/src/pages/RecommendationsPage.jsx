// src/pages/RecommendationsPage.jsx
// AI-5: Recommendations Engine — Employee + Manager view

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Users, RefreshCw, ChevronDown, ChevronUp,
  User, TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react';
import {
  getMyRecommendations,
  getTeamRecommendations,
  getEmployeeRecommendations,
} from '../services/recommendationService';

import RecommendationCard from '../components/workforce/RecommendationCard';
import Loader from '../components/Loader';

const now = new Date();
const DEFAULT_MONTH = now.getMonth() + 1;
const DEFAULT_YEAR  = now.getFullYear();

// ── Priority summary chip ─────────────────────────────────────────────────────
const PriorityChip = ({ level }) => {
  const styles = {
    HIGH:   'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW:    'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[level] || styles.LOW}`}>
      {level}
    </span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    red:    'bg-red-50 text-red-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
  };
  return (
    <div className={`rounded-2xl p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black">{value ?? '—'}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

// ── Collapsible employee row (manager view) ───────────────────────────────────
const EmployeeRow = ({ emp, index }) => {
  const [open, setOpen] = useState(false);
  const name = emp.employeeName || `Employee #${emp.employeeId}`;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4'];
  const avatarColor  = avatarColors[(emp.employeeId || 0) % avatarColors.length];

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{name}</p>
          <p className="text-xs text-slate-400">
            {emp.department || '—'} ·{' '}
            {emp.totalRecommendations ?? 0} recommendation{emp.totalRecommendations !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {emp.overallPriority && <PriorityChip level={emp.overallPriority} />}
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-2 border-t border-slate-100">
              {(emp.recommendations || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recommendations generated</p>
              ) : (
                emp.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} data={rec} loading={false} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const RecommendationsPage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [month,   setMonth]   = useState(DEFAULT_MONTH);
  const [year]                = useState(DEFAULT_YEAR);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [view,    setView]    = useState('team'); // 'team' | 'mine'

  const fetchData = useCallback(async () => {
    console.log("🔵 fetchData called - isManager:", isManager, "view:", view, "month:", month, "year:", year);
    setLoading(true);
    setError('');
    try {
      let result;
      if (isManager && view === 'team') {
        console.log("📤 Calling getTeamRecommendations with month:", month, "year:", year);
        result = await getTeamRecommendations(month, year);
        console.log("✅ Team recommendations received:", result);
        console.log("📊 Team recommendations count:", result?.teamRecommendations?.length);
      } else {
        console.log("📤 Calling getMyRecommendations with month:", month, "year:", year);
        result = await getMyRecommendations(month, year);
        console.log("✅ My recommendations received:", result);
        console.log("📊 Recommendations count:", result?.recommendations?.length);
      }
      setData(result);
    } catch (err) {
      console.error("❌ Error fetching recommendations:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || 'Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, [isManager, view, month, year]);

  useEffect(() => { 
    console.log("🟢 useEffect triggered - calling fetchData");
    fetchData(); 
  }, [fetchData]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return <Loader />;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Lightbulb size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">AI Recommendations</h1>
              <p className="text-xs text-violet-200">Personalised, data-driven insights</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Month selector */}
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="text-xs bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 focus:outline-none"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1} className="text-slate-800">{m} {year}</option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Manager tab switcher */}
        {isManager && (
          <div className="flex gap-2 mt-4">
            {[
              { key: 'team', icon: Users, label: 'Team View' },
              { key: 'mine', icon: User,  label: 'My Recommendations' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  view === key
                    ? 'bg-white text-violet-700 shadow'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── EMPLOYEE VIEW ────────────────────────────────────────────────────── */}
      {(!isManager || view === 'mine') && data && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Productivity"   value={`${Math.round(data.productivityScore ?? 0)}%`} color="blue" />
            <StatCard label="Attendance"     value={`${Math.round(data.attendancePct ?? 0)}%`}     color="green" />
            <StatCard label="Pending Tasks"  value={data.pendingTasks ?? 0}                         color="amber" />
            <StatCard label="Overdue Tasks"  value={data.overdueTasks ?? 0}                         color="red" />
          </div>

          {/* Overall priority banner */}
          {data.overallPriority && (
            <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
              data.overallPriority === 'HIGH'
                ? 'bg-red-50 border-red-200'
                : data.overallPriority === 'MEDIUM'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
            }`}>
              {data.overallPriority === 'HIGH'
                ? <AlertTriangle size={16} className="text-red-600" />
                : data.overallPriority === 'MEDIUM'
                  ? <AlertTriangle size={16} className="text-amber-600" />
                  : <CheckCircle size={16} className="text-green-600" />}
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {data.overallPriority === 'HIGH'
                    ? 'High-priority actions required'
                    : data.overallPriority === 'MEDIUM'
                      ? 'Some areas need your attention'
                      : 'You\'re on track — minor improvements suggested'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {data.totalRecommendations ?? 0} recommendation{data.totalRecommendations !== 1 ? 's' : ''} generated
                </p>
              </div>
            </div>
          )}

          {/* Recommendation list */}
          <div className="space-y-2">
            {(data.recommendations || []).length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Lightbulb size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recommendations for this period.</p>
                <p className="text-xs mt-1">Keep up the good work! 🎉</p>
              </div>
            ) : (
              data.recommendations.map((rec, i) => (
                <RecommendationCard key={i} data={rec} loading={false} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MANAGER TEAM VIEW ─────────────────────────────────────────────────── */}
      {isManager && view === 'team' && data && (
        <div className="space-y-4">
          {/* Team stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Team Productivity" value={`${Math.round(data.teamAvgProductivity ?? 0)}%`} color="blue"  />
            <StatCard label="Team Attendance"   value={`${Math.round(data.teamAvgAttendance  ?? 0)}%`} color="green" />
            <StatCard label="Total Overdue"     value={data.totalOverdueTasks ?? 0}                     color="red"   />
            <StatCard label="At-Risk Employees" value={(data.atRiskEmployeeNames || []).length}         color="amber" sub="HIGH priority" />
          </div>

          {/* Team recommendations */}
          {(data.teamRecommendations || []).length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Team-Level Actions
              </p>
              <div className="space-y-2">
                {data.teamRecommendations.map((rec, i) => (
                  <RecommendationCard key={i} data={rec} loading={false} />
                ))}
              </div>
            </div>
          )}

          {/* Employee breakdown */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Employee Breakdown ({data.totalEmployees ?? 0} employees — sorted by lowest productivity)
            </p>
            <div className="space-y-2">
              {(data.employeeBreakdown || []).map((emp, i) => (
                <EmployeeRow key={emp.employeeId || i} emp={emp} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;