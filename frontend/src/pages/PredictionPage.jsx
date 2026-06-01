import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamPredictions, getAiHealth } from '../services/predictionService';
import PredictionCard from '../components/PredictionCard';
import ConfidenceRing from '../components/ConfidenceRing';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, TrendingUp, TrendingDown, Minus,
  Users, AlertTriangle, Award, X, Wifi, WifiOff, RefreshCw
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const ringColor = (score) => {
  if (!score) return '#94a3b8';
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#06b6d4';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const trendIcon = (trend) => {
  if (trend === 'IMPROVING') return <TrendingUp  size={12} className="text-emerald-600" />;
  if (trend === 'DECLINING') return <TrendingDown size={12} className="text-red-500"    />;
  if (trend === 'STABLE')    return <Minus        size={12} className="text-blue-500"   />;
  return null;
};

const perfBadge = {
  'Outstanding':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Excellent':         'bg-blue-50 text-blue-700 border-blue-200',
  'Good':              'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Needs Improvement': 'bg-amber-50 text-amber-700 border-amber-200',
  'Low Productivity':  'bg-red-50 text-red-700 border-red-200',
  'Unavailable':       'bg-slate-50 text-slate-400 border-slate-200',
};

/* ── Employee detail modal ─────────────────────────────────── */
const DetailModal = ({ prediction, month, year, onClose }) => {
  if (!prediction) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: ringColor(prediction.predictedProductivity) }}>
              {prediction.employeeName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{prediction.employeeName}</p>
              <p className="text-xs text-slate-400">Full AI Analysis · {MONTHS[month - 1]} {year}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* Full PredictionCard using the cached prediction data */}
        <PredictionCard
          employeeId={prediction.employeeId}
          month={month}
          year={year}
        />
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const PredictionPage = () => {
  const now = new Date();
  const navigate = useNavigate();
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year]                    = useState(now.getFullYear());
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [aiOnline, setAiOnline]   = useState(null);
  const [selected, setSelected]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // AI health check on mount
  useEffect(() => {
    getAiHealth()
      .then(h => setAiOnline(h.aiServiceReachable))
      .catch(() => setAiOnline(false));
  }, []);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await getTeamPredictions(month, year);
      setPredictions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team predictions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  // Derived stats
  const improving  = predictions.filter(p => p.trend === 'IMPROVING').length;
  const declining  = predictions.filter(p => p.trend === 'DECLINING').length;
  const needsAttn  = predictions.filter(p => (p.predictedProductivity || 0) < 55).length;
  const avgPred    = predictions.length
    ? (predictions.reduce((s, p) => s + (p.predictedProductivity || 0), 0) / predictions.length).toFixed(1)
    : '—';

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg font-bold text-slate-800">AI Productivity Predictions</h1>
            {aiOnline !== null && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5
                rounded-full border ${aiOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {aiOnline ? <Wifi size={9} /> : <WifiOff size={9} />}
                {aiOnline ? 'AI Online' : 'AI Offline'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Next-month forecast · {MONTHS[month - 1]} {year} · {predictions.length} employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m} {year}</option>)}
          </select>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-slate-400 hover:text-slate-600 p-2 border border-slate-200 rounded-xl bg-white"
            title="Refresh all predictions"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* AI offline banner */}
      {aiOnline === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
          <WifiOff size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">AI Engine Offline — Showing Estimates</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Rule-based estimates are shown. For RandomForest ML predictions:
            </p>
            <code className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded mt-1 inline-block">
              cd ai-engine && uvicorn app:app --host 0.0.0.0 --port 8000
            </code>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users,         label: 'Tracked',      value: predictions.length, color: 'text-slate-600',   bg: 'bg-slate-50'   },
          { icon: TrendingUp,    label: 'Improving',    value: improving,          color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: TrendingDown,  label: 'Declining',    value: declining,          color: 'text-red-500',     bg: 'bg-red-50'     },
          { icon: Brain,         label: 'Avg Forecast', value: `${avgPred}%`,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${bg} rounded-2xl p-4`}>
            <Icon size={15} className={`${color} mb-1.5`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Employee prediction grid */}
      {predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <Brain size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No predictions available</p>
          <p className="text-xs text-slate-400 mt-1">
            Ensure employees have task and report data for this month.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((pred, i) => (
            <motion.div
              key={pred.employeeId || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(pred)}
              className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer
                hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Employee identity */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white
                  text-sm font-bold flex-shrink-0"
                  style={{ background: ringColor(pred.predictedProductivity) }}>
                  {pred.employeeName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{pred.employeeName}</p>
                  <p className="text-[10px] text-slate-400">
                    Current: <strong className="text-slate-600">{pred.currentProductivity?.toFixed(1)}%</strong>
                  </p>
                </div>
                <Sparkles size={13} className="text-violet-400 flex-shrink-0" />
              </div>

              {/* Score comparison */}
              <div className="flex items-center gap-3 mb-3">
                <ConfidenceRing
                  value={pred.predictedProductivity || 0}
                  size={64}
                  stroke={ringColor(pred.predictedProductivity)}
                  label="next mo."
                  thickness={5}
                  fontSize="text-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {trendIcon(pred.trend)}
                    <span className={`text-xs font-semibold
                      ${pred.trend === 'IMPROVING' ? 'text-emerald-600'
                        : pred.trend === 'DECLINING' ? 'text-red-500'
                        : 'text-blue-600'}`}>
                      {pred.trendDelta != null
                        ? `${pred.trendDelta > 0 ? '+' : ''}${pred.trendDelta?.toFixed(1)}%`
                        : pred.trend}
                    </span>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                    ${perfBadge[pred.performanceLabel] || perfBadge['Unavailable']}`}>
                    {pred.performanceLabel}
                  </span>

                  {pred.confidence != null && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {pred.confidence?.toFixed(0)}% confidence
                      {!pred.modelAvailable && <span className="italic ml-1">· est.</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Warning indicator */}
              {pred.warnings?.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600
                  bg-amber-50 rounded-lg px-2.5 py-1.5 mb-2">
                  <AlertTriangle size={10} className="flex-shrink-0" />
                  {pred.warnings[0]}
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-right">
                Click for full analysis →
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            prediction={selected}
            month={month}
            year={year}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictionPage;