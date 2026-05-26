// // empty file
// import { Menu, Bell } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const Navbar = ({ onMenuClick }) => {
//   const { user } = useAuth();

//   return (
//     <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
//       <button
//         onClick={onMenuClick}
//         className="lg:hidden text-gray-500 hover:text-gray-800 p-1"
//       >
//         <Menu size={22} />
//       </button>

//       <div className="hidden lg:block" />

//       <div className="flex items-center gap-3">
//         <span className="text-sm text-gray-600 hidden sm:block">
//           {user?.fullName || user?.email}
//         </span>
//         <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
//           {user?.role}
//         </span>
//         <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
//           {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Navbar;















import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const initials = (name) => name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
const avatarColors = ['#3B82F6','#8B5CF6','#10B981'];

const Navbar = ({ onMenuClick }) => {
  const { user, logoutUser }   = useAuth();
  const navigate               = useNavigate();
  const [dropOpen, setDropOpen]= useState(false);
  const ref                    = useRef(null);

  const avatarColor = avatarColors[(user?.id || 0) % avatarColors.length];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-10 shadow-sm flex-shrink-0">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-800 p-1">
        <Menu size={20} />
      </button>

      {/* Breadcrumb / page context */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
        >
          <Bell size={18} />
        </button>

        {/* Profile dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: avatarColor }}
            >
              {initials(user?.fullName)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName?.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.role}</p>
            </div>
            <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {dropOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.fullName}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    {user?.role}
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { navigate('/profile'); setDropOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button
                    onClick={() => { logoutUser(); navigate('/login'); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;