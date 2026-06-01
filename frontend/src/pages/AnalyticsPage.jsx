import { useEffect, useState } from 'react';
import { getTeamAnalytics, getEmployeeProductivity } from '../services/productivityService';
import { ProductivityBreakdown, TrendBadge, statusConfig } from '../components/ProductivityScore';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, CheckSquare, TrendingUp, Award, AlertTriangle, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';

/* ── Month/Year selector ────────────────────────────────── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const MonthYearPicker = ({ month, year, onChange }) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={e => onChange(Number(e.target.value), year)}
        className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
      >
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select
        value={year}
        onChange={e => onChange(month, Number(e.target.value))}
        className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
};

/* ── Score badge ────────────────────────────────────────── */
const ScoreBadge = ({ score, status }) => {
  const cfg = statusConfig[status] || statusConfig['Good'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      {score?.toFixed(1)}%
    </span>
  );
};

/* ── Employee detail modal ──────────────────────────────── */
const EmployeeModal = ({ employee, month, year, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    getEmployeeProductivity(employee.employeeId, month, year)
      .then(setDetail)
      .catch(() => setDetail(employee))   // fallback to table data
      .finally(() => setLoading(false));
  }, [employee, month, year]);

  if (!employee) return null;

  const radarData = detail ? [
    { metric: 'Hours',    score: detail.hoursScore          || 0 },
    { metric: 'Completion',score: detail.taskCompletionScore || 0 },
    { metric: 'Progress', score: detail.avgProgressScore    || 0 },
    { metric: 'Deadline', score: detail.deadlineDisciplineScore || 0 },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">Employee Analytics</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <ProductivityBreakdown data={detail || employee} />

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Performance Radar</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ── MAIN PAGE ──────────────────────────────────────────── */
const AnalyticsPage = () => {
  const now = new Date();
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [year, setYear]         = useState(now.getFullYear());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await getTeamAnalytics(month, year)); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load analytics.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleMonthChange = (m, y) => { setMonth(m); setYear(y); };

  const employees = data?.employees || [];
  const filtered  = employees.filter(e =>
    !search ||
    e.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  // Bar chart data
  const barData = filtered.slice(0, 12).map(e => ({
    name:  e.employeeName?.split(' ')[0] || 'Employee',
    score: e.productivityScore || 0,
    fill:  (statusConfig[e.performanceStatus] || statusConfig['Good']).bar.replace('bg-','').replace('-500',''),
  }));

  const barColors = filtered.slice(0, 12).map(e => {
    const s = e.performanceStatus;
    if (s === 'Outstanding')       return '#10b981';
    if (s === 'Excellent')         return '#3b82f6';
    if (s === 'Good')              return '#06b6d4'; 
    if (s === 'Needs Improvement') return '#f59e0b';
    return '#ef4444';
  });

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Team Analytics</h1>
          <p className="text-xs text-slate-500">
            Monthly productivity scores — {data?.month} {data?.year}
          </p>
        </div>
        <MonthYearPicker month={month} year={year} onChange={handleMonthChange} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { icon: TrendingUp,    label: 'Team Avg',           value: `${data?.teamAvgProductivity?.toFixed(1) || 0}%`,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { icon: Award,         label: 'Best Performer',     value: data?.bestPerformerName?.split(' ')[0] || '—',       color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: AlertTriangle, label: 'Needs Attention',    value: data?.lowestPerformerName?.split(' ')[0] || '—',     color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { icon: Clock,         label: 'Hours Logged',       value: `${data?.totalHoursLogged?.toFixed(0) || 0}h`,       color: 'text-slate-600',   bg: 'bg-slate-50'   },
          { icon: CheckSquare,   label: 'Tasks Completed',    value: data?.totalTasksCompleted || 0,                      color: 'text-green-600',   bg: 'bg-green-50'   },
          { icon: Users,         label: 'Employees Tracked',  value: data?.employees?.length || 0,                        color: 'text-purple-600',  bg: 'bg-purple-50'  },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${bg} rounded-2xl p-4 flex flex-col gap-1`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={13} className={color} />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <span className={`text-lg font-bold ${color}`}>{value}</span>
          </motion.div>
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Productivity Scores</p>
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <BarChart3 size={28} className="mb-2 text-slate-300" />
              <p className="text-xs">No employee data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData.map((d, i) => ({ ...d, barColor: barColors[i] }))} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Productivity Score']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top/Bottom */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highlights</p>

          {data?.bestPerformerName && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {data.bestPerformerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{data.bestPerformerName}</p>
                <p className="text-[10px] text-slate-400">Best Performer</p>
              </div>
              <span className="text-sm font-bold text-emerald-600">{data.bestPerformerScore?.toFixed(1)}%</span>
            </div>
          )}

          {data?.lowestPerformerName && data.lowestPerformerName !== data.bestPerformerName && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {data.lowestPerformerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{data.lowestPerformerName}</p>
                <p className="text-[10px] text-slate-400">Needs Attention</p>
              </div>
              <span className="text-sm font-bold text-amber-600">{data.lowestPerformerScore?.toFixed(1)}%</span>
            </div>
          )}

          {employees.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No data for this period</p>
          )}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
          <p className="text-xs font-semibold text-slate-700">All Employees</p>
          <input
            type="text"
            placeholder="Search employee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400">
            <Users size={28} className="mb-2 text-slate-300" />
            <p className="text-xs">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Employee','Department','Assigned','Completed','Hours','Score','Status','Trend'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((emp, i) => (
                  <tr
                    key={emp.employeeId}
                    onClick={() => setSelected(emp)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {emp.employeeName?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold text-slate-800 whitespace-nowrap">{emp.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{emp.department || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-center">{emp.totalTasksAssigned}</td>
                    <td className="px-4 py-3 text-slate-600 text-center">{emp.totalTasksCompleted}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{emp.hoursWorked}h</td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={emp.productivityScore} status={emp.performanceStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${(statusConfig[emp.performanceStatus] || statusConfig['Good']).color}`}>
                        {emp.performanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TrendBadge delta={emp.trendDelta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee detail modal */}
      <AnimatePresence>
        {selected && (
          <EmployeeModal
            employee={selected}
            month={month}
            year={year}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsPage;   