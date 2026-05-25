import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllProjects, createProject, deleteProject } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import { Plus, X } from 'lucide-react';

const emptyForm = { name: '', description: '', managerId: '', startDate: '', endDate: '' };

const ProjectsPage = () => {
  const { user }                  = useAuth();
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // All roles see all projects — employees are members of projects
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      console.error('Projects error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Project name is required.'); return; }
    setSubmitting(true);
    try {
      // If manager doesn't fill managerId, default to their own ID
      await createProject({
        ...form,
        managerId: form.managerId ? Number(form.managerId) : user.id,
      });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? This will also delete all its tasks.')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Projects</h1>
          <p className="text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <p className="mt-2 text-sm">No projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={isAdminOrManager ? handleDelete : null}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Create New Project</h2>
              <button onClick={() => { setShowModal(false); setError(''); }}
                className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { name: 'name',        label: 'Project Name *', type: 'text'   },
                { name: 'description', label: 'Description',    type: 'text'   },
                { name: 'managerId',   label: `Manager ID (default: your ID — ${user?.id})`, type: 'number' },
                { name: 'startDate',   label: 'Start Date',     type: 'date'   },
                { name: 'endDate',     label: 'End Date',       type: 'date'   },
              ].map(({ name, label, type }) => (
                <div key={name}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[name]}
                    onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm mt-2 transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;