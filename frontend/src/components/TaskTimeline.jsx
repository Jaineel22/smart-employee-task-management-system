// src/components/TaskTimeline.jsx
// Feature 2: Visual timeline of a task's interruption history

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, CheckCircle, Clock, Circle,
  AlertTriangle, RotateCcw,
} from 'lucide-react';
import { getTaskInterruptions } from '../services/reportService';

// ── Timeline event types ──────────────────────────────────────────────────────
const EVENT_CONFIG = {
  STARTED:  { icon: Play,        color: 'text-blue-600',  bg: 'bg-blue-100',   dot: 'bg-blue-500',   label: 'Started'  },
  PAUSED:   { icon: Pause,       color: 'text-amber-600', bg: 'bg-amber-100',  dot: 'bg-amber-500',  label: 'Paused'   },
  RESUMED:  { icon: RotateCcw,   color: 'text-green-600', bg: 'bg-green-100',  dot: 'bg-green-500',  label: 'Resumed'  },
  BLOCKED:  { icon: AlertTriangle,color:'text-red-600',   bg: 'bg-red-100',    dot: 'bg-red-500',    label: 'Blocked'  },
  COMPLETED:{ icon: CheckCircle, color: 'text-emerald-600',bg:'bg-emerald-100',dot:'bg-emerald-500', label: 'Completed'},
  CURRENT:  { icon: Circle,      color: 'text-slate-400', bg: 'bg-slate-100',  dot: 'bg-slate-300',  label: 'Current'  },
};

const fmtDateTime = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleString(); } catch { return v; }
};

const fmtHours = (h) => {
  if (h == null) return null;
  if (h === 0)   return '<1h';
  if (h < 24)    return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

/**
 * TaskTimeline
 * Props:
 *   taskId    : number
 *   taskStatus: string  (PENDING | IN_PROGRESS | PAUSED | COMPLETED | …)
 *   createdAt : string  (ISO date — task creation)
 *   completedAt: string | null
 */
const TaskTimeline = ({ taskId, taskStatus, createdAt, completedAt }) => {
  const [interruptions, setInterruptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    getTaskInterruptions(taskId)
      .then(setInterruptions)
      .catch(() => setError('Failed to load timeline.'))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/3 mb-1" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }

  // Build timeline events
  const events = [];

  // 1. Task created/started
  if (createdAt) {
    events.push({ type: 'STARTED', time: createdAt, text: 'Task created and assigned' });
  }

  // 2. Each interruption: pause → resume pairs
  interruptions.forEach((intr) => {
    events.push({
      type: 'PAUSED',
      time: intr.pausedAt,
      text: intr.pauseReason,
      extra: null,
    });
    if (intr.resumedAt) {
      events.push({
        type: 'RESUMED',
        time: intr.resumedAt,
        text: intr.resumeNote || 'Task resumed',
        extra: fmtHours(intr.interruptionDurationHours)
          ? `Paused for ${fmtHours(intr.interruptionDurationHours)}`
          : null,
        justification: intr.delayJustification,
      });
    }
  });

  // 3. Completion
  if (taskStatus === 'COMPLETED' && completedAt) {
    events.push({ type: 'COMPLETED', time: completedAt, text: 'Task completed' });
  } else if (taskStatus === 'PAUSED') {
    events.push({ type: 'CURRENT', time: null, text: 'Currently paused' });
  } else if (taskStatus === 'BLOCKED') {
    events.push({ type: 'BLOCKED', time: null, text: 'Currently blocked' });
  } else {
    events.push({ type: 'CURRENT', time: null, text: 'In progress' });
  }

  // Sort by time (events without time go last)
  events.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time) - new Date(b.time);
  });

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-3 bottom-3 w-px bg-slate-100" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.CURRENT;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 relative"
            >
              {/* Icon dot */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${cfg.bg}`}>
                <Icon size={12} className={cfg.color} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                  {event.time && (
                    <span className="text-[10px] text-slate-400">{fmtDateTime(event.time)}</span>
                  )}
                  {event.extra && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {event.extra}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{event.text}</p>

                {/* Delay justification inline */}
                {event.justification && (
                  <div className="mt-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                    <p className="text-[10px] font-bold text-blue-700 mb-0.5">Delay Justification</p>
                    <p className="text-xs text-blue-700">{event.justification}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">No timeline events yet.</p>
      )}
    </div>
  );
};

export default TaskTimeline;