import api from './api';

export const clockIn  = async (remarks = null) =>
  (await api.post('/attendance/clock-in', { remarks })).data;

export const clockOut = async (remarks = null) =>
  (await api.post('/attendance/clock-out', { remarks })).data;

export const getMyHistory = async () =>
  (await api.get('/attendance/my-history')).data;

export const getMySummary = async (month, year) =>
  (await api.get('/attendance/my-summary', { params: { month, year } })).data;

export const getTeamAttendance = async (month, year) =>
  (await api.get('/attendance/team', { params: { month, year } })).data;

export const getEmployeeAttendance = async (id) =>
  (await api.get(`/attendance/employee/${id}`)).data;

export const getDashboardSummary = async () =>
  (await api.get('/attendance/dashboard-summary')).data;