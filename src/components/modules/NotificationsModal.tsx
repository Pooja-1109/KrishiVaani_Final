import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { NotificationItem } from '../../types';
import { Bell, CheckCheck, X, AlertCircle } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const getTitle = (n: NotificationItem) => {
    if (language === 'mr') return n.title_mr;
    if (language === 'hi') return n.title_hi;
    return n.title_en;
  };

  const getMessage = (n: NotificationItem) => {
    if (language === 'mr') return n.message_mr;
    if (language === 'hi') return n.message_hi;
    return n.message_en;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">{t.nav.notifications}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-stone-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t.notifications.markAllRead}</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-stone-100 text-xs space-y-1">
          {loading ? (
            <div className="py-8 text-center text-stone-500">{t.common.loading}</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-stone-500">{t.notifications.noNotifications}</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id ? `notif-${n.id}` : `notif-${n.created_at}`}
                className={`py-3 px-2 rounded-lg transition-colors ${
                  !n.read ? 'bg-emerald-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-stone-900">{getTitle(n)}</span>
                  <span className="text-[10px] text-stone-700 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-stone-600 mt-1 leading-relaxed">{getMessage(n)}</p>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
