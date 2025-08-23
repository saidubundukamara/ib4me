import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from './AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

/**
 * A wrapper component that protects routes by checking if the user is authenticated.
 * Redirects to the login page if the user is not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/auth/sign-in' }) => {
  const { isAuthenticated, isReady } = useAuthContext();

  // Show loading state while authentication is being checked
  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
