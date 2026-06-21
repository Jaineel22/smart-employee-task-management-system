import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotificationsByUser, markAsRead, deleteNotification } from '../services/notificationService';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CheckCheck, Inbox } from 'lucide-react';

const typeConfig = {
  TASK_ASSIGNED:        { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Task Assigned'   },
  DEADLINE_APPROACHING: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Deadline'        },
  TASK_COMPLETED:       { bg: 'bg-emerald-100',text: 'text-emerald-700',label: 'Completed'       },
  PROJECT_UPDATED:      { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Project Update'  },
};

const formatDate = (v) => {
  if (!v) return '';
  try {
    if (Array.isArray(v)) { const [y,mo,d] = v; return `${d}/${mo}/${y}`; }
    return new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
  } catch { return ''; }
};
 
const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');
  const [toast, setToast]      = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const load = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Debug: Log user object
      console.log('User object in NotificationsPage:', user);
      console.log('User ID:', user?.id);
      
      // Safety check: Ensure user exists and has an ID
      if (!user || !user.id) {
        console.error('No user or user.id found. User:', user);
        setError('Please log in to view notifications.');
        setLoading(false);
        return;
      }
      
      // Make the API call
      console.log(`Fetching notifications for user ID: ${user.id}`);
      const data = await getNotificationsByUser(user.id);
      console.log('Notifications received:', data);
      
      // Ensure data is an array
      setNotifications(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('Error loading notifications:', err);
      
      // Handle the blocked request error from api.js interceptor
      if (err.message === 'Blocked request: undefined id in URL') {
        setError('User ID is missing. Please log out and log in again.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load notifications. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      load();
    } else {
      // If no user, show error and stop loading
      setLoading(false);
      setError('Please log in to view notifications.');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkRead = async (id) => {
    try { 
      await markAsRead(id); 
      setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
      showToast('Marked as read.');
    } catch (err) { 
      console.error('Failed to mark as read:', err);
      alert('Failed to mark as read.'); 
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map(n => markAsRead(n.id)));
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      showToast('All marked as read.');
    } catch (err) { 
      console.error('Failed to mark all as read:', err);
      alert('Failed to mark all as read.'); 
    }
  };

  const handleDelete = async (id) => {
    try { 
      await deleteNotification(id); 
      setNotifications(p => p.filter(n => n.id !== id)); 
      showToast('Notification deleted.'); 
    } catch (err) { 
      console.error('Failed to delete:', err);
      alert('Failed to delete notification.'); 
    }
  };

  if (loading) return <Loader />;

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity:0, y:-20 }} 
            animate={{ opacity:1, y:0 }} 
            exit={{ opacity:0, y:-20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Notifications</h1>
          <p className="text-xs text-slate-500">
            {unread > 0
              ? <><span className="text-blue-600 font-bold">{unread} unread</span> · {notifications.length} total</>
              : `${notifications.length} total — all read`}
          </p>
        </div>
        {unread > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {notifications.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Inbox size={28} className="text-blue-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">You're all caught up!</p>
          <p className="text-xs text-slate-400 mt-1">No notifications to show right now.</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map(n => {
              const tc = typeConfig[n.type] || { bg:'bg-slate-100', text:'text-slate-600', label: n.type || 'Notification' };
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:10 }}
                  className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-start gap-3 transition-all
                    ${n.isRead ? 'border-slate-100 opacity-65' : 'border-blue-200 shadow-sm'}`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 self-start ${tc.bg}`}>
                    <Bell size={14} className={tc.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold text-slate-800">{n.title || 'Notification'}</p>
                      {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 break-words">{n.message || 'No message provided'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>
                        {tc.label}
                      </span>
                      {n.createdAt && <span className="text-[10px] text-slate-400">{formatDate(n.createdAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-center">
                    {!n.isRead && (
                      <button 
                        onClick={() => handleMarkRead(n.id)} 
                        title="Mark as read"
                        className="w-7 h-7 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(n.id)} 
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationsPage;