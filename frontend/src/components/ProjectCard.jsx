// // empty file
// const statusColors = {
//   PLANNING:  'bg-yellow-100 text-yellow-700',
//   ACTIVE:    'bg-green-100 text-green-700',
//   ON_HOLD:   'bg-gray-100 text-gray-600',
//   COMPLETED: 'bg-blue-100 text-blue-700',
//   CANCELLED: 'bg-red-100 text-red-700',
// };

// const ProjectCard = ({ project, onDelete }) => {
//   const endDate = project.endDate
//     ? new Date(project.endDate).toLocaleDateString()
//     : 'No end date';

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between mb-2">
//         <h3 className="font-semibold text-gray-800 text-sm">{project.name}</h3>
//         <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-600'}`}>
//           {project.status}
//         </span>
//       </div>

//       {project.description && (
//         <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
//       )}

//       <div className="flex items-center justify-between text-xs text-gray-400">
//         <span>Ends: {endDate}</span>
//         <span>Manager: {project.manager?.fullName || '—'}</span>
//       </div>

//       {onDelete && (
//         <button
//           onClick={() => onDelete(project.id)}
//           className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
//         >
//           Delete
//         </button>
//       )}
//     </div>
//   );
// };

// export default ProjectCard;
























import { motion } from 'framer-motion';
import { CalendarDays, User } from 'lucide-react';

const statusConfig = {
  PLANNING:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
  ACTIVE:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
  ON_HOLD:   { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400'  },
  COMPLETED: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  CANCELLED: { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400'    },
};

const ProjectCard = ({ project, onDelete }) => {
  const st = statusConfig[project.status] || statusConfig.PLANNING;
  const endDate = project.endDate
    ? new Date(project.endDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 h-full"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800 leading-snug">{project.name}</h3>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text} whitespace-nowrap flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>
      )}

      <div className="flex flex-col gap-1.5 text-xs text-slate-500 mt-auto">
        {project.manager?.fullName && (
          <span className="flex items-center gap-1.5">
            <User size={12} className="text-slate-400" />
            {project.manager.fullName}
          </span>
        )}
        {endDate && (
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} className="text-slate-400" />
            Ends {endDate}
          </span>
        )}
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(project.id)}
          className="text-xs text-red-500 hover:text-red-700 font-medium text-left"
        >
          Delete project
        </button>
      )}
    </motion.div>
  );
};

export default ProjectCard;