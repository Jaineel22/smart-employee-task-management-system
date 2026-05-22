// empty file
import api from './api';

export const getAdminDashboard = async () => {
  const res = await api.get('/dashboard/admin');
  return res.data;
};

export const getEmployeeDashboard = async (employeeId) => {
  const res = await api.get(`/dashboard/employee/${employeeId}`);
  return res.data;
};