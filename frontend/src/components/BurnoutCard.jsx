import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const getRiskConfig = (level) => {
    switch (level) {
        case 'HIGH':
            return { color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle, action: 'Immediate action required' };
        case 'MEDIUM':
            return { color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: TrendingUp, action: 'Monitor closely' };
        default:
            return { color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle, action: 'On track' };
    }
};

const BurnoutCard = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const config = getRiskConfig(data.level);
    const Icon = config.icon;
    const riskPercentage = data.burnoutRisk || 0;

    // Get color for progress bar
    const getBarColor = () => {
        if (config.color === 'red') return '#ef4444';
        if (config.color === 'orange') return '#f59e0b';
        return '#10b981';
    };

    const getDotColor = () => {
        if (config.color === 'red') return '#ef4444';
        if (config.color === 'orange') return '#f59e0b';
        return '#10b981';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border ${config.border} p-5 hover:shadow-md transition-all`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                        <Activity size={16} className={config.text} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Burnout Risk</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
                    {data.level} Risk
                </span>
            </div>

            {/* Risk Score */}
            <div className="mb-4">
                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-slate-800">{riskPercentage}%</span>
                    <span className="text-xs text-slate-400">risk score</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${riskPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-2 rounded-full"
                        style={{ width: `${riskPercentage}%`, backgroundColor: getBarColor() }}
                    />
                </div>
            </div>

            {/* Reasons */}
            {data.reasons && data.reasons.length > 0 && (
                <div className="mb-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Contributing Factors
                    </p>
                    <div className="space-y-1.5">
                        {data.reasons.slice(0, 3).map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                <div 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: getDotColor() }}
                                />
                                <span>{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {data.recommendations && data.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Recommendations
                    </p>
                    <div className="space-y-1">
                        {data.recommendations.slice(0, 2).map((rec, idx) => (
                            <p key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <span className="text-blue-500">•</span>
                                {rec}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Badge */}
            <div className="mt-3">
                <span className={`text-[10px] font-medium ${config.text}`}>
                    {config.action}
                </span>
            </div>
        </motion.div>
    );
};

export default BurnoutCard;