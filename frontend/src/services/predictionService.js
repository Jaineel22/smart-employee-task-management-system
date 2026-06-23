import api from './api';

export const getMyPrediction = async (month, year) => {
  const res = await api.get('/predictions/me', { params: { month, year } });
  return res.data;
};

export const getEmployeePrediction = async (id, month, year) => {
  const res = await api.get(`/predictions/employee/${id}`, {
    params: { month, year },
  });
  return res.data;
};

export const getTeamPredictions = async (month, year) => {
  const res = await api.get('/predictions/team', { params: { month, year } });
  return res.data; // returns List<PredictionResponse>
};

export const getAiHealth = async () => {
  const res = await api.get('/predictions/health');
  return res.data;
};