// empty file
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
  const { user }            = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    const fetch = async () => {
      try {
        if (isAdminOrManager) {
          setData(await getAdminDashboard());
        } else {
          setData(await getEmployeeDashboard(user.id));
        }
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <Loader />;
  if (error)   return <p className="text-red-500 text-sm">{error}</p>;

  const adminCards = [
    { title: 'Total Employees',    value: data?.totalEmployees,    icon: Users,        color: 'blue'   },
    { title: 'Total Managers',     value: data?.totalManagers,     icon: Users,        color: 'purple' },
    { title: 'Total Projects',     value: data?.totalProjects,     icon: FolderKanban, color: 'green'  },
    { title: 'Total Tasks',        value: data?.totalTasks,        icon: Layers,       color: 'gray'   },
    { title: 'Completed Tasks',    value: data?.completedTasks,    icon: CheckSquare,  color: 'green'  },
    { title: 'Pending Tasks',      value: data?.pendingTasks,      icon: Clock,        color: 'yellow' },
    { title: 'In Progress',        value: data?.inProgressTasks,   icon: BarChart2,    color: 'blue'   },
    { title: 'High Priority',      value: data?.highPriorityTasks, icon: AlertCircle,  color: 'red'    },
    { title: 'Total Reports',      value: data?.totalReports,      icon: FileText,     color: 'purple' },
    { title: 'Notifications',      value: data?.totalNotifications,icon: Bell,         color: 'gray'   },
  ];

  const employeeCards = [
    { title: 'My Total Tasks',       value: data?.totalTasks,                     icon: Layers,      color: 'blue'   },
    { title: 'Completed',            value: data?.completedTasks,                 icon: CheckSquare, color: 'green'  },
    { title: 'Pending',              value: data?.pendingTasks,                   icon: Clock,       color: 'yellow' },
    { title: 'In Progress',          value: data?.inProgressTasks,                icon: BarChart2,   color: 'blue'   },
    { title: 'My Reports',           value: data?.totalReports,                   icon: FileText,    color: 'purple' },
    { title: 'Unread Notifications', value: data?.unreadNotifications,            icon: Bell,        color: 'red'    },
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