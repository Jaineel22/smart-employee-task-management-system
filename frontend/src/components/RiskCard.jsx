// src/components/RiskCard.jsx
// AI-6: Single task deadline risk card

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckSquare, TrendingUp } from 'lucide-react';

// ── Risk level config ─────────────────────────────────────────────────────────
const RISK_CONFIG = {
  CRITICAL: {
    bg: 'bg-red-50',    border: 'border-red-200',
    badge: 'bg-red-600 text-white',
    bar:   'bg-red-500',
    text:  'text-red-700',
    icon:  AlertTriangle,
  },
  HIGH: {
    bg: 'bg-orange-50', border: 'border-orange-200',
    badge: 'bg-orange-500 text-white',
    bar:   'bg-orange-500',
    text:  'text-orange-700',
    icon:  AlertTriangle,
  },
  MEDIUM: {
    bg: 'bg-amber-50',  border: 'border-amber-200',
    badge: 'bg-amber-500 text-white',
    bar:   'bg-amber-400',
    text:  'text-amber-700',
    icon:  Clock,
  },
  LOW: {
    bg: 'bg-green-50',  border: 'border-green-200',
    badge: 'bg-green-600 text-white',
    bar:   'bg-green-500',
    text:  'text-green-700',
    icon:  CheckSquare,
  },
};

const DEFAULT_CFG = RISK_CONFIG.LOW;

const RiskCard = ({ risk, index = 0, compact = false }) => {
  if (!risk) return null;

  const {
    taskTitle, riskScore, riskLevel, confidence,
    daysRemaining, completionPercentage, priority,
    reasons = [], recommendations = [],
  } = risk;

  const cfg  = RISK_CONFIG[riskLevel] || DEFAULT_CFG;
  const Icon = cfg.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 }}
        className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}
      >
        <Icon size={14} className={cfg.text} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{taskTitle || 'Untitled Task'}</p>
          <p className="text-[10px] text-slate-400">
            {daysRemaining != null
              ? daysRemaining < 0
                ? `${Math.abs(daysRemaining)}d overdue`
                : daysRemaining === 0
                  ? 'Due today'
                  : `${daysRemaining}d remaining`
              : 'No deadline'
            }
            {' · '}{completionPercentage ?? 0}% done
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {riskLevel}
        </span>
        <span className="text-sm font-black text-slate-700">{riskScore}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className={cfg.text} />
          <p className="text-sm font-bold text-slate-800 leading-tight">
            {taskTitle || 'Untitled Task'}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
          {riskLevel}
        </span>
      </div>

      {/* Risk score bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-500 font-medium">Risk Score</span>
          <span className="font-black text-slate-700">{riskScore} / 100</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${riskScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${cfg.bar}`}
          />
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {priority && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
            {priority} priority
          </span>
        )}
        {daysRemaining != null && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            daysRemaining < 0 ? 'bg-red-100 text-red-700' :
            daysRemaining === 0 ? 'bg-orange-100 text-orange-700' :
            'bg-white border border-slate-200 text-slate-600'
          }`}>
            {daysRemaining < 0
              ? `${Math.abs(daysRemaining)}d overdue`
              : daysRemaining === 0
                ? 'Due today'
                : `${daysRemaining}d left`}
          </span>
        )}
        {completionPercentage != null && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
            {completionPercentage}% done
          </span>
        )}
        {confidence != null && (
          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5">
            Confidence: {confidence}%
          </span>
        )}
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Risk Signals
          </p>
          <ul className="space-y-0.5">
            {reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex gap-1.5 items-start">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.bar}`} />
                <span className="text-[11px] text-slate-600">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Actions
          </p>
          <ul className="space-y-0.5">
            {recommendations.slice(0, 2).map((r, i) => (
              <li key={i} className="flex gap-1.5 items-start">
                <TrendingUp size={10} className="text-blue-500 mt-1 flex-shrink-0" />
                <span className="text-[11px] text-slate-600">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default RiskCard;