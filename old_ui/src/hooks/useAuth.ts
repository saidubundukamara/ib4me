import { usePrivy } from '@privy-io/react-auth';

/**
 * Custom hook to manage authentication state and user information from Privy
 * @returns Authentication state and user information
 */
export const useAuth = () => {
  const { ready, authenticated, user, login, logout, linkEmail, linkPhone } = usePrivy();

  return {
    // Authentication state
    isReady: ready,
    isAuthenticated: authenticated,

    // User information
    user,
    userId: user?.id,
    userEmail: user?.email?.address,

    // Authentication methods
    login,
    logout,
    linkEmail,
    linkPhone,
  };
};

export default useAuth;
