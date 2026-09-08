import { api } from '@/api/axios';

export type Notification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function fetchNotifications() {
  const res = await api.get<{ success: true; data: Notification[] }>('/notifications');
  return res.data.data;
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all');
}
