// src/components/ResumeTaskModal.jsx
// Feature 2: Modal for resuming a paused task with optional delay justification

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, PlayCircle, Clock, Info } from 'lucide-react';
import { resumeTask } from '../services/reportService';
import { useAuth } from '../context/AuthContext';

const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

/**
 * ResumeTaskModal
 * Props:
 *   interruption : TaskInterruptionResponse — the active pause record
 *   onClose      : () => void
 *   onSuccess    : () => void
 */
const ResumeTaskModal = ({ interruption, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate how long the task has been paused
  const pausedSince = interruption?.pausedAt
    ? new Date(interruption.pausedAt)
    : null;
  const hoursAgo = pausedSince
    ? Math.round((Date.now() - pausedSince.getTime()) / 3600000)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await resumeTask(interruption.taskId, {
        employeeId: user.id,
        resumeNote: note.trim() || null,
        delayJustification: justification.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resume task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <PlayCircle size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Resume Task</h2>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">
                {interruption?.taskTitle || `Task #${interruption?.taskId}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Pause summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock size={12} className="text-amber-500" />
            <span>
              Paused {hoursAgo != null ? `${hoursAgo}h ago` : 'earlier'}
              {pausedSince ? ` · ${pausedSince.toLocaleString()}` : ''}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <Info size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-semibold">Pause reason:</span> {interruption?.pauseReason}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resume note */}
          <div>
            <label className={labelCls}>Resume Note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Hotfix deployed — resuming login module work…"
            />
          </div>

          {/* Delay justification */}
          <div>
            <label className={labelCls}>
              Delay Justification
              <span className="ml-1 text-slate-400 font-normal">(if deadline was/will be missed)</span>
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Task was paused for 2 days due to urgent P0 hotfix assigned by manager. Original deadline was unreachable as a result."
            />
            <p className="text-[10px] text-slate-400 mt-1">
              This justification is visible to your manager and used by the productivity engine
              to avoid unfair deadline penalties.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <PlayCircle size={14} />
              {submitting ? 'Resuming…' : 'Resume Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ResumeTaskModal;