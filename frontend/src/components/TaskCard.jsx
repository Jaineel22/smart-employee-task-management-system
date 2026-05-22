// empty file
const statusColors = {
  PENDING:     'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-green-100 text-green-700',
  OVERDUE:     'bg-red-100 text-red-700',
};

const priorityColors = {
  LOW:    'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH:   'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

const TaskCard = ({ task, onUpdateProgress }) => {
  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString()
    : 'No deadline';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug">{task.title}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
          {task.status?.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-400">Due: {deadline}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{task.completionPercentage ?? 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${task.completionPercentage ?? 0}%` }}
          />
        </div>
      </div>

      {onUpdateProgress && (
        <button
          onClick={() => onUpdateProgress(task)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Update Progress →
        </button>
      )}
    </div>
  );
};

export default TaskCard;