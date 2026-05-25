import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllTasks, getTasksByEmployee, updateTaskProgress } from '../services/taskService';
import TaskCard from '../components/TaskCard';
import Loader from '../components/Loader';
import { X } from 'lucide-react';

const TasksPage = () => {
  const { user }              = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selected, setSelected]   = useState(null);
  const [progress, setProgress]   = useState({ taskStatus: '', completionPercentage: 0 });
  const [saving, setSaving]       = useState(false);

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = isAdminOrManager
        ? await getAllTasks()
        : await getTasksByEmployee(user.id);
      setTasks(data);
    } catch (err) {
      console.error('Tasks error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const openProgress = (task) => {
    setSelected(task);
    setProgress({
      taskStatus: task.status,
      completionPercentage: task.completionPercentage ?? 0,
    });
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await updateTaskProgress(selected.id, progress);
      setSelected(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update progress.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Tasks</h1>
        <p className="text-sm text-gray-500">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {tasks.length === 0 && !error ? (
        <p className="text-center py-16 text-gray-400 text-sm">No tasks assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateProgress={openProgress}
            />
          ))}
        </div>
      )}

      {/* Progress Update Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Update Progress</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 truncate">{selected.title}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                <select
                  value={progress.taskStatus}
                  onChange={(e) => setProgress((p) => ({ ...p, taskStatus: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Completion: {progress.completionPercentage}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress.completionPercentage}
                  onChange={(e) =>
                    setProgress((p) => ({ ...p, completionPercentage: Number(e.target.value) }))
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <button
                onClick={handleSaveProgress}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving…' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;