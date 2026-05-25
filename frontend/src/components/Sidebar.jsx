import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  FileText, Bell, User, X, LogOut, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Navigation items with optional role restriction
// roles: undefined = visible to everyone; array = restricted to those roles
const allNavItems = [
  { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, roles: undefined },
  { to: '/projects',      label: 'Projects',     icon: FolderKanban,    roles: ['MANAGER', 'ADMIN'] },
  { to: '/tasks',         label: 'Tasks',        icon: CheckSquare,     roles: undefined },
  { to: '/reports',       label: 'Reports',      icon: FileText,        roles: undefined },
  { to: '/notifications', label: 'Notifications',icon: Bell,            roles: undefined },
  { to: '/users',         label: 'Employees',    icon: Users,           roles: ['MANAGER', 'ADMIN'] },
  { to: '/profile',       label: 'Profile',      icon: User,            roles: undefined },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logoutUser } = useAuth();
  const navigate             = useNavigate();

  // Filter nav items based on current user's role
  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true;             // no restriction — show to all
    return item.roles.includes(user?.role);   // restricted — check role
  });

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo + role badge */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div>
            <p className="font-bold text-base text-white leading-tight">SmartTask</p>
            <p className="text-xs text-slate-400">NCode Solutions</p>
            {/* Role badge under logo */}
            <span className={`
              inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full
              ${user?.role === 'MANAGER' || user?.role === 'ADMIN'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300'}
            `}>
              {user?.role}
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Filtered nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info strip */}
        <div className="px-5 py-3 border-t border-slate-700 border-b border-slate-700">
          <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-red-600 hover:text-white rounded-xl transition-colors font-medium"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;