// src/components/DelayJustificationModal.jsx
// Feature 2: Standalone modal to add/view delay justification for a task

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Clock, AlertTriangle } from 'lucide-react';
import { getTaskInterruptions } from '../services/reportService';

const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

/**
 * DelayJustificationModal
 * Read-only view of all interruptions + delay justifications for a task.
 * Used by managers to review why a task missed its deadline.
 *
 * Props:
 *   task    : { id, title }
 *   onClose : () => void
 */
const DelayJustificationModal = ({ task, onClose }) => {
  const [interruptions, setInterruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load on mount
  useEffect(() => {
    if (!task?.id) return;
    getTaskInterruptions(task.id)
      .then(setInterruptions)
      .catch(() => setError('Failed to load interruption history.'))
      .finally(() => setLoading(false));
  }, [task?.id]);

  const fmtDateTime = (v) => v ? new Date(v).toLocaleString() : '—';
  const fmtHours = (h) => h != null ? `${h}h` : '—';

  const totalPaused = interruptions.reduce((s, i) => s + (i.interruptionDurationHours || 0), 0);
  const hasJustifications = interruptions.some(i => i.delayJustification);

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Delay Justification</h2>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{task?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        {!loading && interruptions.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Interruptions', value: interruptions.length },
              { label: 'Total Paused', value: `${totalPaused}h` },
              { label: 'Justifications', value: interruptions.filter(i => i.delayJustification).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-black text-slate-800">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading history…</div>
        ) : interruptions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FileText size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No interruption records for this task.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interruptions.map((intr, i) => (
              <div
                key={intr.id || i}
                className={`rounded-xl border p-3.5 ${
                  intr.currentlyPaused
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                {/* Status + Duration */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    intr.currentlyPaused
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {intr.currentlyPaused ? 'CURRENTLY PAUSED' : 'RESUMED'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={9} /> {fmtHours(intr.interruptionDurationHours)} paused
                  </span>
                </div>

                {/* Timestamps */}
                <div className="space-y-0.5 text-xs text-slate-500 mb-2">
                  <p><span className="font-semibold">Paused:</span> {fmtDateTime(intr.pausedAt)}</p>
                  {intr.resumedAt && (
                    <p><span className="font-semibold">Resumed:</span> {fmtDateTime(intr.resumedAt)}</p>
                  )}
                </div>

                {/* Pause reason */}
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Pause Reason</p>
                  <p className="text-xs text-slate-700">{intr.pauseReason}</p>
                </div>

                {/* Resume note */}
                {intr.resumeNote && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Resume Note</p>
                    <p className="text-xs text-slate-600">{intr.resumeNote}</p>
                  </div>
                )}

                {/* Delay justification */}
                {intr.delayJustification && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                    <p className="text-[10px] font-bold text-blue-700 uppercase mb-1 flex items-center gap-1">
                      <AlertTriangle size={9} /> Delay Justification
                    </p>
                    <p className="text-xs text-blue-800">{intr.delayJustification}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DelayJustificationModal;