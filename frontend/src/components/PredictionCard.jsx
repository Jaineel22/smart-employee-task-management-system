import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyPrediction, getEmployeePrediction } from '../services/predictionService';
import ConfidenceRing from './ConfidenceRing';
import {
  Sparkles, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, AlertTriangle,
  Zap, Info, RefreshCw, WifiOff
} from 'lucide-react';

/* ── Design tokens ───────────────────────────────────────── */
const TREND_CFG = {
  IMPROVING: { Icon: TrendingUp,   cls: 'text-emerald-600 bg-emerald-50', label: 'Improving'  },
  STABLE:    { Icon: Minus,        cls: 'text-blue-600 bg-blue-50',       label: 'Stable'     },
  DECLINING: { Icon: TrendingDown, cls: 'text-red-500 bg-red-50',         label: 'Declining'  },
  UNKNOWN:   { Icon: Info,         cls: 'text-slate-400 bg-slate-50',     label: 'Unknown'    },
};

const PERF_BADGE = {
  'Outstanding':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Excellent':         'bg-blue-50    text-blue-700    border-blue-200',
  'Good':              'bg-cyan-50    text-cyan-700    border-cyan-200',
  'Needs Improvement': 'bg-amber-50   text-amber-700   border-amber-200',
  'Low Productivity':  'bg-red-50     text-red-700     border-red-200',
  'Unavailable':       'bg-slate-50   text-slate-500   border-slate-200',
};

const ringColor = (score) => {
  if (!score) return '#94a3b8';
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#06b6d4';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

/* ── Skeleton loader ─────────────────────────────────────── */
const Skeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-slate-100 rounded-lg" />
      <div className="h-3 bg-slate-100 rounded w-36" />
    </div>
    <div className="flex gap-5 items-center">
      <div className="w-24 h-24 bg-slate-100 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-4/5" />
        <div className="h-3 bg-slate-100 rounded w-3/5" />
        <div className="h-6 bg-slate-100 rounded-full w-2/5" />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
/**
 * PredictionCard
 * ==============
 * Displays the AI-predicted next-month productivity score.
 *
 * Modes:
 *   Default  — full card with ring, trend, reasons, warnings
 *   compact  — single-line badge for Analytics table rows
 *
 * Props:
 *   employeeId  null → calls /predictions/me (own data)
 *               number → calls /predictions/employee/{id}
 *   month       1–12
 *   year        e.g. 2026
 *   compact     true = inline table variant
 */
const PredictionCard = ({ employeeId = null, month, year, compact = false }) => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const result = employeeId
        ? await getEmployeePrediction(employeeId, month, year)
        : await getMyPrediction(month, year);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch prediction.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (month && year) load(); }, [employeeId, month, year]);

  /* ── Compact variant for table cells ──────────────────── */
  if (compact) {
    if (loading) return <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />;
    if (!data || error) return <span className="text-xs text-slate-400">—</span>;

    const tc = TREND_CFG[data.trend] || TREND_CFG.UNKNOWN;
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-slate-700">
          {data.predictedProductivity?.toFixed(1)}%
        </span>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tc.cls}`}>
          <tc.Icon size={9} />
          {data.trendDelta != null
            ? `${data.trendDelta > 0 ? '+' : ''}${data.trendDelta.toFixed(1)}`
            : tc.label}
        </span>
        {!data.modelAvailable && (
          <span className="text-[9px] text-slate-400 italic">est.</span>
        )}
      </div>
    );
  }

  /* ── Full card ───────────────────────────────────────── */
  if (loading) return <Skeleton />;

  if (error) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Sparkles size={15} className="text-slate-400" />
        </div>
        <p className="text-xs font-bold text-slate-600">AI Prediction</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 space-y-1">
        <p className="text-xs text-amber-800 font-medium">Prediction Unavailable</p>
        <p className="text-xs text-amber-700">{error}</p>
        <code className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded block mt-1">
          cd ai-engine && uvicorn app:app --port 8000
        </code>
      </div>
    </div>
  );

  if (!data) return null;

  const tc       = TREND_CFG[data.trend] || TREND_CFG.UNKNOWN;
  const perfBadge = PERF_BADGE[data.performanceLabel] || PERF_BADGE['Unavailable'];
  const hasDetails = data.reasons?.length > 0 || data.warnings?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-5"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">AI Productivity Prediction</p>
            <p className="text-[10px] text-slate-400">
              Next month forecast
              {!data.modelAvailable && (
                <span className="ml-1 text-amber-500 font-semibold">· Estimate</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
          title="Refresh prediction"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Main score row ───────────────────────────────── */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <ConfidenceRing
            value={data.predictedProductivity || 0}
            size={88}
            stroke={ringColor(data.predictedProductivity)}
            label="predicted"
            thickness={7}
          />
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${perfBadge}`}>
            {data.performanceLabel}
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Summary */}
          <p className="text-xs text-slate-700 leading-relaxed">{data.summary}</p>

          {/* Trend badge + confidence */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${tc.cls}`}>
              <tc.Icon size={11} />
              {tc.label}
              {data.trendDelta != null && (
                <span className="ml-0.5">
                  ({data.trendDelta > 0 ? '+' : ''}{data.trendDelta?.toFixed(1)}%)
                </span>
              )}
            </span>

            {data.confidence != null && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                <Zap size={10} className="text-amber-500" />
                {data.confidence?.toFixed(0)}% confidence
              </span>
            )}
          </div>

          {/* Current vs predicted */}
          {data.currentProductivity != null && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Current: <strong className="text-slate-700">{data.currentProductivity?.toFixed(1)}%</strong></span>
              <span>→</span>
              <span>Predicted: <strong className={ringColor(data.predictedProductivity) === '#ef4444' ? 'text-red-600' : 'text-emerald-600'}>
                {data.predictedProductivity?.toFixed(1)}%
              </strong></span>
            </div>
          )}

          {/* Suggestion */}
          {data.suggestion && (
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-1">
              💡 {data.suggestion}
            </p>
          )}
        </div>
      </div>

      {/* ── Expandable details ───────────────────────────── */}
      {hasDetails && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold mb-2"
          >
            {expanded
              ? <><ChevronUp size={12} /> Hide details</>
              : <><ChevronDown size={12} /> View analysis</>}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3"
              >
                {data.reasons?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Positive Signals
                    </p>
                    {data.reasons.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-emerald-50 rounded-xl px-3 py-2"
                      >
                        <p className="text-xs text-emerald-800 leading-relaxed">{r}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {data.warnings?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Risk Signals
                    </p>
                    {data.warnings.map((w, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2"
                      >
                        <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">{w}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Offline notice ───────────────────────────────── */}
      {!data.modelAvailable && (
        <div className="mt-3 flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
          <WifiOff size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Using rule-based estimate. For ML predictions run:{' '}
            <code className="bg-slate-200 px-1 rounded">python3 train_model.py</code>
            {' '}then start the AI service.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PredictionCard;