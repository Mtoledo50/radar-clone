/**
 * =================================================================
 * NotificationCenter — Sino + dropdown de notificações (Fase E)
 * =================================================================
 * Ícone de sino no header com badge de não lidas.
 * Dropdown lista as últimas notificações com link para a página.
 * Botões: "Marcar como lida" (individual) e "Marcar todas" (topo).
 * =================================================================
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, FileText, Calendar, TrendingUp, Zap } from 'lucide-react';
import api from '@/lib/axios';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, any> = {
  BILLING_DUE: Calendar,
  BILLING_OVERDUE: AlertCircle,
  GUIDE_DUE: Calendar,
  TASK_OVERDUE: AlertCircle,
  PROPOSAL_VIEWED: TrendingUp,
  SYSTEM: Zap,
};

const TYPE_COLORS: Record<string, string> = {
  BILLING_DUE: 'bg-amber-100 text-amber-700',
  BILLING_OVERDUE: 'bg-red-100 text-red-700',
  GUIDE_DUE: 'bg-orange-100 text-orange-700',
  TASK_OVERDUE: 'bg-red-100 text-red-700',
  PROPOSAL_VIEWED: 'bg-green-100 text-green-700',
  SYSTEM: 'bg-blue-100 text-blue-700',
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Carrega notificações
  const load = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread'),
      ]);
      setNotifications(listRes.data);
      setUnread(countRes.data);
    } catch {}
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    setLoading(true);
    await api.patch('/notifications/read-all');
    await load();
    setLoading(false);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `há ${d}d`;
    if (h > 0) return `há ${h}h`;
    if (min > 0) return `há ${min}min`;
    return 'agora';
  };

  return (
    <div ref={ref} className="relative">
      {/* Botão sino */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-orange-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Notificações</h3>
              <p className="text-xs text-slate-600">
                {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia!'}
              </p>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                Nenhuma notificação ainda.
              </div>
            )}
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const color = TYPE_COLORS[n.type] || 'bg-slate-100 text-slate-700';
              return (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    !n.read ? 'bg-teal-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-teal-600"
                            title="Marcar como lida"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <a
                            href={n.link}
                            className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                          >
                            Abrir <FileText className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}