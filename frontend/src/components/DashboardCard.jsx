// empty file
const DashboardCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-500',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-500',  text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-600' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-500',    text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
    gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-500',   text: 'text-gray-600' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} rounded-2xl p-5 shadow-sm border border-white flex items-center gap-4`}>
      <div className={`${c.icon} text-white rounded-xl p-3 flex-shrink-0`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default DashboardCard;