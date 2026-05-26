// import { useEffect, useState } from 'react';
// import { getAllEmployees, getAllManagers } from '../services/userService';
// import Loader from '../components/Loader';
// import { Users, Search } from 'lucide-react';

// const roleColors = {
//   EMPLOYEE: 'bg-slate-100 text-slate-600',
//   MANAGER:  'bg-blue-100 text-blue-700',
//   ADMIN:    'bg-purple-100 text-purple-700',
// };

// const UsersPage = () => {
//   const [employees, setEmployees]   = useState([]);
//   const [managers, setManagers]     = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [error, setError]           = useState('');
//   const [search, setSearch]         = useState('');
//   const [tab, setTab]               = useState('employees'); // 'employees' | 'managers'

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [emp, mgr] = await Promise.all([getAllEmployees(), getAllManagers()]);
//         setEmployees(emp);
//         setManagers(mgr);
//       } catch (err) {
//         setError(err.response?.data?.message || 'Failed to load users.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   const list = tab === 'employees' ? employees : managers;
//   const q    = search.toLowerCase();
//   const filtered = list.filter(
//     (u) =>
//       u.fullName?.toLowerCase().includes(q) ||
//       u.email?.toLowerCase().includes(q) ||
//       u.department?.toLowerCase().includes(q)
//   );

//   if (loading) return <Loader />;

//   return (
//     <div>
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
//         <div>
//           <h1 className="text-xl font-bold text-gray-800">Team Members</h1>
//           <p className="text-sm text-gray-500">
//             {employees.length} employees · {managers.length} managers
//           </p>
//         </div>
//         {/* Search */}
//         <div className="relative">
//           <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search by name, email, department…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
//           />
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
//         {['employees', 'managers'].map((t) => (
//           <button
//             key={t}
//             onClick={() => setTab(t)}
//             className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize
//               ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
//           >
//             {t} ({t === 'employees' ? employees.length : managers.length})
//           </button>
//         ))}
//       </div>

//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
//           {error}
//         </div>
//       )}

//       {filtered.length === 0 ? (
//         <div className="text-center py-16 text-gray-400">
//           <Users size={36} className="mx-auto mb-2 text-gray-300" />
//           <p className="text-sm">{search ? 'No users match your search.' : 'No users found.'}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filtered.map((u) => (
//             <div
//               key={u.id}
//               className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
//             >
//               {/* Avatar */}
//               <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
//                 {(u.fullName || u.email || '?').charAt(0).toUpperCase()}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
//                 <p className="text-xs text-gray-500 truncate">{u.email}</p>
//                 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
//                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
//                     {u.role}
//                   </span>
//                   {u.department && (
//                     <span className="text-xs text-gray-400">{u.department}</span>
//                   )}
//                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
//                     {u.isActive ? 'Active' : 'Inactive'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default UsersPage;






















import { useEffect, useState } from 'react';
import { getAllEmployees, getAllManagers } from '../services/userService';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';

const initials = (name) => name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
const avatarColors = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4'];

const UsersPage = () => {
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState('employees');

  useEffect(() => {
    const load = async () => {
      try {
        const [emp, mgr] = await Promise.all([getAllEmployees(), getAllManagers()]);
        setEmployees(emp); setManagers(mgr);
      } catch (err) { setError(err.response?.data?.message || 'Failed to load users.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const list = tab === 'employees' ? employees : managers;
  const q = search.toLowerCase();
  const filtered = list.filter(u =>
    u.fullName?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.department?.toLowerCase().includes(q)
  );

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Team Members</h1>
          <p className="text-xs text-slate-500">{employees.length} employees · {managers.length} managers</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search name, email, department…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 bg-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {['employees','managers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize
              ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t} ({t === 'employees' ? employees.length : managers.length})
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <Users size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No users found</p>
          <p className="text-xs text-slate-400 mt-1">{search ? 'Try adjusting your search' : 'No team members yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y:-2, boxShadow:'0 8px 24px rgba(0,0,0,0.07)' }}
              className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 cursor-default">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: avatarColors[(u.id||0) % avatarColors.length] }}>
                {initials(u.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{u.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {u.department && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">{u.department}</span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;