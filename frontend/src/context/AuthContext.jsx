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
  // { token, id, fullName, email, role, department, ... }
  // We separate token from user fields here.
  const loginUser = (userData) => {
    const { token, ...userFields } = userData;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userFields));
    setUser(userFields);
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