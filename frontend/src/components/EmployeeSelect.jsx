import { useState, useEffect, useRef } from 'react';
import { getAllEmployees } from '../services/userService';
import { Search, User, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeSelect = ({ value, onChange, placeholder = "Select employee…", label }) => {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [selected, setSelected]   = useState(null);
  const ref                       = useRef(null);

  useEffect(() => {
    getAllEmployees().then(setEmployees).catch(() => {});
  }, []);

  // Sync external value → selected display
  useEffect(() => {
    if (value && employees.length) {
      const emp = employees.find(e => e.id === Number(value));
      setSelected(emp || null);
    } else {
      setSelected(null);
    }
  }, [value, employees]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = employees.filter(e =>
    !query ||
    e.fullName?.toLowerCase().includes(query.toLowerCase()) ||
    e.email?.toLowerCase().includes(query.toLowerCase()) ||
    e.department?.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (emp) => {
    setSelected(emp);
    onChange(emp.id);
    setOpen(false);
    setQuery('');
  };

  const clear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onChange('');
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';
  const avatarColor = (id) => {
    const colors = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4'];
    return colors[(id || 0) % colors.length];
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm
          transition-all text-left
          ${open
            ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
            : 'border-slate-200 bg-white hover:border-slate-300'}`}
      >
        {selected ? (
          <>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: avatarColor(selected.id) }}
            >
              {initials(selected.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate text-xs">{selected.fullName}</p>
              <p className="text-slate-400 text-xs truncate">{selected.department || selected.email}</p>
            </div>
            <button onClick={clear} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <User size={15} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 flex-1">{placeholder}</span>
            <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                <Search size={13} className="text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email, department…"
                  className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">No employees found</div>
              ) : (
                filtered.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => pick(emp)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left
                      ${selected?.id === emp.id ? 'bg-blue-50' : ''}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: avatarColor(emp.id) }}
                    >
                      {initials(emp.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{emp.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{emp.department || '—'} · {emp.email}</p>
                    </div>
                    <span className="text-xs text-slate-300 flex-shrink-0">ID:{emp.id}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeSelect;