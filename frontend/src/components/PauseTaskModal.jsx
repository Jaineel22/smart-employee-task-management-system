// src/components/PauseTaskModal.jsx
// Feature 2: Modal for pausing a task with mandatory reason

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PauseCircle, AlertCircle } from 'lucide-react';
import { pauseTask } from '../services/reportService';
import { useAuth } from '../context/AuthContext';

const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white';

/**
 * PauseTaskModal
 * Props:
 *   task      : { id, title }  — task to pause
 *   onClose   : () => void
 *   onSuccess : () => void     — called after successful pause
 */
const PauseTaskModal = ({ task, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const QUICK_REASONS = [
    'Urgent production bug assigned by manager',
    'Higher-priority task assigned',
    'Waiting for design approval',
    'Blocked by external dependency',
    'Team meeting / sprint planning',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Pause reason is mandatory.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await pauseTask(task.id, { employeeId: user.id, pauseReason: reason.trim() });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pause task. Please try again.');
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
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <PauseCircle size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pause Task</h2>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">{task?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Pausing this task will record the interruption. Provide a clear reason so your
            manager understands any deadline delays.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick reason selection */}
          <div>
            <label className={labelCls}>Quick Select Reason</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    reason === r
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div>
            <label className={labelCls}>Pause Reason *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Urgent production bug P0-123 assigned by manager — needs immediate attention…"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {reason.trim().length}/500 characters
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
              disabled={submitting || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <PauseCircle size={14} />
              {submitting ? 'Pausing…' : 'Pause Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PauseTaskModal;