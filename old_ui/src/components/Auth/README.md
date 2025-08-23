# Privy Authentication for IB4ME

This directory contains the authentication implementation for IB4ME using Privy's email and OTP sign-in functionality.

## Overview

IB4ME uses Privy for authentication, which provides a secure and user-friendly way to authenticate users using email one-time passwords (OTPs). This approach eliminates the need for password management while maintaining high security standards.

## Components

### PrivyProvider

The `PrivyProvider` component wraps the entire application and provides the Privy authentication context. It initializes Privy with your app ID and configures the authentication methods and appearance.

```tsx
// PrivyProvider.tsx
import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';

const PrivyProvider = ({ children }) => {
  return (
    <PrivyAuthProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#f97316',
          logo: '/src/assets/ib4me_logo.png',
        },
      }}
    >
      {children}
    </PrivyAuthProvider>
  );
};
```

### AuthContext

The `AuthContext` provides a convenient way to access authentication state and user information throughout the application.

```tsx
// Usage example
import { useAuthContext } from '../components/Auth/AuthContext';

const MyComponent = () => {
  const { isAuthenticated, userEmail, logout } = useAuthContext();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {userEmail}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};
```

## Authentication Flow

1. User enters their email address in the login/signup form
2. Privy sends a one-time password (OTP) to the user's email
3. User enters the OTP to verify their identity
4. Upon successful verification, the user is authenticated

## Configuration

Before using Privy authentication, you need to:

1. Create a Privy account at [privy.io](https://privy.io)
2. Create a new application in the Privy dashboard
3. Get your Privy App ID
4. Replace `YOUR_PRIVY_APP_ID` in `PrivyProvider.tsx` with your actual App ID

## Important Notes

- The Privy provider must be placed at the root of your application to ensure authentication state is available throughout the app.
- Email is currently the only enabled authentication method, but Privy supports other methods like SMS, social logins, and wallet connections that can be enabled as needed.
- User authentication state is managed by Privy and exposed through the `usePrivy` hook or our custom `useAuth` hook.
