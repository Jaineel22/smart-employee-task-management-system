import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReportsByUser, getAllReports, createReport, deleteReport } from '../services/reportService';
import Loader from '../components/Loader';
import { Plus, X, FileText, Trash2 } from 'lucide-react';

const emptyForm = {
  workDescription: '', hoursWorked: '', completionPercentage: 0, reportDate: '', taskId: '',
};

const ReportsPage = () => {
  const { user }                  = useAuth();
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = isAdminOrManager ? await getAllReports() : await getReportsByUser(user.id);
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.taskId)          { setError('Task ID is required.');        return; }
    if (!form.workDescription.trim()) { setError('Description is required.'); return; }
    if (!form.hoursWorked)     { setError('Hours worked is required.');   return; }
    if (!form.reportDate)      { setError('Report date is required.');    return; }

    setSubmitting(true);
    try {
      await createReport({
        workDescription:      form.workDescription,
        hoursWorked:          Number(form.hoursWorked),
        completionPercentage: Number(form.completionPercentage),
        reportDate:           form.reportDate,
        userId:               user.id,
        taskId:               Number(form.taskId),
      });
      showToast('Report submitted successfully.');
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
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  const getTaskLabel = (r) => {
    if (!r.task) return `Task #${r.taskId || '—'}`;
    return r.task.title || `Task #${r.task.id}`;
  };

  const formatDate = (val) => {
    if (!val) return '—';
    if (Array.isArray(val)) { const [y, mo, d] = val; return `${d}/${mo}/${y}`; }
    return val;
  };

  if (loading) return <Loader />;

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Daily Work Reports</h1>
          <p className="text-sm text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> Submit Report
        </button>
      </div>

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {reports.length === 0 && !error ? (
        <p className="text-center py-16 text-gray-400 text-sm">No reports submitted yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative group">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-xl flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{getTaskLabel(r)}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.reportDate)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3 line-clamp-3">{r.workDescription}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{r.hoursWorked}h worked</span>
                <span className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                  {r.completionPercentage}% done
                </span>
              </div>

              {/* Delete button — visible on hover */}
              <button
                onClick={() => handleDelete(r.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1"
                title="Delete report"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Submit Work Report</h2>
              <button onClick={() => { setShowModal(false); setError(''); }}
                className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Task ID *</label>
                <input
                  type="number"
                  value={form.taskId}
                  onChange={(e) => setForm((p) => ({ ...p, taskId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Work Description *</label>
                <textarea
                  rows={3}
                  value={form.workDescription}
                  onChange={(e) => setForm((p) => ({ ...p, workDescription: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What did you work on today?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.hoursWorked}
                    onChange={(e) => setForm((p) => ({ ...p, hoursWorked: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Report Date *</label>
                  <input
                    type="date"
                    value={form.reportDate}
                    onChange={(e) => setForm((p) => ({ ...p, reportDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Completion: {form.completionPercentage}%
                </label>
                <input
                  type="range" min={0} max={100}
                  value={form.completionPercentage}
                  onChange={(e) => setForm((p) => ({ ...p, completionPercentage: e.target.value }))}
                  className="w-full accent-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;