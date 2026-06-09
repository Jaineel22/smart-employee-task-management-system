import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { RoleProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout   from './layouts/DashboardLayout';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import DashboardPage     from './pages/DashboardPage';
import ProjectsPage      from './pages/ProjectsPage';
import TasksPage         from './pages/TasksPage';
import ReportsPage       from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage       from './pages/ProfilePage';
import UsersPage         from './pages/UsersPage';
import AnalyticsPage     from './pages/AnalyticsPage';
import AttendancePage    from './pages/AttendancePage';
import PredictionPage    from './pages/PredictionPage';
import WorkforceIntelligencePage from './pages/WorkforceIntelligencePage';
// ✅ AI-5 & AI-6 IMPORTS
import RecommendationsPage from './pages/RecommendationsPage';
import RiskAnalyticsPage from './pages/RiskAnalyticsPage';
// ✅ FEATURE 1 & 2 IMPORTS
import ActivityIntelligencePage from './pages/ActivityIntelligencePage';
import TaskInterruptionPage from './pages/TaskInterruptionPage';

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Protected layout — all children require login */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />

      {/* MANAGER / ADMIN only */}
      <Route
        path="projects"
        element={
          <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <ProjectsPage />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="users"
        element={
          <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <UsersPage />
          </RoleProtectedRoute>
        }
      />

      {/* ANALYTICS ROUTE - MANAGER/ADMIN only */}
      <Route
        path="analytics"
        element={
          <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <AnalyticsPage />
          </RoleProtectedRoute>
        }
      />

      {/* AI PREDICTIONS ROUTE - MANAGER/ADMIN only */}
      <Route
        path="predictions"
        element={
          <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <PredictionPage />
          </RoleProtectedRoute>
        }
      />

      {/* WORKFORCE INTELLIGENCE ROUTE - All roles */}
      <Route
        path="workforce-intelligence"
        element={
          <ProtectedRoute>
            <WorkforceIntelligencePage />
          </ProtectedRoute>
        }
      />

      {/* AI-5: RECOMMENDATIONS ROUTE - All roles */}
      <Route
        path="recommendations"
        element={
          <ProtectedRoute>
            <RecommendationsPage />
          </ProtectedRoute>
        }
      />

      {/* AI-6: RISK ANALYTICS ROUTE - All roles */}
      <Route
        path="risk-analytics"
        element={
          <ProtectedRoute>
            <RiskAnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* ✅ FEATURE 1: ACTIVITY INTELLIGENCE - MANAGER/ADMIN only */}
      <Route
        path="activity-intelligence"
        element={
          <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <ActivityIntelligencePage />
          </RoleProtectedRoute>
        }
      />

      {/* ✅ FEATURE 2: TASK INTERRUPTIONS - All roles */}
      <Route
        path="task-interruptions"
        element={
          <ProtectedRoute>
            <TaskInterruptionPage />
          </ProtectedRoute>
        }
      />

      {/* All roles */}
      <Route path="tasks" element={<TasksPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      
      {/* ATTENDANCE ROUTE - All roles */}
      <Route path="attendance" element={<AttendancePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;