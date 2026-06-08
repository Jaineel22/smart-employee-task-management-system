// src/components/RecommendationList.jsx
// AI-5: Grouped recommendation list — groups by category, sortable by priority

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Filter, SortAsc,
  Lightbulb, AlertTriangle, CheckCircle, Info,
} from 'lucide-react';
import RecommendationCard from './RecommendationCard';

// ── Priority order for sorting ────────────────────────────────────────────────
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// ── Group header component ────────────────────────────────────────────────────
const GroupHeader = ({ priority, count, open, onToggle }) => {
  const cfg = {
    HIGH:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',   icon: AlertTriangle, dot: 'bg-red-500'   },
    MEDIUM: { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700', icon: Info,          dot: 'bg-amber-500' },
    LOW:    { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700', icon: CheckCircle,   dot: 'bg-green-500' },
  }[priority] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', icon: Info, dot: 'bg-slate-400' };

  const Icon = cfg.icon;

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border} hover:opacity-90 transition-opacity`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <Icon size={13} className={cfg.text} />
      <span className={`text-xs font-bold flex-1 text-left ${cfg.text}`}>
        {priority} Priority
      </span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border ${cfg.border} ${cfg.text}`}>
        {count}
      </span>
      {open
        ? <ChevronUp   size={13} className={cfg.text} />
        : <ChevronDown size={13} className={cfg.text} />}
    </button>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// RecommendationList
// Props:
//   recommendations  : Array<{ message, category, priority, impactScore, confidence }>
//   groupBy          : 'priority' | 'category'   (default 'priority')
//   showFilters      : bool  (default true)
//   maxVisible       : number | null
// ════════════════════════════════════════════════════════════════════════════════
const RecommendationList = ({
  recommendations = [],
  groupBy         = 'priority',
  showFilters     = true,
  maxVisible      = null,
}) => {
  const [sortMode,       setSortMode]       = useState('priority'); // 'priority' | 'impact'
  const [filterPriority, setFilterPriority] = useState('ALL');      // 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [openGroups,     setOpenGroups]     = useState({ HIGH: true, MEDIUM: true, LOW: false });

  // ── Filter + sort ─────────────────────────────────────────────────────────
  let filtered = recommendations.filter(r =>
    filterPriority === 'ALL' || r.priority === filterPriority
  );

  filtered = [...filtered].sort((a, b) => {
    if (sortMode === 'priority') {
      const pa = PRIORITY_ORDER[a.priority] ?? 2;
      const pb = PRIORITY_ORDER[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return (b.impactScore ?? 0) - (a.impactScore ?? 0);
    }
    return (b.impactScore ?? 0) - (a.impactScore ?? 0);
  });

  if (maxVisible) filtered = filtered.slice(0, maxVisible);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!filtered.length) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Lightbulb size={28} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No recommendations for the current filter.</p>
      </div>
    );
  }

  // ── Grouped by priority ───────────────────────────────────────────────────
  if (groupBy === 'priority') {
    const groups = ['HIGH', 'MEDIUM', 'LOW'].map(p => ({
      priority: p,
      items: filtered.filter(r => r.priority === p),
    })).filter(g => g.items.length > 0);

    return (
      <div className="space-y-3">
        {/* Controls */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <Filter size={12} className="text-slate-400" />
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    filterPriority === p
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <SortAsc size={12} className="text-slate-400" />
              {['priority', 'impact'].map(m => (
                <button
                  key={m}
                  onClick={() => setSortMode(m)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    sortMode === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {m === 'priority' ? 'By Priority' : 'By Impact'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {groups.map(({ priority, items }) => (
          <div key={priority}>
            <GroupHeader
              priority={priority}
              count={items.length}
              open={openGroups[priority]}
              onToggle={() => setOpenGroups(prev => ({ ...prev, [priority]: !prev[priority] }))}
            />
            <AnimatePresence>
              {openGroups[priority] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2 pl-1">
                    {items.map((rec, i) => (
                      <RecommendationCard
                        key={`${priority}-${i}`}
                        recommendation={rec}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }

  // ── Flat list (groupBy !== 'priority') ────────────────────────────────────
  return (
    <div className="space-y-2">
      {showFilters && (
        <div className="flex items-center gap-1 flex-wrap mb-1">
          <Filter size={12} className="text-slate-400" />
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                filterPriority === p
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {filtered.map((rec, i) => (
        <RecommendationCard key={i} recommendation={rec} index={i} />
      ))}
    </div>
  );
};

export default RecommendationList;
