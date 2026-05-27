import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const statusConfig = {
  'Outstanding':       { color: 'text-emerald-600', bg: 'bg-emerald-50',  ring: 'ring-emerald-200', bar: 'bg-emerald-500'  },
  'Excellent':         { color: 'text-blue-600',    bg: 'bg-blue-50',     ring: 'ring-blue-200',    bar: 'bg-blue-500'     },
  'Good':              { color: 'text-cyan-600',    bg: 'bg-cyan-50',     ring: 'ring-cyan-200',    bar: 'bg-cyan-500'     },
  'Needs Improvement': { color: 'text-amber-600',   bg: 'bg-amber-50',    ring: 'ring-amber-200',   bar: 'bg-amber-500'    },
  'Low Productivity':  { color: 'text-red-600',     bg: 'bg-red-50',      ring: 'ring-red-200',     bar: 'bg-red-500'      },
};

const TrendBadge = ({ delta }) => {
  if (delta === null || delta === undefined) return null;
  const abs = Math.abs(delta).toFixed(1);
  if (Math.abs(delta) < 0.5)
    return <span className="flex items-center gap-0.5 text-xs text-slate-400"><Minus size={11} /> No change</span>;
  if (delta > 0)
    return <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-semibold"><TrendingUp size={12} /> +{abs}%</span>;
  return <span className="flex items-center gap-0.5 text-xs text-red-500 font-semibold"><TrendingDown size={12} /> -{abs}%</span>;
};

// Compact card variant — used in dashboard
const ProductivityScoreCard = ({ data, loading }) => {
  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-100 rounded w-16 mb-2" />
      <div className="h-2 bg-slate-100 rounded w-full" />
    </div>
  );

  if (!data) return null;

  const cfg = statusConfig[data.performanceStatus] || statusConfig['Good'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      className={`bg-white rounded-2xl border ${cfg.ring} ring-1 p-5 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">Productivity Score</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
          {data.performanceStatus}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${cfg.color}`}>{data.productivityScore}%</span>
        <div className="mb-1"><TrendBadge delta={data.trendDelta} /></div>
      </div>

      {/* Breakdown bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.productivityScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${cfg.bar}`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{data.month} {data.year}</span>
          <span>{data.hoursWorked}h / {data.expectedHours}h expected</span>
        </div>
      </div>
    </motion.div>
  );
};

// Detailed breakdown — used in modals and analytics page
const ProductivityBreakdown = ({ data }) => {
  if (!data) return null;

  const cfg = statusConfig[data.performanceStatus] || statusConfig['Good'];

  const components = [
    { label: 'Hours Worked',        score: data.hoursScore,            weight: '40%', raw: `${data.hoursWorked}h` },
    { label: 'Task Completion',     score: data.taskCompletionScore,   weight: '30%', raw: `${data.totalTasksCompleted}/${data.totalTasksAssigned}` },
    { label: 'Avg Progress',        score: data.avgProgressScore,      weight: '20%', raw: `${data.avgTaskProgress}%` },
    { label: 'Deadline Discipline', score: data.deadlineDisciplineScore,weight: '10%', raw: `${data.onTimeCompletionRate}%` },
  ];

  return (
    <div className="space-y-4">
      {/* Score circle */}
      <div className="flex items-center gap-4">
        <div className={`w-20 h-20 rounded-2xl ${cfg.bg} flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`text-2xl font-bold ${cfg.color}`}>{data.productivityScore}%</span>
          <span className={`text-[10px] font-semibold ${cfg.color}`}>{data.performanceStatus}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{data.employeeName}</p>
          <p className="text-xs text-slate-400">{data.department || 'No department'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{data.month} {data.year}</p>
          <div className="mt-1"><TrendBadge delta={data.trendDelta} /></div>
        </div>
      </div>

      {/* Component bars */}
      <div className="space-y-3">
        {components.map(({ label, score, weight, raw }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">{label} <span className="text-slate-400">({weight})</span></span>
              <span className="font-bold text-slate-700">{score?.toFixed(1)}% <span className="text-slate-400 font-normal">({raw})</span></span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${cfg.bar}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ProductivityScoreCard, ProductivityBreakdown, TrendBadge, statusConfig };
export default ProductivityScoreCard;