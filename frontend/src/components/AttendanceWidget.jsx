import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clockIn, clockOut, getMySummary } from '../services/attendanceService';
import {
  Clock, LogIn, LogOut, CheckCircle, AlertCircle,
  Calendar, TrendingUp, Timer
} from 'lucide-react';

const statusConfig = {
  PRESENT:  { label: 'Present',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LATE:     { label: 'Late',     bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  HALF_DAY: { label: 'Half Day', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
  ABSENT:   { label: 'Absent',   bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400'     },
};

const AttendanceWidget = () => {
  const now  = new Date();
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [liveTime, setLiveTime] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      const data = await getMySummary(now.getMonth() + 1, now.getFullYear());
      setSummary(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live clock when clocked in
  useEffect(() => {
    if (summary?.todayStatus !== 'CLOCKED_IN' || !summary?.clockInTime) return;
    const tick = () => {
      // Parse clockInTime from backend (e.g. "09:15 AM")
      const parts = summary.clockInTime.match(/(\d+):(\d+)\s(AM|PM)/);
      if (!parts) return;
      let h = parseInt(parts[1]);
      const m = parseInt(parts[2]);
      const ampm = parts[3];
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const clockedInMs = new Date();
      clockedInMs.setHours(h, m, 0, 0);
      const diff = Date.now() - clockedInMs.getTime();
      if (diff < 0) return;
      const hrs = Math.floor(diff / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setLiveTime(`${hrs}h ${String(min).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [summary?.todayStatus, summary?.clockInTime]);

  const handleClockIn = async () => {
    setActing(true);
    try {
      await clockIn();
      showToast('Clocked in successfully! Have a productive day.', 'success');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock-in failed.', 'error');
    } finally { setActing(false); }
  };

  const handleClockOut = async () => {
    setActing(true);
    try {
      await clockOut();
      showToast('Clocked out successfully. Great work today!', 'success');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock-out failed.', 'error');
    } finally { setActing(false); }
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="h-3 bg-slate-100 rounded w-32 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
      </div>
    </div>
  );

  const isClockedIn  = summary?.todayStatus === 'CLOCKED_IN';
  const isClockedOut = summary?.todayStatus === 'CLOCKED_OUT';
  const notMarked    = summary?.todayStatus === 'NOT_MARKED';
  const statusLabel  = isClockedIn ? 'PRESENT' : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium
              ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Attendance Tracker</p>
            <p className="text-[10px] text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'short' })}</p>
          </div>
        </div>

        {/* Status pill */}
        {isClockedIn && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
        {isClockedOut && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            <CheckCircle size={11} /> Done
          </span>
        )}
      </div>

      {/* Live timer when clocked in */}
      {isClockedIn && liveTime && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-4 text-white text-center"
        >
          <p className="text-xs text-blue-200 mb-0.5">Time Worked Today</p>
          <p className="text-2xl font-bold font-mono tracking-wider">{liveTime}</p>
          <p className="text-xs text-blue-200 mt-0.5">Clocked in at {summary.clockInTime}</p>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">This Month</p>
          <p className="text-base font-bold text-slate-800">{summary?.attendanceRate?.toFixed(1) ?? 0}%</p>
          <p className="text-[10px] text-slate-500">Attendance rate</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Days Present</p>
          <p className="text-base font-bold text-slate-800">
            {(summary?.presentDays ?? 0) + (summary?.lateDays ?? 0)}
            <span className="text-xs text-slate-400 font-normal"> / {summary?.totalWorkingDays ?? 0}</span>
          </p>
          <p className="text-[10px] text-slate-500">Working days</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Hours Logged</p>
          <p className="text-base font-bold text-slate-800">{summary?.totalHoursWorked?.toFixed(1) ?? 0}h</p>
          <p className="text-[10px] text-slate-500">of {summary?.expectedHours ?? 0}h expected</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Late Days</p>
          <p className="text-base font-bold text-amber-600">{summary?.lateDays ?? 0}</p>
          <p className="text-[10px] text-slate-500">this month</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {notMarked && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClockIn}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            <LogIn size={15} />
            {acting ? 'Clocking in…' : 'Clock In'}
          </motion.button>
        )}

        {isClockedIn && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClockOut}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            <LogOut size={15} />
            {acting ? 'Clocking out…' : 'Clock Out'}
          </motion.button>
        )}

        {isClockedOut && (
          <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-2.5 rounded-xl text-sm">
            <CheckCircle size={15} />
            Attendance Marked
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceWidget;