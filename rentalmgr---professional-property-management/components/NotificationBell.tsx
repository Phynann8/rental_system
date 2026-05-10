import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { AppNotification } from '../types';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(false); // Fetch enough to show recent
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleRead = async (id: number, linkUri?: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      if (linkUri) {
        setIsOpen(false);
        if (linkUri.startsWith('/')) {
          navigate(linkUri);
        } else {
          window.location.href = linkUri;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'Info': return <span className="material-symbols-outlined text-blue-500">info</span>;
      case 'Warning': return <span className="material-symbols-outlined text-amber-500">warning</span>;
      case 'Success': return <span className="material-symbols-outlined text-green-500">check_circle</span>;
      case 'Error': return <span className="material-symbols-outlined text-red-500">error</span>;
      default: return <span className="material-symbols-outlined text-gray-500">notifications</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition-all active:scale-90 shadow-sm ${
          isOpen 
            ? 'bg-primary text-white border-primary shadow-primary/20' 
            : 'bg-gray-50 text-gray-500 hover:bg-white hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        title="Notifications"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-surface-dark shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-4 sm:right-12 mt-3 w-80 sm:w-96 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none dark:bg-surface-dark dark:ring-white/10 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                disabled={loading}
                onClick={handleReadAll}
                className="text-xs font-semibold text-primary hover:text-primary-dark"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto w-full no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined !text-4xl text-gray-300 dark:text-gray-700 mb-2 block">notifications_paused</span>
                You have no notifications.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800 w-full flex flex-col">
                {notifications.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`flex gap-3 p-4 transition ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {notif.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                        {new Date(notif.createdAtUtc).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {notif.linkUri && (
                        <button 
                          onClick={() => handleRead(notif.id, notif.linkUri)}
                          className="mt-3 text-xs font-bold text-primary hover:text-primary-dark uppercase tracking-wider"
                        >
                          View Details &rarr;
                        </button>
                      )}
                    </div>
                    {!notif.isRead && (
                      <div className="flex shrink-0 items-center justify-center">
                        <button 
                          onClick={() => handleRead(notif.id)}
                          className="h-2 w-2 rounded-full bg-primary"
                          title="Mark as read"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
