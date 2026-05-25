import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protects any route from unauthenticated users
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Protects routes that require a specific role
// Usage: <RoleProtectedRoute roles={['MANAGER', 'ADMIN']}> ... </RoleProtectedRoute>
// If the user's role is not in the allowed list, they are sent to /dashboard
export const RoleProtectedRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();

  // Not logged in at all — go to login
  if (!user) return <Navigate to="/login" replace />;

  // Role not permitted — redirect to their own dashboard silently
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;