import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert, RefreshCw, User, Users,
  AlertTriangle, CheckCircle, TrendingDown,
} from 'lucide-react';
import {
  getMyRisk,
  getTeamRisk,
  getCriticalTasks,
} from '../services/riskService';
import RiskCard from '../components/RiskCard';
import RiskDistributionChart, { CriticalTaskWidget, AtRiskEmployeeWidget } from '../components/RiskDistributionChart';
import Loader from '../components/Loader';

const now = new Date();
const DEFAULT_MONTH = now.getMonth() + 1;
const DEFAULT_YEAR  = now.getFullYear();

// ── Risk level badge ──────────────────────────────────────────────────────────
const RiskBadge = ({ level, score }) => {
  const cfg = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH:     'bg-orange-500 text-white',
    MEDIUM:   'bg-amber-500 text-white',
    LOW:      'bg-green-600 text-white',
  };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg[level] || cfg.LOW}`}>
      {level} {score != null ? `· ${score}` : ''}
    </span>
  );
};

// ── Stat mini-card ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = 'slate' }) => {
  const colors = {
    red:    'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    amber:  'bg-amber-50 text-amber-700',
    green:  'bg-green-50 text-green-700',
    blue:   'bg-blue-50 text-blue-700',
    slate:  'bg-slate-50 text-slate-700',
  };
  return (
    <div className={`rounded-2xl p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black">{value ?? 0}</p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const RiskAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [month,   setMonth]   = useState(DEFAULT_MONTH);
  const [year]                = useState(DEFAULT_YEAR);
  const [view,    setView]    = useState(isManager ? 'team' : 'mine');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isManager && view === 'team') {
        const [team, critical] = await Promise.all([
          getTeamRisk(month, year),
          getCriticalTasks(),
        ]);
        setData({ ...team, criticalList: critical });
      } else {
        setData(await getMyRisk());
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load risk data.');
    } finally {
      setLoading(false);
    }
  }, [isManager, view, month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-700 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Deadline Risk Analytics</h1>
              <p className="text-xs text-rose-200">AI-6 Predictive Risk Engine</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isManager && (
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="text-xs bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1} className="text-slate-800">{m} {year}</option>
                ))}
              </select>
            )}
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
              { key: 'team', icon: Users, label: 'Team Risk' },
              { key: 'mine', icon: User,  label: 'My Tasks' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  view === key
                    ? 'bg-white text-rose-700 shadow'
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

      {/* ── EMPLOYEE: my task risks ────────────────────────────────────────────── */}
      {(!isManager || view === 'mine') && data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">
                {data.employeeName || user?.fullName || 'My Tasks'}
              </p>
              <p className="text-xs text-slate-500">{data.department || ''}</p>
            </div>
            <RiskBadge level={data.overallRiskLevel} score={data.avgRiskScore} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Critical"  value={data.criticalTaskCount} color="red"    />
            <StatCard label="High Risk" value={data.highRiskTaskCount}  color="orange" />
            <StatCard label="Medium"    value={data.mediumRiskTaskCount}color="amber"  />
            <StatCard label="Low Risk"  value={data.lowRiskTaskCount}   color="green"  />
          </div>

          {/* Task risk cards */}
          {(data.taskRisks || []).length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30 text-green-500" />
              <p className="text-sm">No active tasks with deadlines.</p>
              <p className="text-xs mt-1">All clear! ✅</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.taskRisks.map((risk, i) => (
                <RiskCard key={risk.taskId || i} risk={risk} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGER: team risk ────────────────────────────────────────────────── */}
      {isManager && view === 'team' && data && (
        <div className="space-y-5">
          {/* Team stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Avg Risk Score" value={data.teamAvgRiskScore} color="blue"   />
            <StatCard label="Critical"        value={data.criticalTaskCount} color="red"    />
            <StatCard label="High Risk"       value={data.highRiskTaskCount} color="orange" />
            <StatCard label="Medium"          value={data.mediumRiskTaskCount}color="amber" />
            <StatCard label="Low Risk"        value={data.lowRiskTaskCount}  color="green"  />
          </div>

          {/* Overview row: distribution + at-risk employees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Risk Distribution
              </p>
              <RiskDistributionChart data={data} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                At-Risk Employees
              </p>
              <AtRiskEmployeeWidget
                employeeRisks={data.employeeRisks || []}
                onViewAll={() => {}}
              />
            </div>
          </div>

          {/* Critical tasks */}
          {(data.criticalList || data.criticalTasks || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 p-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={12} /> Critical Tasks — Immediate Action Required
              </p>
              <CriticalTaskWidget
                tasks={data.criticalList || data.criticalTasks || []}
                onViewAll={() => {}}
              />
            </div>
          )}

          {/* Per-employee breakdown */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Employee Risk Breakdown — sorted by avg risk score
            </p>
            <div className="space-y-3">
              {(data.employeeRisks || []).map((emp, i) => (
                <motion.div
                  key={emp.employeeId || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 p-4"
                >
                  {/* Employee header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {(emp.employeeName || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{emp.employeeName}</p>
                        <p className="text-xs text-slate-400">{emp.department || '—'}</p>
                      </div>
                    </div>
                    <RiskBadge level={emp.overallRiskLevel} score={emp.avgRiskScore} />
                  </div>

                  {/* Task chips */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {emp.criticalTaskCount  > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{emp.criticalTaskCount} Critical</span>}
                    {emp.highRiskTaskCount  > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{emp.highRiskTaskCount} High</span>}
                    {emp.mediumRiskTaskCount> 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{emp.mediumRiskTaskCount} Medium</span>}
                    {emp.lowRiskTaskCount   > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{emp.lowRiskTaskCount} Low</span>}
                  </div>

                  {/* Top 2 risky tasks compact */}
                  {(emp.taskRisks || []).slice(0, 2).map((risk, j) => (
                    <RiskCard key={risk.taskId || j} risk={risk} index={j} compact />
                  ))}

                  {(emp.taskRisks || []).length > 2 && (
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      +{emp.taskRisks.length - 2} more tasks
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAnalyticsPage;