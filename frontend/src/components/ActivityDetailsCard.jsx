// src/components/ActivityDetailsCard.jsx
// Feature 1: Single activity report card for manager intelligence dashboard

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Code2, CheckSquare, Clock, AlertCircle,
  CalendarDays, ChevronDown, ChevronUp, Lightbulb,
} from 'lucide-react';

const TechTag = ({ label }) => (
  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
    {label}
  </span>
);

const Section = ({ icon: Icon, label, value, color = 'text-slate-500' }) => {
  if (!value) return null;
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${color}`}>
        {Icon && <Icon size={10} />} {label}
      </p>
      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
};

const ActivityDetailsCard = ({ report, index = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    employeeName, department, taskWorkedOn, taskTitle,
    detailedWorkSummary, technologiesUsed, technologyTags = [],
    completedActivities, pendingActivities, tomorrowPlan,
    blockers, hasBlockers, hoursWorked,
    completionPercentage, progressPercentage,
    reportDate, aiInsights = [],
  } = report;

  const displayTask = taskWorkedOn || taskTitle || '—';
  const displayDate = Array.isArray(reportDate)
    ? `${reportDate[2]}/${reportDate[1]}/${reportDate[0]}`
    : reportDate || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl border p-4 ${hasBlockers ? 'border-amber-200' : 'border-slate-100'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(employeeName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{employeeName || 'Unknown'}</p>
            <p className="text-xs text-slate-400">{department || '—'} · {displayDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasBlockers && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <AlertCircle size={9} /> Blocker
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            {hoursWorked}h
          </span>
        </div>
      </div>

      {/* Task worked on */}
      <div className="mb-2">
        <p className="text-xs font-bold text-slate-700 truncate">📋 {displayTask}</p>
      </div>

      {/* Summary */}
      {detailedWorkSummary && (
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">
          {detailedWorkSummary}
        </p>
      )}

      {/* Technology tags */}
      {technologyTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {technologyTags.map((t, i) => <TechTag key={i} label={t} />)}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Progress</span>
          <span className="font-bold text-slate-600">
            {progressPercentage ?? completionPercentage ?? 0}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage ?? completionPercentage ?? 0}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full bg-violet-500"
          />
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-[10px] text-violet-600 font-semibold mb-1"
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {expanded ? 'Collapse' : 'View full details'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <Section icon={CheckSquare} label="Completed Activities" value={completedActivities} color="text-green-600" />
              <Section label="Pending Activities" value={pendingActivities} color="text-orange-500" />
              <Section icon={CalendarDays} label="Tomorrow's Plan" value={tomorrowPlan} color="text-indigo-600" />

              {hasBlockers && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Blocker — Manager Action Needed
                  </p>
                  <p className="text-xs text-amber-700">{blockers}</p>
                </div>
              )}

              {/* AI Insights */}
              {aiInsights.length > 0 && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-violet-700 uppercase mb-2 flex items-center gap-1">
                    <Lightbulb size={10} /> AI Insights
                  </p>
                  <ul className="space-y-1">
                    {aiInsights.map((insight, i) => (
                      <li key={i} className="flex gap-1.5 items-start">
                        <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-violet-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityDetailsCard;