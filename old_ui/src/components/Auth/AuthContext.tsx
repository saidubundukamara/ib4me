import React, { createContext, useContext, ReactNode } from 'react';
import useAuth from '../../hooks/useAuth';

// Define the shape of the authentication context
interface AuthContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  user: any; // Using any for simplicity, but could be typed more specifically
  userId: string | undefined;
  userEmail: string | undefined;
  login: () => void;
  logout: () => void;
  linkEmail: (email: string) => Promise<void>;
  linkPhone: (phone: string) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app and makes auth object available to any child component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
