import api from './api';

export const getNotificationsByUser = async (id) => (await api.get(`/notifications/user/${id}`)).data;
export const getUnreadNotifications  = async (id) => (await api.get(`/notifications/user/${id}/unread`)).data;
export const markAsRead              = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
export const deleteNotification      = async (id) => (await api.delete(`/notifications/${id}`)).data;