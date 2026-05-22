// empty file
const statusColors = {
  PLANNING:  'bg-yellow-100 text-yellow-700',
  ACTIVE:    'bg-green-100 text-green-700',
  ON_HOLD:   'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const ProjectCard = ({ project, onDelete }) => {
  const endDate = project.endDate
    ? new Date(project.endDate).toLocaleDateString()
    : 'No end date';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm">{project.name}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-600'}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Ends: {endDate}</span>
        <span>Manager: {project.manager?.fullName || '—'}</span>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(project.id)}
          className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default ProjectCard;