// empty file
import api from './api';

export const getAllProjects       = async ()         => (await api.get('/projects')).data;
export const getProjectsByManager = async (id)       => (await api.get(`/projects/manager/${id}`)).data;
export const createProject        = async (data)     => (await api.post('/projects', data)).data;
export const updateProject        = async (id, data) => (await api.put(`/projects/${id}`, data)).data;
export const deleteProject        = async (id)       => (await api.delete(`/projects/${id}`)).data;