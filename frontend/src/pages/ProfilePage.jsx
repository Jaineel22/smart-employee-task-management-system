// import { useEffect, useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { getUserById, updateUser } from '../services/userService';
// import { useNavigate } from 'react-router-dom';
// import { LogOut, Save, Lock } from 'lucide-react';

// const ProfilePage = () => {
//   const { user, logoutUser, loginUser } = useAuth();
//   const navigate                         = useNavigate();

//   const [profile, setProfile]   = useState(null);
//   const [loading, setLoading]   = useState(true);
//   const [saving, setSaving]     = useState(false);
//   const [error, setError]       = useState('');
//   const [toast, setToast]       = useState('');
//   const [editMode, setEditMode] = useState(false);

//   const [form, setForm] = useState({ fullName: '', department: '' });

//   const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

//   /* ── load profile ───────────────────────────────── */
//   useEffect(() => {
//     const load = async () => {
//       try {
//         // Fetch fresh profile data from backend using stored user id
//         const data = await getUserById(user.id);
//         setProfile(data);
//         setForm({ fullName: data.fullName || '', department: data.department || '' });
//       } catch {
//         // Fallback: use what's already in AuthContext if endpoint fails
//         setProfile(user);
//         setForm({ fullName: user?.fullName || '', department: user?.department || '' });
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (user) load();
//   }, [user]);

//   /* ── save profile ───────────────────────────────── */
//   const handleSave = async () => {
//     setError('');
//     if (!form.fullName.trim()) { setError('Full name cannot be empty.'); return; }
//     setSaving(true);
//     try {
//       const updated = await updateUser(user.id, {
//         fullName:   form.fullName,
//         department: form.department,
//       });
//       setProfile(updated);

//       // Sync updated name/department back into AuthContext + localStorage
//       const stored = JSON.parse(localStorage.getItem('user') || '{}');
//       const newUser = { ...stored, fullName: updated.fullName, department: updated.department };
//       localStorage.setItem('user', JSON.stringify(newUser));

//       showToast('Profile updated successfully.');
//       setEditMode(false);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to update profile.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ── logout ─────────────────────────────────────── */
//   const handleLogout = () => {
//     logoutUser();
//     navigate('/login');
//   };

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-[200px]">
//       <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//     </div>
//   );

//   const displayUser = profile || user;

//   return (
//     <div className="max-w-lg">
//       {toast && (
//         <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
//           {toast}
//         </div>
//       )}

//       <div className="mb-6">
//         <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
//         <p className="text-sm text-gray-500">View and update your account information</p>
//       </div>

//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
//         {/* Avatar + name */}
//         <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
//           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
//             {(displayUser?.fullName || displayUser?.email || 'U').charAt(0).toUpperCase()}
//           </div>
//           <div>
//             <p className="font-semibold text-gray-800">{displayUser?.fullName}</p>
//             <p className="text-sm text-gray-500">{displayUser?.email}</p>
//             <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full mt-1 inline-block">
//               {displayUser?.role}
//             </span>
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">
//             {error}
//           </div>
//         )}

//         {/* Editable fields */}
//         {editMode ? (
//           <div className="space-y-4 mb-5">
//             <div>
//               <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
//               <input
//                 type="text"
//                 value={form.fullName}
//                 onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
//                 className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="text-xs font-medium text-gray-600 block mb-1">Department</label>
//               <input
//                 type="text"
//                 value={form.department}
//                 onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
//                 className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="e.g. Backend Engineering"
//               />
//             </div>
//             <div>
//               <label className="text-xs font-medium text-gray-600 block mb-1">Email (read-only)</label>
//               <input
//                 type="email"
//                 value={displayUser?.email || ''}
//                 disabled
//                 className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
//               />
//             </div>
//           </div>
//         ) : (
//           /* Read-only view */
//           <div className="space-y-4 mb-5">
//             {[
//               { label: 'Full Name',  value: displayUser?.fullName },
//               { label: 'Email',      value: displayUser?.email },
//               { label: 'Department', value: displayUser?.department || '—' },
//               { label: 'Role',       value: displayUser?.role },
//               { label: 'User ID',    value: displayUser?.id },
//               { label: 'Status',     value: displayUser?.isActive ? 'Active' : 'Inactive' },
//             ].map(({ label, value }) => (
//               <div key={label} className="flex justify-between items-center">
//                 <span className="text-sm text-gray-500">{label}</span>
//                 <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Action buttons */}
//         <div className="flex gap-2">
//           {editMode ? (
//             <>
//               <button
//                 onClick={handleSave}
//                 disabled={saving}
//                 className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
//               >
//                 <Save size={15} />
//                 {saving ? 'Saving…' : 'Save Changes'}
//               </button>
//               <button
//                 onClick={() => { setEditMode(false); setError(''); }}
//                 className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
//               >
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <button
//               onClick={() => setEditMode(true)}
//               className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
//             >
//               Edit Profile
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Password change — UI only, informational */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
//         <div className="flex items-center gap-3 mb-1">
//           <Lock size={16} className="text-gray-400" />
//           <p className="text-sm font-semibold text-gray-800">Password</p>
//         </div>
//         <p className="text-xs text-gray-500 ml-7">
//           Password changes are handled by your administrator. Contact your manager or admin to reset your password.
//         </p>
//       </div>

//       {/* Logout */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
//         <button
//           onClick={handleLogout}
//           className="flex items-center gap-2 w-full justify-center bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-xl text-sm transition-colors"
//         >
//           <LogOut size={16} /> Sign Out
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;








import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserById, updateUser } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, LogOut, Pencil, X, Shield, Building2, Mail, Hash } from 'lucide-react';

const initials = (name) => name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
const avatarColors = ['#3B82F6','#8B5CF6','#10B981'];
const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const ProfilePage = () => {
  const { user, logoutUser } = useAuth();
  const navigate             = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({ fullName:'', department:'' });

  const avatarColor = avatarColors[(user?.id || 0) % avatarColors.length];
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const load = async () => {
      try {
        const d = await getUserById(user.id);
        setProfile(d);
        setForm({ fullName: d.fullName||'', department: d.department||'' });
      } catch {
        setProfile(user);
        setForm({ fullName: user?.fullName||'', department: user?.department||'' });
      } finally { setLoading(false); }
    };
    if (user) load();
  }, [user]);

  const handleSave = async () => {
    setError('');
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    setSaving(true);
    try {
      const updated = await updateUser(user.id, { fullName: form.fullName, department: form.department });
      setProfile(updated);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, fullName: updated.fullName, department: updated.department }));
      showToast('Profile updated.'); setEditMode(false);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const d = profile || user;

  return (
    <div className="max-w-md">
      {toast && (
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
          className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </motion.div>
      )}

      <h1 className="text-lg font-bold text-slate-800 mb-5">My Profile</h1>

      {/* Profile hero card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
        {/* Gradient header */}
        <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-700" />
        <div className="px-5 pb-5">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div
              className="w-16 h-16 rounded-2xl border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-sm"
              style={{ background: avatarColor }}
            >
              {initials(d?.fullName)}
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button onClick={() => { setEditMode(false); setError(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50">
                    <X size={12} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-60">
                    <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">{error}</div>}

          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={inputCls} placeholder="e.g. Backend Engineering" />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold text-slate-800">{d?.fullName}</h2>
              <p className="text-xs text-slate-400 mb-3">{d?.email}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                  <Shield size={11} /> {d?.role}
                </span>
                {d?.department && (
                  <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-full">
                    <Building2 size={11} /> {d.department}
                  </span>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${d?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {d?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info rows — only shown when not editing */}
      {!editMode && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
          {[
            { icon: Mail,     label: 'Email',      value: d?.email },
            { icon: Building2,label: 'Department', value: d?.department || '—' },
            { icon: Shield,   label: 'Role',       value: d?.role },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={() => { logoutUser(); navigate('/login'); }}
        className="flex items-center gap-2 w-full justify-center bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl text-sm transition-colors"
      >
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  );
};

export default ProfilePage;