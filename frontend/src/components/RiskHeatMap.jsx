// src/components/RiskHeatMap.jsx
// AI-6: Employee × Risk-Level heatmap grid

import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const RISK_CELL = {
  CRITICAL: { bg: 'bg-red-500',    text: 'text-white',     label: 'C' },
  HIGH:     { bg: 'bg-orange-400', text: 'text-white',     label: 'H' },
  MEDIUM:   { bg: 'bg-amber-300',  text: 'text-amber-900', label: 'M' },
  LOW:      { bg: 'bg-green-200',  text: 'text-green-800', label: 'L' },
  NONE:     { bg: 'bg-slate-100',  text: 'text-slate-400', label: '—' },
};

/**
 * RiskHeatMap
 * Renders a grid: rows = employees, columns = their tasks
 * Each cell colour = task risk level
 *
 * Props:
 *   employeeRisks: Array<EmployeeRiskResponse>   from getTeamRisk()
 *   maxTasksShown: number  (default 8 — limits column count)
 */
const RiskHeatMap = ({ employeeRisks = [], maxTasksShown = 8 }) => {
  if (!employeeRisks.length) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-slate-400">
        No employee risk data available
      </div>
    );
  }

  // Legend
  const legend = [
    { key: 'CRITICAL', label: 'Critical (81–100)' },
    { key: 'HIGH',     label: 'High (61–80)'      },
    { key: 'MEDIUM',   label: 'Medium (31–60)'    },
    { key: 'LOW',      label: 'Low (0–30)'        },
  ];

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {legend.map(({ key, label }) => {
          const cfg = RISK_CELL[key];
          return (
            <span key={key} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
              {label}
            </span>
          );
        })}
      </div>

      {/* Grid */}
      <table className="text-xs w-full border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left text-[10px] text-slate-400 font-semibold pr-3 pb-1.5 whitespace-nowrap">
              Employee
            </th>
            {Array.from({ length: maxTasksShown }, (_, i) => (
              <th key={i} className="text-[10px] text-slate-300 font-normal pb-1.5 w-7">
                T{i + 1}
              </th>
            ))}
            <th className="text-[10px] text-slate-400 font-semibold pl-2 pb-1.5">Avg</th>
          </tr>
        </thead>
        <tbody>
          {employeeRisks.map((emp, rowIdx) => {
            const tasks = emp.taskRisks || [];
            return (
              <motion.tr
                key={emp.employeeId || rowIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIdx * 0.04 }}
              >
                {/* Employee name */}
                <td className="pr-3 py-0.5 whitespace-nowrap">
                  <span className="text-[11px] font-semibold text-slate-700 truncate block max-w-[120px]">
                    {(emp.employeeName || `Emp #${emp.employeeId}`).split(' ')[0]}
                  </span>
                </td>

                {/* Task cells */}
                {Array.from({ length: maxTasksShown }, (_, colIdx) => {
                  const task = tasks[colIdx];
                  const level = task?.riskLevel || 'NONE';
                  const cfg   = RISK_CELL[level];
                  return (
                    <td key={colIdx} className="py-0.5">
                      <div
                        className={`w-6 h-6 rounded-sm flex items-center justify-center ${cfg.bg} ${cfg.text} cursor-default`}
                        title={task ? `${task.taskTitle} — ${task.riskScore}` : 'No task'}
                      >
                        <span className="text-[9px] font-bold">{cfg.label}</span>
                      </div>
                    </td>
                  );
                })}

                {/* Avg score */}
                <td className="pl-2 py-0.5">
                  <span className={`text-[11px] font-black ${
                    (emp.avgRiskScore || 0) >= 81 ? 'text-red-600'    :
                    (emp.avgRiskScore || 0) >= 61 ? 'text-orange-600' :
                    (emp.avgRiskScore || 0) >= 31 ? 'text-amber-600'  :
                    'text-green-600'
                  }`}>
                    {emp.avgRiskScore || 0}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-[9px] text-slate-300 mt-2">
        Showing up to {maxTasksShown} tasks per employee · hover cell for task name
      </p>
    </div>
  );
};

export default RiskHeatMap;


// ─────────────────────────────────────────────────────────────────────────────
// RiskTrendChart.jsx  — export from same file for convenience
// Shows risk score trend across months using a simple Recharts line chart
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RiskTrendChart
 * Props:
 *   data: Array<{ month: string, avgRiskScore: number, criticalCount: number }>
 *         e.g. [{ month: 'Jan', avgRiskScore: 42, criticalCount: 2 }, ...]
 *
 * When no trend data is available (typical for a new deployment),
 * it renders a placeholder with the current month's data.
 */
export const RiskTrendChart = ({ data = [], currentScore = null }) => {
  // If no trend data, show a minimal single-point chart with current value
  const chartData = data.length > 0
    ? data
    : currentScore != null
      ? [{ month: 'Now', avgRiskScore: currentScore, criticalCount: 0 }]
      : [];

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-400">
        No trend data available yet
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Risk level reference lines */}
        <ReferenceLine y={81} stroke="#ef4444" strokeDasharray="4 2"
          label={{ value: 'CRITICAL', position: 'right', fontSize: 8, fill: '#ef4444' }} />
        <ReferenceLine y={61} stroke="#f97316" strokeDasharray="4 2"
          label={{ value: 'HIGH',     position: 'right', fontSize: 8, fill: '#f97316' }} />
        <ReferenceLine y={31} stroke="#f59e0b" strokeDasharray="4 2"
          label={{ value: 'MEDIUM',   position: 'right', fontSize: 8, fill: '#f59e0b' }} />

        <Line
          type="monotone"
          dataKey="avgRiskScore"
          name="Avg Risk Score"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};