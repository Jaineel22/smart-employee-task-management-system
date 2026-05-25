import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotificationsByUser, markAsRead, deleteNotification } from '../services/notificationService';
import Loader from '../components/Loader';
import { Bell, Check, Trash2 } from 'lucide-react';

const typeColors = {
  TASK_ASSIGNED:        'bg-blue-100 text-blue-700',
  DEADLINE_APPROACHING: 'bg-yellow-100 text-yellow-700',
  TASK_COMPLETED:       'bg-green-100 text-green-700',
  PROJECT_UPDATED:      'bg-purple-100 text-purple-700',
};

const NotificationsPage = () => {
  const { user }                          = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotificationsByUser(user.id);
      setNotifications(data);
    } catch (err) {
      console.error('Notifications error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      alert('Failed to mark as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert('Failed to delete notification.');
    }
  };

  // Safe date formatting — createdAt may be array [2025,6,1,...] or string
  const formatDate = (createdAt) => {
    if (!createdAt) return '';
    try {
      // Spring Boot LocalDateTime serializes as array by default without config
      if (Array.isArray(createdAt)) {
        const [y, mo, d] = createdAt;
        return `${d}/${mo}/${y}`;
      }
      return new Date(createdAt).toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) return <Loader />;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
        <p className="text-sm text-gray-500">
          {unread} unread · {notifications.length} total
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {notifications.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={36} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-4 flex items-start gap-4 transition-all
                ${n.isRead ? 'border-gray-100 opacity-75' : 'border-blue-100 shadow-sm'}`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${typeColors[n.type] || 'bg-gray-100 text-gray-600'}`}>
                <Bell size={15} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  {!n.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.type?.replace(/_/g, ' ')}
                  {n.createdAt ? ` · ${formatDate(n.createdAt)}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    className="text-blue-500 hover:text-blue-700 p-1"
                  >
                    <Check size={15} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title="Delete"
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;