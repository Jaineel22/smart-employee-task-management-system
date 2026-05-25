import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminDashboard, getEmployeeDashboard } from '../services/dashboardService';
import DashboardCard from '../components/DashboardCard';
import Loader from '../components/Loader';
import {
  Users, FolderKanban, CheckSquare, Clock,
  AlertCircle, BarChart2, FileText, Bell, TrendingUp, Layers
} from 'lucide-react';

const DashboardPage = () => {
  const { user }              = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        let result;
        if (isAdminOrManager) {
          result = await getAdminDashboard();
        } else {
          // user.id is now always a real number from backend response
          result = await getEmployeeDashboard(user.id);
        }
        setData(result);
      } catch (err) {
        console.error('Dashboard error:', err.response?.data || err.message);
        setError(
          err.response?.data?.message || 'Failed to load dashboard data.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <Loader />;

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
      {error}
    </div>
  );

  const adminCards = [
    { title: 'Total Employees',    value: data?.totalEmployees,     icon: Users,        color: 'blue'   },
    { title: 'Total Managers',     value: data?.totalManagers,      icon: Users,        color: 'purple' },
    { title: 'Total Projects',     value: data?.totalProjects,      icon: FolderKanban, color: 'green'  },
    { title: 'Total Tasks',        value: data?.totalTasks,         icon: Layers,       color: 'gray'   },
    { title: 'Completed Tasks',    value: data?.completedTasks,     icon: CheckSquare,  color: 'green'  },
    { title: 'Pending Tasks',      value: data?.pendingTasks,       icon: Clock,        color: 'yellow' },
    { title: 'In Progress',        value: data?.inProgressTasks,    icon: BarChart2,    color: 'blue'   },
    { title: 'High Priority',      value: data?.highPriorityTasks,  icon: AlertCircle,  color: 'red'    },
    { title: 'Total Reports',      value: data?.totalReports,       icon: FileText,     color: 'purple' },
    { title: 'Notifications',      value: data?.totalNotifications, icon: Bell,         color: 'gray'   },
  ];

  const employeeCards = [
    { title: 'My Total Tasks',       value: data?.totalTasks,                icon: Layers,      color: 'blue'   },
    { title: 'Completed',            value: data?.completedTasks,            icon: CheckSquare, color: 'green'  },
    { title: 'Pending',              value: data?.pendingTasks,              icon: Clock,       color: 'yellow' },
    { title: 'In Progress',          value: data?.inProgressTasks,           icon: BarChart2,   color: 'blue'   },
    { title: 'My Reports',           value: data?.totalReports,              icon: FileText,    color: 'purple' },
    { title: 'Unread Notifications', value: data?.unreadNotifications,       icon: Bell,        color: 'red'    },
    {
      title: 'Avg Completion',
      value: `${data?.averageCompletionPercentage ?? 0}%`,
      icon: TrendingUp,
      color: 'green',
    },
  ];

  const cards = isAdminOrManager ? adminCards : employeeCards;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Welcome back, {user?.fullName?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdminOrManager ? 'System-wide overview' : 'Your personal productivity summary'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;