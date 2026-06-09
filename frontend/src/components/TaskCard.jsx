// src/components/TaskCard.jsx
// Extended with Feature 2: Pause / Resume / Blocked status display + action buttons.
// All existing props and behaviour preserved exactly.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Flag, User, FolderOpen, PauseCircle, PlayCircle, AlertTriangle } from 'lucide-react';
import PauseTaskModal  from './PauseTaskModal';
import ResumeTaskModal from './ResumeTaskModal';
import { getMyPausedTasks } from '../services/reportService';
import { useAuth } from '../context/AuthContext';

// ── Status config — extended with PAUSED, RESUMED, BLOCKED ───────────────────
const statusConfig = {
  PENDING:     { label: 'Pending',     bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  COMPLETED:   { label: 'Completed',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  OVERDUE:     { label: 'Overdue',     bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
  // ── NEW ──────────────────────────────────────────────────────────────────
  PAUSED:      { label: 'Paused',      bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  RESUMED:     { label: 'Resumed',     bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  BLOCKED:     { label: 'Blocked',     bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
};

const priorityConfig = {
  LOW:    { label: 'Low',    color: 'text-slate-500', bg: 'bg-slate-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600',  bg: 'bg-blue-50'   },
  HIGH:   { label: 'High',   color: 'text-orange-600', bg: 'bg-orange-50' },
  URGENT: { label: 'Urgent', color: 'text-red-600',   bg: 'bg-red-50'    },
};

const getUrgency = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  const days  = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (diff < 0)    return { label: 'Overdue',    cls: 'text-red-600 bg-red-50 border-red-200'       };
  if (days === 0)  return { label: 'Due today',  cls: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (days <= 2)   return { label: `${days}d left`, cls: 'text-orange-500 bg-orange-50 border-orange-100' };
  return { label: `${days}d left`, cls: 'text-slate-500 bg-slate-50 border-slate-200' };
};

/**
 * TaskCard
 * Props (existing, all preserved):
 *   task             : Task object
 *   onUpdateProgress : (task) => void   — existing update handler
 *
 * New optional props:
 *   showPauseResume  : bool  — show Pause/Resume buttons (default true for employees)
 *   onInterrupted    : () => void — called after pause/resume to refresh parent
 */
const TaskCard = ({ task, onUpdateProgress, showPauseResume = true, onInterrupted }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [showPauseModal,  setShowPauseModal]  = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [activeIntr,      setActiveIntr]      = useState(null); // for resume

  const st  = statusConfig[task.status]       || statusConfig.PENDING;
  const pri = priorityConfig[task.priority]   || priorityConfig.MEDIUM;
  const urg = getUrgency(task.deadline);
  const pct = task.completionPercentage ?? 0;

  const isPaused    = task.status === 'PAUSED';
  const isBlocked   = task.status === 'BLOCKED';
  const canPause    = !isManager && showPauseResume && task.status === 'IN_PROGRESS';
  const canResume   = !isManager && showPauseResume && isPaused;

  const handleResumeClick = async () => {
    try {
      // Fetch the active interruption so the modal knows what to resume
      const paused = await getMyPausedTasks();
      const match  = paused.find(p => p.taskId === task.id);
      setActiveIntr(match || { taskId: task.id, taskTitle: task.title, pauseReason: 'Previous pause' });
    } catch (err) {
      setActiveIntr({ taskId: task.id, taskTitle: task.title, pauseReason: 'Previous pause' });
    }
    setShowResumeModal(true);
  };

  const handleSuccess = () => {
    setShowPauseModal(false);
    setShowResumeModal(false);
    setActiveIntr(null);
    onInterrupted?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        transition={{ duration: 0.18 }}
        className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 ${
          isPaused  ? 'border-amber-200' :
          isBlocked ? 'border-red-200'   :
          'border-slate-100'
        }`}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{task.title}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${pri.bg} ${pri.color}`}>
            <Flag size={10} className="inline mr-0.5" />{pri.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-xs text-slate-500">
          {(task.project?.name || task.projectName) && (
            <span className="flex items-center gap-1.5">
              <FolderOpen size={12} className="text-slate-400" />
              {task.project?.name || task.projectName}
            </span>
          )}
          {task.assignedTo?.fullName && (
            <span className="flex items-center gap-1.5">
              <User size={12} className="text-slate-400" />
              {task.assignedTo.fullName}
            </span>
          )}
          {urg && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium w-fit ${urg.cls}`}>
              <CalendarClock size={11} />
              {urg.label}
            </span>
          )}
        </div>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit ${st.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${isPaused ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-semibold ${st.text}`}>{st.label}</span>
        </div>

        {/* Pause reason pill (shown when paused) */}
        {isPaused && task.pauseReason && (
          <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5">
            <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 leading-relaxed">{task.pauseReason}</p>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="font-semibold text-slate-600">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                pct === 100     ? 'bg-emerald-500' :
                isPaused        ? 'bg-amber-400'   :
                isBlocked       ? 'bg-red-400'     :
                'bg-blue-500'
              }`}
            />
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2 flex-wrap">
          {/* Existing update progress button */}
          {onUpdateProgress && !isPaused && !isBlocked && (
            <button
              onClick={() => onUpdateProgress(task)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Update Progress →
            </button>
          )}

          {/* NEW: Pause button */}
          {canPause && (
            <button
              onClick={() => setShowPauseModal(true)}
              className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 ml-auto"
            >
              <PauseCircle size={13} /> Pause
            </button>
          )}

          {/* NEW: Resume button */}
          {canResume && (
            <button
              onClick={handleResumeClick}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white ml-auto transition-colors"
            >
              <PlayCircle size={13} /> Resume
            </button>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showPauseModal && (
          <PauseTaskModal
            task={task}
            onClose={() => setShowPauseModal(false)}
            onSuccess={handleSuccess}
          />
        )}
        {showResumeModal && activeIntr && (
          <ResumeTaskModal
            interruption={activeIntr}
            onClose={() => setShowResumeModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TaskCard;