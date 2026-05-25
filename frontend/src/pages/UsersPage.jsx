import { useEffect, useState } from 'react';
import { getAllEmployees, getAllManagers } from '../services/userService';
import Loader from '../components/Loader';
import { Users, Search } from 'lucide-react';

const roleColors = {
  EMPLOYEE: 'bg-slate-100 text-slate-600',
  MANAGER:  'bg-blue-100 text-blue-700',
  ADMIN:    'bg-purple-100 text-purple-700',
};

const UsersPage = () => {
  const [employees, setEmployees]   = useState([]);
  const [managers, setManagers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [tab, setTab]               = useState('employees'); // 'employees' | 'managers'

  useEffect(() => {
    const load = async () => {
      try {
        const [emp, mgr] = await Promise.all([getAllEmployees(), getAllManagers()]);
        setEmployees(emp);
        setManagers(mgr);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const list = tab === 'employees' ? employees : managers;
  const q    = search.toLowerCase();
  const filtered = list.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
  );

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Team Members</h1>
          <p className="text-sm text-gray-500">
            {employees.length} employees · {managers.length} managers
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {['employees', 'managers'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize
              ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t} ({t === 'employees' ? employees.length : managers.length})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={36} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{search ? 'No users match your search.' : 'No users found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                {(u.fullName || u.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                  {u.department && (
                    <span className="text-xs text-gray-400">{u.department}</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;