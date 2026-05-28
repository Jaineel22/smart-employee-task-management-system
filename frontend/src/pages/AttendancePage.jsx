import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyHistory, getMySummary, getTeamAttendance } from '../services/attendanceService';
import AttendanceWidget from '../components/AttendanceWidget';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, CheckCircle, AlertCircle, Users,
  TrendingUp, XCircle, Timer
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const statusColors = {
  PRESENT:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE:     'bg-amber-50 text-amber-700 border-amber-200',
  HALF_DAY: 'bg-blue-50 text-blue-700 border-blue-200',
  ABSENT:   'bg-red-50 text-red-700 border-red-200',
};

const AttendancePage = () => {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year]            = useState(now.getFullYear());
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [history, setHistory]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (isManager) {
          const team = await getTeamAttendance(month, year);
          setTeamData(team);
        } else {
          const [hist, summ] = await Promise.all([
            getMyHistory(),
            getMySummary(month, year),
          ]);
          setHistory(hist);
          setSummary(summ);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load attendance data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month, year, isManager]);

  if (loading) return <Loader />;

  /* ── EMPLOYEE VIEW ──────────────────────────────────────── */
  if (!isManager) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">My Attendance</h1>
          <p className="text-xs text-slate-500">Track your working hours and attendance history</p>
        </div>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m} {year}</option>)}
        </select>
      </div>

      {/* Clock widget */}
      <AttendanceWidget />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: CheckCircle, label: 'Present', value: summary.presentDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: AlertCircle, label: 'Late',    value: summary.lateDays,    color: 'text-amber-600',  bg: 'bg-amber-50'   },
            { icon: XCircle,     label: 'Absent',  value: summary.absentDays,  color: 'text-red-600',    bg: 'bg-red-50'     },
            { icon: Timer,       label: 'Hours',   value: `${summary.totalHoursWorked?.toFixed(1)}h`, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`${bg} rounded-2xl p-4`}
            >
              <Icon size={16} className={`${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Consistency bar */}
      {summary && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-slate-600">Attendance Consistency</p>
            <span className="text-xs font-bold text-blue-600">{summary.consistencyScore?.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.consistencyScore}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className={`h-full rounded-full ${summary.consistencyScore >= 80 ? 'bg-emerald-500' : summary.consistencyScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{summary.month} {summary.year}</span>
            <span>{(summary.presentDays + summary.lateDays)} of {summary.totalWorkingDays} working days</span>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50">
          <p className="text-xs font-bold text-slate-700">Attendance History</p>
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400">
            <Calendar size={28} className="mb-2 text-slate-300" />
            <p className="text-xs">No attendance records yet. Clock in to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Date','Clock In','Clock Out','Hours','Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {new Date(record.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', weekday:'short' })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.clockInTime
                        ? new Date(record.clockInTime).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.clockOutTime
                        ? new Date(record.clockOutTime).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
                        : record.currentlyActive
                            ? <span className="text-blue-600 font-semibold animate-pulse">Active</span>
                            : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.totalHoursWorked != null ? `${record.totalHoursWorked.toFixed(1)}h` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {record.attendanceStatus ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[record.attendanceStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {record.attendanceStatus}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ── MANAGER VIEW ───────────────────────────────────────── */
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Team Attendance</h1>
          <p className="text-xs text-slate-500">Monitor team attendance and consistency</p>
        </div>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m} {year}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Today's KPI cards */}
      {teamData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,        label: 'Total Employees', value: teamData.totalEmployees,                                  color: 'text-slate-600',   bg: 'bg-slate-50'   },
            { icon: CheckCircle,  label: 'Present Today',   value: teamData.presentToday,                                    color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: AlertCircle,  label: 'Late Today',      value: teamData.lateToday,                                       color: 'text-amber-600',   bg: 'bg-amber-50'   },
            { icon: TrendingUp,   label: 'Attendance Rate', value: `${teamData.attendanceRateToday?.toFixed(1) ?? 0}%`,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
          ].map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`${bg} rounded-2xl p-4`}
            >
              <Icon size={16} className={`${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Monthly summaries table */}
      {teamData?.monthlySummaries?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-700">Monthly Summary — {MONTHS[month - 1]} {year}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Employee','Present','Late','Absent','Hours','Consistency'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamData.monthlySummaries.map((s, i) => (
                  <tr key={s.userId || i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.employeeName}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{s.presentDays}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{s.lateDays}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">{s.absentDays}</td>
                    <td className="px-4 py-3 text-slate-600">{s.totalHoursWorked?.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.consistencyScore >= 80 ? 'bg-emerald-500' : s.consistencyScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${s.consistencyScore}%` }}
                          />
                        </div>
                        <span className={`font-bold ${s.consistencyScore >= 80 ? 'text-emerald-600' : s.consistencyScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                          {s.consistencyScore?.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Today's individual records */}
      {teamData?.todayRecords?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-700">Today's Clock Records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Employee','Department','Clock In','Clock Out','Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamData.todayRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                    <td className="px-4 py-3 text-slate-500">{r.department || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.clockInTime ? new Date(r.clockInTime).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.clockOutTime
                        ? new Date(r.clockOutTime).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
                        : r.currentlyActive ? <span className="text-blue-600 font-semibold">Active</span> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.attendanceStatus && (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[r.attendanceStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {r.attendanceStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;