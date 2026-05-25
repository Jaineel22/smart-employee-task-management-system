import api from './api';

// GET current logged-in user's profile from backend
export const getMyProfile = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

// GET any user by ID
export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

// UPDATE user fields (fullName, department, role, isActive)
export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

// GET all employees
export const getAllEmployees = async () => {
  const res = await api.get('/users/employees');
  return res.data;
};

// GET all managers
export const getAllManagers = async () => {
  const res = await api.get('/users/managers');
  return res.data;
};