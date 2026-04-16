import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiGet } from '../utils/api.js';

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('vibecon_admin_token');
    if (!token) {
      setState('denied');
      return;
    }
    apiGet('/api/auth/me', token)
      .then(() => setState('allowed'))
      .catch(() => {
        localStorage.removeItem('vibecon_admin_token');
        setState('denied');
      });
  }, []);

  if (state === 'checking') {
    return (
      <div className="h-full flex items-center justify-center text-sm font-bold opacity-60">
        Verifying…
      </div>
    );
  }
  if (state === 'denied') return <Navigate to="/login" replace />;
  return children;
}
