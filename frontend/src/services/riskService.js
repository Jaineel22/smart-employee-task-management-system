// src/services/riskService.js
// AI-6: Deadline Risk Prediction API calls

import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * GET /api/risk/task/{taskId}
 * Risk prediction for a single task.
 */
export const getTaskRisk = (taskId) =>
  axios
    .get(`${BASE}/risk/task/${taskId}`, { headers: authHeader() })
    .then(r => r.data);

/**
 * GET /api/risk/me
 * Employee: risk summary for all own active tasks.
 */
export const getMyRisk = () =>
  axios
    .get(`${BASE}/risk/me`, { headers: authHeader() })
    .then(r => r.data);

/**
 * GET /api/risk/employee/{employeeId}
 * Manager: risk breakdown for a specific employee.
 */
export const getEmployeeRisk = (employeeId) =>
  axios
    .get(`${BASE}/risk/employee/${employeeId}`, { headers: authHeader() })
    .then(r => r.data);

/**
 * GET /api/risk/project/{projectId}
 * Manager: risk for all active tasks in a project.
 */
export const getProjectRisk = (projectId) =>
  axios
    .get(`${BASE}/risk/project/${projectId}`, { headers: authHeader() })
    .then(r => r.data);

/**
 * GET /api/risk/team
 * Manager: full team risk summary.
 */
export const getTeamRisk = (month, year) =>
  axios
    .get(`${BASE}/risk/team`, {
      params:  { month, year },
      headers: authHeader(),
    })
    .then(r => r.data);

/**
 * GET /api/risk/critical
 * Manager: all CRITICAL tasks across team.
 */
export const getCriticalTasks = () =>
  axios
    .get(`${BASE}/risk/critical`, { headers: authHeader() })
    .then(r => r.data);