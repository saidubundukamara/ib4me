import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import PrivyProvider from './components/Auth/PrivyProvider';
import AuthProvider from './components/Auth/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </PrivyProvider>
  </StrictMode>,
);
