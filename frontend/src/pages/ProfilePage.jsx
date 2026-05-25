import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserById, updateUser } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, Lock } from 'lucide-react';

const ProfilePage = () => {
  const { user, logoutUser, loginUser } = useAuth();
  const navigate                         = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({ fullName: '', department: '' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── load profile ───────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch fresh profile data from backend using stored user id
        const data = await getUserById(user.id);
        setProfile(data);
        setForm({ fullName: data.fullName || '', department: data.department || '' });
      } catch {
        // Fallback: use what's already in AuthContext if endpoint fails
        setProfile(user);
        setForm({ fullName: user?.fullName || '', department: user?.department || '' });
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  /* ── save profile ───────────────────────────────── */
  const handleSave = async () => {
    setError('');
    if (!form.fullName.trim()) { setError('Full name cannot be empty.'); return; }
    setSaving(true);
    try {
      const updated = await updateUser(user.id, {
        fullName:   form.fullName,
        department: form.department,
      });
      setProfile(updated);

      // Sync updated name/department back into AuthContext + localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...stored, fullName: updated.fullName, department: updated.department };
      localStorage.setItem('user', JSON.stringify(newUser));

      showToast('Profile updated successfully.');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  /* ── logout ─────────────────────────────────────── */
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const displayUser = profile || user;

  return (
    <div className="max-w-lg">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-500">View and update your account information</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {(displayUser?.fullName || displayUser?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{displayUser?.fullName}</p>
            <p className="text-sm text-gray-500">{displayUser?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full mt-1 inline-block">
              {displayUser?.role}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Editable fields */}
        {editMode ? (
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Backend Engineering"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Email (read-only)</label>
              <input
                type="email"
                value={displayUser?.email || ''}
                disabled
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        ) : (
          /* Read-only view */
          <div className="space-y-4 mb-5">
            {[
              { label: 'Full Name',  value: displayUser?.fullName },
              { label: 'Email',      value: displayUser?.email },
              { label: 'Department', value: displayUser?.department || '—' },
              { label: 'Role',       value: displayUser?.role },
              { label: 'User ID',    value: displayUser?.id },
              { label: 'Status',     value: displayUser?.isActive ? 'Active' : 'Inactive' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => { setEditMode(false); setError(''); }}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Password change — UI only, informational */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-3 mb-1">
          <Lock size={16} className="text-gray-400" />
          <p className="text-sm font-semibold text-gray-800">Password</p>
        </div>
        <p className="text-xs text-gray-500 ml-7">
          Password changes are handled by your administrator. Contact your manager or admin to reset your password.
        </p>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full justify-center bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;