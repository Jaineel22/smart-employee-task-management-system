// import { NavLink, useNavigate } from 'react-router-dom';
// import {
//   LayoutDashboard, FolderKanban, CheckSquare,
//   FileText, Bell, User, X, LogOut, Users
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// // Navigation items with optional role restriction
// // roles: undefined = visible to everyone; array = restricted to those roles
// const allNavItems = [
//   { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, roles: undefined },
//   { to: '/projects',      label: 'Projects',     icon: FolderKanban,    roles: ['MANAGER', 'ADMIN'] },
//   { to: '/tasks',         label: 'Tasks',        icon: CheckSquare,     roles: undefined },
//   { to: '/reports',       label: 'Reports',      icon: FileText,        roles: undefined },
//   { to: '/notifications', label: 'Notifications',icon: Bell,            roles: undefined },
//   { to: '/users',         label: 'Employees',    icon: Users,           roles: ['MANAGER', 'ADMIN'] },
//   { to: '/profile',       label: 'Profile',      icon: User,            roles: undefined },
// ];

// const Sidebar = ({ open, onClose }) => {
//   const { user, logoutUser } = useAuth();
//   const navigate             = useNavigate();

//   // Filter nav items based on current user's role
//   const navItems = allNavItems.filter((item) => {
//     if (!item.roles) return true;             // no restriction — show to all
//     return item.roles.includes(user?.role);   // restricted — check role
//   });

//   const handleLogout = () => {
//     logoutUser();
//     navigate('/login');
//   };

//   return (
//     <>
//       {/* Mobile overlay */}
//       {open && (
//         <div
//           className="fixed inset-0 bg-black/40 z-20 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       <aside className={`
//         fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 flex flex-col
//         transform transition-transform duration-300 ease-in-out
//         ${open ? 'translate-x-0' : '-translate-x-full'}
//         lg:translate-x-0 lg:static lg:z-auto
//       `}>
//         {/* Logo + role badge */}
//         <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
//           <div>
//             <p className="font-bold text-base text-white leading-tight">SmartTask</p>
//             <p className="text-xs text-slate-400">NCode Solutions</p>
//             {/* Role badge under logo */}
//             <span className={`
//               inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full
//               ${user?.role === 'MANAGER' || user?.role === 'ADMIN'
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-slate-700 text-slate-300'}
//             `}>
//               {user?.role}
//             </span>
//           </div>
//           <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
//             <X size={18} />
//           </button>
//         </div>

//         {/* Filtered nav links */}
//         <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
//           {navItems.map(({ to, label, icon: Icon }) => (
//             <NavLink
//               key={to}
//               to={to}
//               onClick={onClose}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
//                 ${isActive
//                   ? 'bg-blue-600 text-white'
//                   : 'text-slate-300 hover:bg-slate-800 hover:text-white'
//                 }`
//               }
//             >
//               <Icon size={17} />
//               {label}
//             </NavLink>
//           ))}
//         </nav>

//         {/* User info strip */}
//         <div className="px-5 py-3 border-t border-slate-700 border-b border-slate-700">
//           <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
//           <p className="text-xs text-slate-400 truncate">{user?.email}</p>
//         </div>

//         {/* Logout */}
//         <div className="p-4">
//           <button
//             onClick={handleLogout}
//             className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-red-600 hover:text-white rounded-xl transition-colors font-medium"
//           >
//             <LogOut size={17} />
//             Sign Out
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// };

// export default Sidebar;












// import { NavLink, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   LayoutDashboard, FolderKanban, CheckSquare, FileText,
//   Bell, User, Users, LogOut, ChevronLeft, ChevronRight, X
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const allNavItems = [
//   { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, roles: undefined },
//   { to: '/projects',      label: 'Projects',     icon: FolderKanban,    roles: ['MANAGER','ADMIN'] },
//   { to: '/tasks',         label: 'Tasks',        icon: CheckSquare,     roles: undefined },
//   { to: '/reports',       label: 'Reports',      icon: FileText,        roles: undefined },
//   { to: '/notifications', label: 'Notifications',icon: Bell,            roles: undefined },
//   { to: '/users',         label: 'Employees',    icon: Users,           roles: ['MANAGER','ADMIN'] },
//   { to: '/profile',       label: 'Profile',      icon: User,            roles: undefined },
// ];

// const initials = (name) => name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';

// const Sidebar = ({ collapsed, setCollapsed, mobileOpen, closeMobile }) => {
//   const { user, logoutUser } = useAuth();
//   const navigate             = useNavigate();

//   const navItems = allNavItems.filter(item =>
//     !item.roles || item.roles.includes(user?.role)
//   );

//   const handleLogout = () => { logoutUser(); navigate('/login'); };

//   const avatarColors = ['#3B82F6','#8B5CF6','#10B981'];
//   const avatarColor  = avatarColors[(user?.id || 0) % avatarColors.length];

//   const SidebarContent = ({ isMobile = false }) => (
//     <div className="flex flex-col h-full bg-[#0A1628] text-white">
//       {/* Logo row */}
//       <div className={`flex items-center h-14 border-b border-white/[0.07] px-4 flex-shrink-0 ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
//         <AnimatePresence mode="wait">
//           {(!collapsed || isMobile) && (
//             <motion.div
//               initial={{ opacity: 0, width: 0 }}
//               animate={{ opacity: 1, width: 'auto' }}
//               exit={{ opacity: 0, width: 0 }}
//               transition={{ duration: 0.2 }}
//               className="overflow-hidden"
//             >
//               <p className="font-bold text-sm text-white whitespace-nowrap">SmartTask</p>
//               <p className="text-[10px] text-blue-300 whitespace-nowrap">NCode Solutions</p>
//             </motion.div>
//           )}
//         </AnimatePresence>
//         {isMobile ? (
//           <button onClick={closeMobile} className="text-white/60 hover:text-white ml-auto">
//             <X size={18} />
//           </button>
//         ) : (
//           <button
//             onClick={() => setCollapsed(c => !c)}
//             className="text-white/40 hover:text-white transition-colors flex-shrink-0"
//           >
//             {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
//           </button>
//         )}
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
//         {navItems.map(({ to, label, icon: Icon }) => (
//           <NavLink
//             key={to}
//             to={to}
//             onClick={isMobile ? closeMobile : undefined}
//             title={collapsed && !isMobile ? label : undefined}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
//                transition-all duration-150 group relative
//                ${isActive
//                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
//                  : 'text-white/60 hover:text-white hover:bg-white/[0.07]'}`
//             }
//           >
//             {({ isActive }) => (
//               <>
//                 <Icon size={17} className="flex-shrink-0" />
//                 <AnimatePresence mode="wait">
//                   {(!collapsed || isMobile) && (
//                     <motion.span
//                       initial={{ opacity: 0, width: 0 }}
//                       animate={{ opacity: 1, width: 'auto' }}
//                       exit={{ opacity: 0, width: 0 }}
//                       transition={{ duration: 0.15 }}
//                       className="overflow-hidden whitespace-nowrap"
//                     >
//                       {label}
//                     </motion.span>
//                   )}
//                 </AnimatePresence>
//                 {/* Tooltip when collapsed */}
//                 {collapsed && !isMobile && (
//                   <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg
//                     opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
//                     {label}
//                   </div>
//                 )}
//               </>
//             )}
//           </NavLink>
//         ))}
//       </nav>

//       {/* User strip + logout */}
//       <div className="border-t border-white/[0.07] p-2 flex-shrink-0">
//         {(!collapsed || isMobile) && (
//           <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
//             <div
//               className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
//               style={{ background: avatarColor }}
//             >
//               {initials(user?.fullName)}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
//               <p className="text-[10px] text-white/40 truncate">{user?.role}</p>
//             </div>
//           </div>
//         )}
//         <button
//           onClick={handleLogout}
//           title={collapsed && !isMobile ? 'Sign out' : undefined}
//           className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/50
//             hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all
//             ${collapsed && !isMobile ? 'justify-center' : ''}`}
//         >
//           <LogOut size={16} className="flex-shrink-0" />
//           {(!collapsed || isMobile) && <span className="text-sm">Sign out</span>}
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <>
//       {/* Desktop sidebar */}
//       <motion.aside
//         animate={{ width: collapsed ? 64 : 240 }}
//         transition={{ duration: 0.25, ease: 'easeInOut' }}
//         className="hidden lg:flex flex-col h-screen flex-shrink-0 overflow-hidden"
//         style={{ width: collapsed ? 64 : 240 }}
//       >
//         <SidebarContent />
//       </motion.aside>

//       {/* Mobile overlay + drawer */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <>
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={closeMobile}
//               className="fixed inset-0 bg-black/50 z-30 lg:hidden"
//             />
//             <motion.aside
//               initial={{ x: -260 }}
//               animate={{ x: 0 }}
//               exit={{ x: -260 }}
//               transition={{ duration: 0.25, ease: 'easeInOut' }}
//               className="fixed top-0 left-0 h-full w-60 z-40 lg:hidden"
//             >
//               <SidebarContent isMobile />
//             </motion.aside>
//           </>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default Sidebar;
























import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileText,
  Bell,
  User,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const allNavItems = [
  { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, roles: undefined },
  { to: '/projects',      label: 'Projects',     icon: FolderKanban,    roles: ['MANAGER','ADMIN'] },

  // NEW ANALYTICS ENTRY ADDED
  { to: '/analytics',     label: 'Analytics',    icon: BarChart2,       roles: ['MANAGER', 'ADMIN'] },

  { to: '/tasks',         label: 'Tasks',        icon: CheckSquare,     roles: undefined },
  { to: '/reports',       label: 'Reports',      icon: FileText,        roles: undefined },
  { to: '/notifications', label: 'Notifications',icon: Bell,            roles: undefined },
  { to: '/users',         label: 'Employees',    icon: Users,           roles: ['MANAGER','ADMIN'] },
  { to: '/profile',       label: 'Profile',      icon: User,            roles: undefined },
];

const initials = (name) => name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, closeMobile }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const navItems = allNavItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const avatarColors = ['#3B82F6','#8B5CF6','#10B981'];
  const avatarColor = avatarColors[(user?.id || 0) % avatarColors.length];

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-[#0A1628] text-white">
      {/* Logo row */}
      <div className={`flex items-center h-14 border-b border-white/[0.07] px-4 flex-shrink-0 ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        <AnimatePresence mode="wait">
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-sm text-white whitespace-nowrap">SmartTask</p>
              <p className="text-[10px] text-blue-300 whitespace-nowrap">NCode Solutions</p>
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile ? (
          <button onClick={closeMobile} className="text-white/60 hover:text-white ml-auto">
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-white/40 hover:text-white transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={isMobile ? closeMobile : undefined}
            title={collapsed && !isMobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-150 group relative
               ${isActive
                 ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                 : 'text-white/60 hover:text-white hover:bg-white/[0.07]'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className="flex-shrink-0" />

                <AnimatePresence mode="wait">
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip when collapsed */}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User strip + logout */}
      <div className="border-t border-white/[0.07] p-2 flex-shrink-0">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: avatarColor }}
            >
              {initials(user?.fullName)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-white/40 truncate">
                {user?.role}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? 'Sign out' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/50
            hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all
            ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-sm">Sign out</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen flex-shrink-0 overflow-hidden"
        style={{ width: collapsed ? 64 : 240 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />

            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-full w-60 z-40 lg:hidden"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;