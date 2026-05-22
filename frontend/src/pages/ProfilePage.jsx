// empty file
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const ProfilePage = () => {
  const { user, logoutUser } = useAuth();
  const navigate             = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const fields = [
    { label: 'Full Name',   value: user?.fullName },
    { label: 'Email',       value: user?.email },
    { label: 'Role',        value: user?.role },
    { label: 'Department',  value: user?.department || '—' },
    { label: 'User ID',     value: user?.id },
  ];

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-500">Your account information</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.fullName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-2 w-full justify-center bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;