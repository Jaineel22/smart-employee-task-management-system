import { useState, useEffect, useRef } from 'react';
import { getAllProjects } from '../services/projectService';
import { FolderKanban, ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = {
  PLANNING:  '#F59E0B',
  ACTIVE:    '#10B981',
  ON_HOLD:   '#94A3B8',
  COMPLETED: '#3B82F6',
  CANCELLED: '#EF4444',
};

const ProjectSelect = ({ value, onChange, label }) => {
  const [projects, setProjects] = useState([]);
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);
  const ref                     = useRef(null);

  useEffect(() => {
    getAllProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (value && projects.length) {
      setSelected(projects.find(p => p.id === Number(value)) || null);
    } else {
      setSelected(null);
    }
  }, [value, projects]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = projects.filter(p =>
    !query || p.name?.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (p) => { setSelected(p); onChange(p.id); setOpen(false); setQuery(''); };
  const clear = (e) => { e.stopPropagation(); setSelected(null); onChange(''); };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm
          transition-all text-left
          ${open ? 'border-blue-500 ring-2 ring-blue-100 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      >
        {selected ? (
          <>
            <FolderKanban size={15} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate text-xs">{selected.name}</p>
              <p className="text-slate-400 text-xs">{selected.status} · ends {selected.endDate || 'TBD'}</p>
            </div>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: statusColors[selected.status] || '#94A3B8' }}
            />
            <button onClick={clear} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <FolderKanban size={15} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 flex-1 text-xs">Select project…</span>
            <ChevronDown size={14} className="text-slate-400" />
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
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                <Search size={13} className="text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search projects…"
                  className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">No projects found</div>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pick(p)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left
                      ${selected?.id === p.id ? 'bg-blue-50' : ''}`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[p.status] || '#94A3B8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.status} · {p.manager?.fullName || 'No manager'}</p>
                    </div>
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

export default ProjectSelect;