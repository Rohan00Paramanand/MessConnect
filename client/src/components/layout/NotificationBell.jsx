import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Wrench,
  Star,
  Check,
  ExternalLink,
  Trash2
} from 'lucide-react';
import api from '../../api/axios';

const TYPE_CONFIG = {
  COMPLAINT_STATUS: {
    icon: CheckCircle,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  COMPLAINT_ASSIGNED: {
    icon: Wrench,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  SLA_NUDGE: {
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200'
  },
  FEEDBACK: {
    icon: Star,
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  VISIT_SCHEDULED: {
    icon: Calendar,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  MAINTENANCE_REQUEST: {
    icon: Wrench,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  SYSTEM: {
    icon: AlertCircle,
    color: 'text-gray-600 bg-gray-50 border-gray-200'
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=25');
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Connect to SSE stream for real-time web notifications
  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

    const streamUrl = `${apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`;
    let eventSource = null;

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.addEventListener('notification', (event) => {
        try {
          const newNotification = JSON.parse(event.data);

          // Prepend new notification to the active list
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Trigger instant in-app web toast popup
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/10 p-4 border border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer`}
                onClick={() => {
                  toast.dismiss(t.id);
                  if (newNotification.link) {
                    navigate(newNotification.link);
                  }
                }}
              >
                <div className="flex-1 w-0 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 tracking-tight">
                      {newNotification.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {newNotification.message}
                    </p>
                    <span className="text-[10px] text-indigo-600 font-bold mt-1 inline-flex items-center gap-1">
                      Click to open <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </div>
            ),
            { duration: 6000, position: 'top-right' }
          );
        } catch (err) {
          console.error('Error parsing notification event data:', err);
        }
      });

      eventSource.onerror = () => {
        // EventSource automatically retries connection
      };
    } catch (err) {
      console.error('Failed to initialize EventSource:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchNotifications, navigate]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setLoading(false);
    }
  };

  // Click on a single notification
  const handleNotificationClick = async (notif) => {
    // If unread, mark read in background
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Delete single notification
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const target = notifications.find((n) => n._id === id);
        return target && !target.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ─── Notification Bell Button ─── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-gray-50 border border-gray-200/90 shadow-2xs hover:shadow-xs flex items-center justify-center text-gray-700 hover:text-gray-900 active:scale-95 transition-all cursor-pointer flex-shrink-0"
        title="Web Notifications"
        aria-label="Open notifications"
      >
        <Bell size={18} className="sm:w-5 sm:h-5 text-gray-700" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── Notifications Popover Dropdown ─── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900 tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-2.5">
                  <Bell size={22} />
                </div>
                <p className="text-xs font-bold text-gray-700">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  You will get real-time alerts when complaints or requests are updated.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
                const IconComponent = config.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 sm:p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group relative ${
                      !notif.isRead ? 'bg-indigo-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.color}`}
                    >
                      <IconComponent size={15} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs font-bold truncate ${
                            !notif.isRead ? 'text-gray-900 font-black' : 'text-gray-700'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Delete button on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notif._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition-opacity rounded-md hover:bg-gray-100 flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
