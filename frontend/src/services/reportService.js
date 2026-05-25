import api from './api';

export const getAllReports      = async ()         => (await api.get('/reports')).data;
export const getReportsByUser   = async (id)       => (await api.get(`/reports/user/${id}`)).data;
export const getReportById      = async (id)       => (await api.get(`/reports/${id}`)).data;
export const createReport       = async (data)     => (await api.post('/reports', data)).data;
export const updateReport       = async (id, data) => (await api.put(`/reports/${id}`, data)).data;
export const deleteReport       = async (id)       => (await api.delete(`/reports/${id}`)).data;