// import { useEffect, useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import {
//   getAllTasks, getTasksByEmployee,
//   createTask, updateTask, updateTaskProgress, deleteTask
// } from '../services/taskService';
// import TaskCard from '../components/TaskCard';
// import Loader from '../components/Loader';
// import { Plus, X, Search, Pencil } from 'lucide-react';

// const STATUSES   = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
// const PRIORITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// const emptyForm = {
//   title: '', description: '', priority: 'MEDIUM',
//   deadline: '', assignedToId: '', assignedById: '', projectId: '',
// };

// const emptyProgress = { taskStatus: 'PENDING', completionPercentage: 0 };

// const TasksPage = () => {
//   const { user } = useAuth();

//   const [tasks, setTasks]           = useState([]);
//   const [filtered, setFiltered]     = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [error, setError]           = useState('');
//   const [toast, setToast]           = useState('');

//   // Filters
//   const [search, setSearch]         = useState('');
//   const [statusFilter, setStatus]   = useState('ALL');
//   const [priorityFilter, setPriority] = useState('ALL');

//   // Create/Edit modal
//   const [showForm, setShowForm]     = useState(false);
//   const [editTarget, setEditTarget] = useState(null);
//   const [form, setForm]             = useState(emptyForm);
//   const [submitting, setSubmitting] = useState(false);
//   const [formError, setFormError]   = useState('');

//   // Progress modal
//   const [selected, setSelected]     = useState(null);
//   const [progress, setProgress]     = useState(emptyProgress);
//   const [saving, setSaving]         = useState(false);

//   const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

//   /* ── load ───────────────────────────────────────── */
//   const load = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const data = isAdminOrManager
//         ? await getAllTasks()
//         : await getTasksByEmployee(user.id);
//       setTasks(data);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to load tasks.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { if (user) load(); }, [user]);

//   /* ── filter + search ────────────────────────────── */
//   useEffect(() => {
//     let result = [...tasks];
//     const q = search.toLowerCase();

//     if (q) {
//       result = result.filter(
//         (t) =>
//           t.title?.toLowerCase().includes(q) ||
//           t.description?.toLowerCase().includes(q)
//       );
//     }
//     if (statusFilter !== 'ALL') {
//       result = result.filter((t) => t.status === statusFilter);
//     }
//     if (priorityFilter !== 'ALL') {
//       result = result.filter((t) => t.priority === priorityFilter);
//     }
//     setFiltered(result);
//   }, [tasks, search, statusFilter, priorityFilter]);

//   /* ── toast ──────────────────────────────────────── */
//   const showToast = (msg) => {
//     setToast(msg);
//     setTimeout(() => setToast(''), 3000);
//   };

//   /* ── open create ────────────────────────────────── */
//   const openCreate = () => {
//     setEditTarget(null);
//     setForm({ ...emptyForm, assignedById: user?.id ?? '' });
//     setFormError('');
//     setShowForm(true);
//   };

//   /* ── open edit ──────────────────────────────────── */
//   const openEdit = (task) => {
//     setEditTarget(task);
//     setForm({
//       title:        task.title        || '',
//       description:  task.description  || '',
//       priority:     task.priority     || 'MEDIUM',
//       deadline:     task.deadline ? task.deadline.substring(0, 16) : '',
//       assignedToId: task.assignedTo?.id  ?? '',
//       assignedById: task.assignedBy?.id  ?? user?.id ?? '',
//       projectId:    task.project?.id     ?? '',
//     });
//     setFormError('');
//     setShowForm(true);
//   };

//   /* ── submit form ────────────────────────────────── */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setFormError('');

//     if (!form.title.trim())   { setFormError('Task title is required.');   return; }
//     if (!form.projectId)      { setFormError('Project ID is required.');   return; }
//     if (!form.assignedToId)   { setFormError('Assigned To ID is required.'); return; }

//     setSubmitting(true);
//     try {
//       const payload = {
//         title:        form.title,
//         description:  form.description,
//         priority:     form.priority,
//         deadline:     form.deadline || null,
//         assignedToId: Number(form.assignedToId),
//         assignedById: Number(form.assignedById) || user?.id,
//         projectId:    Number(form.projectId),
//       };

//       if (editTarget) {
//         await updateTask(editTarget.id, payload);
//         showToast('Task updated successfully.');
//       } else {
//         await createTask(payload);
//         showToast('Task created successfully.');
//       }

//       setShowForm(false);
//       setEditTarget(null);
//       load();
//     } catch (err) {
//       setFormError(err.response?.data?.message || 'Operation failed.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   /* ── delete ─────────────────────────────────────── */
//   const handleDelete = async (id) => {
//     if (!window.confirm('Delete this task?')) return;
//     try {
//       await deleteTask(id);
//       showToast('Task deleted.');
//       setTasks((prev) => prev.filter((t) => t.id !== id));
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to delete task.');
//     }
//   };

//   /* ── progress modal ─────────────────────────────── */
//   const openProgress = (task) => {
//     setSelected(task);
//     setProgress({ taskStatus: task.status, completionPercentage: task.completionPercentage ?? 0 });
//   };

//   const handleSaveProgress = async () => {
//     setSaving(true);
//     try {
//       await updateTaskProgress(selected.id, progress);
//       showToast('Progress updated.');
//       setSelected(null);
//       load();
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to update progress.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ── render ─────────────────────────────────────── */
//   if (loading) return <Loader />;

//   return (
//     <div>
//       {/* Toast */}
//       {toast && (
//         <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
//           {toast}
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
//         <div>
//           <h1 className="text-xl font-bold text-gray-800">Tasks</h1>
//           <p className="text-sm text-gray-500">
//             {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
//           </p>
//         </div>
//         <div className="flex items-center gap-2 flex-wrap">
//           <div className="relative">
//             <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search tasks…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
//             />
//           </div>
//           {isAdminOrManager && (
//             <button
//               onClick={openCreate}
//               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
//             >
//               <Plus size={16} /> New Task
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Filter bar */}
//       <div className="flex flex-wrap gap-2 mb-5">
//         <div className="flex gap-1 flex-wrap">
//           {STATUSES.map((s) => (
//             <button
//               key={s}
//               onClick={() => setStatus(s)}
//               className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
//                 ${statusFilter === s
//                   ? 'bg-blue-600 text-white border-blue-600'
//                   : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
//             >
//               {s === 'ALL' ? 'All Status' : s.replace('_', ' ')}
//             </button>
//           ))}
//         </div>
//         <div className="flex gap-1 flex-wrap">
//           {PRIORITIES.map((p) => (
//             <button
//               key={p}
//               onClick={() => setPriority(p)}
//               className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
//                 ${priorityFilter === p
//                   ? 'bg-slate-700 text-white border-slate-700'
//                   : 'bg-white text-gray-600 border-gray-200 hover:border-slate-300'}`}
//             >
//               {p === 'ALL' ? 'All Priority' : p}
//             </button>
//           ))}
//         </div>
//       </div>

//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
//           {error}
//         </div>
//       )}

//       {/* Task grid */}
//       {filtered.length === 0 ? (
//         <p className="text-center py-16 text-gray-400 text-sm">
//           {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
//             ? 'No tasks match your filters.'
//             : 'No tasks yet.'}
//         </p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filtered.map((task) => (
//             <div key={task.id} className="relative group">
//               <TaskCard task={task} onUpdateProgress={openProgress} />
//               {isAdminOrManager && (
//                 <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                   <button
//                     onClick={() => openEdit(task)}
//                     className="bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg shadow-sm"
//                     title="Edit task"
//                   >
//                     <Pencil size={13} />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(task.id)}
//                     className="bg-white border border-gray-200 text-red-500 hover:bg-red-50 p-1.5 rounded-lg shadow-sm"
//                     title="Delete task"
//                   >
//                     <X size={13} />
//                   </button>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ── Create / Edit Modal ── */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="font-semibold text-gray-800">
//                 {editTarget ? 'Edit Task' : 'Create New Task'}
//               </h2>
//               <button
//                 onClick={() => { setShowForm(false); setFormError(''); }}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             {formError && (
//               <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">
//                 {formError}
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-3">
//               {/* Title */}
//               <div>
//                 <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
//                 <input
//                   type="text"
//                   value={form.title}
//                   onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
//                   className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="e.g. Design login UI"
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
//                 <textarea
//                   rows={2}
//                   value={form.description}
//                   onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
//                   className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
//                 />
//               </div>

//               {/* Priority + Deadline */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 block mb-1">Priority</label>
//                   <select
//                     value={form.priority}
//                     onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
//                     className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((pr) => (
//                       <option key={pr} value={pr}>{pr}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 block mb-1">Deadline</label>
//                   <input
//                     type="datetime-local"
//                     value={form.deadline}
//                     onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
//                     className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>

//               {/* Project + Assignee IDs */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 block mb-1">Project ID *</label>
//                   <input
//                     type="number"
//                     value={form.projectId}
//                     onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
//                     className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="e.g. 1"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 block mb-1">Assign To (User ID) *</label>
//                   <input
//                     type="number"
//                     value={form.assignedToId}
//                     onChange={(e) => setForm((p) => ({ ...p, assignedToId: e.target.value }))}
//                     className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Employee ID"
//                   />
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={submitting}
//                 className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
//               >
//                 {submitting
//                   ? (editTarget ? 'Saving…' : 'Creating…')
//                   : (editTarget ? 'Save Changes' : 'Create Task')}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* ── Progress Modal ── */}
//       {selected && (
//         <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="font-semibold text-gray-800 text-sm">Update Progress</h2>
//               <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
//                 <X size={18} />
//               </button>
//             </div>
//             <p className="text-xs text-gray-500 mb-4 truncate">{selected.title}</p>

//             <div className="space-y-4">
//               <div>
//                 <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
//                 <select
//                   value={progress.taskStatus}
//                   onChange={(e) => setProgress((p) => ({ ...p, taskStatus: e.target.value }))}
//                   className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((s) => (
//                     <option key={s} value={s}>{s.replace('_', ' ')}</option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="text-xs font-medium text-gray-600 block mb-1">
//                   Completion: {progress.completionPercentage}%
//                 </label>
//                 <input
//                   type="range"
//                   min={0}
//                   max={100}
//                   value={progress.completionPercentage}
//                   onChange={(e) =>
//                     setProgress((p) => ({ ...p, completionPercentage: Number(e.target.value) }))
//                   }
//                   className="w-full accent-blue-600"
//                 />
//               </div>

//               <button
//                 onClick={handleSaveProgress}
//                 disabled={saving}
//                 className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
//               >
//                 {saving ? 'Saving…' : 'Save Progress'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TasksPage;





























import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllTasks, getTasksByEmployee, createTask, updateTask, updateTaskProgress, deleteTask } from '../services/taskService';
import TaskCard from '../components/TaskCard';
import EmployeeSelect from '../components/EmployeeSelect';
import ProjectSelect  from '../components/ProjectSelect';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Pencil, CheckSquare } from 'lucide-react';

const STATUSES   = ['ALL','PENDING','IN_PROGRESS','COMPLETED','OVERDUE'];
const PRIORITIES = ['ALL','LOW','MEDIUM','HIGH','URGENT'];

const emptyForm = { title:'', description:'', priority:'MEDIUM', deadline:'', assignedToId:'', assignedById:'', projectId:'' };
const emptyProgress = { taskStatus:'PENDING', completionPercentage:0 };

const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const selectCls = inputCls;

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus]   = useState('ALL');
  const [priorityFilter, setPriority] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(emptyProgress);
  const [saving, setSaving]     = useState(false);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = isManager ? await getAllTasks() : await getTasksByEmployee(user.id);
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    let r = [...tasks];
    const q = search.toLowerCase();
    if (q) r = r.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    if (statusFilter !== 'ALL')   r = r.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'ALL') r = r.filter(t => t.priority === priorityFilter);
    setFiltered(r);
  }, [tasks, search, statusFilter, priorityFilter]);

  const openCreate = () => {
    setEditTarget(null); setForm({ ...emptyForm, assignedById: user?.id ?? '' });
    setFormError(''); setShowForm(true);
  };

  const openEdit = (task) => {
    setEditTarget(task);
    setForm({
      title:        task.title        || '',
      description:  task.description  || '',
      priority:     task.priority     || 'MEDIUM',
      deadline:     task.deadline ? task.deadline.substring(0,16) : '',
      assignedToId: task.assignedTo?.id  ?? '',
      assignedById: task.assignedBy?.id  ?? user?.id ?? '',
      projectId:    task.project?.id     ?? '',
    });
    setFormError(''); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.title.trim())  { setFormError('Task title is required.'); return; }
    if (!form.projectId)     { setFormError('Please select a project.'); return; }
    if (!form.assignedToId)  { setFormError('Please select an employee.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        title:        form.title,
        description:  form.description,
        priority:     form.priority,
        deadline:     form.deadline || null,
        assignedToId: Number(form.assignedToId),
        assignedById: Number(form.assignedById) || user?.id,
        projectId:    Number(form.projectId),
      };
      if (editTarget) { await updateTask(editTarget.id, payload); showToast('Task updated.'); }
      else            { await createTask(payload); showToast('Task created.'); }
      setShowForm(false); setEditTarget(null); load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await deleteTask(id); showToast('Task deleted.'); setTasks(p => p.filter(t => t.id !== id)); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
  };

  const openProgress = (task) => {
    setSelected(task);
    setProgress({ taskStatus: task.status, completionPercentage: task.completionPercentage ?? 0 });
  };

  // Smart progress rules
  const handleStatusChange = (status) => {
    let pct = progress.completionPercentage;
    if (status === 'COMPLETED') pct = 100;
    else if (status === 'PENDING') pct = 0;
    setProgress({ taskStatus: status, completionPercentage: pct });
  };

  const handlePctChange = (pct) => {
    let status = progress.taskStatus;
    if (pct === 100) status = 'COMPLETED';
    else if (pct === 0) status = 'PENDING';
    else if (status === 'PENDING' || status === 'COMPLETED') status = 'IN_PROGRESS';
    setProgress({ taskStatus: status, completionPercentage: pct });
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await updateTaskProgress(selected.id, progress);
      showToast('Progress updated.'); setSelected(null); load();
    } catch (err) { alert(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Tasks</h1>
          <p className="text-xs text-slate-500">{filtered.length} of {tasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 bg-white" />
          </div>
          {isManager && (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              <Plus size={14} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
              ${statusFilter===s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
            {s === 'ALL' ? 'All Status' : s.replace('_',' ')}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-200 self-center mx-1" />
        {PRIORITIES.map(p => (
          <button key={p} onClick={() => setPriority(p)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors
              ${priorityFilter===p ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {p === 'ALL' ? 'All Priority' : p}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <CheckSquare size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No tasks found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? 'Try adjusting your filters' : 'No tasks assigned yet'}
          </p>
          {isManager && (
            <button onClick={openCreate}
              className="mt-4 flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
              <Plus size={13} /> Create first task
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(task => (
            <div key={task.id} className="relative group">
              <TaskCard task={task} onUpdateProgress={openProgress} />
              {isManager && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(task)}
                    className="bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg shadow-sm">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(task.id)}
                    className="bg-white border border-slate-200 text-red-500 hover:bg-red-50 p-1.5 rounded-lg shadow-sm">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">{editTarget ? 'Edit Task' : 'Create New Task'}</h2>
                <button onClick={() => { setShowForm(false); setFormError(''); }}
                  className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>

              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">{formError}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Title *</label>
                  <input type="text" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className={inputCls} placeholder="e.g. Design login UI" />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className={`${inputCls} resize-none`} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={selectCls}>
                      {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Deadline</label>
                    <input type="datetime-local" value={form.deadline}
                      onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className={inputCls} />
                  </div>
                </div>

                {/* Smart dropdowns */}
                <ProjectSelect
                  value={form.projectId}
                  onChange={(id) => setForm(p => ({ ...p, projectId: id }))}
                  label="Project *"
                />

                <EmployeeSelect
                  value={form.assignedToId}
                  onChange={(id) => setForm(p => ({ ...p, assignedToId: id }))}
                  label="Assign To *"
                />

                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {submitting ? (editTarget ? 'Saving…' : 'Creating…') : (editTarget ? 'Save Changes' : 'Create Task')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800">Update Progress</h2>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              <p className="text-xs text-slate-500 mb-5 truncate font-medium">{selected.title}</p>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={progress.taskStatus}
                    onChange={e => handleStatusChange(e.target.value)} className={selectCls}>
                    {['PENDING','IN_PROGRESS','COMPLETED','OVERDUE'].map(s => (
                      <option key={s} value={s}>{s.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`${labelCls} mb-0`}>Completion</label>
                    <span className="text-sm font-bold text-blue-600">{progress.completionPercentage}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={progress.completionPercentage}
                    onChange={e => handlePctChange(Number(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <motion.div
                      animate={{ width: `${progress.completionPercentage}%` }}
                      className={`h-full rounded-full ${progress.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>

                <button onClick={handleSaveProgress} disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {saving ? 'Saving…' : 'Save Progress'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;