import api from './api';

export const getMyProductivity = async (month, year) => {
  const res = await api.get('/productivity/me', { params: { month, year } });
  return res.data;
};

export const getTeamAnalytics = async (month, year) => {
  const res = await api.get('/productivity/team', { params: { month, year } });
  return res.data;
};

export const getEmployeeProductivity = async (id, month, year) => {
  const res = await api.get(`/productivity/employee/${id}`, { params: { month, year } });
  return res.data;
};