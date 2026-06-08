// frontend/src/services/recommendationService.js
// AI-5: Recommendation Engine API calls

import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * GET /api/recommendations/me
 * Returns the authenticated employee's own recommendations.
 */
export const getMyRecommendations = (month, year) =>
  axios
    .get(`${BASE}/recommendations/me`, {
      params:  { month, year },
      headers: authHeader(),
    })
    .then(r => r.data)
    .catch(err => {
      console.error('Error fetching recommendations:', err);
      return null;
    });

/**
 * GET /api/recommendations/employee/{id}
 * Manager: fetch recommendations for a specific employee.
 */
export const getEmployeeRecommendations = (employeeId, month, year) =>
  axios
    .get(`${BASE}/recommendations/employee/${employeeId}`, {
      params:  { month, year },
      headers: authHeader(),
    })
    .then(r => r.data)
    .catch(err => {
      console.error('Error fetching employee recommendations:', err);
      return null;
    });

/**
 * GET /api/recommendations/team
 * Manager: fetch team-wide recommendations + per-employee breakdown.
 */
export const getTeamRecommendations = (month, year) =>
  axios
    .get(`${BASE}/recommendations/team`, {
      params:  { month, year },
      headers: authHeader(),
    })
    .then(r => r.data)
    .catch(err => {
      console.error('Error fetching team recommendations:', err);
      return null;
    });

/**
 * GET /api/recommendations/project/{projectId}
 * Manager: fetch recommendations for all employees on a project.
 */
export const getProjectRecommendations = (projectId, month, year) =>
  axios
    .get(`${BASE}/recommendations/project/${projectId}`, {
      params:  { month, year },
      headers: authHeader(),
    })
    .then(r => r.data)
    .catch(err => {
      console.error('Error fetching project recommendations:', err);
      return null;
    });