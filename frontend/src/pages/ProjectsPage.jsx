import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllProjects, createProject, updateProject, deleteProject } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Pencil, FolderKanban } from 'lucide-react';

const STATUS_OPTIONS = ['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'];
const emptyForm = { name:'', description:'', managerId:'', startDate:'', endDate:'', status:'PLANNING' };
const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true); setError('');
    try { const d = await getAllProjects(); setProjects(d); setFiltered(d); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load projects.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(projects.filter(p =>
      p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.status?.toLowerCase().includes(q)
    ));
  }, [search, projects]);

  const openCreate = () => {
    setEditTarget(null); setForm({ ...emptyForm, managerId: user?.id ?? '' });
    setError(''); setShowModal(true);
  };

  const openEdit = (project) => {
    setEditTarget(project);
    setForm({ name: project.name||'', description: project.description||'',
      managerId: project.manager?.id ?? user?.id ?? '', startDate: project.startDate||'',
      endDate: project.endDate||'', status: project.status||'PLANNING' });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, managerId: form.managerId ? Number(form.managerId) : user?.id };
      if (editTarget) { await updateProject(editTarget.id, payload); showToast('Project updated.'); }
      else            { await createProject(payload); showToast('Project created.'); }
      setShowModal(false); setEditTarget(null); load();
    } catch (err) { setError(err.response?.data?.message || 'Operation failed.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try { await deleteProject(id); showToast('Project deleted.'); setProjects(p => p.filter(pr => pr.id !== id)); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Projects</h1>
          <p className="text-xs text-slate-500">{filtered.length} of {projects.length} projects</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 bg-white" />
          </div>
          {isManager && (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              <Plus size={14} /> New Project
            </button>
          )}
        </div>
      </div>

      {error && !showModal && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <FolderKanban size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">{search ? 'Try adjusting your search' : 'No projects created yet'}</p>
          {isManager && (
            <button onClick={openCreate} className="mt-4 flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
              <Plus size={13} /> Create first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <div key={project.id} className="relative group">
              <ProjectCard project={project} />
              {isManager && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(project)}
                    className="bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg shadow-sm">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(project.id)}
                    className="bg-white border border-slate-200 text-red-500 hover:bg-red-50 p-1.5 rounded-lg shadow-sm">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">{editTarget ? 'Edit Project' : 'Create New Project'}</h2>
                <button onClick={() => { setShowModal(false); setError(''); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Project Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Employee Portal v2" />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Manager ID <span className="text-slate-400 font-normal">(defaults to you: {user?.id})</span></label>
                  <input type="number" value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))} className={inputCls} placeholder={String(user?.id)} />
                </div>
                {editTarget && (
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {submitting ? (editTarget ? 'Saving…' : 'Creating…') : (editTarget ? 'Save Changes' : 'Create Project')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsPage;