import api from './api';

export const getMyProfile = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};
export const getAllEmployees = async () => {
  const res = await api.get('/users/employees');
  return res.data;
};

export const getAllManagers = async () => {
  const res = await api.get('/users/managers');
  return res.data;
};