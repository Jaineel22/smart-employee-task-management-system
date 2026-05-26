// // empty file
// const DashboardCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
//   const colors = {
//     blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-500',   text: 'text-blue-600' },
//     green:  { bg: 'bg-green-50',  icon: 'bg-green-500',  text: 'text-green-600' },
//     yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-600' },
//     red:    { bg: 'bg-red-50',    icon: 'bg-red-500',    text: 'text-red-600' },
//     purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
//     gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-500',   text: 'text-gray-600' },
//   };
//   const c = colors[color] || colors.blue;

//   return (
//     <div className={`${c.bg} rounded-2xl p-5 shadow-sm border border-white flex items-center gap-4`}>
//       <div className={`${c.icon} text-white rounded-xl p-3 flex-shrink-0`}>
//         {Icon && <Icon size={22} />}
//       </div>
//       <div>
//         <p className="text-sm text-gray-500 font-medium">{title}</p>
//         <p className={`text-2xl font-bold ${c.text}`}>{value ?? '—'}</p>
//         {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
//       </div>
//     </div>
//   );
// };

// export default DashboardCard;
















import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Animated number counter
const Counter = ({ target }) => {
  const [count, setCount] = useState(0);
  const numericTarget = typeof target === 'number' ? target : null;

  useEffect(() => {
    if (numericTarget === null) return;
    let start = 0;
    const duration = 900;
    const step = Math.ceil(numericTarget / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= numericTarget) { setCount(numericTarget); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [numericTarget]);

  if (numericTarget === null) return <span>{target ?? '—'}</span>;
  return <span>{count}</span>;
};

const colorMap = {
  blue:   { bg: 'from-blue-500 to-blue-600',   light: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-100' },
  green:  { bg: 'from-emerald-500 to-green-600',light: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  yellow: { bg: 'from-amber-400 to-orange-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  red:    { bg: 'from-red-500 to-rose-600',     light: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-100' },
  purple: { bg: 'from-violet-500 to-purple-600',light: 'bg-violet-50',text: 'text-violet-600',border: 'border-violet-100' },
  gray:   { bg: 'from-slate-400 to-slate-500',  light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
};

const DashboardCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const c = colorMap[color] || colorMap.blue;
  const numericValue = typeof value === 'string' && value.endsWith('%')
    ? null
    : typeof value === 'number' ? value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border ${c.border} p-5 flex items-center gap-4 cursor-default`}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        {Icon && <Icon size={20} color="white" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
        <p className={`text-2xl font-bold ${c.text} leading-tight`}>
          {numericValue !== null ? <Counter target={numericValue} /> : (value ?? '—')}
        </p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default DashboardCard;