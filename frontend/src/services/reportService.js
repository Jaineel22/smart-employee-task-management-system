import axios from 'axios'; 

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllReports = () =>
  axios.get(`${BASE}/reports`, { headers: authHeader() }).then(r => r.data);

export const getReportsByUser = (userId) =>
  axios.get(`${BASE}/reports/user/${userId}`, { headers: authHeader() }).then(r => r.data);

export const getReportById = (id) =>
  axios.get(`${BASE}/reports/${id}`, { headers: authHeader() }).then(r => r.data);

export const createReport = (data) =>
  axios.post(`${BASE}/reports`, data, { headers: authHeader() }).then(r => r.data);

export const updateReport = (id, data) =>
  axios.put(`${BASE}/reports/${id}`, data, { headers: authHeader() }).then(r => r.data);

export const deleteReport = (id) =>
  axios.delete(`${BASE}/reports/${id}`, { headers: authHeader() }).then(r => r.data);

export const getAllActivityReports = () =>
  axios.get(`${BASE}/reports/activity`, { headers: authHeader() }).then(r => r.data);

export const getActivityReportsByUser = (userId) =>
  axios.get(`${BASE}/reports/activity/user/${userId}`, { headers: authHeader() }).then(r => r.data);

export const getActivityReportsByDate = (date) =>
  axios.get(`${BASE}/reports/activity/date/${date}`, { headers: authHeader() }).then(r => r.data);

export const pauseTask = (taskId, payload) =>
  axios.post(`${BASE}/tasks/${taskId}/pause`, payload, { headers: authHeader() }).then(r => r.data);

export const resumeTask = (taskId, payload) =>
  axios.post(`${BASE}/tasks/${taskId}/resume`, payload, { headers: authHeader() }).then(r => r.data);

export const getTaskInterruptions = (taskId) =>
  axios.get(`${BASE}/tasks/${taskId}/interruptions`, { headers: authHeader() }).then(r => r.data);

export const getEmployeeInterruptions = (employeeId) =>
  axios.get(`${BASE}/interruptions/employee/${employeeId}`, { headers: authHeader() }).then(r => r.data);

export const getMyPausedTasks = () =>
  axios.get(`${BASE}/interruptions/paused/me`, { headers: authHeader() }).then(r => r.data);

export const getAllPausedTasks = () =>
  axios.get(`${BASE}/interruptions/paused`, { headers: authHeader() }).then(r => r.data);

export const getInterruptionAnalytics = () =>
  axios.get(`${BASE}/interruptions/analytics`, { headers: authHeader() }).then(r => r.data);