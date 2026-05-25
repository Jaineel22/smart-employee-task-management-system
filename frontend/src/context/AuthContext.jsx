// empty file
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // userData is the full flat response from backend:
  // Accept both flat response and nested response shapes:
  // Flat:  { token, id, fullName, email, role, department, ... }
  // Nested: { token, user: { id, fullName, ... } }
  const loginUser = (resp) => {
    console.log('Auth login response:', resp);
    let token = resp?.token;
    let userFields = null;

    if (resp?.user) {
      // Nested shape
      userFields = resp.user;
      if (!token && resp.user.token) token = resp.user.token;
    } else {
      // Flat shape: remove token and use the remaining fields as user
      const { token: _t, ...rest } = resp || {};
      userFields = rest;
    }

    // Normalize id to number when possible
    if (userFields && userFields.id != null) {
      const maybeNum = Number(userFields.id);
      if (!Number.isNaN(maybeNum)) userFields.id = maybeNum;
    }

    localStorage.setItem('token', token ?? '');
    localStorage.setItem('user', JSON.stringify(userFields ?? null));
    setUser(userFields ?? null);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);