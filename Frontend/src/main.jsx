import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(32, 44, 51, 0.95)',
            backdropFilter: 'blur(16px)',
            color: '#e9edef',
            border: '1px solid rgba(42,57,66,0.6)',
            borderRadius: '14px',
            fontSize: '13px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#e9edef' } },
          success: { iconTheme: { primary: '#00a884', secondary: '#e9edef' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
