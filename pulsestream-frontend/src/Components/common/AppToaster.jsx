import { Toaster } from 'react-hot-toast';

/**
 * AppToaster — Centralized toast notification component.
 * Keeps App.jsx clean by isolating all toast configuration here.
 * Always renders in front of every element (z-index: 99999) and
 * centered on the screen so it's never hidden behind the navbar.
 */
const AppToaster = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      containerStyle={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999,
      }}
      toastOptions={{
        // Base styles shared by all toast types
        style: {
          zIndex: 99999,
          fontSize: '15px',
          fontWeight: '600',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          minWidth: '280px',
          textAlign: 'center',
        },
        // Success toast
        success: {
          style: {
            background: '#1a1a2e',
            color: '#e0e0e0',
            border: '1px solid #e50914',
          },
          iconTheme: { primary: '#e50914', secondary: '#fff' },
        },
        // Error toast
        error: {
          style: {
            background: '#1a1a2e',
            color: '#e0e0e0',
            border: '1px solid #ff4444',
          },
          iconTheme: { primary: '#ff4444', secondary: '#fff' },
        },
        // ⏳ Loading toast
        loading: {
          style: {
            background: '#1a1a2e',
            color: '#e0e0e0',
            border: '1px solid #888',
          },
        },
      }}
    />
  );
};

export default AppToaster;
