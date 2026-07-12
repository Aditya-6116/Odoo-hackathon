import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from '../../utils/formatters';
import Badge from '../ui/Badge';

export default function TopBar({ pageTitle }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch]       = useState('');
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) navigate(`/assets?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur border-b border-surface-700/50
                        flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
      {/* Page title */}
      <h1 className="text-base font-semibold text-slate-200 mr-auto">{pageTitle}</h1>

      {/* Global search */}
      <form onSubmit={handleSearch} className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="search"
          placeholder="Search assets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-3 py-1.5 w-52 text-sm rounded-lg bg-surface-800 border border-surface-700
                     focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 text-slate-200
                     placeholder-slate-500 transition-colors"
        />
      </form>

      {/* Notification bell */}
      <div className="relative" ref={panelRef}>
        <button
          id="notif-btn"
          onClick={() => setNotifOpen(o => !o)}
          className="relative p-2 rounded-lg hover:bg-surface-700 text-slate-400 hover:text-slate-200
                     transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center
                             justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-surface-850 border border-surface-700
                          rounded-2xl shadow-glass overflow-hidden animate-slide-in z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
              <span className="text-sm font-semibold text-slate-200">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-surface-700/40">
              {notifications.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-slate-500">No notifications</li>
              )}
              {notifications.map(n => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-surface-700/30 transition-colors
                              ${!n.isRead ? 'bg-primary-900/10' : ''}`}
                >
                  <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {n.createdAt ? formatDistanceToNow(n.createdAt) : '—'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
