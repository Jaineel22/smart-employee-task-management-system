// src/components/RiskDistributionChart.jsx
// AI-6: Risk level distribution pie/donut chart

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#22c55e',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p style={{ color: payload[0].payload.fill }} className="font-bold">
        {payload[0].name}: {payload[0].value} task{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

const RiskDistributionChart = ({ data }) => {
  const chartData = [
    { name: 'Critical', value: data?.criticalTaskCount || 0, fill: COLORS.CRITICAL },
    { name: 'High',     value: data?.highRiskTaskCount  || 0, fill: COLORS.HIGH },
    { name: 'Medium',   value: data?.mediumRiskTaskCount|| 0, fill: COLORS.MEDIUM },
    { name: 'Low',      value: data?.lowRiskTaskCount   || 0, fill: COLORS.LOW },
  ].filter(d => d.value > 0);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-slate-400">
        No active tasks with deadlines
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={72}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
        {chartData.map(d => (
          <span key={d.name} className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
};

export default RiskDistributionChart;


// ─────────────────────────────────────────────────────────────────────────────
// src/components/CriticalTaskWidget.jsx
// Compact widget showing top CRITICAL tasks — for dashboard use
// ─────────────────────────────────────────────────────────────────────────────

export const CriticalTaskWidget = ({ tasks = [], onViewAll }) => {
  if (!tasks.length) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-slate-400">
        No critical tasks — great work! 🎉
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {tasks.slice(0, 4).map((task, i) => (
          <div
            key={task.taskId || i}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50 border border-red-100"
          >
            <div className="w-1.5 h-8 rounded-full bg-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {task.taskTitle || 'Untitled Task'}
              </p>
              <p className="text-[10px] text-slate-500">
                {task.daysRemaining != null
                  ? task.daysRemaining < 0
                    ? `${Math.abs(task.daysRemaining)}d overdue`
                    : task.daysRemaining === 0
                      ? 'Due today'
                      : `${task.daysRemaining}d left`
                  : 'No deadline set'}
                {' · '}{task.completionPercentage ?? 0}% done
              </p>
            </div>
            <span className="text-xs font-black text-red-600 flex-shrink-0">
              {task.riskScore}
            </span>
          </div>
        ))}
      </div>

      {tasks.length > 4 && onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-2 text-xs text-blue-600 font-semibold hover:underline w-full text-center"
        >
          View all {tasks.length} critical tasks →
        </button>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// src/components/AtRiskEmployeeWidget.jsx
// Shows employees with HIGH/CRITICAL risk — for manager dashboard
// ─────────────────────────────────────────────────────────────────────────────

const RISK_DOT = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-400',
  LOW:      'bg-green-500',
};

export const AtRiskEmployeeWidget = ({ employeeRisks = [], onViewAll }) => {
  const atRisk = employeeRisks
    .filter(e => ['CRITICAL', 'HIGH'].includes(e.overallRiskLevel))
    .slice(0, 5);

  if (!atRisk.length) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-slate-400">
        No employees at high risk — team is on track ✅
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {atRisk.map((emp, i) => (
        <div
          key={emp.employeeId || i}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(emp.employeeName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {emp.employeeName || `Employee #${emp.employeeId}`}
            </p>
            <p className="text-[10px] text-slate-400">
              {emp.criticalTaskCount > 0 && `${emp.criticalTaskCount} critical · `}
              {emp.highRiskTaskCount > 0 && `${emp.highRiskTaskCount} high risk`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${RISK_DOT[emp.overallRiskLevel] || RISK_DOT.LOW}`} />
            <span className="text-xs font-bold text-slate-700">{emp.avgRiskScore}</span>
          </div>
        </div>
      ))}

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs text-blue-600 font-semibold hover:underline w-full text-center mt-1"
        >
          View full risk analytics →
        </button>
      )}
    </div>
  );
};