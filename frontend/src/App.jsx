// import { Routes, Route, Navigate } from 'react-router-dom';
// import ProtectedRoute, { RoleProtectedRoute } from './components/ProtectedRoute';
// import DashboardLayout   from './layouts/DashboardLayout';
// import LoginPage         from './pages/LoginPage';
// import RegisterPage      from './pages/RegisterPage';
// import DashboardPage     from './pages/DashboardPage';
// import ProjectsPage      from './pages/ProjectsPage';
// import TasksPage         from './pages/TasksPage';
// import ReportsPage       from './pages/ReportsPage';
// import NotificationsPage from './pages/NotificationsPage';
// import ProfilePage       from './pages/ProfilePage';
// import UsersPage         from './pages/UsersPage';

// const App = () => (
//   <Routes>
//     {/* Public */}
//     <Route path="/login"    element={<LoginPage />} />
//     <Route path="/register" element={<RegisterPage />} />

//     {/* Protected layout — all children require login */}
//     <Route
//       path="/"
//       element={
//         <ProtectedRoute>
//           <DashboardLayout />
//         </ProtectedRoute>
//       }
//     >
//       <Route index                element={<Navigate to="/dashboard" replace />} />
//       <Route path="dashboard"     element={<DashboardPage />} />

//       {/* MANAGER / ADMIN only */}
//       <Route
//         path="projects"
//         element={
//           <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
//             <ProjectsPage />
//           </RoleProtectedRoute>
//         }
//       />
//       <Route
//         path="users"
//         element={
//           <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}>
//             <UsersPage />
//           </RoleProtectedRoute>
//         }
//       />

//       {/* All roles */}
//       <Route path="tasks"         element={<TasksPage />} />
//       <Route path="reports"       element={<ReportsPage />} />
//       <Route path="notifications" element={<NotificationsPage />} />
//       <Route path="profile"       element={<ProfilePage />} />
//     </Route>

//     <Route path="*" element={<Navigate to="/dashboard" replace />} />
//   </Routes>
// );

// export default App;








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
import AttendancePage    from './pages/AttendancePage'; // ✅ ADDED import

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

      {/* All roles */}
      <Route path="tasks" element={<TasksPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      
      {/* ✅ ATTENDANCE ROUTE - All roles */}
      <Route path="attendance" element={<AttendancePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;