import api from './api';

export const getMyInsights   = async () =>
  (await api.get('/productivity/insights/me')).data;

export const getTeamInsights = async () =>
  (await api.get('/productivity/insights/team')).data;