// // empty file
// const statusColors = {
//   PENDING:     'bg-yellow-100 text-yellow-700',
//   IN_PROGRESS: 'bg-blue-100 text-blue-700',
//   COMPLETED:   'bg-green-100 text-green-700',
//   OVERDUE:     'bg-red-100 text-red-700',
// };

// const priorityColors = {
//   LOW:    'bg-gray-100 text-gray-600',
//   MEDIUM: 'bg-blue-100 text-blue-600',
//   HIGH:   'bg-orange-100 text-orange-600',
//   URGENT: 'bg-red-100 text-red-600',
// };

// const TaskCard = ({ task, onUpdateProgress }) => {
//   const deadline = task.deadline
//     ? new Date(task.deadline).toLocaleDateString()
//     : 'No deadline';

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between gap-2 mb-3">
//         <h3 className="font-semibold text-gray-800 text-sm leading-snug">{task.title}</h3>
//         <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
//           {task.priority}
//         </span>
//       </div>

//       {task.description && (
//         <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
//       )}

//       <div className="flex items-center gap-2 mb-3">
//         <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
//           {task.status?.replace('_', ' ')}
//         </span>
//         <span className="text-xs text-gray-400">Due: {deadline}</span>
//       </div>

//       {/* Progress bar */}
//       <div className="mb-3">
//         <div className="flex justify-between text-xs text-gray-500 mb-1">
//           <span>Progress</span>
//           <span>{task.completionPercentage ?? 0}%</span>
//         </div>
//         <div className="w-full bg-gray-100 rounded-full h-1.5">
//           <div
//             className="bg-blue-500 h-1.5 rounded-full transition-all"
//             style={{ width: `${task.completionPercentage ?? 0}%` }}
//           />
//         </div>
//       </div>

//       {onUpdateProgress && (
//         <button
//           onClick={() => onUpdateProgress(task)}
//           className="text-xs text-blue-600 hover:text-blue-800 font-medium"
//         >
//           Update Progress →
//         </button>
//       )}
//     </div>
//   );
// };

// export default TaskCard;















import { motion } from 'framer-motion';
import { CalendarClock, Flag, User, FolderOpen } from 'lucide-react';

const statusConfig = {
  PENDING:     { label: 'Pending',     bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500'  },
  COMPLETED:   { label: 'Completed',   bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500'},
  OVERDUE:     { label: 'Overdue',     bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500'   },
};

const priorityConfig = {
  LOW:    { label: 'Low',    color: 'text-slate-500', bg: 'bg-slate-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600',  bg: 'bg-blue-50'   },
  HIGH:   { label: 'High',   color: 'text-orange-600',bg: 'bg-orange-50' },
  URGENT: { label: 'Urgent', color: 'text-red-600',   bg: 'bg-red-50'    },
};

const getUrgency = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Overdue', cls: 'text-red-600 bg-red-50 border-red-200' };
  if (days === 0) return { label: 'Due today', cls: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (days <= 2) return { label: `${days}d left`, cls: 'text-orange-500 bg-orange-50 border-orange-100' };
  return { label: `${days}d left`, cls: 'text-slate-500 bg-slate-50 border-slate-200' };
};

const TaskCard = ({ task, onUpdateProgress }) => {
  const st  = statusConfig[task.status]  || statusConfig.PENDING;
  const pri = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const urg = getUrgency(task.deadline);
  const pct = task.completionPercentage ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{task.title}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${pri.bg} ${pri.color}`}>
          <Flag size={10} className="inline mr-0.5" />{pri.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1.5 text-xs text-slate-500">
        {(task.project?.name || task.projectName) && (
          <span className="flex items-center gap-1.5">
            <FolderOpen size={12} className="text-slate-400" />
            {task.project?.name || task.projectName}
          </span>
        )}
        {(task.assignedTo?.fullName) && (
          <span className="flex items-center gap-1.5">
            <User size={12} className="text-slate-400" />
            {task.assignedTo.fullName}
          </span>
        )}
        {urg && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium w-fit ${urg.cls}`}>
            <CalendarClock size={11} />
            {urg.label}
          </span>
        )}
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit ${st.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
        <span className={`text-xs font-semibold ${st.text}`}>{st.label}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Progress</span>
          <span className="font-semibold text-slate-600">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
          />
        </div>
      </div>

      {onUpdateProgress && (
        <button
          onClick={() => onUpdateProgress(task)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 text-left mt-0.5"
        >
          Update Progress →
        </button>
      )}
    </motion.div>
  );
};

export default TaskCard;