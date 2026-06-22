import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllReports, getReportsByUser, createReport, deleteReport,
} from '../services/reportService';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, FileText, Trash2, ClipboardList, Code2,
  CheckSquare, AlertCircle, CalendarDays, Lightbulb,
  Clock, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Styles ────────────────────────────────────────────────────────────────────
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const textareaCls = `${inputCls} resize-none`;

const emptyForm = {
  // existing fields
  taskId: '', hoursWorked: '', completionPercentage: 0, reportDate: '',
  workDescription: '',
  // new activity intelligence fields
  taskWorkedOn: '', detailedWorkSummary: '', technologiesUsed: '',
  completedActivities: '', pendingActivities: '', tomorrowPlan: '',
  blockers: '', progressPercentage: 0,
};

// ── Technology tag chips ──────────────────────────────────────────────────────
const TechTags = ({ value }) => {
  if (!value) return null;
  const tags = value.split(/[,;]/).map(t => t.trim()).filter(Boolean);
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map((t, i) => (
        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          {t}
        </span>
      ))}
    </div>
  );
};

// ── Report card ───────────────────────────────────────────────────────────────
const ReportCard = ({ report, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const getTaskLabel = (r) => r.task?.title || r.taskWorkedOn || `Task #${r.task?.id || '—'}`;
  const formatDate = (v) => {
    if (!v) return '—';
    if (Array.isArray(v)) { const [y, mo, d] = v; return `${d}/${mo}/${y}`; }
    return v;
  };

  const hasActivity = report.detailedWorkSummary || report.technologiesUsed ||
                      report.completedActivities || report.pendingActivities;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.07)' }}
      className="bg-white rounded-2xl border border-slate-100 p-4 relative group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-violet-100 text-violet-600 p-2 rounded-xl flex-shrink-0">
          <FileText size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{getTaskLabel(report)}</p>
          <p className="text-xs text-slate-400">{formatDate(report.reportDate)}</p>
        </div>
        {report.blockers && (
          <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Work description or summary */}
      <p className="text-xs text-slate-600 mb-2 line-clamp-2">
        {report.detailedWorkSummary || report.workDescription || '—'}
      </p>

      {/* Tech tags */}
      {report.technologiesUsed && <TechTags value={report.technologiesUsed} />}

      {/* Metrics row */}
      <div className="flex items-center justify-between text-xs mt-3">
        <span className="flex items-center gap-1 text-slate-500">
          <Clock size={11} /> {report.hoursWorked}h
        </span>
        <span className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
          {report.completionPercentage ?? report.progressPercentage ?? 0}% done
        </span>
      </div>

      {/* Expand toggle for activity details */}
      {hasActivity && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 font-semibold"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Hide details' : 'View details'}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {report.completedActivities && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Completed</p>
                  <p className="text-xs text-slate-600">{report.completedActivities}</p>
                </div>
              )}
              {report.pendingActivities && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Pending</p>
                  <p className="text-xs text-slate-600">{report.pendingActivities}</p>
                </div>
              )}
              {report.tomorrowPlan && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Tomorrow</p>
                  <p className="text-xs text-slate-600">{report.tomorrowPlan}</p>
                </div>
              )}
              {report.blockers && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">Blocker</p>
                  <p className="text-xs text-amber-700">{report.blockers}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => onDelete(report.id)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const d = isManager ? await getAllReports() : await getReportsByUser(user.id);
      setReports(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.taskId)               { setError('Task ID is required.'); return; }
    if (!form.hoursWorked)          { setError('Hours worked is required.'); return; }
    if (!form.reportDate)           { setError('Report date is required.'); return; }
    if (!form.detailedWorkSummary && !form.workDescription) {
      setError('Please describe what you worked on today.'); return;
    }

    setSubmitting(true);
    try {
      await createReport({
        userId:               user.id,
        taskId:               Number(form.taskId),
        hoursWorked:          Number(form.hoursWorked),
        completionPercentage: Number(form.completionPercentage),
        reportDate:           form.reportDate,
        // legacy field — keep for backward compat
        workDescription:      form.detailedWorkSummary || form.workDescription,
        // new activity fields
        taskWorkedOn:         form.taskWorkedOn,
        detailedWorkSummary:  form.detailedWorkSummary,
        technologiesUsed:     form.technologiesUsed,
        completedActivities:  form.completedActivities,
        pendingActivities:    form.pendingActivities,
        tomorrowPlan:         form.tomorrowPlan,
        blockers:             form.blockers,
        progressPercentage:   Number(form.progressPercentage),
      });
      showToast('Report submitted successfully!');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await deleteReport(id);
      showToast('Report deleted.');
      setReports(p => p.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Daily Work Reports</h1>
          <p className="text-xs text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
        </div>
        {!isManager && (
          <button
            onClick={() => { setShowModal(true); setError(''); }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} /> Submit Report
          </button>
        )}
      </div>

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {/* Empty state */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <ClipboardList size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No reports yet</p>
          <p className="text-xs text-slate-400 mt-1">Submit your first daily work report</p>
          {!isManager && (
            <button onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
              <Plus size={13} /> Submit Report
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map(r => (
            <ReportCard key={r.id} report={r} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* ── Submit Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Submit Work Report</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Activity Intelligence — detailed daily log</p>
                </div>
                <button onClick={() => { setShowModal(false); setError(''); }} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Row 1: Task ID + Task name ───────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Task ID *</label>
                    <input type="number" value={form.taskId} onChange={set('taskId')}
                      className={inputCls} placeholder="e.g. 3" />
                  </div>
                  <div>
                    <label className={labelCls}>Task Name</label>
                    <input type="text" value={form.taskWorkedOn} onChange={set('taskWorkedOn')}
                      className={inputCls} placeholder="Login Module" />
                  </div>
                </div>

                {/* ── Detailed work summary ──────────────────────────────── */}
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-1.5">
                      <FileText size={12} className="text-violet-500" />
                      Detailed Work Summary *
                    </span>
                  </label>
                  <textarea rows={3} value={form.detailedWorkSummary} onChange={set('detailedWorkSummary')}
                    className={textareaCls}
                    placeholder="Created responsive login page. Implemented HTML structure. Added CSS styling…" />
                </div>

                {/* ── Technologies used ──────────────────────────────────── */}
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-1.5">
                      <Code2 size={12} className="text-blue-500" />
                      Technologies Used
                    </span>
                  </label>
                  <input type="text" value={form.technologiesUsed} onChange={set('technologiesUsed')}
                    className={inputCls} placeholder="HTML5, CSS3, Bootstrap, React" />
                  {form.technologiesUsed && <TechTags value={form.technologiesUsed} />}
                </div>

                {/* ── Completed + Pending side by side ──────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>
                      <span className="flex items-center gap-1.5">
                        <CheckSquare size={12} className="text-green-500" />
                        Completed Activities
                      </span>
                    </label>
                    <textarea rows={3} value={form.completedActivities} onChange={set('completedActivities')}
                      className={textareaCls} placeholder="• UI completed&#10;• Responsive design done" />
                  </div>
                  <div>
                    <label className={labelCls}>Pending Activities</label>
                    <textarea rows={3} value={form.pendingActivities} onChange={set('pendingActivities')}
                      className={textareaCls} placeholder="• JS validation&#10;• API integration" />
                  </div>
                </div>

                {/* ── Tomorrow plan ──────────────────────────────────────── */}
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-indigo-500" />
                      Tomorrow's Plan
                    </span>
                  </label>
                  <textarea rows={2} value={form.tomorrowPlan} onChange={set('tomorrowPlan')}
                    className={textareaCls} placeholder="Implement client-side validation…" />
                </div>

                {/* ── Blockers ───────────────────────────────────────────── */}
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-amber-500" />
                      Blockers / Issues
                    </span>
                  </label>
                  <textarea rows={2} value={form.blockers} onChange={set('blockers')}
                    className={textareaCls} placeholder="None — or describe any blockers…" />
                </div>

                {/* ── Hours + Date + Completion ──────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Hours *</label>
                    <input type="number" step="0.5" min="0.5" value={form.hoursWorked}
                      onChange={set('hoursWorked')} className={inputCls} placeholder="6.5" />
                  </div>
                  <div>
                    <label className={labelCls}>Date *</label>
                    <input type="date" value={form.reportDate} onChange={set('reportDate')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Task Progress %</label>
                    <input type="number" min="0" max="100" value={form.completionPercentage}
                      onChange={set('completionPercentage')} className={inputCls} placeholder="45" />
                  </div>
                </div>

                {/* ── Session progress slider ───────────────────────────── */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={`${labelCls} mb-0`}>Session Progress</label>
                    <span className="text-xs font-bold text-blue-600">{form.progressPercentage}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={form.progressPercentage}
                    onChange={set('progressPercentage')} className="w-full accent-blue-600" />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;