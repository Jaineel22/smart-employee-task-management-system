import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getTaskRisk = (taskId) =>
  axios
    .get(`${BASE}/risk/task/${taskId}`, { headers: authHeader() })
    .then(r => r.data);

export const getMyRisk = () =>
  axios
    .get(`${BASE}/risk/me`, { headers: authHeader() })
    .then(r => r.data);

export const getEmployeeRisk = (employeeId) =>
  axios
    .get(`${BASE}/risk/employee/${employeeId}`, { headers: authHeader() })
    .then(r => r.data);

export const getProjectRisk = (projectId) =>
  axios
    .get(`${BASE}/risk/project/${projectId}`, { headers: authHeader() })
    .then(r => r.data);

export const getTeamRisk = (month, year) =>
  axios
    .get(`${BASE}/risk/team`, {
      params:  { month, year },
      headers: authHeader(),
    })
    .then(r => r.data);

export const getCriticalTasks = () =>
  axios
    .get(`${BASE}/risk/critical`, { headers: authHeader() })
    .then(r => r.data);