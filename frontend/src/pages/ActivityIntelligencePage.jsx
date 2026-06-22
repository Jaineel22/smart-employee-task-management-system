import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, RefreshCw, Search, AlertCircle, Code2,
  CheckSquare, CalendarDays, Clock, ChevronDown, ChevronUp,
  Lightbulb, Users,
} from 'lucide-react';
import { getAllActivityReports, getActivityReportsByDate } from '../services/reportService';
import Loader from '../components/Loader';
import ActivityDetailsCard from '../components/ActivityDetailsCard';
import { useAuth } from '../context/AuthContext';

const today = new Date().toISOString().split('T')[0];

const ActivityIntelligencePage = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(today);
  const [filterMode, setFilterMode] = useState('today'); // 'today' | 'all'

  const fetchReports = useCallback(async () => {
    console.log("🔵 fetchReports called - filterMode:", filterMode, "dateFilter:", dateFilter);
    console.log("👤 User role:", user?.role, "isManager:", isManager);
    
    setLoading(true);
    setError('');
    
    // Check if user has manager access
    if (!isManager) {
      console.error("❌ User does not have manager access");
      setError('Access denied. Manager role required.');
      setLoading(false);
      return;
    }
    
    try {
      let data;
      if (filterMode === 'today' && dateFilter) {
        console.log("📤 Calling getActivityReportsByDate with:", dateFilter);
        data = await getActivityReportsByDate(dateFilter);
      } else {
        console.log("📤 Calling getAllActivityReports");
        data = await getAllActivityReports();
      }
      console.log("✅ Received data:", data);
      console.log("📊 Data count:", data?.length || 0);
      setReports(data || []);
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
      console.error("Error details:", err.response?.data, err.message);
      setError(err.response?.data?.message || 'Failed to load activity reports.');
    } finally {
      setLoading(false);
    }
  }, [filterMode, dateFilter, user, isManager]);

  useEffect(() => {
    console.log("🟢 ActivityIntelligencePage mounted");
    if (user) {
      fetchReports();
    } else {
      console.log("⏳ Waiting for user to load...");
    }
  }, [fetchReports, user]);

  // Client-side search
  const filtered = reports.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.employeeName?.toLowerCase().includes(q) ||
      r.taskWorkedOn?.toLowerCase().includes(q) ||
      r.taskTitle?.toLowerCase().includes(q) ||
      r.technologiesUsed?.toLowerCase().includes(q) ||
      r.detailedWorkSummary?.toLowerCase().includes(q)
    );
  });

  const blockersCount = filtered.filter(r => r.hasBlockers).length;
  const totalHours = filtered.reduce((s, r) => s + (r.hoursWorked || 0), 0);

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Activity Intelligence</h1>
              <p className="text-xs text-violet-200">Detailed employee work intelligence dashboard</p>
            </div>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Role warning */}
        {!isManager && (
          <div className="mt-4 bg-amber-500/30 border border-amber-400 rounded-xl p-3">
            <p className="text-xs text-white font-medium">
              ⚠️ Manager access required. Activity Intelligence is only available for managers.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <div className="flex gap-1">
            {[
              { key: 'today', label: "Today's Reports" },
              { key: 'all', label: 'All Reports' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterMode(key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterMode === key
                    ? 'bg-white text-violet-700 shadow'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {filterMode === 'today' && (
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="text-xs bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Reports', value: filtered.length, color: 'bg-violet-50 text-violet-700' },
          { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: 'bg-blue-50 text-blue-700' },
          { label: 'With Blockers', value: blockersCount, color: 'bg-amber-50 text-amber-700' },
          { label: 'Employees', value: new Set(filtered.map(r => r.employeeId)).size, color: 'bg-green-50 text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-xs font-semibold opacity-70">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by employee, task, or technology…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Reports grid */}
      {filtered.length === 0 && !error && !loading ? (
        <div className="text-center py-16 text-slate-400">
          <Activity size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No activity reports found for this selection.</p>
          <p className="text-xs mt-1">Try submitting a report with detailed activity information.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((report, i) => (
            <ActivityDetailsCard key={report.reportId || i} report={report} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityIntelligencePage;