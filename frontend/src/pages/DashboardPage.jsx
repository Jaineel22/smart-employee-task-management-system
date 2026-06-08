import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminDashboard, getEmployeeDashboard } from '../services/dashboardService';
import { getTasksByEmployee, getAllTasks } from '../services/taskService';
import { getMyProductivity } from '../services/productivityService';
import DashboardCard from '../components/DashboardCard';
import TaskCard from '../components/TaskCard';
import Loader from '../components/Loader';
import ProductivityScoreCard from '../components/ProductivityScore';
import AttendanceWidget from '../components/AttendanceWidget';
import InsightsCard from '../components/InsightsCard';
import PredictionCard from '../components/PredictionCard';
import { getAiHealth } from '../services/predictionService';
// ✅ AI-5 & AI-6 Widget Imports
import { 
  MyRecommendationsWidget, 
  MyRiskTasksWidget,
  ManagerCriticalTasksBanner,
  ManagerAI56SummaryCards 
} from '../components/DashboardAI56Widgets';
import { motion } from 'framer-motion';
import {
  Users, FolderKanban, CheckSquare, Clock, AlertCircle,
  BarChart2, FileText, Bell, TrendingUp, Layers, Plus, Eye, ClipboardList, Brain
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.fill || e.color }}>
          {e.name}: <span className="font-bold">{e.value}</span>
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 p-4 ${className}`}>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
    {children}
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, variant = 'primary' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
      ${variant === 'primary'
        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
  >
    <Icon size={15} />
    {label}
  </button>
);

const getSmartGreeting = (user, data) => {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const active = (data?.inProgressTasks || 0);
  const pending = (data?.pendingTasks || 0);

  if (active > 0 && pending > 0)
    return { greeting: `${timeGreet}, ${firstName}.`, sub: `You have ${active} task${active > 1 ? 's' : ''} in progress and ${pending} pending.` };
  if (active > 0)
    return { greeting: `${timeGreet}, ${firstName}.`, sub: `You're working on ${active} active task${active > 1 ? 's' : ''}. Keep it up!` };
  if (pending > 0)
    return { greeting: `${timeGreet}, ${firstName}.`, sub: `${pending} task${pending > 1 ? 's' : ''} waiting to be started.` };
  return { greeting: `${timeGreet}, ${firstName}! 🎉`, sub: 'All tasks are up to date. Great work!' };
};

/* ── MANAGER DASHBOARD ──────────────────────────────────────── */
const ManagerDashboard = ({ data, navigate }) => {
  const cards = [
    { title: 'Employees', value: data.totalEmployees, icon: Users, color: 'blue' },
    { title: 'Projects', value: data.totalProjects, icon: FolderKanban, color: 'green' },
    { title: 'Total Tasks', value: data.totalTasks, icon: Layers, color: 'gray' },
    { title: 'Completed', value: data.completedTasks, icon: CheckSquare, color: 'green' },
    { title: 'Pending', value: data.pendingTasks, icon: Clock, color: 'yellow' },
    { title: 'In Progress', value: data.inProgressTasks, icon: BarChart2, color: 'blue' },
    { title: 'High Priority', value: data.highPriorityTasks, icon: AlertCircle, color: 'red' },
    { title: 'Reports', value: data.totalReports, icon: FileText, color: 'purple' },
  ];

  const statusPie = [
    { name: 'Completed', value: data.completedTasks || 0 },
    { name: 'In Progress', value: data.inProgressTasks || 0 },
    { name: 'Pending', value: data.pendingTasks || 0 },
    { name: 'Overdue', value: Math.max(0, (data.totalTasks || 0) - (data.completedTasks || 0) - (data.inProgressTasks || 0) - (data.pendingTasks || 0)) },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Done', v: data.completedTasks || 0, fill: '#22c55e' },
    { name: 'Doing', v: data.inProgressTasks || 0, fill: '#3b82f6' },
    { name: 'Todo', v: data.pendingTasks || 0, fill: '#f59e0b' },
  ];

  const pct = data.totalTasks
    ? Math.round(((data.completedTasks || 0) / data.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Manager Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">NCode Solutions — System Overview</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <QuickAction icon={Plus} label="New Project" onClick={() => navigate('/projects')} />
          <QuickAction icon={Plus} label="New Task" onClick={() => navigate('/tasks')} variant="outline" />
          <QuickAction icon={Eye} label="Reports" onClick={() => navigate('/reports')} variant="outline" />
          <QuickAction icon={Users} label="Team" onClick={() => navigate('/users')} variant="outline" />
        </div>
      </div>

      {/* Manager Team Insights */}
      <InsightsCard isManager={true} />

      {/* AI Prediction Engine Banner for Manager */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">AI Prediction Engine</p>
          <p className="text-xs text-violet-200 mt-0.5">
            Forecast next-month productivity for every team member
          </p>
        </div>
        <button
          onClick={() => navigate('/predictions')}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          <Brain size={14} />
          View Predictions
        </button>
      </div>

      {/* ✅ AI-6: Critical Tasks Banner */}
      <ManagerCriticalTasksBanner />

      {/* ✅ AI-5 & AI-6: Manager Summary Cards */}
      <ManagerAI56SummaryCards />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <DashboardCard {...c} />
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie chart */}
        <ChartCard title="Task Status">
          {statusPie.length === 0
            ? <p className="text-xs text-slate-400 text-center py-8">No task data</p>
            : <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                  {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          }
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {statusPie.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name}
              </span>
            ))}
          </div>
        </ChartCard>

        {/* Bar chart */}
        <ChartCard title="Task Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="v" radius={[5, 5, 0, 0]}>
                {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radial */}
        <ChartCard title="Completion Rate">
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={140} height={140}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={45} outerRadius={65} startAngle={90} endAngle={-270} data={[{ v: pct, fill: '#22c55e' }]}>
                  <RadialBar background={{ fill: '#f1f5f9' }} dataKey="v" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">{pct}%</span>
                <span className="text-[10px] text-slate-400">Done</span>
              </div>
            </div>
            <div className="ml-4 space-y-2 text-xs">
              <div><p className="text-slate-400">Total</p><p className="font-bold text-slate-800">{data.totalTasks || 0}</p></div>
              <div><p className="text-slate-400">Done</p><p className="font-bold text-emerald-600">{data.completedTasks || 0}</p></div>
              <div><p className="text-slate-400">Left</p><p className="font-bold text-orange-500">{(data.totalTasks || 0) - (data.completedTasks || 0)}</p></div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

/* ── EMPLOYEE DASHBOARD ─────────────────────────────────────── */
const EmployeeDashboard = ({ data, user, navigate, tasks }) => {
  const { greeting, sub } = getSmartGreeting(user, data);

  // PRODUCTIVITY STATE
  const now = new Date();
  const [prodMonth, setProdMonth] = useState(now.getMonth() + 1);
  const [prodYear] = useState(now.getFullYear());
  const [prodData, setProdData] = useState(null);
  const [prodLoading, setProdLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    setProdLoading(true);

    getMyProductivity(prodMonth, prodYear)
      .then(setProdData)
      .catch(() => setProdData(null))
      .finally(() => setProdLoading(false));
  }, [user?.id, prodMonth, prodYear]);

  // AI Health Check State
  const [aiOnline, setAiOnline] = useState(null);

  useEffect(() => {
    getAiHealth()
      .then(h => setAiOnline(h.aiServiceReachable))
      .catch(() => setAiOnline(false));
  }, []);

  const cards = [
    { title: 'My Tasks', value: data.totalTasks, icon: Layers, color: 'blue' },
    { title: 'Completed', value: data.completedTasks, icon: CheckSquare, color: 'green' },
    { title: 'Pending', value: data.pendingTasks, icon: Clock, color: 'yellow' },
    { title: 'In Progress', value: data.inProgressTasks, icon: BarChart2, color: 'blue' },
    { title: 'Reports', value: data.totalReports, icon: FileText, color: 'purple' },
    { title: 'Unread', value: data.unreadNotifications, icon: Bell, color: 'red' },
    {
      title: 'Avg Done',
      value: `${data.averageCompletionPercentage ?? 0}%`,
      icon: TrendingUp,
      color: 'green'
    },
  ];

  const activeTasks = tasks
    .filter(t => t.status !== 'COMPLETED')
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Smart greeting */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <h1 className="text-base font-bold">{greeting}</h1>
        <p className="text-sm text-blue-100 mt-1">{sub}</p>

        <div className="flex gap-2 mt-3">
          <QuickAction
            icon={CheckSquare}
            label="My Tasks"
            onClick={() => navigate('/tasks')}
          />

          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 transition-all text-white"
          >
            <ClipboardList size={15} /> Submit Report
          </button>
        </div>
      </div>

      {/* Attendance Widget + Insights side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceWidget />
        <InsightsCard isManager={false} />
      </div>

      {/* Productivity Score + Month Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            My Productivity
          </p>

          <select
            value={prodMonth}
            onChange={e => setProdMonth(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[
              'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ].map((m, i) => (
              <option key={m} value={i + 1}>
                {m} {prodYear}
              </option>
            ))}
          </select>
        </div>

        <ProductivityScoreCard
          data={prodData}
          loading={prodLoading}
        />
      </div>

      {/* Prediction Card - added after ProductivityScoreCard */}
      <PredictionCard
        employeeId={null}
        month={prodMonth}
        year={prodYear}
      />

      {/* ✅ AI-5: My Recommendations Widget */}
      <MyRecommendationsWidget userId={user?.id} month={prodMonth} year={prodYear} />

      {/* ✅ AI-6: My Risk Tasks Widget */}
      <MyRiskTasksWidget userId={user?.id} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <DashboardCard {...c} />
          </motion.div>
        ))}
      </div>

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">
              My Active Tasks
            </h2>

            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Performance bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Performance Summary
        </p>

        <div className="space-y-3">
          {[
            {
              label: 'Completed',
              value: data.completedTasks || 0,
              total: data.totalTasks || 1,
              color: 'bg-emerald-500'
            },
            {
              label: 'In Progress',
              value: data.inProgressTasks || 0,
              total: data.totalTasks || 1,
              color: 'bg-blue-500'
            },
            {
              label: 'Pending',
              value: data.pendingTasks || 0,
              total: data.totalTasks || 1,
              color: 'bg-amber-400'
            },
          ].map(({ label, value, total, color }) => {
            const pct =
              total > 0 ? Math.round((value / total) * 100) : 0;

            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{label}</span>

                  <span className="font-semibold text-slate-700">
                    {value}{' '}
                    <span className="text-slate-400">
                      ({pct}%)
                    </span>
                  </span>
                </div>

                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── MAIN ───────────────────────────────────────────────────── */
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const [dashData, taskData] = await Promise.all([
          isManager ? getAdminDashboard() : getEmployeeDashboard(user.id),
          isManager ? getAllTasks() : getTasksByEmployee(user.id),
        ]);
        setData(dashData);
        setTasks(taskData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <Loader />;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>;
  if (!data) return null;

  return isManager
    ? <ManagerDashboard data={data} navigate={navigate} />
    : <EmployeeDashboard data={data} user={user} navigate={navigate} tasks={tasks} />;
};

export default DashboardPage;