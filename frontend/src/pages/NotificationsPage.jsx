import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotificationsByUser, markAsRead, deleteNotification
} from '../services/notificationService';
import Loader from '../components/Loader';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';

const typeColors = {
  TASK_ASSIGNED:        'bg-blue-100 text-blue-700',
  DEADLINE_APPROACHING: 'bg-yellow-100 text-yellow-700',
  TASK_COMPLETED:       'bg-green-100 text-green-700',
  PROJECT_UPDATED:      'bg-purple-100 text-purple-700',
};

const formatDate = (val) => {
  if (!val) return '';
  try {
    if (Array.isArray(val)) { const [y, mo, d] = val; return `${d}/${mo}/${y}`; }
    return new Date(val).toLocaleDateString();
  } catch { return ''; }
};

const NotificationsPage = () => {
  const { user }                          = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [toast, setToast]                 = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setNotifications(await getNotificationsByUser(user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      alert('Failed to mark as read.');
    }
  };

  // Mark all unread as read — sequential calls (no bulk endpoint yet)
  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => markAsRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read.');
    } catch {
      alert('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('Notification deleted.');
    } catch {
      alert('Failed to delete notification.');
    }
  };

  if (loading) return <Loader />;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unread > 0
              ? <><span className="text-blue-600 font-semibold">{unread} unread</span> · {notifications.length} total</>
              : `${notifications.length} total — all read`}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {notifications.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={36} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">You're all caught up — no notifications.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-4 flex items-start gap-4 transition-all
                ${n.isRead ? 'border-gray-100 opacity-70' : 'border-blue-200 shadow-sm'}`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${typeColors[n.type] || 'bg-gray-100 text-gray-600'}`}>
                <Bell size={15} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.type?.replace(/_/g, ' ')}
                  {n.createdAt ? ` · ${formatDate(n.createdAt)}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title="Delete"
                  className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={14} />
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