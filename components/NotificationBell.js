'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Determine where to navigate based on notification type and user role
  const getNotifLink = (notif) => {
    const isManager = currentUser?.role === 'manager' || currentUser?.role === 'developer';

    switch (notif.type) {
      case 'order':
        return isManager ? '/manager/orders' : '/dashboard?tab=orders';
      case 'custom_order':
        return isManager ? '/manager/orders' : '/dashboard?tab=custom';
      case 'payment':
        return isManager ? '/manager/orders' : '/dashboard?tab=orders';
      default:
        return isManager ? '/manager/designs' : '/dashboard';
    }
  };

  const handleNotifClick = (notif) => {
    // Mark as read
    if (!notif.is_read) markAsRead(notif.id);
    // Navigate
    const link = getNotifLink(notif);
    setIsOpen(false);
    router.push(link);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch { }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, mark_all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}j lalu`;
    const days = Math.floor(hrs / 24);
    return `${days}h lalu`;
  };

  const typeIcons = {
    order: '📥',
    custom_order: '🎨',
    payment: '💰',
    system: '🔔',
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="w-6 h-6 text-purple-600 animate-pulse" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8A8A)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden z-50"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(108, 60, 225, 0.1)',
            boxShadow: '0 12px 40px rgba(108, 60, 225, 0.12), 0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(108, 60, 225, 0.06)' }}>
            <h3 className="text-sm font-bold text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-purple-600 hover:text-purple-500 font-medium">
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <BellIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50/50 transition-colors cursor-pointer group"
                  style={{
                    background: notif.is_read ? 'transparent' : 'rgba(108, 60, 225, 0.03)',
                    borderBottom: '1px solid rgba(108, 60, 225, 0.04)',
                  }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{typeIcons[notif.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${notif.is_read ? 'text-slate-600' : 'text-slate-800'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-300">{getTimeAgo(notif.created_at)}</p>
                      <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Lihat detail →
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
