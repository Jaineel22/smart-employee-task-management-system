import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute   from './components/ProtectedRoute';
import DashboardLayout  from './layouts/DashboardLayout';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import ProjectsPage     from './pages/ProjectsPage';
import TasksPage        from './pages/TasksPage';
import ReportsPage      from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage      from './pages/ProfilePage';

const App = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Protected routes — all share DashboardLayout (sidebar + navbar) */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index                  element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"       element={<DashboardPage />} />
      <Route path="projects"        element={<ProjectsPage />} />
      <Route path="tasks"           element={<TasksPage />} />
      <Route path="reports"         element={<ReportsPage />} />
      <Route path="notifications"   element={<NotificationsPage />} />
      <Route path="profile"         element={<ProfilePage />} />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;