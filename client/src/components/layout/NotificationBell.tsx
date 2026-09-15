import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsRead } from '@/features/notifications/api';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });

  const unreadCount = data?.filter((n) => !n.isRead).length ?? 0;

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative text-paper-300 hover:text-brand-300"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-paper-50/15 bg-surface-50 shadow-lg">
          {!data || data.length === 0 ? (
            <p className="p-4 text-sm text-paper-400">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-paper-50/10 overflow-y-auto">
              {data.map((n) => (
                <li key={n._id} className="p-3 text-sm">
                  <p className="font-medium text-paper-50">{n.title}</p>
                  <p className="text-paper-400">{n.body}</p>
                  <p className="mt-1 text-xs text-paper-600">{new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
