import api from './api';

/**
 * predictionService.js
 * ====================
 * All calls go through Spring Boot (/api/predictions/*) which
 * proxies to the Python FastAPI service. If Python is offline,
 * Spring Boot returns a graceful fallback — this service never throws
 * on network errors from the AI layer.
 */

// GET /api/predictions/me?month=5&year=2026
// Logged-in employee's own next-month prediction
export const getMyPrediction = async (month, year) => {
  const res = await api.get('/predictions/me', { params: { month, year } });
  return res.data;
};

// GET /api/predictions/employee/{id}?month=5&year=2026
// Specific employee prediction (manager use)
export const getEmployeePrediction = async (id, month, year) => {
  const res = await api.get(`/predictions/employee/${id}`, {
    params: { month, year },
  });
  return res.data;
};

// GET /api/predictions/team?month=5&year=2026
// All employees' predictions — used by PredictionPage manager view
export const getTeamPredictions = async (month, year) => {
  const res = await api.get('/predictions/team', { params: { month, year } });
  return res.data; // returns List<PredictionResponse>
};

// GET /api/predictions/health
// Returns { aiServiceReachable: bool, message: string }
// Never throws — 200 always returned by Spring Boot
export const getAiHealth = async () => {
  const res = await api.get('/predictions/health');
  return res.data;
};