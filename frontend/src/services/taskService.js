import api from './api';

export const getAllTasks         = async ()         => (await api.get('/tasks')).data;
export const getTasksByEmployee  = async (id)       => (await api.get(`/tasks/employee/${id}`)).data;
export const getTasksByProject   = async (id)       => (await api.get(`/tasks/project/${id}`)).data;
export const getTaskById         = async (id)       => (await api.get(`/tasks/${id}`)).data;
export const createTask          = async (data)     => (await api.post('/tasks', data)).data;
export const updateTask          = async (id, data) => (await api.put(`/tasks/${id}`, data)).data;
export const updateTaskProgress  = async (id, data) => (await api.patch(`/tasks/${id}/progress`, data)).data;
export const deleteTask          = async (id)       => (await api.delete(`/tasks/${id}`)).data;