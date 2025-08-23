import React from 'react';
import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';

interface PrivyProviderProps {
  children: React.ReactNode;
}

const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  // Replace with your actual Privy app ID from the Privy dashboard
  const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

  return (
    <PrivyAuthProvider
      appId={PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#f97316', // Orange color to match IB4ME branding
          logo: '/src/assets/ib4me_logo.png',
        },
      }}
    >
      {children}
    </PrivyAuthProvider>
  );
};

export default PrivyProvider;
